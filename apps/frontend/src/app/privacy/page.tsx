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
          Tratamos datos de cuenta, integrantes familiares, calendario, mensajes, gastos, comprobantes y preferencias
          que las personas deciden cargar. Algunos datos pueden referirse a hijos y requieren especial cuidado.
        </p>
      </section>
      <section>
        <h2>Finalidades</h2>
        <p>
          Utilizamos la informacion para prestar las funciones solicitadas, proteger las cuentas, sincronizar datos,
          mantener registros de auditoria y atender solicitudes de soporte o privacidad.
        </p>
      </section>
      <section>
        <h2>Controles y consentimiento</h2>
        <p>
          La analitica de producto y el procesamiento asistido son opcionales. El asistente de comunicacion nunca
          reemplaza automaticamente un mensaje y no brinda asesoramiento legal.
        </p>
      </section>
      <section>
        <h2>Conservacion y eliminacion</h2>
        <p>
          Conservamos la informacion mientras la cuenta este activa y durante los plazos necesarios para seguridad,
          obligaciones aplicables y resolucion de disputas. Las solicitudes de eliminacion tienen un periodo de
          revision para evitar perdidas accidentales.
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
    </LegalPage>
  );
}
