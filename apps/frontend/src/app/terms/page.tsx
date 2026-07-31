import type { Metadata } from 'next';
import { LegalPage } from '../legal-page';

export const metadata: Metadata = {
  title: 'Términos de uso',
  description:
    'Reglas de uso responsable de Coparent Global para familias separadas, registros familiares, integraciones y disponibilidad del servicio.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Uso responsable"
      title="Términos de uso"
      summary="Estas reglas buscan proteger a las familias y mantener la aplicación enfocada en el bienestar infantil."
    >
      <section>
        <h2>Uso permitido</h2>
        <p>
          Coparent Global debe utilizarse para organizar la coparentalidad de manera legítima, respetuosa y segura.
          Cada persona es responsable por la exactitud y legalidad de la información que incorpora.
        </p>
      </section>
      <section>
        <h2>Requisitos de la cuenta</h2>
        <p>
          La aplicación está destinada a personas adultas con capacidad para administrar información familiar. Cada
          persona debe proteger sus credenciales, mantener datos de contacto actualizados y utilizar una cuenta
          individual. No se deben compartir contraseñas.
        </p>
      </section>
      <section>
        <h2>Conductas prohibidas</h2>
        <p>
          No se permite acosar, amenazar, suplantar identidades, vigilar indebidamente, manipular a hijos/as, acceder a
          familias ajenas ni cargar contenido ilegal o que vulnere derechos de terceros.
        </p>
      </section>
      <section>
        <h2>Registros y asistencia</h2>
        <p>
          Los registros y sugerencias de comunicación son herramientas organizativas. No constituyen asesoramiento
          jurídico, psicológico ni profesional, y su valor probatorio depende de cada jurisdicción.
        </p>
      </section>
      <section>
        <h2>Contenido y familias compartidas</h2>
        <p>
          Quien incorpora contenido declara que tiene derecho a hacerlo y que su uso es apropiado para la
          coparentalidad. Parte de la información pertenece a un espacio familiar compartido y puede seguir siendo
          visible para proteger la continuidad, auditoría y derechos de otros integrantes.
        </p>
      </section>
      <section>
        <h2>Integraciones y notificaciones</h2>
        <p>
          Las integraciones con Google o WhatsApp son opcionales. Ninguna acción preparada desde WhatsApp impacta en
          la familia hasta ser confirmada manualmente en la aplicación. Las notificaciones dependen del dispositivo,
          conectividad y proveedores externos, por lo que no deben utilizarse como único canal para emergencias.
        </p>
      </section>
      <section>
        <h2>Disponibilidad</h2>
        <p>
          Trabajamos para ofrecer un servicio confiable, pero pueden existir interrupciones por mantenimiento,
          conectividad o proveedores externos. Las funciones offline pueden requerir sincronización posterior.
        </p>
      </section>
      <section>
        <h2>Suspensión</h2>
        <p>
          Podemos limitar cuentas que comprometan la seguridad, infrinjan estas reglas o pongan en riesgo a otras
          personas, procurando conservar los mecanismos apropiados de revisión y privacidad.
        </p>
      </section>
      <section>
        <h2>Limitación y cambios</h2>
        <p>
          El servicio se ofrece como herramienta de organización y no reemplaza acuerdos, resoluciones judiciales ni
          asesoramiento profesional. Podemos modificar funciones o estos términos para mejorar seguridad,
          cumplimiento o funcionamiento, informando los cambios relevantes.
        </p>
      </section>
    </LegalPage>
  );
}
