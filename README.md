# Brasil declarado

Ensaio visual comparativo sobre renda, patrimônio e desigualdades no universo
de declarantes do IRPF. Os exercícios 2025 e 2026 são colocados lado a lado e
relacionados às estimativas populacionais do IBGE para 2024 e 2025.

## Páginas

- abertura e síntese nacional;
- comparação entre os dois exercícios;
- população, cobertura fiscal e patrimônio por habitante;
- renda, patrimônio e concentração;
- raça e gênero;
- território;
- trabalho e ocupações;
- método, cobertura e ética.

## Dados derivados

`public/data/analysis.json` contém somente agregados preparados para o site. O
arquivo pode ser reproduzido com `scripts/build_analysis_data.py`, que usa
DuckDB e lê `../powerbi_extraido/Fat_-_Perfil_Beneficiario.csv`.

As médias são sempre calculadas como razão entre somas e contagens ponderadas
por `qtd_contribuintes`. Nenhum resultado usa média simples entre células.

As populações oficiais estão preservadas em
`data/ibge_population_2024_2025.csv` e vêm da tabela 6579 do SIDRA. Variações
monetárias reais usam o IPCA de 2025 (4,26%).

## Desenvolvimento

```bash
npm install
npm run dev
```

Validação:

```bash
npm run build
npm run lint
node --test tests/rendered-html.test.mjs
```
