import { WorkComparison } from "../components/ComparativeFigures";
import { PageShell } from "../components/SiteShell";

export default function TrabalhoPage() {
  return <PageShell>
    <section className="inner-hero page-pad theme-gold">
      <div className="hero-index">05 — Trabalho, propriedade e poder</div>
      <p className="eyebrow">Hierarquias ocupacionais entre exercícios</p>
      <h1>A profissão explica.<br />A propriedade completa.</h1>
      <p className="inner-deck">As ocupações de maior renda continuam no topo, mas patrimônio e vínculo revelam formas distintas de poder econômico.</p>
    </section>

    <section className="page-pad essay-opening">
      <p className="section-number">I</p>
      <div><h2>A hierarquia é estável; os valores sobem.</h2><p>Magistratura e tribunais de contas lideram os dois exercícios, seguidos pela alta advocacia pública, medicina e auditoria fiscal. Mesmo descontando o IPCA de 2025, a renda média dos grupos do topo cresce.</p><p>Mas a comparação não acompanha as mesmas pessoas. Mudanças no conjunto que declara dentro de cada ocupação também alteram a média.</p></div>
    </section>

    <section className="page-pad essay-section paper-section">
      <header className="essay-heading"><p className="eyebrow">Ocupações com ao menos 20 mil declarantes</p><h2>Renda anual média, 2025 → 2026.</h2></header>
      <WorkComparison />
    </section>

    <section className="page-pad essay-section">
      <header className="essay-heading"><p className="section-number">II</p><h2>Renda do trabalho e posição proprietária não são a mesma coisa.</h2></header>
      <div className="essay-copy two-column-copy"><p>Em 2025, proprietários de empresas e empregadores tinham renda média de R$ 298,7 mil e patrimônio de R$ 1,24 milhão. Em 2026, as médias passam a R$ 382,5 mil e R$ 1,39 milhão.</p><p>Capitalistas formam um grupo bem menor, mas com patrimônio médio acima de R$ 2,5 milhões em 2026. Diretores empresariais e produtores agropecuários também registram estoques patrimoniais muito superiores às médias de renda.</p></div>
      <div className="interpretive-pullquote">A declaração mostra que classe não é apenas quanto entra no ano. É também o que já foi acumulado — mesmo quando esse estoque está registrado por valores históricos.</div>
    </section>
  </PageShell>;
}
