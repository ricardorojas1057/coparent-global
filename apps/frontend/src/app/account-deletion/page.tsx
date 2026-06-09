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
          <li>Revisa la confirmacion y conserva el acceso durante el periodo de revision.</li>
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
        <h2>Problemas para acceder</h2>
        <p>
          Si no podes iniciar sesion, utiliza la recuperacion de contrasena y luego realiza la solicitud desde la
          aplicacion. Para otros inconvenientes, consulta la pagina de soporte.
        </p>
      </section>
    </LegalPage>
  );
}
