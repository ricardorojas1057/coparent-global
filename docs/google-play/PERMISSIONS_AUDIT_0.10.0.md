# Auditoria de permisos Android 0.10.0

Fecha: 13 de junio de 2026

## Resultado

El binario final fue inspeccionado despues de retirar `expo-dev-client` y
bloquear permisos amplios que no eran necesarios.

Permisos retirados:

- `android.permission.SYSTEM_ALERT_WINDOW`
- `android.permission.READ_EXTERNAL_STORAGE`
- `android.permission.WRITE_EXTERNAL_STORAGE`

La aplicacion recibe texto o imagenes compartidas mediante permisos temporales
otorgados por Android para cada contenido. No necesita leer todo el
almacenamiento del dispositivo.

## Permisos funcionales principales

| Permiso | Motivo |
| --- | --- |
| `INTERNET` | Comunicacion HTTPS con el backend |
| `ACCESS_NETWORK_STATE` y `ACCESS_WIFI_STATE` | Detectar conectividad y sincronizacion |
| `POST_NOTIFICATIONS`, `VIBRATE`, `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED` | Notificaciones y recordatorios |
| `com.google.android.c2dm.permission.RECEIVE` | Firebase Cloud Messaging |
| `USE_BIOMETRIC` y `USE_FINGERPRINT` | Almacenamiento seguro compatible con el dispositivo |
| `com.android.vending.BILLING` | Suscripciones administradas por Google Play |

Los permisos de insignias de distintos fabricantes provienen del sistema de
notificaciones y sirven para mostrar el contador en el icono.

## Binario auditado

- Archivo: `Coparent-Global-0.10.0-27.aab`
- SHA-256: `1ACF2283C4A7318A00E74B83ED650C8D38598794BB3279B98F6C76ABE4818E0D`
- Tamano: 32.205.019 bytes
- Cliente de desarrollo: no incluido
