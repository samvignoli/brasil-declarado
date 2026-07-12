# Brasil declarado

Análise sociológica, econômica e territorial dos dados agregados de declarantes
do Imposto de Renda no Brasil.

**Site:** https://samvignoli.com/brasildeclarado/  
**Explorador:** https://samvignoli.com/brasildeclarado/explorador/

O projeto cruza renda, patrimônio, raça, gênero, idade, profissão e território
sem confundir o universo fiscal com a população brasileira. O relatório compara
os exercícios 2025 e 2026, confronta médias com totais e explicita os limites da
declaração de patrimônio pelo custo histórico.

## O que há no projeto

- ensaio nacional e discrepância entre o painel e as entregas oficiais;
- Explorador comparativo: 214.184 segmentos em 2025 e 223.857 em 2026;
- filtros combináveis de renda total, renda tributável e patrimônio;
- URLs compartilháveis que preservam exercício, busca, granularidade e faixas;
- atlas de 5.571 municípios, com renda e patrimônio por habitante;
- desigualdade racial e comparação com o Censo 2022;
- vínculos entre trabalho privado, setor público e propriedade de capital;
- checagem crítica de interpretações liberais e esquerdistas;
- método, fontes, limiares e limitações reproduzíveis.

## Começar

Requer Node.js 22 ou superior.

```bash
npm install
npm run dev
```

O site estará em http://localhost:3000.

Para construir e executar todos os testes:

```bash
npm test
```

O resultado estático é escrito em `dist/`. Não há dependência de API, CDN,
fonte ou mapa externo em tempo de execução.

## Dados

O repositório inclui 16 índices comprimidos do Explorador em `public/data/`:
oito combinações de filtros econômicos para cada exercício. O navegador carrega
somente o índice correspondente ao recorte ativo, com 10 a 13 MB em gzip. O
arquivo `explorer-manifest.json` descreve exercícios, faixas e partições.

O banco completo em DuckDB tem aproximadamente 1,5 GB e não pertence ao
histórico Git. Ele será distribuído nos assets da
[Release mais recente](https://github.com/samvignoli/brasil-declarado/releases/latest),
acompanhado de README, dicionário e consultas de exemplo.

Para reconstruir os agregados, coloque o banco em `data/perfil.duckdb` e rode:

```bash
python3 -m pip install duckdb pyshp shapely pytopojson
npm run data
```

As médias são calculadas como razão entre somas — renda total dividida pelo
número de declarantes — e nunca como média simples das células agregadas.

## Fonte principal

[Painel de Perfil dos Declarantes do IRPF — Receita Federal](https://app.powerbi.com/view?r=eyJrIjoiYzA5NTBkYzctZTA1Zi00MDE5LTkzZTItYzM4ZDgwYTFlMmYxIiwidCI6IjZmNDlhYTQzLTgyMmEtNGMyMC05NjcwLWRiNzcwMGJmMWViMCJ9),
extraído em 11 de julho de 2026. População e malha municipal: IBGE.

## Limitações essenciais

1. Declarantes de IRPF não representam toda a população brasileira.
2. Combinações pequenas podem ser protegidas ou omitidas. O Explorador exige
   ao menos 100 declarantes por segmento.
3. Imóveis, veículos e participações empresariais geralmente permanecem pelo
   custo histórico ou capital social, não pelo valor de mercado.
4. A mesma pessoa pode contribuir para agregações diferentes; segmentos de
   granularidades distintas não devem ser somados.
5. O recorte de 2026 do painel não coincide com o total oficial de declarações
   entregues, e a Receita não publicou uma reconciliação desses universos.
6. Raça/cor veio integralmente como “Não informado” no exercício 2025. Por isso,
   os perfis raciais do Explorador existem apenas em 2026.
7. Rankings condicionados por uma faixa valem somente dentro dela. Filtrar pela
   própria variável ranqueada é uma descrição circular, não um ranking geral.

## Estrutura

- `src/`: JavaScript e estilos do site;
- `explorador/`, `territorio/`, `raca/` etc.: capítulos HTML;
- `scripts/build_deep_report.py`: geração reproduzível dos agregados;
- `public/data/`: dados estáticos consumidos pelo site;
- `tests/`: testes de integridade editorial, estatística e técnica;
- `release/`: documentação dos pacotes de dados.

## Contribuir

Leia [CONTRIBUTING.md](CONTRIBUTING.md). Correções metodológicas, testes,
melhorias de acessibilidade e novas leituras sociológicas são bem-vindas.

## Licença

O código do projeto é distribuído sob a licença MIT. Os dados mantêm a autoria,
os termos e as condições aplicáveis às fontes públicas originais; este projeto
não os relicencia.
