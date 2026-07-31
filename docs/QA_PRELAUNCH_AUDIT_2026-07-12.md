# QA prelaunch audit - Coparent Global

Fecha: 2026-07-12
Alcance: mobile Expo React Native, backend NestJS, Prisma/PostgreSQL, Firebase, Vercel y Google Play Closed Testing.

## 1. Resumen ejecutivo

Coparent Global esta lista para continuar en prueba cerrada con testers reales, pero no esta lista para produccion publica sin resolver algunos puntos de confianza, privacidad y Google Play.

La base tecnica compila y los tests backend pasan. La autorizacion familiar existe en la mayoria de los servicios criticos. Las mejoras recientes de calendario, gastos, WhatsApp, exportacion e internacionalizacion van en la direccion correcta.

Los riesgos principales no son de compilacion, sino de lanzamiento real:

- Google Sign-In todavia debe validarse en un celular con la version instalada desde Google Play.
- Google Play Closed Testing exige que los testers esten agregados y opt-in con el mismo Gmail del telefono.
- Data Safety debe declarar exactamente datos personales, datos de menores, mensajes, gastos, comprobantes, diagnostico, push token y datos de cuenta.
- Las notificaciones de calendario y gastos pueden exponer contenido sensible en pantalla bloqueada.
- WhatsApp confirma notas saltandose la misma logica de mensajes y revision de tono.
- Hay textos con encoding roto en `App.tsx` y `whatsapp.service.ts`.
- La exportacion HTML es util para prueba, pero contiene mensajes, emails y gastos; necesita confirmaciones visibles y controles de acceso mas finos antes de publicarse.

Decision QA: lista para prueba cerrada con riesgos controlados. No lista para produccion publica.

## 2. Verificaciones ejecutadas

Comandos ejecutados:

```powershell
npm.cmd --workspace apps/backend run build
npm.cmd --workspace apps/mobile run typecheck
npm.cmd --workspace apps/backend test -- --runInBand
npm.cmd audit --workspaces --audit-level=low
```

Resultado:

- Backend build: OK.
- Mobile typecheck: OK.
- Backend tests: 21 suites, 60 tests, OK.
- NPM audit: 0 vulnerabilidades reportadas.

## 3. Fuentes externas usadas para Google Play

- Google Play: nuevas cuentas personales deben ejecutar una prueba cerrada con minimo 12 testers opt-in por 14 dias continuos antes de solicitar produccion: https://support.google.com/googleplay/android-developer/answer/14151465
- Google Play Data safety: el desarrollador debe completar una declaracion clara y exacta sobre datos recolectados, compartidos y protegidos: https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play account deletion: si la app permite crear cuentas, debe ofrecer ruta in-app y enlace web para solicitar eliminacion de cuenta y datos: https://support.google.com/googleplay/android-developer/answer/13327111
- Google Play review/privacy policy: la politica de privacidad y disclosures in-app deben explicar como se recolectan, usan y comparten datos sensibles: https://support.google.com/googleplay/android-developer/answer/9859455

## 4. Bugs criticos probables

### C1 - Google Sign-In puede seguir fallando en builds reales

Prioridad: critica

Evidencia:

- La app usa client IDs hardcodeados como fallback en `apps/mobile/src/config.ts:21-29`.
- El backend usa flujo Google web/mobile y redirect URI en `apps/backend/src/modules/auth/auth.service.ts:81-118`.
- Ya hubo evidencia real de `DEVELOPER_ERROR` en celular.

Riesgo:

Si el SHA-1, OAuth Android client, OAuth Web client, `google-services.json`, redirect URI o entorno Vercel no coinciden, los testers no pueden entrar con Google.

Mitigacion:

- Probar build 36 instalada desde Google Play, no APK local.
- Verificar dos rutas: Google nativo y fallback por navegador.
- Confirmar variables backend: `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_WEB_CLIENT_SECRET`, `GOOGLE_ANDROID_CLIENT_ID`, `GOOGLE_MOBILE_REDIRECT_URI`, `GOOGLE_MOBILE_DEEP_LINK`.
- Confirmar SHA-1 de Play App Signing y upload key en Google Cloud/Firebase.
- Mantener login email/password como fallback visible.

### C2 - Testers no pueden instalar si no estan agregados y opt-in

Prioridad: critica

Evidencia:

- La app muestra link de testing `https://play.google.com/apps/testing/ar.coparent.app` en `apps/mobile/App.tsx:248`.
- El mensaje de invitacion familiar mezcla descarga y token familiar en `apps/mobile/App.tsx:3197-3216`.
- Google exige closed testing con testers opt-in, no basta con compartir el link.

