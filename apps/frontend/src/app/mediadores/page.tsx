import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'App para mediadores familiares',
  description: 'Herramienta para mediadores familiares que buscan reducir conflicto, ordenar acuerdos y facilitar seguimiento entre progenitores.',
  alternates: { canonical: '/mediadores' },
  openGraph: {
    title: 'App para mediadores familiares | Coparent Global',
    description: 'Ordená acuerdos, calendarios, gastos y seguimiento familiar para procesos de mediación.',
    url: '/mediadores',
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
    title: 'App para mediadores familiares | Coparent Global',
    description: 'Ordená acuerdos, calendarios, gastos y seguimiento familiar para procesos de mediación.',
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
          <p className='eyebrow'>Mediación familiar</p>
          <h1>Coparent Global para mediadores</h1>
          <p className='lead'>La app ayuda a convertir acuerdos cotidianos en tareas concretas: calendario, responsables, gastos, mensajes y confirmaciones. El objetivo es reducir ambigüedad y mejorar el seguimiento.</p>
          <div className='hero-actions'>
            <a className='primary-link' href='/install'>Usar o instalar</a>
            <a className='secondary-link' href='/support'>Consultar soporte</a>
          </div>
        </div>
        <div className='hero-device' aria-label='Captura de Coparent Global'>
          <img src='/screenshots/calendario-responsables.png' alt='Pantalla de calendario con responsables familiares' />
        </div>
      </section>

      <section className='resource-section'>
        <div className='resource-grid'>
          <article className='resource-card'><span>Acuerdos operativos</span><p>Los acuerdos se traducen en eventos, responsables, horarios y solicitudes de cambio.</p></article>
          <article className='resource-card'><span>Comunicación estructurada</span><p>Los modos de coparentalidad permiten adaptar permisos y confirmaciones según el nivel de cooperación.</p></article>
          <article className='resource-card'><span>Menos fricción</span><p>El foco está en claridad, privacidad y bienestar infantil, no en vigilancia ni exposición innecesaria.</p></article>
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
