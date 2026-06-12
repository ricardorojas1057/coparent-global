import { LegalPage } from '../legal-page';

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacidad por diseno"
      title="Politica de privacidad"
      summary="Explicamos que informacion utiliza Coparent Global, para que se usa y como podes controlarla."
    >
      <section>
        <h2>Informacion que tratamos</h2>
        <p>
          Tratamos datos de cuenta, integrantes familiares, calendario, mensajes, gastos, comprobantes, preferencias,
          consentimientos y registros de seguridad que las personas deciden cargar o que son necesarios para operar
          el servicio. Algunos datos pueden referirse a hijos y requieren especial cuidado.
        </p>
      </section>
      <section>
        <h2>Datos de menores</h2>
        <p>
          La aplicacion esta dirigida a personas adultas responsables. No crea perfiles para que los hijos utilicen
          directamente el servicio. Solo deben cargarse datos necesarios para su cuidado y organizacion, evitando
          informacion excesiva, humillante o ajena a la coparentalidad.
        </p>
      </section>
      <section>
        <h2>Finalidades</h2>
        <p>
          Utilizamos la informacion para prestar las funciones solicitadas, proteger las cuentas, sincronizar datos,
          enviar notificaciones autorizadas, mantener registros de auditoria y atender solicitudes de soporte,
          seguridad o privacidad.
        </p>
      </section>
      <section>
        <h2>Controles y consentimiento</h2>
        <p>
          Las notificaciones pueden administrarse desde el dispositivo y la configuracion familiar. El diagnostico
          tecnico mediante Firebase Crashlytics y el procesamiento asistido son opcionales. El asistente de
          comunicacion nunca reemplaza automaticamente un mensaje y no brinda asesoramiento legal.
        </p>
      </section>
      <section>
        <h2>Proveedores tecnicos</h2>
        <p>
          Para operar la aplicacion podemos utilizar Vercel para alojamiento, Neon para base de datos, Expo/EAS para
          compilacion y notificaciones, Firebase para diagnosticos opcionales y mensajeria, Google para inicio de
          sesion opcional y Meta/WhatsApp cuando una persona vincula voluntariamente esa integracion. Estos
          proveedores tratan informacion conforme a sus propias condiciones y medidas de seguridad.
        </p>
      </section>
      <section>
        <h2>Conservacion y eliminacion</h2>
        <p>
          Conservamos la informacion mientras la cuenta este activa y durante los plazos necesarios para seguridad,
          obligaciones aplicables, proteccion de otros integrantes y resolucion de disputas. Las solicitudes de
          eliminacion pueden requerir revision para evitar perdidas accidentales o afectar indebidamente registros
          compartidos. Cuando corresponda, los datos se eliminan o anonimizan.
        </p>
      </section>
      <section>
        <h2>Transferencias y jurisdicciones</h2>
        <p>
          Los servicios tecnicos pueden operar en distintos paises. No afirmamos que los registros sean legalmente
          validos en todas las jurisdicciones. Cada familia debe consultar asesoramiento profesional cuando sea
          necesario.
        </p>
      </section>
      <section>
        <h2>Seguridad</h2>
        <p>
          Aplicamos autorizacion familiar, cifrado durante la transmision, contrasenas protegidas, registros de
          cambios y controles para reducir accesos no autorizados. Ningun sistema puede garantizar riesgo cero.
        </p>
      </section>
      <section>
        <h2>Derechos y consultas</h2>
        <p>
          Desde Perfil se pueden administrar consentimientos y solicitar la eliminacion de la cuenta. Para consultas,
          solicitudes de acceso, rectificacion o privacidad, utiliza la pagina publica de soporte. Podemos solicitar
          verificacion de identidad antes de responder.
        </p>
      </section>
      <section>
        <h2>Cambios a esta politica</h2>
        <p>
          Podemos actualizar esta politica cuando cambien las funciones, proveedores o normas aplicables. La fecha de
          actualizacion se publica en esta pagina y los cambios importantes se comunicaran dentro de la aplicacion.
        </p>
      </section>
    </LegalPage>
  );
}
