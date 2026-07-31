import type { Metadata } from 'next';
import { LegalPage } from '../legal-page';

export const metadata: Metadata = {
  title: 'Ayuda y soporte',
  description:
    'Canales de ayuda para Coparent Global: ingreso, privacidad, seguridad, emergencias y contacto de soporte.',
  alternates: { canonical: '/support' },
};

export default function SupportPage() {
  return (
    <LegalPage
      eyebrow="Ayuda"
      title="Soporte de Coparent Global"
      summary="Estas son las formas recomendadas de resolver problemas sin compartir contraseñas ni información sensible."
    >
      <section>
        <h2>No puedo ingresar</h2>
        <p>
          Utilizá la opción Olvidé mi contraseña en la pantalla de ingreso. Coparent Global nunca te pedirá que
          compartas tu contraseña o un código de recuperación.
        </p>
      </section>
      <section>
        <h2>Seguridad o privacidad</h2>
        <p>
          Desde Perfil podés administrar consentimiento, solicitar eliminación de cuenta y revisar integraciones.
          Desvinculá cualquier acceso que no reconozcas.
        </p>
      </section>
      <section>
        <h2>Emergencias</h2>
        <p>
          Coparent Global no es un servicio de emergencias. Si existe riesgo inmediato para una persona, contactá a
          los servicios de emergencia o autoridades locales correspondientes.
        </p>
      </section>
      <section>
        <h2>Contacto</h2>
        <p>
          Escribinos a{' '}
          <a href="mailto:coparentglobal.soporte@gmail.com">coparentglobal.soporte@gmail.com</a>. Durante la etapa de
          prueba, también podés reportar problemas a la persona que te invitó. Nunca incluyas contraseñas, códigos de
          acceso, conversaciones familiares completas ni datos innecesarios de hijos/as.
        </p>
      </section>
    </LegalPage>
  );
}
