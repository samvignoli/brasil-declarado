# Brasil declarado — base de dados

Pacote de dados do projeto **Brasil declarado**, baseado no Painel de Perfil dos
Declarantes do IRPF da Receita Federal do Brasil.

Site e explorador: https://samvignoli.com/brasildeclarado/

Fonte original: https://app.powerbi.com/view?r=eyJrIjoiYzA5NTBkYzctZTA1Zi00MDE5LTkzZTItYzM4ZDgwYTFlMmYxIiwidCI6IjZmNDlhYTQzLTgyMmEtNGMyMC05NjcwLWRiNzcwMGJmMWViMCJ9

Extração utilizada pelo projeto: 11 de julho de 2026.

## Arquivos

- `perfil-irpf-2025-2026.duckdb`: banco analítico completo extraído do cubo
  agregado da Receita. Aproximadamente 1,5 GB.
- `explorer-manifest.json`: catálogo de exercícios, faixas e partições.
- `outlier-universe*.json.gz`: 16 índices do Explorador — oito combinações de
  faixas econômicas para cada exercício. Cada navegação carrega apenas a
  partição correspondente ao recorte ativo.
- `DICIONARIO.md`: descrição dos principais campos e limitações.
- `CONSULTAS_EXEMPLO.sql`: exemplos de consultas em DuckDB.

## Como abrir o banco

Com o DuckDB instalado:

```bash
duckdb perfil-irpf-2025-2026.duckdb
```

Dentro do console:

```sql
SHOW TABLES;
DESCRIBE perfil;
```

Também é possível usar Python, R, Julia e ferramentas de BI compatíveis com
DuckDB.

## Limitações indispensáveis

1. A base representa declarantes de IRPF, não toda a população brasileira.
2. Os dados são agregados e anonimizados; não permitem reconstruir pessoas.
3. Combinações pequenas podem ser omitidas ou protegidas pela Receita. No
   Explorador, cada segmento possui pelo menos 100 declarantes.
4. Imóveis, veículos e participações empresariais geralmente permanecem pelo
   custo histórico ou capital social, não pelo valor de mercado.
5. A mesma pessoa pode contribuir para diferentes agregações. Segmentos de
   granularidades distintas não devem ser somados.
6. O exercício fiscal é o ano da declaração; renda e patrimônio se referem ao
   ano-calendário anterior.
7. O recorte do painel para 2026 não coincide com a quantidade oficial de
   declarações entregues. A Receita não publicou, até a elaboração do projeto,
   uma reconciliação dos dois universos.
8. Raça/cor não está disponível no exercício 2025: todas as células extraídas
   vieram como “Não informado”. Os perfis raciais existem apenas em 2026.
9. Posições condicionadas por faixas econômicas valem somente dentro delas.
   Filtrar pela própria variável ranqueada altera a pergunta e deve ser descrito.

## Uso responsável

Ao reutilizar os dados, cite a Receita Federal como fonte primária, informe o
universo analisado e preserve as ressalvas metodológicas. Este pacote não altera
nem substitui os termos aplicáveis à fonte pública original.
