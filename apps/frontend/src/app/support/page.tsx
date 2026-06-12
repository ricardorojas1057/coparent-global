import { LegalPage } from '../legal-page';

export default function SupportPage() {
  return (
    <LegalPage
      eyebrow="Ayuda"
      title="Soporte de Coparent Global"
      summary="Estas son las formas recomendadas de resolver problemas sin compartir contrasenas ni informacion sensible."
    >
      <section>
        <h2>No puedo ingresar</h2>
        <p>
          Utiliza la opcion Olvide mi contrasena en la pantalla de ingreso. Coparent Global nunca te pedira que
          compartas tu contrasena o un codigo de recuperacion.
        </p>
      </section>
      <section>
        <h2>Seguridad o privacidad</h2>
        <p>
          Desde Perfil podes administrar consentimiento, solicitar eliminacion de cuenta y revisar integraciones.
          Desvincula cualquier acceso que no reconozcas.
        </p>
      </section>
      <section>
        <h2>Emergencias</h2>
        <p>
          Coparent Global no es un servicio de emergencias. Si existe riesgo inmediato para una persona, contacta a
          los servicios de emergencia o autoridades locales correspondientes.
        </p>
      </section>
      <section>
        <h2>Contacto</h2>
        <p>
          Escribinos a{' '}
          <a href="mailto:coparentglobal.soporte@gmail.com">coparentglobal.soporte@gmail.com</a>. Durante la etapa de
          prueba, tambien podes reportar problemas a la persona que te invito. Nunca incluyas contrasenas, codigos de
          acceso, conversaciones familiares completas ni datos innecesarios de hijos.
        </p>
      </section>
    </LegalPage>
  );
}
