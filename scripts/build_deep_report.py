#!/usr/bin/env python3
"""Constrói os agregados e a malha municipal do relatório Brasil declarado.

Os cálculos partem exclusivamente do cubo agregado da Receita. A população
municipal vem da tabela 6579 do SIDRA; a geometria, da Malha Municipal 2024 do
IBGE. O script nunca tenta reconstruir pessoas ou microdados.
"""

from __future__ import annotations

import csv
from collections import defaultdict
import gzip
import itertools
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

ECONOMIC_BANDS = {
    "income_total": {
        "column": "faixa_rend_total", "key": "income_total_band",
        "param": "renda_total", "label": "Rendimentos totais",
        "options": [
            ("ate-200-mil", "0 a R$ 200 mil"),
            ("200-600-mil", "R$ 200 mil a R$ 600 mil"),
            ("600-mil-1-2-mi", "R$ 600 mil a R$ 1,2 mi"),
            ("acima-1-2-mi", "Superior a R$ 1,2 mi"),
        ],
    },
    "taxable_income": {
        "column": "faixa_rend_tributavel", "key": "taxable_income_band",
        "param": "renda_tributavel", "label": "Rendimentos tributáveis",
        "options": [
            ("ate-28-5-mil", "0 a R$ 28,5 mil"),
            ("28-5-60-mil", "R$ 28,5 mil a R$ 60 mil"),
            ("60-88-2-mil", "R$ 60 mil a R$ 88,2 mil"),
            ("88-2-100-mil", "R$ 88,2 mil a R$ 100 mil"),
            ("100-500-mil", "R$ 100 mil a R$ 500 mil"),
            ("acima-500-mil", "Superior a R$ 500 mil"),
        ],
    },
    "wealth": {
        "column": "faixa_patrimonio", "key": "wealth_band",
        "param": "patrimonio", "label": "Patrimônio",
        "options": [
            ("ate-100-mil", "até R$ 100 mil"),
            ("100-500-mil", "R$ 100 mil a R$ 500 mil"),
            ("500-mil-1-mi", "R$ 500 mil a R$ 1 mi"),
            ("acima-1-mi", "Superior a R$ 1 mi"),
        ],
    },
}

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
    def query_segments(year: int, economic_dimensions: tuple[str, ...]) -> list[dict]:
        economic_select = ", ".join(
            f"p.{ECONOMIC_BANDS[name]['column']} AS {ECONOMIC_BANDS[name]['key']}"
            for name in economic_dimensions
        )
        economic_group = ", ".join(
            f"p.{ECONOMIC_BANDS[name]['column']}" for name in economic_dimensions
        )
        if economic_select:
            economic_select += ","
            economic_group += ","
        if year == 2025:
            race_select = "NULL::VARCHAR AS race, false AS has_race,"
            demographic_cube = "p.co_municipio, p.faixa_etaria, p.genero"
            race_filter = ""
        else:
            race_select = (
                "p.raca_cor AS race, grouping(p.raca_cor) = 0 AS has_race,"
            )
            demographic_cube = (
                "p.co_municipio, p.faixa_etaria, p.genero, p.raca_cor"
            )
            race_filter = "AND p.raca_cor <> 'Não Informado'"
        return query(con, f"""
          SELECT {economic_select}
                 p.co_municipio AS city_code, p.faixa_etaria AS age,
                 p.genero AS gender, {race_select}
                 p.co_ocupacao AS occupation_code,
                 grouping(p.co_municipio) = 0 AS has_city,
                 grouping(p.faixa_etaria) = 0 AS has_age,
                 grouping(p.genero) = 0 AS has_gender,
                 sum(p.contribuintes)::BIGINT AS declarantes,
                 sum(p.rend_total)::DOUBLE AS renda,
                 sum(p.patrimonio)::DOUBLE AS patrimonio
          FROM perfil p JOIN municipios m USING (co_municipio)
          WHERE p.exercicio = {year} AND m.uf <> 'EX' {race_filter}
          GROUP BY {economic_group}p.co_ocupacao, cube({demographic_cube})
          HAVING sum(p.contribuintes) >= 100 AND sum(p.rend_total) > 0
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

    dimension_names = {
        "city": "cidade", "age": "idade", "gender": "gênero", "race": "raça"
    }

    def describe_profiles(rows: list[dict]) -> list[dict]:
        profile_counts: dict[str, int] = {}
        for row in rows:
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
        return profiles

    def index_segments(rows: list[dict], economic_keys: tuple[str, ...]) -> list[dict]:
        """Acrescenta posições dentro de cada recorte econômico exato."""
        search_fields = (
            "profile", "municipality", "uf", "age", "gender", "race",
            "occupation", "declarantes", "income_average", "wealth_average",
        )
        indexed = [
            {
                field: row[field]
                for field in (*search_fields, *economic_keys)
                if field in row
            }
            for row in rows
        ]
        rankings = (
            ("income_rank", "income_average", True, False),
            ("income_bottom_rank", "income_average", False, False),
            ("wealth_rank", "wealth_average", True, False),
            ("wealth_bottom_rank", "wealth_average", False, True),
        )
        scopes: dict[tuple, list[dict]] = defaultdict(list)
        for row in indexed:
            scopes[tuple(row.get(key) for key in economic_keys)].append(row)
        for scope_rows in scopes.values():
            for rank_name, metric_name, reverse, nonnegative in rankings:
                eligible = scope_rows
                if nonnegative:
                    eligible = [row for row in scope_rows if row[metric_name] >= 0]
                ordered = sorted(
                    eligible, key=lambda row: row[metric_name], reverse=reverse
                )
                for position, row in enumerate(ordered, 1):
                    row[rank_name] = position
        return indexed

    def base_summary(indexed: list[dict], profiles: list[dict]) -> dict:
        def top(rank_name: str) -> list[dict]:
            return sorted(
                (row for row in indexed if row.get(rank_name)),
                key=lambda row: row[rank_name],
            )[:200]
        return {
            "eligible": len(indexed), "profiles": profiles,
            "income_top": top("income_rank"),
            "income_bottom": top("income_bottom_rank"),
            "wealth_top": top("wealth_rank"),
            "wealth_bottom": top("wealth_bottom_rank"),
        }

    explorer_manifest = {
        "threshold": 100,
        "bands": {
            name: {
                key: value for key, value in config.items()
                if key not in {"column", "options"}
            } | {
                "options": [
                    {"id": option_id, "label": label, "value": label}
                    for option_id, label in config["options"]
                ]
            }
            for name, config in ECONOMIC_BANDS.items()
        },
        "years": {},
    }
    dataset_sizes = []
    outliers = None
    for exercise in (2025, 2026):
        year_manifest = {"race_available": exercise == 2026, "files": {}}
        for width in range(4):
            for economic_dimensions in itertools.combinations(
                ECONOMIC_BANDS.keys(), width
            ):
                economic_keys = tuple(
                    ECONOMIC_BANDS[name]["key"] for name in economic_dimensions
                )
                rows = [
                    prepare_segment(row)
                    for row in query_segments(exercise, economic_dimensions)
                ]
                profiles = describe_profiles(rows)
                indexed = index_segments(rows, economic_keys)
                mask = "+".join(economic_dimensions) or "base"
                if exercise == 2026 and mask == "base":
                    filename = "outlier-universe.json.gz"
                else:
                    filename = f"outlier-universe-{exercise}-{mask}.json.gz"
                payload = {
                    "year": exercise, "threshold": 100,
                    "economic_dimensions": list(economic_dimensions),
                    "eligible": len(indexed), "profiles": profiles,
                    "segments": indexed,
                }
                with gzip.open(
                    OUT / filename, "wt", encoding="utf-8", compresslevel=9
                ) as handle:
                    json.dump(
                        payload, handle, ensure_ascii=False, separators=(",", ":")
                    )
                size = (OUT / filename).stat().st_size
                dataset_sizes.append((filename, len(indexed), size))
                year_manifest["files"][mask] = filename
                if mask == "base":
                    summary = base_summary(indexed, profiles)
                    year_manifest["base"] = summary
                    if exercise == 2026:
                        outliers = {"threshold": 100, "universe": summary}
                del rows, indexed, payload
        explorer_manifest["years"][str(exercise)] = year_manifest
    (OUT / "explorer-manifest.json").write_text(
        json.dumps(explorer_manifest, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    assert outliers is not None

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
    generated_datasets = {name for name, _, _ in dataset_sizes}
    for legacy_dataset in OUT.glob("outlier-universe*.json.gz"):
        if legacy_dataset.name not in generated_datasets:
            legacy_dataset.unlink()
    con.close()
    build_map(crosswalk)
    print(f"Dados: {(OUT / 'deep-analysis.json').stat().st_size / 1e6:.1f} MB")
    total_search_size = sum(size for _, _, size in dataset_sizes)
    total_segments = sum(count for _, count, _ in dataset_sizes)
    print(
        f"Explorador: {len(dataset_sizes)} índices; "
        f"{total_segments:,} segmentos; {total_search_size / 1e6:.1f} MB gzip"
    )
    for filename, count, size in dataset_sizes:
        print(f"  {filename}: {count:,} segmentos; {size / 1e6:.1f} MB")
    print(f"Mapa: {(OUT / 'municipalities.topo.json').stat().st_size / 1e6:.1f} MB")
    print(f"Cidades: {len(cities)} linhas; recorte racial: {len(municipal_race)} cidades")


if __name__ == "__main__":
    main()
