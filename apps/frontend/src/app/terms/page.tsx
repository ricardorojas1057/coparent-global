import { LegalPage } from '../legal-page';

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Uso responsable"
      title="Terminos de uso"
      summary="Estas reglas buscan proteger a las familias y mantener la aplicacion enfocada en el bienestar infantil."
    >
      <section>
        <h2>Uso permitido</h2>
        <p>
          Coparent Global debe utilizarse para organizar la coparentalidad de manera legitima, respetuosa y segura.
          Cada persona es responsable por la exactitud y legalidad de la informacion que incorpora.
        </p>
      </section>
      <section>
        <h2>Conductas prohibidas</h2>
        <p>
          No se permite acosar, amenazar, suplantar identidades, vigilar indebidamente, manipular a hijos, acceder a
          familias ajenas ni cargar contenido ilegal o que vulnere derechos de terceros.
        </p>
      </section>
      <section>
        <h2>Registros y asistencia</h2>
        <p>
          Los registros y sugerencias de comunicacion son herramientas organizativas. No constituyen asesoramiento
          juridico, psicologico ni profesional, y su valor probatorio depende de cada jurisdiccion.
        </p>
      </section>
      <section>
        <h2>Disponibilidad</h2>
        <p>
          Trabajamos para ofrecer un servicio confiable, pero pueden existir interrupciones por mantenimiento,
          conectividad o proveedores externos. Las funciones offline pueden requerir sincronizacion posterior.
        </p>
      </section>
      <section>
        <h2>Suspension</h2>
        <p>
          Podemos limitar cuentas que comprometan la seguridad, infrinjan estas reglas o pongan en riesgo a otras
          personas, procurando conservar los mecanismos apropiados de revision y privacidad.
        </p>
      </section>
    </LegalPage>
  );
}
