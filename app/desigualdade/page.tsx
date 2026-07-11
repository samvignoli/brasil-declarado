import { CompositionShift, ConcentrationComparison, GenderComparison } from "../components/ComparativeFigures";
import { PageShell } from "../components/SiteShell";

export default function DesigualdadePage() {
  return <PageShell>
    <section className="inner-hero page-pad theme-green">
      <div className="hero-index">03 — Estruturas sociais</div>
      <p className="eyebrow">Renda, patrimônio e gênero no tempo</p>
      <h1>O topo cresce.<br />A base encolhe.</h1>
      <p className="inner-deck">A comparação entre exercícios sugere maior concentração, mas também alerta: a fotografia de 2026 perdeu mais pessoas justamente nas faixas inferiores.</p>
    </section>

    <section className="page-pad essay-opening">
      <p className="section-number">I</p>
      <div><h2>A desigualdade mudou — e a amostra também.</h2><p>A faixa superior a R$ 1,2 milhão anual passa de 360 mil para 446 mil declarantes. A faixa até R$ 200 mil cai de 41,1 para 35,4 milhões. No patrimônio, o grupo acima de R$ 1 milhão cresce; a faixa até R$ 100 mil perde 5,6 milhões de pessoas.</p><p>Isso torna impossível atribuir todo o aumento das médias às mesmas pessoas ficando mais ricas. Parte vem de uma base mais concentrada no alto.</p></div>
    </section>

    <section className="page-pad essay-section paper-section">
      <header className="essay-heading"><p className="eyebrow">Mudança da composição</p><h2>O deslocamento ocorre em direções opostas.</h2></header>
      <CompositionShift />
    </section>

    <section className="page-pad essay-section">
      <header className="essay-heading"><p className="section-number">II</p><h2>O topo aumenta em tamanho e em poder econômico.</h2></header>
      <div className="essay-copy two-column-copy"><p>Declarantes com patrimônio acima de R$ 1 milhão passam de 5,8% para 7,2% da base e sua parcela do patrimônio sobe de 72,9% para 75,1%.</p><p>Na renda, o grupo acima de R$ 1,2 milhão anual passa de 0,77% para 1,07% dos declarantes e concentra 28,9% da renda em 2026, contra 23,3% no exercício anterior.</p></div>
      <ConcentrationComparison />
    </section>

    <section className="page-pad essay-section dark-figure-section">
      <header className="essay-heading"><p className="section-number">III</p><h2>Gênero permanece uma estrutura, não um detalhe.</h2></header>
      <div className="essay-copy two-column-copy"><p>Em ambos os exercícios, mulheres são minoria entre declarantes e têm médias inferiores. Em 2026, a renda média feminina equivale a 77,6% da masculina; o patrimônio, a 58,9%.</p><p>A diferença patrimonial é mais profunda que a de renda e praticamente não cede entre os exercícios. Isso aponta para acumulação histórica: propriedade, herança, posição ocupacional e duração da vida econômica.</p></div>
      <GenderComparison />
    </section>
  </PageShell>;
}
