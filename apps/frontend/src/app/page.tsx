const resources = [
  {
    href: '/privacy',
    title: 'Privacidad',
    description: 'Como protegemos la informacion familiar y tus opciones de control.',
  },
  {
    href: '/terms',
    title: 'Terminos de uso',
    description: 'Reglas claras para utilizar Coparent Global de forma responsable.',
  },
  {
    href: '/account-deletion',
    title: 'Eliminar una cuenta',
    description: 'Como solicitar, cancelar y completar la eliminacion de una cuenta.',
  },
  {
    href: '/support',
    title: 'Soporte',
    description: 'Ayuda para acceso, seguridad, privacidad y funcionamiento de la app.',
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="/">
          Coparent Global
        </a>
        <nav aria-label="Navegacion principal">
          <a href="/privacy">Privacidad</a>
          <a href="/support">Soporte</a>
        </nav>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">Informacion publica</p>
          <h1>Coparentalidad clara, segura y centrada en los hijos</h1>
          <p className="lead">
            Coparent Global ayuda a organizar conversaciones, calendarios y gastos familiares con privacidad,
            trazabilidad y controles configurables.
          </p>
        </div>
      </section>

      <section className="resource-section" aria-labelledby="resources-title">
        <div className="section-heading">
          <p className="eyebrow">Transparencia</p>
          <h2 id="resources-title">Documentos y ayuda</h2>
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
        <span>La aplicacion no brinda asesoramiento legal.</span>
      </footer>
    </main>
  );
}