Riesgo:

El tester ve "Aplicacion no disponible" y abandona. Tambien se pierde el conteo de 12 testers durante 14 dias.

Mitigacion:

- Agregar Gmail del tester en Play Console.
- Pedirle que abra el link con ese mismo Gmail.
- Primero aceptar prueba de Google Play; despues abrir invitacion familiar.
- Separar visualmente: "Link de descarga/testing" y "Link de invitacion familiar".

### C3 - Data Safety incompleto o incorrecto bloquea release

Prioridad: critica

Evidencia:

La app recolecta o procesa:

- Nombre, email, telefono opcional, ID de usuario.
- Datos de hijos/as.
- Mensajes familiares.
- Calendario.
- Gastos, saldos, comprobantes.
- Push tokens.
- Diagnostico/Crashlytics.
- Datos de suscripcion.

Riesgo:

Google Play puede impedir guardar, enviar revision o aprobar la app si la declaracion no coincide con el binario y la politica de privacidad.

Mitigacion:

- Completar Data Safety con todos los tipos aplicables.
- Marcar cifrado en transito solo si backend usa HTTPS en produccion.
- Declarar eliminacion de cuenta con `https://coparent-global.vercel.app/account-deletion`.
- Alinear politica de privacidad, textos in-app y formulario.

## 5. Bugs y riesgos altos

### H1 - Notificaciones pueden exponer informacion sensible

Prioridad: alta

Evidencia:

- Calendario envia el titulo del evento como body: `apps/backend/src/modules/calendar/calendar.service.ts:69-74`.
- Gastos envia la descripcion del gasto como body: `apps/backend/src/modules/expenses/expenses.service.ts:100-105`.
- `NotificationsService` persiste y envia `title` y `body`: `apps/backend/src/modules/notifications/notifications.service.ts:50-76`.

Riesgo:

En pantalla bloqueada puede aparecer "consulta medica", "deuda", "abogado", "colegio" u otra informacion sensible.

Mitigacion:

- Usar cuerpos genericos: "Hay una novedad familiar en Coparent Global".
- Mantener detalles solo dentro de la app autenticada.
- Agregar test que prohíba incluir `dto.title` o `dto.description` en push.

### H2 - WhatsApp confirma notas sin pasar por `MessagesService`

Prioridad: alta

Evidencia:

- Mensajes normales pasan por `MessagesService.create`, que revisa tono, registra audit y notifica: `apps/backend/src/modules/messages/messages.service.ts:33-76`.
- WhatsApp, al confirmar una nota, crea `chatMessage` directamente con Prisma: `apps/backend/src/modules/whatsapp/whatsapp.service.ts:257-272`.

Riesgo:

Una frase agresiva compartida desde WhatsApp puede entrar como mensaje sin la misma revision de tono ni metadata `aiIntervened`.

Mitigacion:

- Inyectar `MessagesService` en `WhatsAppService` y usar `messages.create(...)`.
- Si se necesita preservar `originalContent`, extender DTO/servicio con campo controlado.
- Agregar test con insultos confirmados desde WhatsApp.

### H3 - Revision de tono sigue siendo regex simple

Prioridad: alta

Evidencia:

- Backend usa patrones regex en `apps/backend/src/modules/messages/communication-assistant.ts:7-45`.
- Mobile duplica patrones en `apps/mobile/App.tsx:3292-3330`.

Riesgo:

Falsos negativos con insultos alterados, separaciones, leetspeak, sarcasmo o frases agresivas sin insultos. Falsos positivos con palabras usadas en contexto no ofensivo.

Mitigacion:

- No prometer "confiable"; decir "revision orientativa".
- Centralizar la revision en backend y usar mobile solo como previsualizacion.
- Agregar un set de 50 frases reales anonimizadas para tests.
- Considerar modelo de clasificacion moderado y privado mas adelante.

### H4 - Textos con encoding roto

Prioridad: alta

Evidencia:

- `apps/mobile/App.tsx:1284`, `1316`, `1804`, `1816`, `1944-1960`, `3210-3216`, `3235-3239`.
- `apps/backend/src/modules/whatsapp/whatsapp.service.ts:87-93`.
- `apps/backend/src/modules/messages/communication-assistant.ts:75-77`.

Riesgo:

La app puede mostrar "invitaciÃ³n", "automÃ¡ticamente" o "EntrÃ¡", lo que baja confianza y parece producto roto.

Mitigacion:

- Saneamiento completo de encoding.
- Test de snapshot o `rg "Ã|Â"` en CI.
- Mover textos a `i18n.ts` y evitar strings dispersos.

