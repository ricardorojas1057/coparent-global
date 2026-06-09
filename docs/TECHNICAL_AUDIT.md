# Auditoria tecnica

Fecha: 9 de junio de 2026

## Estado verificado

- Backend NestJS compila.
- Frontend Next.js compila y esta desplegado.
- Aplicacion Expo pasa TypeScript y genera APK Android.
- APK `0.5.1` verificada con Firebase Crashlytics incluido.
- 13 suites y 28 pruebas backend pasan.
- Migraciones Prisma aplicadas en PostgreSQL local y Neon.
- Auditoria previa a GitHub no encontro secretos en archivos publicables.
- Endpoints funcionales protegidos con JWT y autorizacion familiar.

## Riesgos pendientes

- `npm audit --omit=dev` informa 15 vulnerabilidades moderadas; deben revisarse sin aplicar
  actualizaciones mayores automaticamente.
- Jest informa un worker que no finaliza limpiamente; no rompe pruebas, pero requiere investigar
  recursos abiertos.
- Faltan pruebas end-to-end de los recorridos completos en dispositivos Android reales.
- Crashlytics esta integrado con consentimiento y recoleccion desactivada por defecto; falta
  validar la recepcion del primer reporte en Firebase desde una compilacion instalada.
- El enlace APK de Expo es temporal. Google Play debe ser la descarga estable.
- Las politicas legales y de privacidad requieren revision profesional por jurisdiccion.
- El repositorio no incluye licencia de reutilizacion.

## Controles existentes

- JWT y `CurrentUser`.
- Validacion DTO.
- Comprobacion de membresia familiar en operaciones sensibles.
- Auditoria encadenada.
- Confirmacion manual antes de impactar acciones recibidas desde WhatsApp.
- Exclusiones Git para secretos, archivos Firebase, builds y claves de firma.
- Notificaciones de mejor esfuerzo: una falla externa no impide guardar una operacion.

## Recomendaciones siguientes

1. Configurar FCM V1 y validar la recepcion del primer reporte de Crashlytics.
2. Publicar AAB en prueba interna de Google Play.
3. Agregar pruebas end-to-end y pruebas de autorizacion multiusuario.
4. Revisar dependencias moderadas y fijar una politica de actualizaciones.
5. Ejecutar una evaluacion de privacidad y amenazas antes de incorporar familias reales.
