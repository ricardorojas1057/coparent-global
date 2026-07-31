import type { Metadata } from "next";
import { InstallPrompt } from "./install-prompt";

export const metadata: Metadata = {
  title: "Instalar Coparent Global como app web",
  description: "Usá Coparent Global desde el navegador o instalala en la pantalla principal de tu celular.",
  alternates: { canonical: "/install" },
  openGraph: {
    title: "Instalar Coparent Global como app web",
    description: "Accedé a Coparent Global desde el navegador o instalala en la pantalla principal.",
    url: "/install",
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
    title: "Instalar Coparent Global como app web",
    description: "Accedé a Coparent Global desde el navegador o instalala en la pantalla principal.",
  },
};

export default function InstallPage() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="/">
          Coparent Global
        </a>
        <nav aria-label="Navegación principal">
          <a href="/privacy">Privacidad</a>
          <a href="/support">Soporte</a>
        </nav>
      </header>

      <section className="install-page" aria-labelledby="install-title">
        <p className="eyebrow">Acceso desde celular</p>
        <h1 id="install-title">Usá Coparent Global desde el navegador o instalala como app web</h1>
        <p className="lead">
          Podés entrar desde Chrome, Edge o Safari sin descargar nada. Si querés acceso más rápido, agregala a la pantalla
          principal y se abre como una app instalada.
        </p>

        <div className="access-choice" aria-label="Opciones de acceso">
          <a className="primary-link" href="/app">
            Entrar a la app web
          </a>
          <div>
            <InstallPrompt />
          </div>
        </div>

        <div className="install-grid" aria-label="Instrucciones de instalación">
          <article className="resource-card">
            <span>Opción 1: usar en navegador</span>
            <ol>
              <li>Abrí este link en Chrome, Edge o Safari.</li>
              <li>Tocá Entrar a la app web.</li>
              <li>Guardá el link si querés volver más tarde.</li>
            </ol>
          </article>
          <article className="resource-card">
            <span>Opción 2: instalar como app</span>
            <ol>
              <li>Android: Chrome, menú de tres puntos, Instalar app o Agregar a pantalla principal.</li>
              <li>iPhone: Safari, Compartir, Agregar a pantalla de inicio.</li>
              <li>Abrí Coparent Global desde el ícono nuevo.</li>
            </ol>
          </article>
        </div>

        <div className="install-note">
          <strong>Importante:</strong> Coparent Global funciona primero como web. Google Play queda como canal opcional para
          quienes prefieran instalar la app nativa cuando esté disponible.
        </div>
      </section>
    </main>
  );
}