### H5 - Exportacion HTML expone datos sensibles a cualquier miembro familiar

Prioridad: alta

Evidencia:

- Exportacion valida membresia, no rol: `apps/backend/src/modules/exports/exports.service.ts:18-22`.
- Incluye emails de miembros: `apps/backend/src/modules/exports/exports.service.ts:134-143`.
- Incluye mensajes: `apps/backend/src/modules/exports/exports.service.ts:184-192`.
- Incluye gastos y saldos: `apps/backend/src/modules/exports/exports.service.ts:158-180`.

Riesgo:

Un integrante puede exportar mensajes, gastos y correos y reenviarlos fuera de la app. En alto conflicto esto puede aumentar riesgo de abuso.

Mitigacion:

- Confirmacion fuerte antes de exportar.
- Registrar IP/dispositivo si aplica.
- Opcion de exportacion basica sin emails.
- En modo alto conflicto, exigir rol principal o consentimiento/registro visible.

### H6 - Edicion de hijos/as permitida a cualquier miembro

Prioridad: alta

Evidencia:

- Crear hijo valida membresia y plan: `apps/backend/src/modules/children/children.service.ts:16-30`.
- Editar hijo solo exige acceso a la familia, no rol: `apps/backend/src/modules/children/children.service.ts:33-52`.
- Eliminar exige `PRIMARY_PARENT`: `apps/backend/src/modules/children/children.service.ts:55-57`.

Riesgo:

En relaciones de alto conflicto, un integrante puede modificar datos del hijo/a sin confirmacion.

Mitigacion:

- En modo cooperativo permitir edicion.
- En modo estructurado/alto conflicto, convertir cambios en solicitud o exigir rol principal.
- Auditar y notificar cambios con mensaje generico.

### H7 - Cola offline parcial

Prioridad: alta

Evidencia:

- Cola persistente existe en `apps/mobile/src/offline.ts:42-70`.
- En `App.tsx` se ve uso explicito para mensajes en `apps/mobile/App.tsx:1571`.

Riesgo:

El usuario puede creer que calendario/gastos/invitaciones se guardan offline, pero solo algunos cambios se reintentan. Tambien puede haber duplicados si falta idempotencia en endpoints no cubiertos.

Mitigacion:

- Mostrar "compatible offline" solo en flujos realmente soportados.
- Agregar `clientMutationId` a calendario y gastos si se van a encolar.
- Testear corte de internet durante envio.

## 6. Casos borde por pantalla

### Login y registro

- Email con espacios, mayusculas, alias `+`.
- Password incorrecta.
- Cuenta sin email verificado.
- Token vencido.
- Google cancelado.
- Google mal configurado.
- Usuario eliminado que intenta volver.
- Deep link de Google abierto con app cerrada.
- Sin red durante callback.

Prioridad: critica para Google y email verification; alta para el resto.

### Invitaciones

- Tester no agregado.
- Tester agregado pero no hizo opt-in.
- Link familiar abierto antes de instalar.
- Link familiar abierto con Gmail distinto.
- Invitacion expirada.
- Invitacion revocada.
- Invitacion ya aceptada.
- Persona responde desde web pero no instala.
- Otro progenitor no coopera.

Prioridad: critica.

### Familias e hijos/as

- Fecha futura.
- Fecha imposible.
- Hijo duplicado.
- Menor sin apellido.
- Usuario secundario edita hijo.
- Eliminacion de hijo con eventos/gastos vinculados.
- Familias multiples.

Prioridad: alta.

### Calendario

- Fin antes que inicio.
- Evento sin responsable.
- Responsable que no integra familia.
- Evento de muchos dias.
- Edicion en modo alto conflicto.
- Cancelacion por usuario no creador.
- Solicitud de cambio duplicada.
- Zona horaria diferente.

Prioridad: alta.

### Mensajes

- Mensaje vacio.
- Mensaje de 4000 caracteres.
- Insultos con separadores: "h i j a de p u t a".
- Sarcasmo sin insultos.
- Texto pegado desde WhatsApp.
- Categoria en idioma incorrecto.
- Historial no editable.
- Intento de borrar mensaje desde API.

Prioridad: alta.

### Gastos

- Monto 0, negativo, coma decimal.
- Moneda distinta.
- Pago compartido vs pagado por una sola parte.
- Payer fuera de familia.
- Comprobante mayor a 2 MB.
- PDF, JPG, PNG.
- Reembolso marcado por usuario incorrecto.
- Saldo tras editar o cancelar gasto.

Prioridad: alta.

### Exportaciones

