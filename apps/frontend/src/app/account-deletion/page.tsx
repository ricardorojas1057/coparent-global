import type { Metadata } from 'next';
import { LegalPage } from '../legal-page';

export const metadata: Metadata = {
  title: 'Cómo eliminar tu cuenta',
  description:
    'Pasos para solicitar, cancelar y confirmar la eliminación de cuenta en Coparent Global, incluyendo datos compartidos y plazos.',
  alternates: { canonical: '/account-deletion' },
};

export default function AccountDeletionPage() {
  return (
    <LegalPage
      eyebrow="Control de tus datos"
      title="Eliminación de cuenta"
      summary="Podés iniciar y cancelar una solicitud de eliminación directamente desde la aplicación."
    >
      <section>
        <h2>Cómo solicitarla</h2>
        <ol>
          <li>Iniciá sesión en Coparent Global.</li>
          <li>Abrí la sección Perfil.</li>
          <li>En Privacidad, seleccioná Solicitar eliminación de cuenta.</li>
          <li>Mientras la solicitud esté pendiente, podés cancelarla o confirmar la eliminación definitiva.</li>
          <li>Al confirmar definitivamente, la sesión se cierra y tus datos personales se anonimizan.</li>
        </ol>
      </section>
      <section>
        <h2>Cómo cancelarla</h2>
        <p>
          Mientras la solicitud esté pendiente, podés volver a Perfil y elegir Cancelar eliminación. La cuenta
          continuará funcionando normalmente.
        </p>
      </section>
      <section>
        <h2>Qué se elimina</h2>
        <p>
          Se eliminan o anonimizan los datos personales asociados cuando corresponda. Algunos registros pueden
          conservarse temporalmente por seguridad, prevención de fraude, obligaciones aplicables o para proteger los
          derechos de otros integrantes familiares.
        </p>
      </section>
      <section>
        <h2>Datos compartidos</h2>
        <p>
          Los mensajes, eventos, gastos y auditorías compartidos con otra persona pueden conservarse o anonimizarse
          cuando sean necesarios para mantener la integridad del registro familiar y los derechos de sus integrantes.
          La eliminación de una cuenta no debe borrar silenciosamente información que también pertenece a terceros.
        </p>
      </section>
      <section>
        <h2>Plazo y confirmación</h2>
        <p>
          La solicitud queda registrada y su estado puede consultarse desde Perfil. Si confirmás la eliminación
          definitiva dentro de la app, la anonimización de la cuenta y la revocación de acceso comienzan
          inmediatamente. Las solicitudes externas o los casos que requieran revisión se procesan dentro de 30 días
          corridos luego de verificar identidad. Podemos conservar durante más tiempo información mínima cuando sea
          necesaria para seguridad, obligaciones legales o protección de otros integrantes familiares.
        </p>
      </section>
      <section>
        <h2>Problemas para acceder</h2>
        <p>
          Si no podés iniciar sesión o ya desinstalaste la aplicación, enviá la solicitud desde el correo asociado a
          tu cuenta a{' '}
          <a href="mailto:coparentglobal.soporte@gmail.com?subject=Solicitud%20de%20eliminacion%20de%20cuenta">
            coparentglobal.soporte@gmail.com
          </a>{' '}
          con el asunto Solicitud de eliminación de cuenta. Podemos pedirte información adicional para verificar tu
          identidad antes de procesarla.
        </p>
      </section>
    </LegalPage>
  );
}
