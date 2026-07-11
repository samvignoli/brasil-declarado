import Link from "next/link";
import { PageShell } from "./components/SiteShell";
import { SourceScale, WealthFigure } from "./components/DataFigures";

export default function Home() {
  return (
    <PageShell>
      <section className="home-hero page-pad">
        <div className="hero-index">01 — Retrato nacional</div>
        <p className="eyebrow">Imposto de renda como lente social</p>
        <h1>Um país visto<br />por quem declara.</h1>
        <div className="hero-deck">
          <p>
            Renda, patrimônio, idade, gênero, ocupação e território de 46,7 milhões
            de declarantes — sem confundir declaração com população.
          </p>
          <span>Exercício 2025 como referência principal</span>
        </div>
        <div className="hero-totals" aria-label="Números gerais do exercício 2025">
          <div><strong>R$ 6,10 tri</strong><span>renda total declarada</span></div>
          <div><strong>R$ 15,27 tri</strong><span>patrimônio informado</span></div>
          <div><strong>46,7 mi</strong><span>declarantes representados</span></div>
        </div>
      </section>

      <section className="page-pad home-intro split-text">
        <div>
          <p className="section-number">I</p>
          <h2>A declaração ilumina o topo e deixa o resto em sombra.</h2>
        </div>
        <div className="prose">
          <p>
            O IRPF é uma janela extraordinária para observar a distribuição de recursos
            entre os grupos que declaram. Mas não é um censo: entram pessoas obrigadas
            por renda, patrimônio ou outras condições, além de entregas voluntárias.
          </p>
          <p>
            Por isso, cada achado neste ensaio descreve o <em>Brasil declarado</em>.
            Ele mostra concentração, hierarquias e contrastes reais dentro desse universo,
            sem transformar ausência cadastral em ausência social.
          </p>
          <Link href="/metodo" className="text-link">Entenda o universo e as limitações →</Link>
        </div>
      </section>

      <section className="page-pad figure-section">
        <WealthFigure />
      </section>

      <section className="page-pad findings-grid">
        <Link href="/desigualdade" className="finding-card tone-green">
          <span className="card-index">01</span>
          <p className="eyebrow">Concentração</p>
          <h3>0,77% recebe quase um quarto da renda.</h3>
          <p>360 mil declarantes acima de R$ 1,2 milhão anual concentram 23,3% da renda total registrada em 2025.</p>
          <span className="card-link">Explorar renda e patrimônio →</span>
        </Link>
        <Link href="/raca" className="finding-card tone-blue">
          <span className="card-index">02</span>
          <p className="eyebrow">Raça & gênero</p>
          <h3>A ausência também é um dado.</h3>
          <p>Em 2026, 49,3% dos declarantes não têm raça/cor informada. Entre os identificados, os contrastes são grandes.</p>
          <span className="card-link">Ler o retrato parcial →</span>
        </Link>
        <Link href="/territorio" className="finding-card tone-orange">
          <span className="card-index">03</span>
          <p className="eyebrow">Geografia</p>
          <h3>O Sudeste reúne 60% do patrimônio.</h3>
          <p>A região representa 51,1% dos declarantes e 60,1% do patrimônio informado no exercício 2025.</p>
          <span className="card-link">Percorrer o território →</span>
        </Link>
        <Link href="/trabalho" className="finding-card tone-gold">
          <span className="card-index">04</span>
          <p className="eyebrow">Trabalho & poder</p>
          <h3>Ocupações desenham hierarquias persistentes.</h3>
          <p>Magistratura, alta advocacia pública, medicina e direção empresarial aparecem no alto das médias.</p>
          <span className="card-link">Comparar ocupações →</span>
        </Link>
      </section>

      <section className="page-pad source-section">
        <div className="section-heading"><p className="eyebrow">Escala da fonte</p><h2>Grande o bastante para exigir método.</h2></div>
        <SourceScale />
      </section>
    </PageShell>
  );
}
