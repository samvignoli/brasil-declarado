import { IntersectionFigure, RaceFigure } from "../components/DataFigures";
import { PageShell } from "../components/SiteShell";

export default function RacaPage() {
  return <PageShell>
    <section className="inner-hero page-pad theme-blue">
      <div className="hero-index">04 — Raça, gênero e cadastro</div>
      <p className="eyebrow">O dado e o silêncio</p>
      <h1>Entre os anos,<br />o dado racial aparece.</h1>
      <p className="inner-deck">Em 2025, raça/cor está ausente para todos. Em 2026, passa a existir — mas ainda falta para 49,3%. A mudança é cadastral antes de ser estatística.</p>
    </section>
    <section className="page-pad warning-panel">
      <strong>Limite central</strong>
      <p>Em 2025, todos os 46,7 milhões de registros estão como “Não Informado”. Em 2026, são 20,5 milhões sem identificação racial. Os números abaixo descrevem apenas quem tem raça/cor registrada.</p>
    </section>
    <section className="page-pad narrative-grid">
      <div className="sticky-title"><p className="section-number">I</p><h2>Mesmo parcial, o contraste é amplo.</h2></div>
      <div className="story-column">
        <p>Entre os registros identificados de 2026, a renda média de declarantes pretos equivale a 48% da média branca; a de pardos, a 55%. No patrimônio informado, as proporções caem para 15% e 27%, respectivamente.</p>
        <p>Isso não é uma estimativa da população brasileira. É uma associação dentro de um subconjunto selecionado por obrigação tributária, entrega efetiva e preenchimento cadastral.</p>
        <RaceFigure />
      </div>
    </section>
    <section className="page-pad narrative-grid pale-section">
      <div className="sticky-title"><p className="section-number">II</p><h2>Raça e gênero não atuam separados.</h2></div>
      <div className="story-column">
        <p>Dentro de todas as categorias raciais informadas, homens apresentam médias superiores às de mulheres. Entre declarantes brancos, o patrimônio médio masculino é quase o dobro do feminino; entre pardos, a diferença também é marcante.</p>
        <IntersectionFigure />
      </div>
    </section>
    <section className="page-pad callout-quote">
      <p>“Não informado” não é ruído a apagar. É parte da estrutura do dado e pode refletir formas desiguais de atualização cadastral.</p>
    </section>
  </PageShell>;
}
