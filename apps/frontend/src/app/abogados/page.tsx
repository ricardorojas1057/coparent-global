import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'App para abogados de familia',
  description: 'Herramienta para abogados de familia que necesitan organizar cronologías, gastos, mensajes y reportes familiares verificables.',
  alternates: { canonical: '/abogados' },
  openGraph: {
    title: 'App para abogados de familia | Coparent Global',
    description: 'Cronologías, gastos, mensajes y reportes familiares verificables para abogados de familia.',
    url: '/abogados',
    siteName: 'Coparent Global',
    locale: 'es_AR',
    type: 'website',
    images: [
      {
        url: '/og/coparent-global-og.png',
        width: 1200,
        height: 630,
        alt: 'Coparent Global, app de coparentalidad para padres separados',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og/coparent-global-og.png'],
    title: 'App para abogados de familia | Coparent Global',
    description: 'Cronologías, gastos, mensajes y reportes familiares verificables para abogados de familia.',
  },
};

export default function SeoLandingPage() {
  return (
    <main>
      <header className='site-header'>
        <a className='wordmark' href='/'>Coparent Global</a>
        <nav aria-label='Navegación principal'>
          <a href='/padres-separados'>Padres separados</a>
          <a href='/abogados'>Abogados</a>
          <a href='/install'>Usar o instalar</a>
        </nav>
      </header>

      <section className='feature-hero'>
        <div>
          <p className='eyebrow'>Para profesionales</p>
          <h1>Coparent Global para abogados de familia</h1>
          <p className='lead'>La plataforma permite ordenar información familiar sensible en cronologías, calendarios, gastos y exportaciones claras, sin reemplazar el criterio profesional ni prometer validez legal universal.</p>
          <div className='hero-actions'>
            <a className='primary-link' href='/install'>Usar o instalar</a>
            <a className='secondary-link' href='/support'>Consultar soporte</a>
          </div>
        </div>
        <div className='hero-device' aria-label='Captura de Coparent Global'>
          <img src='/screenshots/galeria-google-play.png' alt='Galería de pantallas de Coparent Global' />
        </div>
      </section>

      <section className='resource-section'>
        <div className='resource-grid'>
          <article className='resource-card'><span>Cronología ordenada</span><p>Mensajes, eventos, solicitudes, gastos y comprobantes pueden revisarse por familia y período.</p></article>
          <article className='resource-card'><span>Reportes exportables</span><p>La exportación básica ayuda a preparar reuniones, mediaciones o análisis interno del caso.</p></article>
          <article className='resource-card'><span>Límites jurídicos claros</span><p>Coparent Global organiza registros; no brinda asesoramiento legal ni garantiza admisibilidad universal.</p></article>
          <article className='resource-card'><span>Uso responsable</span><p>La app ordena información sensible, pero no reemplaza acuerdos, resoluciones judiciales ni asesoramiento profesional.</p></article>
        </div>
      </section>

      <section className='trust-section'>
        <div>
          <p className='eyebrow'>Privacidad y alcance</p>
          <h2>Una herramienta organizativa, no asesoramiento legal</h2>
          <p>
            Coparent Global ayuda a ordenar información familiar, pero no reemplaza acuerdos, resoluciones judiciales,
            mediación ni asesoramiento profesional. Los registros deben interpretarse según cada caso y jurisdicción.
          </p>
        </div>
        <ul>
          <li>Datos familiares tratados con cuidado.</li>
          <li>Funciones centradas en hijos/as.</li>
          <li>Exportaciones claras y trazables.</li>
          <li>Uso desde navegador o app instalada.</li>
        </ul>
      </section>

      <footer className='site-footer'>
        <strong>Coparent Global</strong>
        <span>Coparentalidad clara, privada y centrada en los hijos/as.</span>
      </footer>
    </main>
  );
}