- Usuario fuera de familia.
- Familia sin datos.
- Mensajes con HTML/script.
- Archivo compartido por Android sin adjunto real.
- Hash no coincide tras modificar HTML.
- Aviso legal visible.
- Exportacion en ingles/espanol.

Prioridad: alta.

### WhatsApp

- Codigo vencido a los 15 minutos.
- Codigo reenviado a tercero.
- Foto sin texto.
- Texto que parece gasto pero falta monto.
- Confirmacion duplicada.
- Cancelacion.
- Webhook sin firma.
- Firma invalida.
- Meta caido.

Prioridad: alta.

### Privacidad y cuenta

- Usuario pide eliminacion y cancela.
- Usuario elimina siendo progenitor principal.
- Datos compartidos retenidos sin datos personales.
- Push token eliminado al borrar cuenta.
- Crashlytics desactivado.
- Politica y terminos accesibles.

Prioridad: critica para eliminacion; alta para analitica.

### Offline y conectividad

- Sin internet al login.
- Cambio WiFi/4G durante envio.
- Reintento duplicado.
- Cola mayor a 50.
- App cerrada antes de sincronizar.

Prioridad: alta.

### Notificaciones

- Permiso denegado.
- Token FCM/Expo invalido.
- Usuario desactiva push.
- Usuario eliminado sigue recibiendo push.
- Push con datos sensibles.

Prioridad: alta.

### Google Play

- AAB con versionCode repetido.
- Tester no agregado.
- Tester no acepto enlace.
- Build vieja instalada.
- Data Safety incompleta.
- Declaracion de publicidad incompleta.
- Declaracion de salud/finanzas incorrecta.
- App access/instrucciones para reviewer incompletas.

Prioridad: critica.

## 7. Riesgos de seguridad

| Riesgo | Prioridad | Estado observado | Mitigacion |
| --- | --- | --- | --- |
| Acceso a familia ajena | Critica | Servicios principales validan membresia | Mantener tests por endpoint y agregar guard/policy central |
| Endpoints sin guard | Alta | Auth/invitations/webhook son publicos por diseno; resto mayormente protegido | Ampliar `protected-controllers.spec.ts` para exports, notifications, subscriptions |
| Tokens vencidos | Alta | JWT existe; authVersion invalida en borrado | Testear expiracion y refresh/logout |
| Links de invitacion | Alta | Token hash y expiracion 7 dias | Agregar revocacion visible y rate limits por token/IP |
| Comprobantes privados | Alta | Guardados como bytes en DB, con hash | Migrar a storage privado con URLs firmadas y antivirus |
| Rate limiting | Media | Middleware en endpoints sensibles | En produccion usar storage distribuido, no Map en memoria |
| Error messages | Media | Algunos mensajes especificos | Revisar para no filtrar existencia de emails |

## 8. Riesgos de privacidad

| Riesgo | Prioridad | Mitigacion |
| --- | --- | --- |
| Datos de menores | Critica | Minimizar campos, explicar finalidad, no pedir datos reales en testing |
| Push con detalles sensibles | Alta | Cuerpos genericos |
| Exportacion compartible | Alta | Confirmacion fuerte, registrar auditoria, opcion de redaccion |
| Crashlytics/diagnostico | Alta | Consentimiento claro, no enviar mensajes/comprobantes |
| WhatsApp | Alta | Mantener confirmacion manual, explicar que WhatsApp/Meta es tercero |
| Eliminacion de cuenta | Critica | Mantener ruta in-app y web; explicar retencion de registros compartidos |

## 9. Riesgos de Google Play

- Para produccion, Google exige closed testing con al menos 12 testers opt-in durante 14 dias continuos para nuevas cuentas personales.
- El formulario Data Safety debe coincidir con el AAB final.
- Si hay creacion de cuenta, Google exige ruta in-app y web para eliminacion.
- App access debe explicar como entra el reviewer: cuenta de prueba, login, pasos, si Google Sign-In falla, alternativa email/password.
- Si se declaran funciones financieras o de salud de forma incorrecta, puede bloquear la revision. En esta app "gastos compartidos" no deberia declararse como servicio financiero regulado, pero si se manejan datos financieros personales en Data Safety.

## 10. Checklist manual para testers

Cada tester debe usar datos ficticios.

