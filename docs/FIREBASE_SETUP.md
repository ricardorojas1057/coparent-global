# Firebase: notificaciones y errores

La aplicacion registra tokens Expo Push y el backend envia avisos mediante Expo Push Service.
En Android, Expo entrega esas notificaciones usando Firebase Cloud Messaging (FCM).

## Activar notificaciones Android

1. Crear un proyecto en Firebase Console.
2. Agregar una aplicacion Android con el identificador `ar.coparent.app`.
3. En Firebase, abrir **Configuracion del proyecto > Cuentas de servicio** y generar una clave privada.
4. Subir esa clave a EAS como credencial FCM V1. Nunca guardarla en este repositorio.
5. Generar una nueva APK/AAB con EAS.

## Activar Crashlytics

Crashlytics requiere agregar la configuracion nativa privada de Firebase y generar una nueva
compilacion. Antes de activarlo:

- Confirmar el consentimiento de analitica/errores en la politica de privacidad.
- Mantener `google-services.json` y las claves de servicio fuera de GitHub.
- No adjuntar mensajes familiares, nombres de hijos/as ni comprobantes a los reportes de error.

Crashlytics queda preparado como siguiente paso operativo, pero no se activa automaticamente
sin las credenciales privadas del propietario del proyecto Firebase.
