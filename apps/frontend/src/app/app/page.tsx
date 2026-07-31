import type { Metadata } from "next";
import { AppClient } from "./app-client";

export const metadata: Metadata = {
  title: "Entrar a Coparent Global",
  description: "Acceso desde navegador, instalación web y descarga de Coparent Global para familias invitadas o testers.",
  alternates: { canonical: "/app" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Entrar a Coparent Global",
    description: "Accedé a Coparent Global desde el navegador, instalala como app web o continuá con una invitación familiar.",
    url: "/app",
    siteName: "Coparent Global",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/og/coparent-global-og.png",
        width: 1200,
        height: 630,
        alt: "Coparent Global, app de coparentalidad para padres separados",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og/coparent-global-og.png"],
    title: "Entrar a Coparent Global",
    description: "Accedé a Coparent Global desde el navegador, instalala como app web o continuá con una invitación familiar.",
  },
};

export default function AppAccessPage() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="/">
          Coparent Global
        </a>
        <nav aria-label="Navegación principal">
          <a href="/install">Instalar</a>
          <a href="/support">Soporte</a>
          <a href="/privacy">Privacidad</a>
        </nav>
      </header>

      <AppClient />
    </main>
  );
}
