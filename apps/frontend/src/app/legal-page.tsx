import type { ReactNode } from 'react';

export function LegalPage({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
}) {
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

      <article className="legal">
        <header className="legal-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lead">{summary}</p>
          <p className="updated">Ultima actualizacion: 7 de junio de 2026</p>
        </header>
        <div className="legal-body">{children}</div>
      </article>

      <footer className="site-footer">
        <a href="/">Inicio</a>
        <a href="/terms">Terminos</a>
        <a href="/account-deletion">Eliminar cuenta</a>
      </footer>
    </main>
  );
}
