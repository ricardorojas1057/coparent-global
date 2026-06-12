# Paquete listo para Play Console

## Estado al 12 de junio de 2026

- Cuenta de desarrollador creada.
- Dispositivo Android del propietario verificado.
- Documentos de identidad enviados y en revision de Google.
- Telefono y creacion de la app bloqueados hasta la aprobacion de identidad.
- Backend de compras reales implementado y desplegado, con facturacion desactivada.
- Mobile 0.8.0 contiene compras y restauracion, pero falta generar el AAB final.
- Paginas publicas de privacidad, soporte y eliminacion actualizadas y desplegadas.
- Plazo operativo inicial de eliminacion publicado: hasta 30 dias corridos luego de verificar identidad.

## Datos de la aplicacion

| Campo | Valor |
| --- | --- |
| Nombre | Coparent Global |
| Desarrollador publico | Coparent Global |
| Package name | `ar.coparent.app` |
| Categoria sugerida | Parenting |
| Idiomas iniciales | Espanol e ingles |
| Correo de soporte | `coparentglobal.soporte@gmail.com` |
| Sitio web | `https://coparent-global.vercel.app` |
| Privacidad | `https://coparent-global.vercel.app/privacy` |
| Terminos | `https://coparent-global.vercel.app/terms` |
| Eliminacion de cuenta | `https://coparent-global.vercel.app/account-deletion` |
| Soporte | `https://coparent-global.vercel.app/support` |

## Recursos preparados

- Icono Play Store: `assets/app-icon-512x512.png`
- Feature graphic global: `assets/feature-graphic-global-1024x500.png`
- Ficha en espanol: `STORE_LISTING_ES.md`
- Ficha en ingles: `STORE_LISTING_EN.md`
- Plan de capturas: `SCREENSHOT_PLAN.md`
- Data Safety preliminar: `DATA_SAFETY_DRAFT.md`
- Acceso del revisor: `REVIEWER_ACCESS.md`
- Plan de prueba cerrada: `CLOSED_TESTING_PLAN.md`
- Tracker de testers: `tester-tracker.csv`
- Casos de prueba: `TEST_CASES.md`

La imagen antigua `assets/feature-graphic-1024x500.png` no debe cargarse porque
contiene un error de caracteres. Usar solamente la version `global`.

## Pendiente cuando Google apruebe la identidad

1. Verificar el telefono de contacto.
2. Crear la aplicacion `Coparent Global`.
3. Configurar ficha, URLs y recursos graficos.
4. Crear la prueba cerrada y cargar al menos 15 correos de testers.
5. Generar y subir el AAB 0.8.0 o superior.
6. Tomar capturas reales desde la version instalada.
7. Completar Data Safety contra el AAB final.
8. Iniciar los 14 dias de prueba con al menos 12 testers.

## Bloqueos conocidos

- Google debe aprobar la identidad del titular.
- La cuota gratuita de builds Android de EAS se renueva el 1 de julio de 2026.
- La integracion de WhatsApp no debe promocionarse hasta activar el numero oficial.
- La facturacion no debe habilitarse hasta probar compras con tester de licencia.
- La politica de privacidad y los terminos requieren revision legal antes del lanzamiento general.
