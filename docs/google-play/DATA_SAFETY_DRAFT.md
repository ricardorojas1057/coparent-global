# Google Play Data Safety - borrador operativo

Este borrador debe completarse en Play Console verificando cada respuesta contra la version finalmente publicada.

## Datos recopilados o compartidos

| Categoria de Play | Ejemplos en Coparent Global | Finalidad | Obligatorio |
| --- | --- | --- | --- |
| Informacion personal | Nombre, apellido, email, telefono opcional | Cuenta, autenticacion, soporte | Parcial |
| Informacion de la app | Familias, hijos, calendario, mensajes, gastos, comprobantes | Funciones principales | Segun uso |
| Actividad de la app | Interacciones y auditorias de operaciones | Seguridad, integridad y funcionamiento | Si |
| Identificadores de dispositivo | Token de notificaciones push | Notificaciones autorizadas | Opcional |
| Diagnosticos | Errores tecnicos de Crashlytics | Estabilidad, solo con consentimiento | Opcional |

## Declaraciones previstas

- Los datos se cifran en transito mediante HTTPS.
- La app permite solicitar eliminacion de cuenta dentro de la app y mediante URL publica.
- No se venden datos personales.
- Los diagnosticos tecnicos son opcionales y no deben incluir contenido familiar ni datos personales.
- Google Sign-In, Firebase, Expo/EAS, Vercel, Neon y Meta/WhatsApp deben declararse segun el uso de la version publicada.

## Verificaciones antes de enviar

- Revisar todos los SDK incluidos en el AAB final.
- Confirmar politicas de retencion y plazo real de eliminacion.
- Confirmar si Play considera alguna transferencia a proveedores como "compartir".
- Completar la seccion de practicas de seguridad y revision independiente si corresponde.
