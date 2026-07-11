import Link from "next/link";

const navigation = [
  ["/", "Dois anos"],
  ["/territorio", "Território"],
  ["/desigualdade", "Estruturas sociais"],
  ["/raca", "Raça & cadastro"],
  ["/trabalho", "Trabalho"],
  ["/metodo", "Como ler"],
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Brasil declarado — início">
        <span className="brand-mark">BR</span>
        <span>Brasil declarado</span>
      </Link>
      <nav aria-label="Navegação principal">
        {navigation.map(([href, label]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p className="eyebrow">Leitura responsável</p>
        <p className="footer-statement">
          Declarações revelam muito sobre as desigualdades — e pouco sobre quem
          permanece fora do sistema declaratório.
        </p>
      </div>
      <div className="footer-meta">
        <p>Fonte: Receita Federal do Brasil</p>
        <p>Extração: 11 jul. 2026</p>
        <p>Exercícios 2025 × 2026</p>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
