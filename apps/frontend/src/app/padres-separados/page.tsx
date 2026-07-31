import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'App para padres separados',
  description: 'Organizá calendario, mensajes, gastos y acuerdos familiares después de una separación, con privacidad y foco en los hijos/as.',
  alternates: { canonical: '/padres-separados' },
  openGraph: {
    title: 'App para padres separados | Coparent Global',
    description: 'Organizá calendario, mensajes, gastos y acuerdos familiares después de una separación, con privacidad y foco en los hijos/as.',
    url: '/padres-separados',
  },
  twitter: {
    title: 'App para padres separados | Coparent Global',
    description: 'Organizá calendario, mensajes, gastos y acuerdos familiares después de una separación, con privacidad y foco en los hijos/as.',
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
          <p className='eyebrow'>Para familias en dos hogares</p>
          <h1>App para padres separados</h1>
          <p className='lead'>Coparent Global ayuda a madres, padres y cuidadores a ordenar la vida familiar después de una separación: calendario de cuidado, mensajes importantes, gastos compartidos, comprobantes y acuerdos en un solo espacio.</p>
          <div className='hero-actions'>
            <a className='primary-link' href='/install'>Usar o instalar</a>
            <a className='secondary-link' href='/support'>Consultar soporte</a>
          </div>
        </div>
        <div className='hero-device' aria-label='Captura de Coparent Global'>
          <img src='/screenshots/inicio-familia.png' alt='Pantalla de inicio de Coparent Global con resumen familiar' />
        </div>
      </section>

      <section className='resource-section'>
        <div className='resource-grid'>
          <article className='resource-card'><span>Menos información dispersa</span><p>Centralizá lo que hoy suele quedar en WhatsApp, capturas, recibos, notas y calendarios separados.</p></article>
          <article className='resource-card'><span>Invitaciones simples</span><p>Podés invitar al otro progenitor y compartir instrucciones claras para usar la app desde Google Play o desde navegador.</p></article>
          <article className='resource-card'><span>Privacidad visible</span><p>La app está pensada para datos sensibles de familias e hijos/as, con eliminación de cuenta y límites claros sobre el uso de la información.</p></article>
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
