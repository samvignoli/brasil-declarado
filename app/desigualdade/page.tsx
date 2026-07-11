import { DistributionFigure, GenderFigure, WealthFigure } from "../components/DataFigures";
import { PageShell } from "../components/SiteShell";

export default function DesigualdadePage() {
  return <PageShell>
    <section className="inner-hero page-pad theme-green">
      <div className="hero-index">02 — Renda & patrimônio</div>
      <p className="eyebrow">A arquitetura da concentração</p>
      <h1>Poucos no topo.<br />Muito no topo.</h1>
      <p className="inner-deck">O patrimônio declarado é ainda mais concentrado que a renda — mesmo sendo uma medida imperfeita e frequentemente registrada a custo histórico.</p>
    </section>
    <section className="page-pad stat-band">
      <div><strong>5,8%</strong><span>têm patrimônio acima de R$ 1 milhão</span></div>
      <div><strong>72,9%</strong><span>do patrimônio está nesse grupo</span></div>
      <div><strong>23,3%</strong><span>da renda vai aos 0,77% acima de R$ 1,2 mi/ano</span></div>
    </section>
    <section className="page-pad narrative-grid">
      <div className="sticky-title"><p className="section-number">I</p><h2>A riqueza se concentra mais que o fluxo de renda.</h2></div>
      <div className="story-column">
        <p>Em 2025, a renda total média foi de R$ 130,5 mil por declarante. O patrimônio médio informado chegou a R$ 326,8 mil. Essas médias escondem uma distribuição muito assimétrica.</p>
        <p>A faixa acima de R$ 1 milhão de patrimônio reúne 2,7 milhões de declarantes. É uma minoria de 5,8% que concentra quase três quartos de todo o estoque patrimonial registrado.</p>
        <WealthFigure />
      </div>
    </section>
    <section className="page-pad narrative-grid pale-section">
      <div className="sticky-title"><p className="section-number">II</p><h2>Faixas revelam o degrau — não toda a escada.</h2></div>
      <div className="story-column">
        <p>As quatro faixas permitem observar concentração, mas não medir um Gini individual: dentro de cada faixa continuam existindo diferenças que o cubo agregado não expõe.</p>
        <DistributionFigure dataset="income_bands" labelKey="faixa" initialMetric="rend_total" />
        <DistributionFigure dataset="wealth_bands" labelKey="faixa" initialMetric="patrimonio" color="orange" />
      </div>
    </section>
    <section className="page-pad narrative-grid">
      <div className="sticky-title"><p className="section-number">III</p><h2>Gênero atravessa renda e patrimônio.</h2></div>
      <div className="story-column">
        <p>Em 2025, mulheres são 43,9% dos declarantes. Sua renda média equivale a 81,9% da masculina; o patrimônio médio, a 59,7%. O contraste patrimonial é mais profundo que o de renda.</p>
        <GenderFigure />
      </div>
    </section>
  </PageShell>;
}
