import type { Metadata } from "next";

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
    images: ["/icons/icon-512.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/icons/icon-512.png"],
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

      <section className="install-page" aria-labelledby="app-title">
        <p className="eyebrow">Acceso a la app</p>
        <h1 id="app-title">Entrá a Coparent Global</h1>
        <p className="lead">
          Si estás en la prueba cerrada, usá el enlace de Google Play que te compartieron como tester. Si recibiste una
          invitación familiar, abrí exactamente ese enlace para vincularte con la familia.
        </p>

        <div className="install-grid" aria-label="Formas de acceso">
          <article className="resource-card">
            <span>Ya soy tester</span>
            <p>Entrá al enlace de prueba de Google Play con el mismo Gmail agregado como tester y tocá Instalar.</p>
            <a className="primary-link" href="/install">
              Ver instrucciones
            </a>
          </article>
          <article className="resource-card">
            <span>Tengo una invitación</span>
            <p>Volvé al mensaje de WhatsApp o email y abrí el enlace completo de invitación familiar.</p>
            <a className="secondary-link" href="/support">
              Pedir ayuda
            </a>
          </article>
          <article className="resource-card">
            <span>Quiero instalarla como web app</span>
            <p>Podés agregar Coparent Global a la pantalla principal desde Chrome o Safari.</p>
            <a className="secondary-link" href="/install">
              Instalar como app
            </a>
          </article>
        </div>

        <div className="install-note">
          <strong>Nota:</strong> durante la prueba cerrada, Google Play solo permite descargar la app a los Gmail
          agregados como testers. La web pública sirve para información, instalación web y soporte.
        </div>
      </section>
    </main>
  );
}