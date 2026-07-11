import { WorkExplorer } from "../components/DataFigures";
import { PageShell } from "../components/SiteShell";

export default function TrabalhoPage() {
  return <PageShell>
    <section className="inner-hero page-pad theme-gold">
      <div className="hero-index">05 — Trabalho & poder</div>
      <p className="eyebrow">Hierarquias ocupacionais</p>
      <h1>O lugar no trabalho<br />deixa marca fiscal.</h1>
      <p className="inner-deck">Ocupação, vínculo e posição de classe organizam diferenças persistentes de renda e patrimônio no universo declarante.</p>
    </section>
    <section className="page-pad stat-band gold-band">
      <div><strong>R$ 1,15 mi</strong><span>renda média anual da magistratura*</span></div>
      <div><strong>R$ 2,52 mi</strong><span>patrimônio médio do mesmo grupo*</span></div>
      <div><strong>8,8×</strong><span>a renda média de todos os declarantes</span></div>
    </section>
    <section className="page-pad narrative-grid">
      <div className="sticky-title"><p className="section-number">I</p><h2>Profissão combina credenciais, poder e propriedade.</h2></div>
      <div className="story-column">
        <p>Em 2025, magistratura e tribunais de contas apresentam a maior renda média entre ocupações com ao menos 20 mil declarantes. Logo depois aparecem alta advocacia pública, medicina e carreiras de auditoria fiscal.</p>
        <p>Diretores de empresas e produtores agropecuários não lideram a renda média, mas registram patrimônio médio acima de R$ 1,4 milhão — um sinal da diferença entre fluxo de renda e posição proprietária.</p>
        <WorkExplorer />
      </div>
    </section>
    <section className="page-pad narrative-grid pale-section">
      <div className="sticky-title"><p className="section-number">II</p><h2>O vínculo também estratifica.</h2></div>
      <div className="story-column prose">
        <p>Empregados do setor privado são o maior grupo: 16 milhões de declarantes em 2025, com renda média de R$ 92,9 mil. Proprietários e empregadores somam 4,8 milhões, com renda média de R$ 298,7 mil e patrimônio médio de R$ 1,24 milhão.</p>
        <p>Já os 1,4 milhão de MEIs presentes na base registram renda média de R$ 51,4 mil e patrimônio de R$ 90,5 mil. A distância não mede apenas produtividade: incorpora seleção para declarar, escala dos negócios, composição da renda e formas jurídicas distintas.</p>
      </div>
    </section>
    <p className="page-pad footnote-line">* Grupo: membros do Poder Judiciário e de tribunais de contas, conforme categoria ocupacional da Receita.</p>
  </PageShell>;
}
