# Google Play Data Safety - respuestas preliminares

Este documento prepara las respuestas de Play Console para la version Android
0.10.0, verificada contra el binario final del 13 de junio de 2026. Debe
confirmarse nuevamente si cambian proveedores o funciones antes de enviarlo.

## Respuestas generales

| Pregunta | Respuesta preliminar |
| --- | --- |
| La app recopila o comparte datos de usuario | Si |
| Los datos se cifran en transito | Si, mediante HTTPS |
| Los usuarios pueden solicitar eliminacion | Si, desde Perfil y desde la URL publica |
| Se venden datos personales | No |
| La app esta dirigida a menores | No; esta dirigida a personas adultas responsables |
| Diagnosticos de Crashlytics | Opcionales, requieren consentimiento en Perfil |

URL publica de eliminacion:
`https://coparent-global.vercel.app/account-deletion`

Contacto de privacidad:
`coparentglobal.soporte@gmail.com`

## Datos que deben declararse como recopilados

| Categoria de Play | Datos utilizados | Obligatorio | Finalidad |
| --- | --- | --- | --- |
| Informacion personal: nombre | Nombre y apellido de la cuenta; nombres cargados para integrantes e hijos | Parcial | Cuenta y funciones familiares |
| Informacion personal: email | Email de acceso y recuperacion | Si | Gestion de cuenta, autenticacion y soporte |
| Informacion personal: telefono | Telefono opcional | No | Perfil e integraciones voluntarias |
| IDs de usuario | IDs internos y Google Subject cuando se usa Google Sign-In | Si | Autenticacion, seguridad y autorizacion familiar |
| Otra informacion personal | Fecha de nacimiento de hijos y roles familiares | Segun uso | Organizacion familiar |
| Informacion financiera: otra informacion financiera | Gastos familiares, importes, saldos y reembolsos | Segun uso | Gestion de gastos compartidos |
| Mensajes | Mensajes enviados dentro del espacio familiar | Segun uso | Mensajeria familiar registrada |
| Fotos y archivos | Comprobantes o fotos enviados voluntariamente | No | Comprobantes y acciones confirmadas |
| Informacion de salud | Contenido opcional de eventos o mensajes de salud | No | Organizacion familiar |
| Actividad de la app: interacciones | Cambios, confirmaciones y auditorias de operaciones | Si | Seguridad, integridad y funcionamiento |
| Informacion y rendimiento: registros de fallos | Errores tecnicos de Crashlytics | No | Diagnostico y estabilidad |
| Identificadores de dispositivo u otros | Token de notificaciones push | No | Envio de notificaciones autorizadas |

## Tratamiento y uso

- Los datos funcionales se conservan en el backend para operar el espacio
  familiar y mantener la integridad de registros compartidos.
- El contenido familiar no se usa para publicidad.
- Crashlytics debe permanecer desactivado hasta que la persona active
  Diagnostico y analitica.
- El asistente de comunicacion solo procesa contenido cuando la persona lo
  solicita y nunca reemplaza automaticamente el mensaje.
- WhatsApp solo prepara acciones pendientes. Ninguna accion impacta en la
  familia hasta ser confirmada manualmente dentro de la app.

## Compartir con terceros

Revisar esta seccion con la definicion vigente de Google Play antes de enviar.
La version usa proveedores tecnicos para prestar el servicio:

| Proveedor | Funcion | Datos potenciales |
| --- | --- | --- |
| Vercel | Backend y web publica | Solicitudes API y datos necesarios para operar |
| Neon | Base de datos PostgreSQL | Datos almacenados por la app |
| Expo/EAS | Compilacion y notificaciones | Tokens y entrega de notificaciones |
| Firebase/Google | Google Sign-In, FCM y Crashlytics opcional | Identidad Google, token push y diagnosticos consentidos |
| Meta/WhatsApp | Integracion voluntaria | Numero y contenido enviado al canal vinculado |
| Google Play | Suscripciones Android | Producto, token de compra y estado de suscripcion |

Los proveedores deben utilizarse bajo sus condiciones de servicio y solamente
para prestar las funciones solicitadas. Confirmar en Play Console si cada caso
califica como proveedor de servicio o como dato compartido.

## Verificacion final antes del envio

- [x] Inspeccionar SDK y permisos incluidos en el binario final.
- [x] Confirmar que Android no solicita acceso general al almacenamiento ni superposicion.
- [ ] Confirmar que Crashlytics no recopila antes del consentimiento.
- [ ] Confirmar que las URLs publicas funcionan sin iniciar sesion.
- [x] Implementar solicitud, cancelacion y confirmacion definitiva con anonimizacion y revocacion de acceso.
- [x] Publicar el plazo operativo inicial para solicitudes externas: hasta 30 dias corridos luego de verificar identidad.
- [ ] Revisar legalmente tratamiento de datos de menores y registros compartidos.
- [ ] Confirmar que las respuestas coinciden con las funciones habilitadas en produccion.
