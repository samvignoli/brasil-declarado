#!/usr/bin/env python3
"""Gera agregados auditaveis para o site a partir do cubo publico da RFB."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / "analise-brasil"
DATA = ROOT / "powerbi_extraido"
DB_PATH = SITE / "data" / "perfil.duckdb"
OUT_PATH = SITE / "public" / "data" / "analysis.json"


def qpath(path: Path) -> str:
    return str(path).replace("'", "''")


def main() -> None:
    try:
        import duckdb
    except ImportError:
        print("DuckDB nao encontrado. Adicione-o ao PYTHONPATH.", file=sys.stderr)
        raise

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    con = duckdb.connect(str(DB_PATH))
    con.execute(f"PRAGMA threads={max(2, min(8, os.cpu_count() or 4))}")
    con.execute("PRAGMA enable_progress_bar")

    has_table = con.execute(
        "SELECT count(*) FROM information_schema.tables WHERE table_name='perfil'"
    ).fetchone()[0]
    if not has_table:
        print("Importando o CSV principal para uma tabela colunar...", flush=True)
        con.execute(
            f"""
            CREATE TABLE perfil AS
            SELECT
              qtd_contribuintes::BIGINT AS contribuintes,
              qtd_dependentes::BIGINT AS dependentes,
              genero,
              co_natureza_ocupacao,
              co_municipio::INTEGER AS co_municipio,
              in_atividade_rural,
              in_renda_variavel,
              in_conjuge,
              txt_nivel,
              an_exercicio::INTEGER AS exercicio,
              Faixa_Rendimentos_Tributaveis_Curto AS faixa_rend_tributavel,
              Ordem_Faixa_Rendimentos_Tributaveis::INTEGER AS ordem_rend_tributavel,
              Faixa_Patrimonio_Curto AS faixa_patrimonio,
              Ordem_Faixa_Patrimonio::INTEGER AS ordem_patrimonio,
              Faixa_rend_total_Curto AS faixa_rend_total,
              Ordem_Faixa_Rend_Total::INTEGER AS ordem_rend_total,
              co_ocupacao::INTEGER AS co_ocupacao,
              raca_cor,
              soma_rend_trib_total::DOUBLE AS rend_tributavel,
              soma_rend_total::DOUBLE AS rend_total,
              soma_patrimonio_liquido::DOUBLE AS patrimonio,
              in_completo,
              soma_va_impdev3_total::DOUBLE AS imposto_devido,
              soma_desp_medica_liquida::DOUBLE AS desp_medica,
              soma_doacoes_dirpf::DOUBLE AS doacoes_dirpf,
              soma_doacoes_ano::DOUBLE AS doacoes_ano,
              soma_desp_pensao_alimenticia::DOUBLE AS desp_pensao,
              soma_desp_instrucao::DOUBLE AS desp_instrucao,
              soma_idade::BIGINT AS soma_idade,
              faixa_etaria
            FROM read_csv_auto(
              '{qpath(DATA / 'Fat_-_Perfil_Beneficiario.csv')}',
              header=true,
              encoding='utf-8',
              all_varchar=true,
              parallel=true,
              ignore_errors=false
            )
            """
        )
        print("Importacao concluida.", flush=True)

    con.execute(
        f"""
        CREATE OR REPLACE TABLE municipios AS
        SELECT "Código Município"::INTEGER AS co_municipio,
               "Nome Município" AS municipio,
               "Sigla UF" AS uf,
               "Sigla Região Política" AS regiao,
               "Município - UF" AS municipio_uf,
               "Nome UF" AS nome_uf
        FROM read_csv_auto('{qpath(DATA / 'Dim-Municipios.csv')}', header=true)
        """
    )
    con.execute(
        f"""
        CREATE OR REPLACE TABLE naturezas AS
        SELECT lpad(nopr_cd::VARCHAR, 2, '0') AS codigo, nopr_nm AS natureza
        FROM read_csv_auto('{qpath(DATA / 'Dim-Natureza_da_Ocupacao.csv')}', header=true)
        """
    )
    con.execute(
        f"""
        CREATE OR REPLACE TABLE ocupacoes AS
        SELECT oprf_cd::INTEGER AS codigo, oprf_nm AS ocupacao
        FROM read_csv_auto('{qpath(DATA / 'Dim-Ocupacoes_Principais.csv')}', header=true)
        UNION
        SELECT oprf_cd::INTEGER AS codigo, oprf_nm AS ocupacao
        FROM read_csv_auto('{qpath(DATA / 'Tabela.csv')}', header=true)
        """
    )

    metric_sql = """
      sum(contribuintes)::HUGEINT AS contribuintes,
      sum(dependentes)::HUGEINT AS dependentes,
      sum(rend_tributavel)::DOUBLE AS rend_tributavel,
      sum(rend_total)::DOUBLE AS rend_total,
      sum(patrimonio)::DOUBLE AS patrimonio,
      sum(imposto_devido)::DOUBLE AS imposto_devido,
      sum(desp_medica)::DOUBLE AS desp_medica,
      sum(desp_instrucao)::DOUBLE AS desp_instrucao,
      sum(desp_pensao)::DOUBLE AS desp_pensao,
      sum(doacoes_dirpf)::DOUBLE AS doacoes_dirpf,
      sum(doacoes_ano)::DOUBLE AS doacoes_ano,
      sum(soma_idade)::HUGEINT AS soma_idade
    """

    def rows(sql: str) -> list[dict]:
        cur = con.execute(sql)
        names = [item[0] for item in cur.description]
        result = []
        for row in cur.fetchall():
            record = {}
            for key, value in zip(names, row):
                if value is None:
                    record[key] = None
                elif isinstance(value, int):
                    record[key] = value
                elif isinstance(value, float):
                    record[key] = round(value, 2)
                else:
                    record[key] = str(value)
            result.append(record)
        return result

    output: dict[str, object] = {
        "meta": {
            "source": "Painel de Perfil dos Declarantes do IRPF",
            "extracted_at": "2026-07-11",
            "unit": "celulas multidimensionais agregadas",
            "raw_rows": 50_100_305,
            "notes": [
                "As medias sao razoes entre somas e contribuintes.",
                "Exercicio e o ano de entrega; os rendimentos se referem ao ano-calendario anterior.",
                "O universo abrange declarantes do IRPF, nao toda a populacao brasileira.",
            ],
        }
    }

    def grouped(
        name: str,
        select_dims: str,
        group_dims: str,
        source: str = "perfil",
        order: str = "",
    ) -> None:
        sql = f"SELECT {select_dims}, {metric_sql} FROM {source} GROUP BY {group_dims}"
        if order:
            sql += f" ORDER BY {order}"
        print(f"Agregando {name}...", flush=True)
        output[name] = rows(sql)

    grouped("overview", "exercicio", "exercicio", order="exercicio")
    grouped("gender", "exercicio, coalesce(genero, 'Não informado') AS genero", "exercicio, genero", order="exercicio, genero")
    grouped("race", "exercicio, coalesce(raca_cor, 'Não informado') AS raca", "exercicio, raca", order="exercicio, raca")
    age_order = "CASE faixa_etaria WHEN 'até 29 anos' THEN 1 WHEN '30 a 39 anos' THEN 2 WHEN '40 a 49 anos' THEN 3 WHEN '50 a 59 anos' THEN 4 WHEN '60 a 79 anos' THEN 5 WHEN '80 anos ou mais' THEN 6 ELSE 99 END"
    grouped("age", f"exercicio, coalesce(faixa_etaria, 'Não informado') AS faixa, {age_order} AS ordem", "exercicio, faixa, ordem", order="exercicio, ordem")
    grouped("income_bands", "exercicio, coalesce(faixa_rend_total, 'Não informado') AS faixa, coalesce(ordem_rend_total, 99) AS ordem", "exercicio, faixa, ordem", order="exercicio, ordem")
    grouped("taxable_income_bands", "exercicio, coalesce(faixa_rend_tributavel, 'Não informado') AS faixa, coalesce(ordem_rend_tributavel, 99) AS ordem", "exercicio, faixa, ordem", order="exercicio, ordem")
    grouped("wealth_bands", "exercicio, coalesce(faixa_patrimonio, 'Não informado') AS faixa, coalesce(ordem_patrimonio, 99) AS ordem", "exercicio, faixa, ordem", order="exercicio, ordem")
    grouped("account_level", "exercicio, coalesce(txt_nivel, 'Não informado') AS nivel", "exercicio, nivel", order="exercicio, nivel")
    grouped("rural", "exercicio, coalesce(in_atividade_rural, 'Não informado') AS valor", "exercicio, valor", order="exercicio, valor")
    grouped("variable_income", "exercicio, coalesce(in_renda_variavel, 'Não informado') AS valor", "exercicio, valor", order="exercicio, valor")
    grouped("spouse", "exercicio, coalesce(in_conjuge, 'Não informado') AS valor", "exercicio, valor", order="exercicio, valor")
    grouped("form_type", "exercicio, coalesce(in_completo, 'Não informado') AS valor", "exercicio, valor", order="exercicio, valor")

    geo_source = """
      (SELECT p.*, coalesce(m.municipio, 'Código sem correspondência') AS municipio,
              coalesce(m.municipio_uf, 'Código sem correspondência') AS municipio_uf,
              coalesce(m.uf, 'NI') AS uf, coalesce(m.regiao, 'NI') AS regiao,
              coalesce(m.nome_uf, 'Não informado') AS nome_uf
       FROM perfil p LEFT JOIN municipios m USING (co_municipio)) geo
    """
    grouped("regions", "exercicio, regiao", "exercicio, regiao", source=geo_source, order="exercicio, regiao")
    grouped("states", "exercicio, uf, nome_uf", "exercicio, uf, nome_uf", source=geo_source, order="exercicio, uf")
    grouped("municipalities", "exercicio, co_municipio, municipio, municipio_uf, uf, regiao", "exercicio, co_municipio, municipio, municipio_uf, uf, regiao", source=geo_source, order="exercicio, co_municipio")

    nature_source = """
      (SELECT p.*, coalesce(n.natureza, 'Código ' || coalesce(p.co_natureza_ocupacao, 'NI')) AS natureza
       FROM perfil p LEFT JOIN naturezas n ON lpad(p.co_natureza_ocupacao, 2, '0') = n.codigo) nat
    """
    grouped("employment_nature", "exercicio, natureza", "exercicio, natureza", source=nature_source, order="exercicio, contribuintes DESC")
    occupation_source = """
      (SELECT p.*, coalesce(o.ocupacao, 'Código ' || coalesce(p.co_ocupacao::VARCHAR, 'NI')) AS ocupacao
       FROM perfil p LEFT JOIN ocupacoes o ON p.co_ocupacao = o.codigo) occ
    """
    grouped("occupations", "exercicio, ocupacao", "exercicio, ocupacao", source=occupation_source, order="exercicio, contribuintes DESC")

    grouped("race_gender", "exercicio, coalesce(raca_cor, 'Não informado') AS raca, coalesce(genero, 'Não informado') AS genero", "exercicio, raca, genero", order="exercicio, raca, genero")
    grouped("race_age", "exercicio, coalesce(raca_cor, 'Não informado') AS raca, coalesce(faixa_etaria, 'Não informado') AS faixa", "exercicio, raca, faixa", order="exercicio, raca, faixa")
    grouped("race_wealth", "exercicio, coalesce(raca_cor, 'Não informado') AS raca, coalesce(faixa_patrimonio, 'Não informado') AS faixa, coalesce(ordem_patrimonio, 99) AS ordem", "exercicio, raca, faixa, ordem", order="exercicio, raca, ordem")
    grouped("gender_wealth", "exercicio, coalesce(genero, 'Não informado') AS genero, coalesce(faixa_patrimonio, 'Não informado') AS faixa, coalesce(ordem_patrimonio, 99) AS ordem", "exercicio, genero, faixa, ordem", order="exercicio, genero, ordem")
    grouped("race_income", "exercicio, coalesce(raca_cor, 'Não informado') AS raca, coalesce(faixa_rend_total, 'Não informado') AS faixa, coalesce(ordem_rend_total, 99) AS ordem", "exercicio, raca, faixa, ordem", order="exercicio, raca, ordem")
    grouped("gender_income", "exercicio, coalesce(genero, 'Não informado') AS genero, coalesce(faixa_rend_total, 'Não informado') AS faixa, coalesce(ordem_rend_total, 99) AS ordem", "exercicio, genero, faixa, ordem", order="exercicio, genero, ordem")
    grouped("region_race", "exercicio, regiao, coalesce(raca_cor, 'Não informado') AS raca", "exercicio, regiao, raca", source=geo_source, order="exercicio, regiao, raca")

    OUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    con.close()
    print(
        f"Arquivo criado: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024 / 1024:.1f} MB)",
        flush=True,
    )


if __name__ == "__main__":
    main()
