import { SourceScale } from "../components/DataFigures";
import { PageShell } from "../components/SiteShell";

const cards = [
  ["01", "Declarante não é população", "A base inclui quem entregou DIRPF. Pessoas abaixo dos critérios de obrigatoriedade e muitos brasileiros de baixa renda ficam fora do retrato."],
  ["02", "Linha não é pessoa", "Cada uma das 50,1 milhões de linhas é uma célula agregada. Totais usam a soma de qtd_contribuintes; médias são razões entre somas e contagens."],
  ["03", "Patrimônio não é mercado", "Bens costumam permanecer pelo custo de aquisição, salvo acréscimos e regimes especiais. Empresas fechadas também não aparecem por valor econômico corrente."],
  ["04", "Exercício não é ano da renda", "O exercício é o ano de entrega. A declaração do exercício 2026 relata fatos ocorridos, em geral, no ano-calendário 2025."],
  ["05", "Ausência é substantiva", "Categorias vazias ou não informadas são preservadas. Em raça/cor, a ausência impede generalizações para o conjunto da população."],
  ["06", "Associação não é causalidade", "Diferenças entre municípios, gêneros ou ocupações são descritivas. A base não identifica trajetórias nem permite atribuir causalidade."],
  ["07", "Per capita tem dois sentidos", "Por declarante descreve somente quem está no IRPF. Por habitante divide o total declarado por toda a população e combina riqueza com cobertura fiscal."],
  ["08", "Os anos não são uma coorte", "A queda de 46,7 para 41,6 milhões de declarantes muda a composição. Não sabemos quem entrou, saiu ou permaneceu entre os exercícios."],
  ["09", "Comparação real", "Variações monetárias entre os anos-calendário 2024 e 2025 foram corrigidas pelo IPCA de 2025, de 4,26%. Valores exibidos em reais continuam nominais."],
];

export default function MetodoPage() {
  return <PageShell>
    <section className="inner-hero page-pad theme-paper">
      <div className="hero-index">06 — Como ler</div>
      <p className="eyebrow">Método, cobertura e ética</p>
      <h1>O que a declaração<br />consegue enxergar?</h1>
      <p className="inner-deck">Um guia para comparar dois exercícios sem transformar precisão numérica em certeza sociológica.</p>
    </section>
    <section className="page-pad source-section"><SourceScale /></section>
    <section className="page-pad method-cards">
      {cards.map(([index, title, text]) => <article key={index}><span>{index}</span><h2>{title}</h2><p>{text}</p></article>)}
    </section>
    <section className="page-pad narrative-grid pale-section">
      <div className="sticky-title"><p className="section-number">I</p><h2>Como as contas foram feitas.</h2></div>
      <div className="story-column prose">
        <p>O arquivo principal foi materializado em uma tabela colunar e agregado por exercício, gênero, raça/cor, faixa etária, município, UF, região, ocupação, natureza do vínculo e faixas de renda e patrimônio.</p>
        <p>Contagens foram somadas com <code>qtd_contribuintes</code> como peso. Renda média, por exemplo, é <code>sum(soma_rend_total) / sum(qtd_contribuintes)</code>. Nenhum resultado usa média simples entre células.</p>
        <p>Para medidas populacionais, o exercício 2025 foi relacionado à estimativa do IBGE de 1º de julho de 2024, ano-calendário dos rendimentos; o exercício 2026, à estimativa de 2025. Residentes no exterior foram excluídos dos denominadores regionais.</p>
        <p>Não foi calculado Gini individual, porque a base agregada não preserva posições individuais dentro das faixas.</p>
      </div>
    </section>
    <section className="page-pad narrative-grid">
      <div className="sticky-title"><p className="section-number">II</p><h2>Como interpretar patrimônio.</h2></div>
      <div className="story-column prose">
        <p>O campo patrimonial é valioso para comparar posições relativas dentro da declaração, mas não deve ser lido como riqueza a preços de mercado. Imóveis e bens móveis, em regra, ficam pelo valor de aquisição e só mudam com novos custos ou eventos admitidos. Regimes excepcionais de atualização criam rupturas adicionais.</p>
        <p>Ativos financeiros tendem a refletir saldos mais atuais, enquanto participações em empresas fechadas podem permanecer pelo custo declarado. A soma mistura componentes com relógios econômicos diferentes.</p>
      </div>
    </section>
    <section className="page-pad sources-list">
      <p className="eyebrow">Fontes e documentação</p>
      <h2>Base para auditoria</h2>
      <a href="https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/arrecadacao" target="_blank" rel="noreferrer">Receita Federal — Painel de Perfil dos Declarantes do IRPF ↗</a>
      <a href="https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/quem/quem" target="_blank" rel="noreferrer">Receita Federal — Quem deve declarar ↗</a>
      <a href="https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/perguntas-frequentes/imposto-de-renda/dirpf/declaracao/atualizar" target="_blank" rel="noreferrer">Receita Federal — Atualização do valor dos bens ↗</a>
      <a href="https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/preenchimento/manual-mir/patrimonio/eventos-do-patrimonio" target="_blank" rel="noreferrer">Receita Federal — Eventos do patrimônio ↗</a>
      <a href="https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/perguntas-frequentes/imposto-de-renda/dirpf" target="_blank" rel="noreferrer">Receita Federal — Exercício e ano-calendário ↗</a>
      <a href="https://sidra.ibge.gov.br/tabela/6579" target="_blank" rel="noreferrer">IBGE/SIDRA — Estimativas da população, tabela 6579 ↗</a>
      <a href="https://agenciadenoticias.ibge.gov.br/agencia-sala-de-imprensa/2013-agencia-de-noticias/releases/45612-ipca-vai-a-0-33-em-dezembro-e-fecha-o-ano-em-4-26" target="_blank" rel="noreferrer">IBGE — IPCA de 2025 (4,26%) ↗</a>
    </section>
  </PageShell>;
}
