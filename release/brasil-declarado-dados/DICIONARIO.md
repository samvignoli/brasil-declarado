# Dicionário de dados

## Tabela `perfil`

Cada linha é uma célula agregada do cubo, não uma pessoa.

| Campo | Descrição |
|---|---|
| `contribuintes` | Quantidade agregada de declarantes na célula. |
| `dependentes` | Quantidade agregada de dependentes. |
| `genero` | Gênero informado no painel. |
| `raca_cor` | Raça/cor informada; há grande volume não informado. |
| `faixa_etaria` | Faixa etária do declarante. |
| `co_ocupacao` | Código da profissão/ocupação. |
| `co_natureza_ocupacao` | Código da natureza do vínculo ocupacional. |
| `co_municipio` | Código municipal interno da dimensão da Receita. |
| `exercicio` | Ano de entrega da declaração. |
| `rend_total` | Soma da renda total declarada na célula. |
| `rend_tributavel` | Soma da renda tributável declarada. |
| `patrimonio` | Soma do patrimônio declarado. Não equivale a valor de mercado. |
| `imposto_devido` | Soma do imposto devido. |
| `desp_medica` | Soma das despesas médicas declaradas. |
| `desp_instrucao` | Soma das despesas de instrução declaradas. |
| `desp_pensao` | Soma das despesas de pensão. |
| `doacoes_dirpf` | Doações registradas na declaração. |
| `doacoes_ano` | Doações registradas no ano. |
| `soma_idade` | Soma das idades na célula agregada. |
| `in_atividade_rural` | Indicador de atividade rural. |
| `in_renda_variavel` | Indicador de operações/enquadramento em renda variável. |
| `in_conjuge` | Indicador relacionado a cônjuge. |
| `in_completo` | Indicador da forma de declaração. |
| `faixa_rend_total` | Faixa de renda total. |
| `faixa_rend_tributavel` | Faixa de renda tributável. |
| `faixa_patrimonio` | Faixa de patrimônio. |

## Índices do Explorador

O Explorador é dividido em 16 arquivos gzip: oito combinações das três dimensões
econômicas para cada exercício. Cada JSON comprimido possui:

- `year`: exercício fiscal, 2025 ou 2026;
- `threshold`: piso de 100 declarantes;
- `economic_dimensions`: faixas econômicas materializadas naquele índice;
- `profiles`: oito combinações dimensionais em 2025 e 16 em 2026;
- `segments`: segmentos pesquisáveis e suas posições dentro do recorte.

O `explorer-manifest.json` relaciona anos, arquivos e opções das faixas. Raça/cor
não está disponível em 2025 porque todas as células vieram como “Não informado”.

Campos dos segmentos:

| Campo | Descrição |
|---|---|
| `profile` | Combinação dimensional utilizada. |
| `municipality`, `uf` | Município e UF, quando presentes no perfil. |
| `age` | Faixa etária, quando presente. |
| `gender` | Gênero, quando presente. |
| `race` | Raça/cor, quando presente. |
| `occupation` | Profissão, preservada em todos os perfis. |
| `declarantes` | Quantidade agregada de declarantes. |
| `income_average` | Renda média do segmento. |
| `wealth_average` | Patrimônio médio declarado do segmento. |
| `income_total_band` | Faixa de rendimentos totais, quando ativa. |
| `taxable_income_band` | Faixa de rendimentos tributáveis, quando ativa. |
| `wealth_band` | Faixa de patrimônio, quando ativa. |
| `income_rank` | Posição em renda média dentro do recorte econômico. |
| `wealth_rank` | Posição em patrimônio médio dentro do recorte econômico. |
| `income_bottom_rank` | Posição partindo das menores rendas do recorte. |
| `wealth_bottom_rank` | Posição partindo dos menores patrimônios não negativos do recorte. |
