import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coparent Global sin conexion",
  description: "Pantalla offline de Coparent Global.",
};

export default function OfflinePage() {
  return (
    <main>
      <section className="install-page" aria-labelledby="offline-title">
        <p className="eyebrow">Sin conexion</p>
        <h1 id="offline-title">No hay conexion disponible</h1>
        <p className="lead">
          Coparent Global no puede cargar datos familiares en este momento. Revisa tu conexion e intenta nuevamente.
        </p>
        <a className="primary-link" href="/">
          Reintentar
        </a>
      </section>
    </main>
  );
}
