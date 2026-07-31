import type { Metadata } from "next";
import { InstallPrompt } from "./install-prompt";

export const metadata: Metadata = {
  title: "Usar o instalar Coparent Global",
  description: "Usá Coparent Global desde el navegador o instalala como app web en tu celular.",
  alternates: { canonical: "/install" },
  openGraph: {
    title: "Usar o instalar Coparent Global",
    description: "Accedé a Coparent Global desde el navegador, Google Play o como app web instalada.",
    url: "/install",
  },
  twitter: {
    title: "Usar o instalar Coparent Global",
    description: "Accedé a Coparent Global desde el navegador, Google Play o como app web instalada.",
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
        <h1 id="install-title">Usá Coparent Global desde el navegador o instalala como app</h1>
        <p className="lead">
          Podés entrar desde Chrome o Safari sin descargar nada. Si querés acceso más rápido, agregala a la pantalla
          principal y se abre como una app instalada.
        </p>

        <div className="access-choice" aria-label="Opciones de acceso">
          <a className="primary-link" href="/app">
            Usar desde el navegador
          </a>
          <div>
            <InstallPrompt />
          </div>
        </div>

        <div className="install-grid" aria-label="Instrucciones de instalación">
          <article className="resource-card">
            <span>Opción 1: usar en navegador</span>
            <ol>
              <li>Abrir este link en Chrome o Safari.</li>
              <li>Tocar Usar desde el navegador.</li>
              <li>Guardar el link si querés volver más tarde.</li>
            </ol>
          </article>
          <article className="resource-card">
            <span>Opción 2: instalar como app</span>
            <ol>
              <li>Android: Chrome, menú de tres puntos, Instalar app o Agregar a pantalla principal.</li>
              <li>iPhone: Safari, Compartir, Agregar a pantalla de inicio.</li>
              <li>Abrir Coparent Global desde el ícono nuevo.</li>
            </ol>
          </article>
        </div>

        <div className="install-note">
          <strong>Importante:</strong> esta opción web evita depender de Google Play para entrar desde el celular. La app
          nativa de Google Play sigue siendo el canal recomendado para pruebas cerradas y funciones móviles avanzadas.
        </div>
      </section>
    </main>
  );
}