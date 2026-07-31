import Script from 'next/script';

const resources = [
  {
    href: '/padres-separados',
    title: 'App para padres separados',
    description: 'Organización diaria para familias en dos hogares.',
  },
  {
    href: '/calendario-de-cuidado',
    title: 'Calendario de cuidado',
    description: 'Responsables, horarios, entregas y solicitudes de cambio.',
  },
  {
    href: '/gastos-de-hijos',
    title: 'Gastos de hijos',
    description: 'Comprobantes, pagos, divisiones, reembolsos y saldos.',
  },
  {
    href: '/abogados',
    title: 'Para abogados',
    description: 'Cronologías, reportes y registros familiares revisables.',
  },
  {
    href: '/mediadores',
    title: 'Para mediadores',
    description: 'Acuerdos operativos y seguimiento con menos ambigüedad.',
  },
  {
    href: '/privacy',
    title: 'Política de privacidad',
    description: 'Cómo protegemos información familiar y datos de hijos/as.',
  },
];

const productBlocks = [
  {
    title: 'Calendario de cuidado compartido',
    description:
      'Organizá régimen de comunicación, responsables, horarios de entrega, vacaciones y solicitudes de cambio.',
  },
  {
    title: 'Gastos de los hijos con comprobantes',
    description:
      'Registrá gastos ordinarios y extraordinarios, porcentajes, pagos, reembolsos y saldos entre progenitores.',
  },
  {
    title: 'Mensajes familiares trazables',
    description:
      'Centralizá conversaciones importantes y mantené una cronología ordenada para reducir confusiones.',
  },
  {
    title: 'Acuerdos y registros verificables',
    description:
      'Convertí acuerdos familiares en obligaciones operativas y exportá información clara para revisión profesional.',
  },
];

const faqItems = [
  {
    question: '¿Coparent Global reemplaza a WhatsApp?',
    answer:
      'No necesariamente. La app ayuda a ordenar calendario, gastos, mensajes y registros familiares para que la información importante no quede dispersa entre chats, recibos y capturas.',
  },
  {
    question: '¿Sirve para abogados y mediadores?',
    answer:
      'Sí. Está pensada para que profesionales puedan trabajar con cronologías, obligaciones, reportes y documentación familiar de forma más ordenada.',
  },
  {
    question: '¿Los registros tienen validez legal automática?',
    answer:
      'No. Coparent Global organiza información trazable y exportable, pero la utilidad legal depende de la jurisdicción, el caso y la evaluación profesional.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Coparent Global',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Android, iOS, Web',
  description:
    'Aplicación de coparentalidad para padres separados, abogados y mediadores. Organiza calendario de cuidado, mensajes, gastos compartidos y registros familiares.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function Home() {
  return (
    <main>
      <Script id="software-application-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      <header className="site-header">
        <a className="wordmark" href="/">
          Coparent Global
        </a>
        <nav aria-label="Navegación principal">
          <a href="/padres-separados">Padres separados</a>
          <a href="/abogados">Abogados</a>
          <a href="/install">Usar o instalar</a>
        </nav>
      </header>

      <section className="feature-hero home-hero">
        <div>
          <p className="eyebrow">Coparentalidad organizada</p>
          <h1>App de coparentalidad para padres separados</h1>
          <p className="lead">
            Coparent Global centraliza calendario de cuidado, mensajes, gastos compartidos, comprobantes y acuerdos
            familiares en un espacio privado, organizado y trazable para familias separadas, abogados y mediadores.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="/install">Usar o instalar</a>
            <a className="secondary-link" href="/abogados">Ver uso profesional</a>
          </div>
        </div>
        <div className="hero-device hero-device-stack" aria-label="Capturas reales de Coparent Global">
          <img src="/screenshots/inicio-familia.png" alt="Inicio familiar de Coparent Global" />
          <img src="/screenshots/calendario-responsables.png" alt="Calendario de cuidado compartido" />
        </div>
      </section>

      <section className="resource-section" aria-labelledby="product-title">
        <div className="section-heading">
          <p className="eyebrow">Qué resuelve</p>
          <h2 id="product-title">Un sistema operativo para la familia después de la separación</h2>
          <p className="lead">
            Después de una separación, la información familiar suele quedar dispersa entre WhatsApp, recibos,
            transferencias, calendarios, correos y capturas. Coparent Global ordena esa información en un flujo único,
            privado y exportable.
          </p>
        </div>
        <div className="resource-grid">
          {productBlocks.map((block) => (
            <article className="resource-card" key={block.title}>
              <span>{block.title}</span>
              <p>{block.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="seo-section" aria-labelledby="parents-title">
        <div>
          <p className="eyebrow">Para familias en dos hogares</p>
          <h2 id="parents-title">Organización diaria para madres, padres y cuidadores</h2>
          <p>
            La app ayuda a registrar quién es responsable de cada actividad, cuándo ocurre cada entrega o retiro, qué
            gastos fueron pagados y qué información conviene conservar. También permite trabajar con términos frecuentes
            en Argentina, como cuidado personal, régimen de comunicación, cuota alimentaria y gastos extraordinarios.
          </p>
        </div>
        <div>
          <p className="eyebrow">Para profesionales</p>
          <h2>Información clara para abogados y mediadores</h2>
          <p>
            Coparent Global está preparada para ordenar cronologías, reportes y períodos relevantes sin convertir la app
            en asesoramiento jurídico. La información exportada debe revisarse según el caso y la jurisdicción aplicable.
          </p>
        </div>
      </section>

      <section className="trust-section" aria-labelledby="trust-title">
        <div>
          <p className="eyebrow">Confianza y límites</p>
          <h2 id="trust-title">Registro íntegro, trazable y exportable</h2>
          <p>
            La app permite ordenar información sensible sin prometer validez legal universal. La utilidad de cada
            registro depende del contexto, la jurisdicción y la evaluación profesional correspondiente.
          </p>
        </div>
        <ul>
          <li>No reemplaza asesoramiento jurídico.</li>
          <li>Prioriza privacidad y datos de menores.</li>
          <li>Evita cachear información familiar sensible en la web instalable.</li>
          <li>Permite acceso rápido desde celular sin depender de Google Play.</li>
        </ul>
      </section>

      <section className="install-callout" aria-labelledby="install-callout-title">
        <div>
          <p className="eyebrow">App web instalable</p>
          <h2 id="install-callout-title">Usala desde el navegador o instalala sin Play Store</h2>
          <p>
            Abrí Coparent Global desde Chrome o Safari. Podés usarla en el navegador o agregarla a la pantalla principal
            para abrirla como app.
          </p>
        </div>
        <a className="primary-link" href="/install">Usar o instalar</a>
      </section>

      <section className="resource-section" aria-labelledby="faq-title">
        <div className="section-heading">
          <p className="eyebrow">Preguntas frecuentes</p>
          <h2 id="faq-title">Antes de empezar</h2>
        </div>
        <div className="faq-list">
          {faqItems.map((item) => (
            <article className="resource-card" key={item.question}>
              <span>{item.question}</span>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="resource-section" aria-labelledby="resources-title">
        <div className="section-heading">
          <p className="eyebrow">Páginas útiles</p>
          <h2 id="resources-title">Funciones, profesionales y documentos</h2>
        </div>
        <div className="resource-grid">
          {resources.map((resource) => (
            <a className="resource-card" href={resource.href} key={resource.href}>
              <span>{resource.title}</span>
              <p>{resource.description}</p>
            </a>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <strong>Coparent Global</strong>
        <span>La aplicación no brinda asesoramiento legal.</span>
      </footer>
    </main>
  );
}
