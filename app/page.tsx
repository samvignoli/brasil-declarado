import Link from "next/link";
import { CompositionShift, NationalComparison, RegionalCoverage, RegionalPerCapita } from "./components/ComparativeFigures";
import { PageShell } from "./components/SiteShell";

export default function Home() {
  return <PageShell>
    <section className="home-hero comparative-hero page-pad">
      <div className="hero-index">01 — O país entre duas declarações</div>
      <p className="eyebrow">Exercício 2025 × exercício 2026</p>
      <h1>Duas fotos.<br />Uma moldura<br />que mudou.</h1>
      <div className="hero-deck">
        <p>Renda e patrimônio crescem. O número de declarantes cai. Antes de dizer que o país enriqueceu, é preciso entender quem permaneceu na fotografia.</p>
        <span>Rendimentos de 2024 e 2025; extração em 11 jul. 2026</span>
      </div>
      <div className="hero-totals comparison-totals">
        <div><strong>−11,0%</strong><span>declarantes observados</span></div>
        <div><strong>+6,7%</strong><span>renda total, em termos reais</span></div>
        <div><strong>+6,9%</strong><span>patrimônio total, em termos reais</span></div>
      </div>
    </section>

    <section className="page-pad essay-opening">
      <p className="section-number">I</p>
      <div>
        <h2>O principal achado não é uma cifra. É uma mudança de composição.</h2>
        <p>O exercício 2025 representa 46,7 milhões de declarantes; o de 2026, 41,6 milhões. Ao mesmo tempo, a população brasileira estimada pelo IBGE cresce de 212,6 para 213,4 milhões. A cobertura do painel recua de 22,0 para 19,5 declarantes a cada cem habitantes.</p>
        <p>Os valores médios sobem muito mais que os totais porque a parte inferior da distribuição encolhe enquanto as faixas superiores crescem. A base de 2026 está mais concentrada no topo. Comparar médias sem mostrar isso confundiria seleção com enriquecimento.</p>
      </div>
    </section>

    <section className="page-pad essay-figure dark-figure-section">
      <p className="eyebrow">A fotografia nacional, lado a lado</p>
      <NationalComparison />
    </section>

    <section className="page-pad essay-section">
      <header className="essay-heading"><p className="section-number">II</p><h2>Quem some da base está concentrado embaixo. Quem cresce está no topo.</h2></header>
      <div className="essay-copy two-column-copy">
        <p>A faixa de renda anual até R$ 200 mil perde 5,7 milhões de declarantes, queda de 14,0%. Todas as faixas acima dela crescem; o grupo superior a R$ 1,2 milhão aumenta 23,7%.</p>
        <p>No patrimônio, a faixa até R$ 100 mil perde 17,3% dos declarantes, enquanto o grupo acima de R$ 1 milhão cresce 10,1%. A desigualdade não aparece apenas nos valores: aparece na própria composição do universo observado.</p>
      </div>
      <CompositionShift />
    </section>

    <section className="page-pad essay-section paper-section">
      <header className="essay-heading"><p className="section-number">III</p><h2>A população muda o significado do mapa.</h2></header>
      <div className="essay-copy two-column-copy">
        <p>O Sudeste não tem “60% da riqueza” isoladamente: abriga cerca de 41,6% da população e concentra 60% do patrimônio declarado. O Sul reúne 14,7% dos habitantes e cerca de 20% do patrimônio. No Norte e no Nordeste, a relação se inverte.</p>
        <p>O denominador também mostra a desigualdade de cobertura. Em 2026, há 25 declarantes a cada cem habitantes no Sul e 24,3 no Sudeste, contra 11,8 no Norte e 10,9 no Nordeste. O mapa da riqueza declarada é também um mapa da entrada no sistema fiscal.</p>
      </div>
      <RegionalCoverage />
      <div className="essay-subheading"><p className="eyebrow">Patrimônio declarado por habitante</p><h3>O estoque registrado, dividido por toda a população regional.</h3></div>
      <RegionalPerCapita />
      <p className="interpretation-note">Esta medida não é a riqueza média de uma pessoa residente. É o total que aparece nas declarações dividido por todos os habitantes — uma combinação de riqueza, cobertura fiscal e forma de registro dos bens.</p>
      <Link href="/territorio" className="essay-link">Aprofundar a geografia da declaração →</Link>
    </section>

    <section className="page-pad conclusions-section">
      <p className="eyebrow">A foto do país</p>
      <h2>Quatro conclusões que sobrevivem à cautela.</h2>
      <div className="conclusions-grid">
        <article><span>01</span><h3>A base ficou mais seletiva.</h3><p>O recuo de cobertura acontece nas cinco regiões e se concentra nas faixas inferiores.</p></article>
        <article><span>02</span><h3>A concentração aumentou.</h3><p>Os grupos de renda e patrimônio mais altos ganham peso e participação nos totais.</p></article>
        <article><span>03</span><h3>O território amplifica.</h3><p>População, entrada no IRPF e patrimônio por declarante se acumulam nos mesmos estados.</p></article>
        <article><span>04</span><h3>Não é um painel longitudinal.</h3><p>Não sabemos quem entrou ou saiu. A comparação descreve dois universos agregados, não trajetórias pessoais.</p></article>
      </div>
    </section>
  </PageShell>;
}
