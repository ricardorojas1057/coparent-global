import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calendario de cuidado compartido',
  description: 'Organizá régimen de comunicación, entregas, retiros, responsables, actividades, salud, escuela y solicitudes de cambio.',
  alternates: { canonical: '/calendario-de-cuidado' },
  openGraph: {
    title: 'Calendario de cuidado compartido | Coparent Global',
    description: 'Organizá régimen de comunicación, entregas, retiros, responsables y solicitudes de cambio.',
    url: '/calendario-de-cuidado',
    siteName: 'Coparent Global',
    locale: 'es_AR',
    type: 'website',
    images: ['/icons/icon-512.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/icons/icon-512.png'],
    title: 'Calendario de cuidado compartido | Coparent Global',
    description: 'Organizá régimen de comunicación, entregas, retiros, responsables y solicitudes de cambio.',
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
          <p className='eyebrow'>Calendario familiar</p>
          <h1>Calendario de cuidado compartido</h1>
          <p className='lead'>El calendario permite organizar con quién estará cada hijo/a, quién es responsable, qué tipo de actividad corresponde y cuándo se solicita un cambio.</p>
          <div className='hero-actions'>
            <a className='primary-link' href='/install'>Usar o instalar</a>
            <a className='secondary-link' href='/support'>Consultar soporte</a>
          </div>
        </div>
        <div className='hero-device' aria-label='Captura de Coparent Global'>
          <img src='/screenshots/calendario-responsables.png' alt='Pantalla de calendario familiar de Coparent Global' />
        </div>
      </section>

      <section className='resource-section'>
        <div className='resource-grid'>
          <article className='resource-card'><span>Responsable claro</span><p>Cada evento puede indicar hijo/a, progenitor responsable, fecha, hora, tipo y observaciones.</p></article>
          <article className='resource-card'><span>Solicitudes de cambio</span><p>Cuando una modificación requiere acuerdo, la app puede registrar la solicitud y su respuesta.</p></article>
          <article className='resource-card'><span>Lenguaje local</span><p>Incluye vocabulario útil para Argentina y Latinoamérica, como cuidado personal y régimen de comunicación.</p></article>
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
