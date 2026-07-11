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
    description: "Uma leitura sociológica dos dados agregados das declarações de imposto de renda do Brasil, exercícios 2025 e 2026.",
    icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      title: "Brasil declarado",
      description: "Renda, patrimônio e desigualdade em 46,7 milhões de declarações.",
      images: [{ url: new URL("/og.png", metadataBase).toString(), width: 1536, height: 1024, alt: "Brasil declarado — renda, patrimônio e desigualdade" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Brasil declarado",
      description: "Renda, patrimônio e desigualdade em 46,7 milhões de declarações.",
      images: [new URL("/og.png", metadataBase).toString()],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
