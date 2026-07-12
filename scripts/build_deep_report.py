#!/usr/bin/env python3
"""Constrói os agregados e a malha municipal do relatório Brasil declarado.

Os cálculos partem exclusivamente do cubo agregado da Receita. A população
municipal vem da tabela 6579 do SIDRA; a geometria, da Malha Municipal 2024 do
IBGE. O script nunca tenta reconstruir pessoas ou microdados.
"""

from __future__ import annotations

import csv
import gzip
import json
import math
import re
import unicodedata
import zipfile
from pathlib import Path

import duckdb


SITE = Path(__file__).resolve().parents[1]
DB = SITE / "data" / "perfil.duckdb"
OUT = SITE / "public" / "data"
POP_SOURCE = SITE / "data" / "ibge_municipal_population_2024_2025.csv"
POP_DOWNLOAD = Path("/tmp/pop_municipios_ibge.json")
MAP_ZIP = Path("/tmp/BR_Municipios_2024.zip")
MAP_DIR = Path("/tmp/BR_Municipios_2024")

IPCA_2025 = 0.0426

# Mudanças oficiais de grafia ou nome entre a dimensão fiscal e a malha atual.
# A chave é o código interno da dimensão municipal da Receita.
MUNICIPAL_ALIASES = {
    47: "1100338", 315: "1400605", 345: "1708254", 377: "1502954",
    522: "2513968", 529: "1506500", 770: "3300233", 834: "4102752",
    1623: "2401206", 1703: "2405306", 2331: "2601607", 2437: "2606903",
    2469: "2608503", 3101: "2800100", 3291: "2919058", 3869: "2928505",
    4049: "3102506", 4177: "3108909", 4551: "3127602", 5075: "3153806",
    5495: "4119251", 5739: "4209458", 5875: "3303807", 5917: "3305901",
    6401: "3515004", 7711: "4116307", 7843: "4123303", 8251: "4212809",
    8273: "4213906", 8333: "4216909", 8339: "4217204", 9139: "5107008",
    9155: "5107800", 9269: "5203500", 9321: "1706001", 9691: "1720499",
}

REGION_NAMES = {
    "N": "Norte", "NE": "Nordeste", "SE": "Sudeste", "S": "Sul",
    "CO": "Centro-Oeste",
}


def norm(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Z0-9]", "", value.upper())


def compact_number(value):
    if value is None:
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        if not math.isfinite(value):
            return None
        return round(value, 2)
    return value


def query(con: duckdb.DuckDBPyConnection, sql: str) -> list[dict]:
    cursor = con.execute(sql)
    names = [column[0] for column in cursor.description]
    return [
        {name: compact_number(value) for name, value in zip(names, row)}
        for row in cursor.fetchall()
    ]


def prepare_population() -> tuple[dict[tuple[str, int], int], dict[str, dict]]:
    """Lê a resposta SIDRA e persiste um CSV compacto e auditável."""
    if POP_SOURCE.exists():
        rows = list(csv.DictReader(POP_SOURCE.open(encoding="utf-8")))
    else:
        if not POP_DOWNLOAD.exists():
            raise FileNotFoundError(
                "Baixe a tabela SIDRA 6579 para /tmp/pop_municipios_ibge.json"
            )
        raw = json.loads(POP_DOWNLOAD.read_text(encoding="utf-8"))[1:]
        rows = []
        for item in raw:
            if item.get("V") in {None, "", "..."}:
                continue
            name, uf = item["D1N"].rsplit(" - ", 1)
            rows.append({
                "year": item["D3C"], "ibge_code": item["D1C"],
                "municipality": name, "uf": uf, "population": item["V"],
            })
        POP_SOURCE.parent.mkdir(parents=True, exist_ok=True)
        with POP_SOURCE.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=[
                "year", "ibge_code", "municipality", "uf", "population"
            ])
            writer.writeheader()
            writer.writerows(rows)

    population: dict[tuple[str, int], int] = {}
    places: dict[str, dict] = {}
    for row in rows:
        code = row["ibge_code"]
        year = int(row["year"])
        population[(code, year)] = int(row["population"])
        places[code] = {
            "code": code, "name": row["municipality"], "uf": row["uf"]
        }
    return population, places


