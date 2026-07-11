import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: {
      default: "Brasil declarado — renda, patrimônio e desigualdade",
      template: "%s | Brasil declarado",
    },
    description: "Uma leitura comparativa e sociológica dos exercícios 2025 e 2026 do IRPF, com população, cobertura, renda e patrimônio.",
    icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      title: "Brasil declarado",
      description: "Duas fotos do Brasil declarado — e uma moldura que mudou entre 2025 e 2026.",
      images: [{ url: new URL("/og.png", metadataBase).toString(), width: 1536, height: 1024, alt: "Brasil declarado — renda, patrimônio e desigualdade" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Brasil declarado",
      description: "Duas fotos do Brasil declarado — e uma moldura que mudou entre 2025 e 2026.",
      images: [new URL("/og.png", metadataBase).toString()],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
