# Firebase: notificaciones y errores

La aplicacion registra tokens Expo Push y el backend envia avisos mediante Expo Push Service.
En Android, Expo entrega esas notificaciones usando Firebase Cloud Messaging (FCM).

## Estado actual

- Proyecto Firebase gratuito: `coparent-global-5b673`.
- App Android registrada: `ar.coparent.app`.
- Crashlytics integrado con recoleccion automatica desactivada.
- El usuario debe activar **Diagnostico y analitica** para permitir reportes.
- `google-services.json` se mantiene fuera de GitHub y se entrega a EAS como archivo secreto.

## Activar notificaciones Android

1. En Firebase, abrir **Configuracion del proyecto > Cuentas de servicio** y generar una clave privada.
2. Subir esa clave a EAS como credencial FCM V1. Nunca guardarla en este repositorio.
3. Generar una nueva APK/AAB con EAS.

## Activar Crashlytics

Crashlytics requiere una compilacion nativa nueva. Sus controles son:

- Recoleccion desactivada por defecto en `apps/mobile/firebase.json`.
- Activacion vinculada al consentimiento de diagnostico de cada usuario.
- Sin identificadores, mensajes familiares, nombres de hijos/as ni comprobantes.
- `google-services.json` y claves de servicio excluidos de GitHub.

Firebase comienza a mostrar errores despues de instalar y ejecutar una compilacion `0.5.1` o
superior con el consentimiento activado.
