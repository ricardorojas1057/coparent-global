# Google Play Billing: puesta en produccion

Esta guia deja documentado el procedimiento para activar compras reales de
suscripciones en Coparent Global sin habilitar cobros antes de que la
verificacion del backend este lista.

## Estado actual

| Componente | Estado |
| --- | --- |
| Flujo de compra Android con Google Play Billing | Implementado en mobile 0.8.0 |
| Verificacion de compras en NestJS | Implementada y desplegada |
| Acknowledgement server-side | Implementado |
| Sincronizacion mediante RTDN | Implementada |
| Migracion de base de datos | Aplicada en produccion |
| Cuenta de desarrollador | Creada |
| Identidad del desarrollador | Documentos enviados; en revision de Google |
| Dispositivo Android del propietario | Verificado |
| Telefono de contacto | Pendiente; se habilita al aprobar la identidad |
| Productos creados en Play Console | Pendiente |
| Cuenta de servicio de Google Play | Pendiente |
| Pub/Sub para RTDN | Pendiente |
| Compra real con usuario de prueba | Pendiente |
| Facturacion real habilitada | No, desactivada de forma segura |

No cambiar `GOOGLE_PLAY_BILLING_ENABLED` a `true` hasta completar toda la
prueba de licencia indicada al final.

## 1. Crear la cuenta y la aplicacion

1. Completar el registro de Play Console con la cuenta propietaria.
2. Elegir correctamente entre cuenta personal y organizacion. Esta decision
   tiene consecuencias legales y de verificacion.
3. Completar el pago y la verificacion de identidad solicitados por Google.
4. Crear la aplicacion con nombre `Coparent Global`.
5. Usar el identificador Android existente: `ar.coparent.app`.
6. Configurar Play App Signing.
7. Publicar primero mediante testing interno.

La cuenta, el pago y la verificacion de identidad deben ser completados por el
titular. No deben delegarse ni automatizarse.

## 2. Subir una version compatible con compras

La primera version con compras reales es la version mobile `0.8.0` y
`versionCode` 16.

1. Generar un Android App Bundle de produccion desde `apps/mobile`.
2. Subir el archivo `.aab` a la pista de testing interno.
3. Resolver cualquier declaracion o revision requerida por Play Console.

La cuota gratuita de builds Android de EAS se encuentra agotada y se renueva
el 1 de julio de 2026. No es necesario contratar un plan de Expo: se puede
esperar la renovacion de la cuota gratuita.

## 3. Crear los tres productos

En Play Console, abrir `Monetizar > Productos > Suscripciones`.

| Producto | ID inmutable | Precio mensual inicial | Precio anual inicial |
| --- | --- | ---: | ---: |
| Family Plus | `coparent_family_plus` | USD 6.99 | USD 67.08 |
| Family Premium | `coparent_family_premium` | USD 12.99 | USD 124.68 |
| Professional | `coparent_professional` | USD 29.99 | USD 287.88 |

Para cada producto:

1. Crear un plan base auto-renovable con ID `monthly`.
2. Crear un plan base auto-renovable con ID `annual`.
3. Definir precios y revisar la conversion automatica por pais.
4. Activar ambos planes base.

Los IDs de producto y de plan base no deben cambiarse: ya estan incluidos en
la aplicacion y en el backend.

## 4. Crear acceso del backend a Google Play

1. Crear o seleccionar un proyecto de Google Cloud.
2. Habilitar `Google Play Android Developer API`.
3. Crear una cuenta de servicio exclusiva para Coparent Global.
4. Vincularla en Play Console y otorgarle solamente los permisos necesarios
   para consultar y administrar suscripciones.
5. Descargar el JSON de la cuenta de servicio.
6. Guardar el JSON completo como variable sensible de Vercel:
   `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.

El archivo JSON es secreto. No debe agregarse al repositorio, enviarse por
WhatsApp ni incluirse dentro de la aplicacion movil.

## 5. Configurar notificaciones RTDN

1. Crear un topic de Pub/Sub para notificaciones de Google Play.
2. Otorgar permiso de publicador a:
   `google-play-developer-notifications@system.gserviceaccount.com`.
3. Crear una cuenta de servicio para la suscripcion push.
4. Crear una suscripcion push autenticada hacia:
   `https://coparent-argentina-api.vercel.app/subscriptions/google-play/notifications`
5. Usar esa misma URL como audience del token OIDC.
6. Configurar en Vercel:
   - `GOOGLE_PLAY_PUBSUB_AUDIENCE`
   - `GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL`
7. Registrar el topic en la configuracion de monetizacion de Play Console.

## 6. Probar sin cobrar a usuarios reales

1. Agregar una cuenta de Google como tester de licencia.
2. Agregarla tambien a la pista de testing interno.
3. Instalar la aplicacion desde el enlace oficial de testing de Play.
4. Comprar cada plan mensual y anual con el metodo de pago de prueba.
5. Confirmar que la app muestra el plan correcto.
6. Confirmar renovacion, cancelacion, periodo de gracia y compra pendiente.
7. Confirmar que una compra cancelada conserva beneficios hasta el final del
   periodo ya pagado.
8. Confirmar que Play Console muestra la compra como acknowledged.

## 7. Activar facturacion real

Solo despues de completar exitosamente todas las pruebas:

1. Configurar en Vercel `GOOGLE_PLAY_BILLING_ENABLED=true`.
2. Volver a desplegar el backend.
3. Repetir una compra de prueba.
4. Promover gradualmente la version desde testing interno.

## Control final

- [x] Cuenta de desarrollador creada
- [x] Dispositivo Android del propietario verificado
- [ ] Identidad del desarrollador aprobada por Google
- [ ] Telefono de contacto verificado
- [ ] Aplicacion `ar.coparent.app` creada
- [ ] AAB 0.8.0 o superior publicado en testing interno
- [ ] Tres productos creados
- [ ] Seis planes base activos
- [ ] Cuenta de servicio configurada
- [ ] RTDN autenticado y probado
- [ ] Compra de tester verificada por el backend
- [ ] Restauracion de compra probada
- [ ] Renovacion y cancelacion sincronizadas
- [ ] Facturacion habilitada en Vercel
