# Google Play checklist

## Build tecnico

- [x] Configurar la URL HTTPS real del backend.
- [x] Crear y vincular el proyecto EAS.
- [x] Integrar Firebase, Google Sign-In y Crashlytics opcional.
- [x] Generar Android App Bundle 0.10.0 localmente sin depender de la cuota EAS.
- [x] Retirar herramientas de desarrollo y permisos Android innecesarios.
- Subir el `.aab` a Play Console en testing interno/cerrado antes de produccion.

## Play Console

- [x] Crear cuenta de desarrollador.
- [x] Verificar acceso a un dispositivo Android.
- [ ] Esperar aprobacion de identidad y verificar telefono.
- [ ] Crear app Android con package name `ar.coparent.app`.
- [x] Preparar ficha ES/EN, icono y feature graphic.
- [ ] Tomar screenshots reales de telefono.
- [x] Preparar Data Safety preliminar.
- [x] Validar Data Safety y permisos contra el binario final 0.10.0.
- [x] Publicar URLs de privacidad, soporte y eliminacion.
- [ ] Configurar Play App Signing.
- [ ] Publicar primero en prueba cerrada.
- [ ] Mantener al menos 12 testers durante 14 dias consecutivos.

## Privacidad y cumplimiento

- [x] La app ofrece solicitud de eliminacion dentro de la app y mediante URL externa.
- [x] Validar Data Safety preliminar contra el AAB final.
- [x] La API publica usa HTTPS.
- [x] Android no declara acceso general al almacenamiento ni permiso de superposicion.
- [ ] Obtener revision legal antes del lanzamiento general.
