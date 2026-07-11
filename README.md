# Brasil declarado

Ensaio visual e exploratório sobre renda, patrimônio e desigualdades no universo
de declarantes do IRPF, construído a partir da extração documentada no diretório
pai.

## Páginas

- abertura e síntese nacional;
- renda e patrimônio;
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
