import { RegionPopulationBalance, RegionalCoverage, RegionalPerCapita, StatePerCapitaTable } from "../components/ComparativeFigures";
import { PageShell } from "../components/SiteShell";

export default function TerritorioPage() {
  return <PageShell>
    <section className="inner-hero page-pad theme-orange">
      <div className="hero-index">02 — População, cobertura e riqueza</div>
      <p className="eyebrow">Uma geografia com denominador</p>
      <h1>Não basta somar.<br />É preciso dividir.</h1>
      <p className="inner-deck">A população do IBGE revela quanto da concentração regional vem do tamanho demográfico, quanto vem da cobertura do IRPF e quanto permanece como diferença patrimonial entre declarantes.</p>
    </section>

    <section className="page-pad essay-opening">
      <p className="section-number">I</p>
      <div><h2>Três mapas se sobrepõem.</h2><p>O primeiro é o da população. O segundo, o da presença no sistema declaratório. O terceiro, o do valor patrimonial de quem declara. A concentração final nasce do acúmulo dos três — não de um único fator.</p><p>Em 2025, o Sudeste reunia 41,7% da população, 51,1% dos declarantes e 60,1% do patrimônio. No Nordeste, a sequência era 26,9%, 15,4% e 8,1%. A desigualdade se amplia a cada passagem.</p></div>
    </section>

    <section className="page-pad essay-section paper-section">
      <header className="essay-heading"><p className="eyebrow">População → declarantes → patrimônio</p><h2>A participação regional em cada camada.</h2></header>
      <RegionPopulationBalance />
    </section>

    <section className="page-pad essay-section">
      <header className="essay-heading"><p className="section-number">II</p><h2>Em 2026, a cobertura recua em todas as regiões.</h2></header>
      <div className="essay-copy two-column-copy"><p>A queda não é um fenômeno restrito a uma região. O Norte perde 2,3 declarantes por cem habitantes; o Nordeste, 1,8; o Sudeste, 2,7; o Sul, 3,3; o Centro-Oeste, 2,8.</p><p>Isso reforça que as médias maiores de 2026 combinam mudança econômica e mudança de composição. No Sul, onde a cobertura mais cai, a renda média por declarante é justamente a que mais cresce.</p></div>
      <RegionalCoverage />
    </section>

    <section className="page-pad essay-section dark-figure-section">
      <header className="essay-heading"><p className="section-number">III</p><h2>Patrimônio por habitante: uma lente melhor, ainda imperfeita.</h2></header>
      <div className="essay-copy two-column-copy"><p>Dividir o estoque declarado por toda a população reduz o efeito do tamanho regional. Em 2026, o Sudeste registra R$ 114,9 mil por habitante e o Sul, R$ 110,2 mil. No Norte são R$ 23,3 mil; no Nordeste, R$ 24,2 mil.</p><p>A distância Sudeste–Nordeste é de 4,7 vezes. Por declarante, cai para 2,1 vezes. O restante da diferença vem da proporção muito distinta de habitantes que aparece no IRPF.</p></div>
      <RegionalPerCapita />
    </section>

    <section className="page-pad essay-section paper-section">
      <header className="essay-heading"><p className="section-number">IV</p><h2>O ranking dos estados repete a hierarquia da cobertura.</h2></header>
      <div className="essay-copy"><p>Distrito Federal e São Paulo lideram tanto patrimônio declarado por habitante quanto participação da população no IRPF. Amapá e Maranhão estão na ponta oposta. Isso não torna a medida circular, mas mostra que “riqueza per capita declarada” captura simultaneamente patrimônio e acesso ao universo fiscal.</p></div>
      <StatePerCapitaTable />
    </section>
  </PageShell>;
}