1. Confirmar que su Gmail fue agregado como tester.
2. Abrir el link de Google Play con ese Gmail y aceptar la prueba.
3. Instalar Coparent Global desde Google Play.
4. Registrarse con email/password.
5. Verificar email.
6. Cerrar sesion e ingresar de nuevo.
7. Probar Google Sign-In.
8. Crear familia.
9. Invitar a otro usuario con email limitado.
10. Abrir el link familiar desde otro celular/cuenta.
11. Agregar hijo/a con fecha valida.
12. Intentar fecha futura y verificar error.
13. Crear evento con responsable.
14. Editar evento.
15. Solicitar cambio de evento.
16. Cambiar modo a alto conflicto y probar edicion.
17. Enviar mensaje neutral.
18. Enviar mensaje con insulto y verificar alerta.
19. Probar mensaje largo.
20. Registrar gasto compartido.
21. Registrar gasto pagado por una sola parte.
22. Adjuntar comprobante chico.
23. Intentar comprobante grande.
24. Revisar saldos y reporte mensual.
25. Compartir exportacion HTML y verificar aviso legal/hash.
26. Generar codigo de WhatsApp.
27. Compartir texto o foto hacia Coparent y confirmar manualmente.
28. Cortar internet, enviar mensaje, volver online y verificar sincronizacion.
29. Desactivar notificaciones y confirmar que no molesta.
30. Revisar privacidad, terminos y eliminacion de cuenta.

## 11. Checklist tecnico para desarrollo

Critico:

- Validar Google Sign-In end-to-end desde build 36 instalada por Play.
- Completar Data Safety y App Access con informacion consistente.
- Reemplazar push de calendario/gastos por textos genericos.
- Ampliar `protected-controllers.spec.ts` para nuevos controllers: exports, notifications, subscriptions.
- Saneamiento global de encoding con `rg "Ã|Â"`.

Alta:

- WhatsApp debe crear mensajes via `MessagesService`.
- Agregar permisos por modo para editar datos de hijos/as.
- Mejorar revision de tono con corpus de pruebas.
- Agregar confirmacion fuerte de exportacion.
- Aclarar offline: que funciona y que no.
- Agregar tests de comprobante por usuario no autorizado.

Media:

- Dividir `App.tsx` en pantallas/componentes.
- Mover textos restantes a `i18n.ts`.
- Agregar pruebas E2E con dos usuarios.
- Revisar almacenamiento de comprobantes fuera de DB para produccion.

## 12. Pruebas automatizadas recomendadas

Backend unit/integration:

- `GET /families/:familyId/exports/basic` rechaza usuario ajeno.
- Exportacion no contiene HTML sin escapar.
- Push de calendario/gastos no contiene titulo/descripcion originales.
- WhatsApp confirm note usa revision de tono.
- Usuario secundario no puede editar hijo/a en modo alto conflicto.
- Invitacion con email limitado rechaza email distinto.
- Invitacion expirada/revocada ya aceptada falla.
- Receipt upload rechaza usuario no pagador.
- Account deletion borra push tokens y revoca acceso.

Mobile:

- Login email/password feliz y fallido.
- Google fallback deep link.
- Mensajes: neutral, insulto, largo, vacio.
- Fecha nacimiento: dia/mes/año validos y fecha futura.
- Calendario: fin antes de inicio.
- Gasto: coma decimal, cero, negativo.
- Offline queue: mensaje duplicado no se duplica.
- i18n smoke test: no renderizar claves crudas ni ingles en modo español.

E2E manual/automatizado:

- Dos usuarios reales en misma familia.
- Un usuario crea evento/gasto/mensaje; otro recibe, ve y responde.
- Usuario ajeno intenta acceder a IDs ajenos.
- Build instalada desde Google Play, no local.

## 13. Priorizacion final

Critica antes de produccion:

1. Google Sign-In Play build.
2. Google Play Data Safety, app access y account deletion.
3. Closed testing con 12 testers opt-in por 14 dias.
4. Notificaciones sin datos sensibles.

Alta antes de ampliar testers:

1. WhatsApp confirmacion via `MessagesService`.
2. Saneamiento de textos rotos.
3. Revision de tono con corpus real.
4. Controles de exportacion.
5. Permisos de edicion de hijos/as por modo.

Media:

1. Refactor de `App.tsx`.
2. Storage privado externo para comprobantes.
3. Offline completo para calendario/gastos.
4. E2E automatizado.

## 14. Decision final

Estado QA:

- Prueba cerrada: si, con riesgos conocidos y checklist obligatorio.
- Produccion publica: no todavia.
- Produccion recomendada: despues de 14 dias de closed testing, Data Safety aprobada, Google Sign-In validado en Play, push generico, WhatsApp consistente y textos saneados.

Puntaje QA actual:

- Compilacion: 9/10
- Backend seguridad base: 7/10
- Mobile UX/testing readiness: 6/10
- Privacidad: 6/10
- Google Play readiness: 6/10
- Produccion publica: 5/10

