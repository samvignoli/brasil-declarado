import { DistributionFigure, TerritoryExplorer } from "../components/DataFigures";
import { PageShell } from "../components/SiteShell";

export default function TerritorioPage() {
  return <PageShell>
    <section className="inner-hero page-pad theme-orange">
      <div className="hero-index">04 — Território</div>
      <p className="eyebrow">Uma geografia fiscal</p>
      <h1>O CEP também<br />organiza a riqueza.</h1>
      <p className="inner-deck">O Sudeste concentra declarantes, renda e, em proporção ainda maior, patrimônio. Capitais e enclaves de alta renda ampliam o contraste.</p>
    </section>
    <section className="page-pad stat-band orange-band">
      <div><strong>51,1%</strong><span>dos declarantes estão no Sudeste</span></div>
      <div><strong>55,2%</strong><span>da renda total declarada</span></div>
      <div><strong>60,1%</strong><span>do patrimônio informado</span></div>
    </section>
    <section className="page-pad narrative-grid">
      <div className="sticky-title"><p className="section-number">I</p><h2>A concentração aumenta do número de pessoas ao estoque de patrimônio.</h2></div>
      <div className="story-column">
        <p>O Norte reúne 5,6% dos declarantes, mas 2,6% do patrimônio. O Nordeste, 15,4% das pessoas e 8,1% do patrimônio. O Sul faz o movimento inverso: 18,8% dos declarantes e 20,1% do patrimônio.</p>
        <DistributionFigure dataset="regions" labelKey="regiao" initialMetric="patrimonio" color="orange" />
      </div>
    </section>
    <section className="page-pad narrative-grid pale-section">
      <div className="sticky-title"><p className="section-number">II</p><h2>Estados e cidades expõem os polos.</h2></div>
      <div className="story-column">
        <p>No exercício 2025, o Distrito Federal lidera a renda média entre as unidades da federação. Entre municípios com ao menos 50 mil declarantes, Santana de Parnaíba, Vitória, Balneário Camboriú e Florianópolis aparecem no topo.</p>
        <TerritoryExplorer />
      </div>
    </section>
    <section className="page-pad method-strip"><strong>Cuidado ecológico</strong><p>Uma média municipal alta não descreve todos os moradores. O painel não permite separar desigualdades internas a cada cidade nem inferir trajetórias individuais.</p></section>
  </PageShell>;
}
