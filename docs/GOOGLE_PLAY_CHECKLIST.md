# Google Play checklist

## Build tecnico

- [x] Configurar la URL HTTPS real del backend.
- [x] Crear y vincular el proyecto EAS.
- [x] Integrar Firebase, Google Sign-In y Crashlytics opcional.
- [ ] Generar Android App Bundle 0.8.0 o superior cuando se renueve la cuota gratuita EAS.
- Subir el `.aab` a Play Console en testing interno/cerrado antes de produccion.

## Play Console

- [x] Crear cuenta de desarrollador.
- [x] Verificar acceso a un dispositivo Android.
- [ ] Esperar aprobacion de identidad y verificar telefono.
- [ ] Crear app Android con package name `ar.coparent.app`.
- [x] Preparar ficha ES/EN, icono y feature graphic.
- [ ] Tomar screenshots reales de telefono.
- [x] Preparar Data Safety preliminar.
- [x] Publicar URLs de privacidad, soporte y eliminacion.
- [ ] Configurar Play App Signing.
- [ ] Publicar primero en prueba cerrada.
- [ ] Mantener al menos 12 testers durante 14 dias consecutivos.

## Privacidad y cumplimiento

- [x] La app ofrece solicitud de eliminacion dentro de la app y mediante URL externa.
- [ ] Validar Data Safety contra el AAB final.
- [x] La API publica usa HTTPS.
- [x] Android no declara permisos adicionales innecesarios en `app.json`.
- [ ] Obtener revision legal antes del lanzamiento general.
