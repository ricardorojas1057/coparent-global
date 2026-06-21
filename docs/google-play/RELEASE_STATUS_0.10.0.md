# Estado de lanzamiento 0.10.0

Fecha: 13 de junio de 2026

## Estado

- Backend y pagina web de invitaciones desplegados en produccion.
- Aplicacion movil configurada como version `0.10.0` y Android `versionCode 27`.
- Backend: 20 suites y 51 pruebas aprobadas.
- TypeScript aprobado en backend y aplicacion movil.
- Build de produccion web aprobado.
- Migraciones de invitaciones de invitados y comprobantes privados aplicadas en Neon.
- Cliente de desarrollo retirado de la compilacion publica.
- Permisos amplios de almacenamiento y superposicion retirados del binario Android.

## Mejoras incluidas

- Respuesta segura a invitaciones sin instalar la app ni obtener acceso familiar.
- Comprobantes de gastos privados, autorizados por familia, auditados y con hash SHA-256.
- Exportacion familiar verificable con manifiesto SHA-256.
- Cola persistente y segura para mensajes enviados sin conexion.
- Mejoras de traduccion en gastos para espanol e ingles.
- Correccion del bloqueo de auditoria que provocaba errores 500 en produccion.

## Publicacion Android

El AAB de produccion fue generado localmente el 13 de junio de 2026 sin consumir
cupo de EAS.

- Archivo: `C:\Users\Ricardo\Downloads\Coparent-Global-0.10.0-27.aab`
- Tamano: 32.205.019 bytes
- SHA-256: `1ACF2283C4A7318A00E74B83ED650C8D38598794BB3279B98F6C76ABE4818E0D`
- Firma SHA-1 verificada: `84:BF:60:C0:F2:69:33:FB:C6:8A:96:5C:3E:C4:50:9E:C4:CC:DE:DE`
- Arquitectura nativa estable configurada para compilaciones locales reproducibles en Windows.
- Permisos finales auditados desde el APK de produccion.

Las proximas compilaciones locales se pueden generar con:

`npm --workspace apps/mobile run build:android:local`

El cupo mensual de EAS ya no bloquea la publicacion de esta version.

Antes de enviar a produccion:

1. Subir el AAB a la prueba cerrada de Google Play.
2. Ejecutar los recorridos de `TEST_CASES.md` con dos cuentas y dos dispositivos.
3. Confirmar que Firebase Crashlytics y las notificaciones push funcionan en la compilacion instalada desde Google Play.

## Bloqueos para lanzamiento publico

- Completar la prueba cerrada requerida por Google Play.
- Validar la aplicacion con aproximadamente 20 familias.
- Terminar la traduccion de todas las pantallas esenciales.
- Revisar privacidad, terminos y tratamiento de datos de menores con un profesional.
- Ampliar el funcionamiento offline mas alla de la cola de mensajes.

La recomendacion actual es publicar primero como beta cerrada, no como lanzamiento
publico general.
