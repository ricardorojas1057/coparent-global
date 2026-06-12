import { LegalPage } from '../legal-page';

export default function AccountDeletionPage() {
  return (
    <LegalPage
      eyebrow="Control de tus datos"
      title="Eliminacion de cuenta"
      summary="Podes iniciar y cancelar una solicitud de eliminacion directamente desde la aplicacion."
    >
      <section>
        <h2>Como solicitarla</h2>
        <ol>
          <li>Inicia sesion en Coparent Global.</li>
          <li>Abri la seccion Perfil.</li>
          <li>En Privacidad, selecciona Solicitar eliminacion de cuenta.</li>
          <li>Mientras la solicitud este pendiente, podes cancelarla o confirmar la eliminacion definitiva.</li>
          <li>Al confirmar definitivamente, la sesion se cierra y tus datos personales se anonimizan.</li>
        </ol>
      </section>
      <section>
        <h2>Como cancelarla</h2>
        <p>
          Mientras la solicitud este pendiente, podes volver a Perfil y elegir Cancelar eliminacion. La cuenta
          continuara funcionando normalmente.
        </p>
      </section>
      <section>
        <h2>Que se elimina</h2>
        <p>
          Se eliminan o anonimizan los datos personales asociados cuando corresponda. Algunos registros pueden
          conservarse temporalmente por seguridad, prevencion de fraude, obligaciones aplicables o para proteger los
          derechos de otros integrantes familiares.
        </p>
      </section>
      <section>
        <h2>Datos compartidos</h2>
        <p>
          Los mensajes, eventos, gastos y auditorias compartidos con otra persona pueden conservarse o anonimizarse
          cuando sean necesarios para mantener la integridad del registro familiar y los derechos de sus integrantes.
          La eliminacion de una cuenta no debe borrar silenciosamente informacion que tambien pertenece a terceros.
        </p>
      </section>
      <section>
        <h2>Plazo y confirmacion</h2>
        <p>
          La solicitud queda registrada y su estado puede consultarse desde Perfil. Si confirmas la eliminacion
          definitiva dentro de la app, la anonimizacion de la cuenta y la revocacion de acceso comienzan
          inmediatamente. Las solicitudes externas o los casos que requieran revision se procesan dentro de 30 dias
          corridos luego de verificar identidad. Podemos conservar durante mas tiempo informacion minima cuando sea
          necesaria para seguridad, obligaciones legales o proteccion de otros integrantes familiares.
        </p>
      </section>
      <section>
        <h2>Problemas para acceder</h2>
        <p>
          Si no podes iniciar sesion o ya desinstalaste la aplicacion, envia la solicitud desde el correo asociado a
          tu cuenta a{' '}
          <a href="mailto:coparentglobal.soporte@gmail.com?subject=Solicitud%20de%20eliminacion%20de%20cuenta">
            coparentglobal.soporte@gmail.com
          </a>{' '}
          con el asunto Solicitud de eliminacion de cuenta. Podemos pedirte informacion adicional para verificar tu
          identidad antes de procesarla.
        </p>
      </section>
    </LegalPage>
  );
}
