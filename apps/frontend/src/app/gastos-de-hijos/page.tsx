import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gastos compartidos de hijos con comprobantes',
  description: 'Registrá gastos de hijos, comprobantes, pagos por una parte, divisiones, reembolsos y saldos familiares.',
  alternates: { canonical: '/gastos-de-hijos' },
  openGraph: {
    title: 'Gastos compartidos de hijos con comprobantes | Coparent Global',
    description: 'Registrá gastos de hijos, comprobantes, pagos por una parte, reembolsos y saldos familiares.',
    url: '/gastos-de-hijos',
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
    title: 'Gastos compartidos de hijos con comprobantes | Coparent Global',
    description: 'Registrá gastos de hijos, comprobantes, pagos por una parte, reembolsos y saldos familiares.',
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
          <p className='eyebrow'>Gastos familiares</p>
          <h1>Gastos compartidos de hijos con comprobantes</h1>
          <p className='lead'>Coparent Global permite registrar gastos ordinarios y extraordinarios, indicar quién pagó, cómo se divide, qué comprobante respalda el gasto y cuál es el saldo pendiente.</p>
          <div className='hero-actions'>
            <a className='primary-link' href='/install'>Usar o instalar</a>
            <a className='secondary-link' href='/support'>Consultar soporte</a>
          </div>
        </div>
        <div className='hero-device' aria-label='Captura de Coparent Global'>
          <img src='/screenshots/gastos-saldos.png' alt='Pantalla de gastos, saldos y reportes de Coparent Global' />
        </div>
      </section>

      <section className='resource-section'>
        <div className='resource-grid'>
          <article className='resource-card'><span>Pago por una parte</span><p>Un progenitor puede cargar un gasto pagado por completo y dejar claro cuánto corresponde reembolsar.</p></article>
          <article className='resource-card'><span>Saldos visibles</span><p>El resumen mensual facilita entender qué se pagó, qué falta y qué comprobantes respaldan cada registro.</p></article>
          <article className='resource-card'><span>Sin billetera obligatoria</span><p>La primera etapa funciona como registro financiero familiar, sin convertir la app en banco ni billetera.</p></article>
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
