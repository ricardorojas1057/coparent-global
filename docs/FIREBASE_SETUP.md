# Firebase, Crashlytics y notificaciones

La aplicacion registra tokens Expo Push y el backend envia avisos mediante Expo Push Service.
En Android, Expo entrega esas notificaciones usando Firebase Cloud Messaging (FCM).

## Estado actual

- Proyecto Firebase gratuito: `coparent-global-5b673`.
- App Android registrada: `ar.coparent.app`.
- Crashlytics integrado con recoleccion automatica desactivada.
- El usuario debe activar **Diagnostico y analitica** para permitir reportes.
- `google-services.json` se mantiene fuera de GitHub y se entrega a EAS como archivo secreto.

## Archivo de configuracion Android

`apps/mobile/app.config.js` usa `GOOGLE_SERVICES_JSON` durante compilaciones EAS y recurre a
`apps/mobile/google-services.json` solo para desarrollo local. Ambos archivos se mantienen fuera de Git.

Crear el secreto para cada entorno EAS:

```powershell
eas env:create --environment preview --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret
eas env:create --environment production --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret
```

## FCM V1

Para que Expo Push Service entregue notificaciones Android, cargar una clave JSON privada de una cuenta de servicio
con acceso a Firebase Cloud Messaging:

1. Google Cloud Console > IAM y administracion > Cuentas de servicio.
2. Crear o elegir una cuenta exclusiva para notificaciones.
3. Otorgar el rol Firebase Messaging API Admin.
4. Crear una clave JSON y guardarla fuera del repositorio.
5. Ejecutar `eas credentials -p android`.
6. Elegir Production > Google Service Account > Manage FCM V1 > Upload a new service account key.

La clave privada nunca debe incorporarse al repositorio ni enviarse a logs.

## Validacion de Crashlytics

1. Instalar un APK de preview generado con Firebase.
2. Iniciar sesion y abrir Perfil.
3. Activar Diagnostico y analitica.
4. Tocar Enviar diagnostico de prueba.
5. Confirmar en Firebase Crashlytics que aparece `Coparent Global controlled diagnostic test`.

Crashlytics no recibe identificadores, mensajes familiares, nombres de hijos/as ni comprobantes desde la app.