def municipality_crosswalk(con, places: dict[str, dict]) -> dict[int, str]:
    by_name = {(p["uf"], norm(p["name"])): code for code, p in places.items()}
    crosswalk = {}
    missing = []
    for code, name, uf in con.execute(
        "SELECT co_municipio, municipio, uf FROM municipios WHERE uf <> 'EX'"
    ).fetchall():
        ibge_code = by_name.get((uf, norm(name))) or MUNICIPAL_ALIASES.get(code)
        if ibge_code:
            crosswalk[code] = ibge_code
        else:
            missing.append(f"{code}: {name} - {uf}")
    if missing:
        raise RuntimeError("Municípios sem correspondência: " + "; ".join(missing))
    return crosswalk


def build_map(crosswalk: dict[int, str]) -> None:
    target = OUT / "municipalities.topo.json"
    if not MAP_ZIP.exists():
        raise FileNotFoundError("Malha do IBGE ausente em /tmp/BR_Municipios_2024.zip")

    import shapefile
    from shapely.geometry import mapping, shape
    from topojson import Topology

    MAP_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(MAP_ZIP) as archive:
        archive.extractall(MAP_DIR)

    reader = shapefile.Reader(str(MAP_DIR / "BR_Municipios_2024.shp"), encoding="utf-8")
    fields = [f[0] for f in reader.fields[1:]]
    code_field = "CD_MUN" if "CD_MUN" in fields else fields[0]
    features = []
    for record in reader.iterShapeRecords():
        properties = dict(zip(fields, record.record))
        code = str(properties[code_field])
        geometry = shape(record.shape.__geo_interface__).simplify(
            0.012, preserve_topology=True
        )
        features.append({
            "type": "Feature", "id": code,
            "properties": {"code": code}, "geometry": mapping(geometry),
        })

    topology = Topology(
        {"type": "FeatureCollection", "features": features},
        prequantize=100000,
    ).to_dict()
    target.write_text(
        json.dumps(topology, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    population, places = prepare_population()
    con = duckdb.connect(str(DB), read_only=True)
    con.execute("PRAGMA threads=8")
    crosswalk = municipality_crosswalk(con, places)

    metric = """
      sum(contribuintes)::BIGINT AS declarantes,
      sum(rend_total)::DOUBLE AS renda,
      sum(rend_tributavel)::DOUBLE AS renda_tributavel,
      sum(patrimonio)::DOUBLE AS patrimonio,
      sum(imposto_devido)::DOUBLE AS imposto
    """

    overview = query(con, f"SELECT exercicio, {metric} FROM perfil GROUP BY exercicio ORDER BY exercicio")
    regions_raw = query(con, f"""
      SELECT p.exercicio, m.regiao, {metric}
      FROM perfil p JOIN municipios m USING (co_municipio)
      WHERE m.regiao <> 'EX'
      GROUP BY p.exercicio, m.regiao ORDER BY p.exercicio, m.regiao
    """)

    national_population = {2024: 212_583_750, 2025: 213_421_037}
    region_population = {
        (int(row["year"]), row["name"]): int(row["population"])
        for row in csv.DictReader((SITE / "data/ibge_population_2024_2025.csv").open())
        if row["level"] == "region"
    }
    regions = []
    for row in regions_raw:
        pop_year = row["exercicio"] - 1
        pop = region_population[(pop_year, REGION_NAMES[row["regiao"]])]
        row.update({
            "name": REGION_NAMES[row["regiao"]], "population": pop,
            "coverage": round(row["declarantes"] / pop, 6),
            "wealth_per_capita": round(row["patrimonio"] / pop, 2),
            "income_per_capita": round(row["renda"] / pop, 2),
        })
        regions.append(row)

    city_raw = query(con, f"""
      SELECT p.exercicio, p.co_municipio, m.municipio, m.uf, m.regiao, {metric}
      FROM perfil p JOIN municipios m USING (co_municipio)
      WHERE m.uf <> 'EX'
      GROUP BY p.exercicio, p.co_municipio, m.municipio, m.uf, m.regiao
      ORDER BY p.co_municipio, p.exercicio
    """)
    cities = []
    for row in city_raw:
        ibge = crosswalk[row["co_municipio"]]
        pop_year = row["exercicio"] - 1
        pop = population.get((ibge, pop_year))
        # Boa Esperança do Norte foi instalada em 2025 e não tem estimativa 2024.
        if not pop:
            continue
        row.update({
            "ibge": ibge, "name": places[ibge]["name"], "population": pop,
            "coverage": round(row["declarantes"] / pop, 6),
            "wealth_per_capita": round(row["patrimonio"] / pop, 2),
            "income_per_capita": round(row["renda"] / pop, 2),
            "wealth_per_filer": round(row["patrimonio"] / row["declarantes"], 2),
            "income_per_filer": round(row["renda"] / row["declarantes"], 2),
        })
        del row["co_municipio"]
        cities.append(row)

    race = query(con, f"""
      SELECT exercicio, raca_cor AS race, {metric}
      FROM perfil GROUP BY exercicio, raca_cor ORDER BY exercicio, raca_cor
    """)
    race_gender = query(con, f"""
      SELECT exercicio, raca_cor AS race, genero AS gender, {metric}
      FROM perfil GROUP BY exercicio, raca_cor, genero
      ORDER BY exercicio, raca_cor, genero
    """)
    age = query(con, f"""
      SELECT exercicio, faixa_etaria AS age, {metric}
      FROM perfil GROUP BY exercicio, faixa_etaria ORDER BY exercicio, faixa_etaria
    """)
    tax_bands = query(con, f"""
      SELECT exercicio, ordem_rend_total AS band_order, faixa_rend_total AS band, {metric}
      FROM perfil GROUP BY exercicio, ordem_rend_total, faixa_rend_total
      ORDER BY exercicio, ordem_rend_total
    """)
    wealth_bands = query(con, f"""
      SELECT exercicio, ordem_patrimonio AS band_order, faixa_patrimonio AS band, {metric}
      FROM perfil GROUP BY exercicio, ordem_patrimonio, faixa_patrimonio
      ORDER BY exercicio, ordem_patrimonio
    """)
    variable_income = query(con, f"""
      SELECT exercicio, in_renda_variavel AS value, {metric}
      FROM perfil GROUP BY exercicio, in_renda_variavel
      ORDER BY exercicio, in_renda_variavel
    """)
    occupations = query(con, f"""
      SELECT p.exercicio, coalesce(o.ocupacao, 'Código ' || p.co_ocupacao::VARCHAR) AS occupation,
             {metric}
      FROM perfil p LEFT JOIN ocupacoes o ON p.co_ocupacao = o.codigo
      GROUP BY p.exercicio, occupation
      ORDER BY p.exercicio, declarantes DESC
    """)

    employment_nature = query(con, f"""
      SELECT p.exercicio,
             lpad(p.co_natureza_ocupacao, 2, '0') AS code,
             coalesce(n.natureza, 'Não especificado') AS vínculo,
             {metric}
      FROM perfil p
      LEFT JOIN naturezas n
        ON lpad(p.co_natureza_ocupacao, 2, '0') = n.codigo
      GROUP BY p.exercicio, code, vínculo
      ORDER BY p.exercicio, patrimonio DESC
    """)

    # Grupos analíticos. A categoria financeira (02) permanece separada porque
    # a própria Receita mistura bancos públicos e privados, impossibilitando
    # uma divisão binária rigorosa.
    employment_group_codes = {
        "Assalariado privado": {"01"},
        "Financeiro público/privado": {"02"},
        "Organismos e ONGs": {"03"},
        "Autônomo ou profissional liberal": {"11"},
        "Proprietário ou capitalista": {"12", "13"},
        "Microempreendedor individual": {"14"},
        "Setor público": {"21", "22", "23", "31", "32", "33", "41", "42", "43", "51"},
        "Aposentado ou pensionista": {"61", "62"},
        "Outros ou não especificado": {"71", "72", "81", "91"},
    }
    employment_groups = []
    for exercise in (2025, 2026):
        year_rows = [row for row in employment_nature if row["exercicio"] == exercise]
        for group, codes in employment_group_codes.items():
            selected = [row for row in year_rows if row["code"] in codes]
            employment_groups.append({
                "exercicio": exercise,
                "group": group,
                "codes": sorted(codes),
                "declarantes": sum(row["declarantes"] for row in selected),
                "renda": round(sum(row["renda"] for row in selected), 2),
                "renda_tributavel": round(sum(row["renda_tributavel"] for row in selected), 2),
                "patrimonio": round(sum(row["patrimonio"] for row in selected), 2),
                "imposto": round(sum(row["imposto"] for row in selected), 2),
            })

    occupation_lookup = {
        row["codigo"]: row["ocupacao"]
        for row in query(con, "SELECT codigo, ocupacao FROM ocupacoes")
    }
    segment_universe = query(con, """
      SELECT p.co_municipio AS city_code, p.faixa_etaria AS age,
             p.genero AS gender, p.raca_cor AS race, p.co_ocupacao AS occupation_code,
             grouping(p.co_municipio) = 0 AS has_city,
             grouping(p.faixa_etaria) = 0 AS has_age,
             grouping(p.genero) = 0 AS has_gender,
             grouping(p.raca_cor) = 0 AS has_race,
             sum(p.contribuintes)::BIGINT AS declarantes,
             sum(p.rend_total)::DOUBLE AS renda,
             sum(p.patrimonio)::DOUBLE AS patrimonio
      FROM perfil p JOIN municipios m USING (co_municipio)
      WHERE p.exercicio = 2026 AND m.uf <> 'EX'
        AND p.raca_cor <> 'Não Informado'
      GROUP BY p.co_ocupacao,
               cube(p.co_municipio, p.faixa_etaria, p.genero, p.raca_cor)
      HAVING sum(p.contribuintes) >= 100
    """)

    def prepare_segment(row: dict) -> dict:
        result = dict(row)
        has_city = result.pop("has_city")
        has_age = result.pop("has_age")
        has_gender = result.pop("has_gender")
        has_race = result.pop("has_race")
        dimensions = [
            name for name, present in (
                ("city", has_city), ("age", has_age),
                ("gender", has_gender), ("race", has_race),
            ) if present
        ]
        result["profile"] = "_".join(dimensions) if dimensions else "occupation"
        occupation_code = result.pop("occupation_code", None)
        result["occupation"] = occupation_lookup.get(
            occupation_code,
            f"Código {occupation_code}" if occupation_code is not None else "Ocupação não informada",
        )
        result["income_average"] = round(row["renda"] / row["declarantes"], 2)
        result["wealth_average"] = round(row["patrimonio"] / row["declarantes"], 2)
        city_code = result.pop("city_code", None)
        if has_city:
            ibge_code = crosswalk.get(city_code)
            place = places.get(ibge_code, {})
            result["municipality"] = place.get("name", f"Município {city_code}")
            result["uf"] = place.get("uf", "")
        if not has_age:
            result.pop("age", None)
        if not has_gender:
            result.pop("gender", None)
        if not has_race:
            result.pop("race", None)
        return result

    segment_universe = [
        prepare_segment(row) for row in segment_universe if row["renda"] > 0
    ]

    def ranked(rows: list[dict], metric_name: str, reverse: bool, nonnegative=False):
        eligible = rows
        if nonnegative:
            eligible = [row for row in rows if row[metric_name] >= 0]
        return sorted(eligible, key=lambda row: row[metric_name], reverse=reverse)[:200]

    dimension_names = {
        "city": "cidade", "age": "idade", "gender": "gênero", "race": "raça"
    }
    profile_counts: dict[str, int] = {}
    for row in segment_universe:
        profile_counts[row["profile"]] = profile_counts.get(row["profile"], 0) + 1
    profiles = []
    for profile, eligible in profile_counts.items():
        dimensions = [] if profile == "occupation" else profile.split("_")
        label_parts = [dimension_names[name] for name in dimensions] + ["profissão"]
        profiles.append({
            "id": profile,
            "label": " + ".join(label_parts).capitalize(),
            "dimensions": dimensions + ["occupation"],
            "eligible": eligible,
        })
    profiles.sort(key=lambda item: (-len(item["dimensions"]), item["label"]))
    outliers = {
        "threshold": 100,
        "universe": {
            "eligible": len(segment_universe),
            "profiles": profiles,
            "income_top": ranked(segment_universe, "income_average", True),
            "income_bottom": ranked(segment_universe, "income_average", False),
            "wealth_top": ranked(segment_universe, "wealth_average", True),
            "wealth_bottom": ranked(segment_universe, "wealth_average", False, True),
        },
    }

    def index_segments(rows: list[dict]) -> list[dict]:
        """Acrescenta posições globais para busca sem duplicar quatro rankings."""
        search_fields = (
            "profile", "municipality", "uf", "age", "gender", "race",
            "occupation", "declarantes", "income_average", "wealth_average",
        )
        indexed = [
            {field: row[field] for field in search_fields if field in row}
            for row in rows
        ]
        rankings = (
            ("income_rank", "income_average", True, False),
            ("income_bottom_rank", "income_average", False, False),
            ("wealth_rank", "wealth_average", True, False),
            ("wealth_bottom_rank", "wealth_average", False, True),
        )
        for rank_name, metric_name, reverse, nonnegative in rankings:
            eligible = indexed
            if nonnegative:
                eligible = [row for row in indexed if row[metric_name] >= 0]
            ordered = sorted(eligible, key=lambda row: row[metric_name], reverse=reverse)
            for position, row in enumerate(ordered, 1):
                row[rank_name] = position
        return indexed

    outlier_search = {
        "threshold": 100,
        "profiles": profiles,
        "segments": index_segments(segment_universe),
    }

    municipal_race_raw = query(con, """
      SELECT p.co_municipio,
        CASE WHEN raca_cor = 'Branca' THEN 'Branca'
             WHEN raca_cor IN ('Preta','Parda') THEN 'Negra' ELSE 'Outra/NI' END AS race,
        sum(contribuintes)::BIGINT AS declarantes,
        sum(rend_total)::DOUBLE AS renda,
        sum(patrimonio)::DOUBLE AS patrimonio
      FROM perfil p JOIN municipios m USING (co_municipio)
      WHERE exercicio = 2026 AND m.uf <> 'EX'
      GROUP BY p.co_municipio, race ORDER BY p.co_municipio, race
    """)
    race_by_city: dict[int, dict] = {}
    for row in municipal_race_raw:
        race_by_city.setdefault(row["co_municipio"], {})[row["race"]] = row
    municipal_race = []
    for internal, groups in race_by_city.items():
        white, black = groups.get("Branca"), groups.get("Negra")
        unknown = groups.get("Outra/NI", {"declarantes": 0})
        if not white or not black or white["declarantes"] < 1000 or black["declarantes"] < 1000:
            continue
        total = white["declarantes"] + black["declarantes"] + unknown["declarantes"]
        missing_share = unknown["declarantes"] / total
        if missing_share > 0.60:
            continue
        ibge = crosswalk[internal]
        municipal_race.append({
            "ibge": ibge, "name": places[ibge]["name"], "uf": places[ibge]["uf"],
            "white_n": white["declarantes"], "black_n": black["declarantes"],
            "missing_share": round(missing_share, 6),
            "income_ratio": round(
                (white["renda"] / white["declarantes"]) /
                (black["renda"] / black["declarantes"]), 4
            ),
            "wealth_ratio": round(
                (white["patrimonio"] / white["declarantes"]) /
                (black["patrimonio"] / black["declarantes"]), 4
            ),
            "white_income": round(white["renda"] / white["declarantes"], 2),
            "black_income": round(black["renda"] / black["declarantes"], 2),
            "white_wealth": round(white["patrimonio"] / white["declarantes"], 2),
            "black_wealth": round(black["patrimonio"] / black["declarantes"], 2),
        })

    report = {
        "meta": {
            "generated": "2026-07-11", "ipca_2025": IPCA_2025,
            "panel_source": "Painel de Perfil dos Declarantes do IRPF — Receita Federal",
            "panel_url": "https://app.powerbi.com/view?r=eyJrIjoiYzA5NTBkYzctZTA1Zi00MDE5LTkzZTItYzM4ZDgwYTFlMmYxIiwidCI6IjZmNDlhYTQzLTgyMmEtNGMyMC05NjcwLWRiNzcwMGJmMWViMCJ9",
            "panel_extracted_at": "2026-07-11",
            "population_source": "IBGE/SIDRA tabela 6579",
            "calendar_note": "Exercício 2025 retrata 2024; exercício 2026 retrata 2025.",
        },
        "official_declarations": {
            "2025_deadline": 43_344_108, "2025_sep": 45_645_935,
            "2026_deadline": 44_393_571,
        },
        "tax_rules": {
            "2025_taxable_threshold": 33_888,
            "2026_taxable_threshold": 35_584,
            "2025_rural_threshold": 169_440,
            "2026_rural_threshold": 177_920,
        },
        "census_race_2022": {
            "Parda": 0.453, "Branca": 0.435, "Preta": 0.102,
            "Indígena": 0.006, "Amarela": 0.004,
        },
        "national_population": national_population,
        "overview": overview, "regions": regions, "cities": cities,
        "race": race, "race_gender": race_gender,
        "municipal_race": municipal_race, "age": age,
        "tax_bands": tax_bands, "wealth_bands": wealth_bands,
        "variable_income": variable_income,
        "occupations": occupations,
        "employment_nature": employment_nature,
        "employment_groups": employment_groups,
        "outliers": outliers,
    }
    (OUT / "deep-analysis.json").write_text(
        json.dumps(report, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    for legacy_search in OUT.glob("outlier-search*.json"):
        legacy_search.unlink()
    search_payload = json.dumps(
        outlier_search, ensure_ascii=False, separators=(",", ":")
    ).encode("utf-8")
    with gzip.open(OUT / "outlier-universe.json.gz", "wb", compresslevel=9) as handle:
        handle.write(search_payload)
    con.close()
    build_map(crosswalk)
    print(f"Dados: {(OUT / 'deep-analysis.json').stat().st_size / 1e6:.1f} MB")
    search_size = (OUT / "outlier-universe.json.gz").stat().st_size
    print(f"Busca: {len(search_payload) / 1e6:.1f} MB brutos; {search_size / 1e6:.1f} MB gzip")
    print(f"Mapa: {(OUT / 'municipalities.topo.json').stat().st_size / 1e6:.1f} MB")
    print(f"Cidades: {len(cities)} linhas; recorte racial: {len(municipal_race)} cidades")


if __name__ == "__main__":
    main()
