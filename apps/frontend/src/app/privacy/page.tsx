import type { Metadata } from 'next';
import { LegalPage } from '../legal-page';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description:
    'Conocé cómo Coparent Global protege datos familiares, hijos/as, mensajes, gastos, proveedores técnicos y eliminación de cuenta.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacidad por diseño"
      title="Política de privacidad"
      summary="Explicamos qué información utiliza Coparent Global, para qué se usa y cómo podés controlarla."
    >
      <section>
        <h2>Información que tratamos</h2>
        <p>
          Tratamos datos de cuenta, integrantes familiares, calendario, mensajes, gastos, comprobantes, preferencias,
          consentimientos y registros de seguridad que las personas deciden cargar o que son necesarios para operar
          el servicio. Algunos datos pueden referirse a hijos/as y requieren especial cuidado.
        </p>
      </section>
      <section>
        <h2>Datos de menores</h2>
        <p>
          La aplicación está dirigida a personas adultas responsables. No crea perfiles para que los hijos/as utilicen
          directamente el servicio. Solo deben cargarse datos necesarios para su cuidado y organización, evitando
          información excesiva, humillante o ajena a la coparentalidad.
        </p>
      </section>
      <section>
        <h2>Finalidades</h2>
        <p>
          Utilizamos la información para prestar las funciones solicitadas, proteger las cuentas, sincronizar datos,
          enviar notificaciones autorizadas, mantener registros de auditoría y atender solicitudes de soporte,
          seguridad o privacidad.
        </p>
      </section>
      <section>
        <h2>Controles y consentimiento</h2>
        <p>
          Las notificaciones pueden administrarse desde el dispositivo y la configuración familiar. El diagnóstico
          técnico mediante Firebase Crashlytics y el procesamiento asistido son opcionales. El asistente de
          comunicación nunca reemplaza automáticamente un mensaje y no brinda asesoramiento legal.
        </p>
      </section>
      <section>
        <h2>Proveedores técnicos</h2>
        <p>
          Para operar la aplicación podemos utilizar Vercel para alojamiento, Neon para base de datos, Expo/EAS para
          compilación y notificaciones, Firebase para diagnósticos opcionales y mensajería, Google para inicio de
          sesión opcional y Meta/WhatsApp cuando una persona vincula voluntariamente esa integración. Estos
          proveedores tratan información conforme a sus propias condiciones y medidas de seguridad.
        </p>
      </section>
      <section>
        <h2>Conservación y eliminación</h2>
        <p>
          Conservamos la información mientras la cuenta esté activa y durante los plazos necesarios para seguridad,
          obligaciones aplicables, protección de otros integrantes y resolución de disputas. Las solicitudes de
          eliminación pueden requerir revisión para evitar pérdidas accidentales o afectar indebidamente registros
          compartidos. Cuando corresponda, los datos se eliminan o anonimizan.
        </p>
      </section>
      <section>
        <h2>Transferencias y jurisdicciones</h2>
        <p>
          Los servicios técnicos pueden operar en distintos países. No afirmamos que los registros sean legalmente
          válidos en todas las jurisdicciones. Cada familia debe consultar asesoramiento profesional cuando sea
          necesario.
        </p>
      </section>
      <section>
        <h2>Seguridad</h2>
        <p>
          Aplicamos autorización familiar, cifrado durante la transmisión, contraseñas protegidas, registros de
          cambios y controles para reducir accesos no autorizados. Ningún sistema puede garantizar riesgo cero.
        </p>
      </section>
      <section>
        <h2>Derechos y consultas</h2>
        <p>
          Desde Perfil se pueden administrar consentimientos y solicitar la eliminación de la cuenta. Para consultas,
          solicitudes de acceso, rectificación o privacidad, escribí a{' '}
          <a href="mailto:coparentglobal.soporte@gmail.com">coparentglobal.soporte@gmail.com</a>. Podemos solicitar
          verificación de identidad antes de responder pedidos sensibles.
        </p>
      </section>
    </LegalPage>
  );
}
