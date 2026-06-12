# Auditoria independiente de Coparent Global

Fecha: 12 de junio de 2026
Alcance: producto, estrategia, seguridad, privacidad, experiencia movil, monetizacion, arquitectura y operaciones
Decision recomendada: **publicar solamente en prueba cerrada; posponer el lanzamiento publico**

> Este documento es una evaluacion tecnica y de producto. No reemplaza una revision juridica profesional en cada jurisdiccion.

## Actualizacion de remediacion

Luego de esta auditoria se implemento el primer bloque critico de la version 0.8.1:

- Endurecimiento HTTP, CORS, validacion estricta y rate limiting base.
- Verificacion obligatoria de email para nuevas cuentas locales.
- Eliminacion definitiva con anonimizacion y revocacion de acceso.
- Eliminacion del almacenamiento persistente offline sin cifrar.
- Idempotencia para reintentos de mensajes.
- Bloqueo transaccional para evitar bifurcaciones concurrentes de auditoria.

Estos cambios reducen varios riesgos criticos, pero la recomendacion sigue siendo prueba cerrada hasta desplegar,
probar con dos cuentas reales y completar los pendientes indicados en `docs/SECURITY_HARDENING_2026-06-12.md`.

## 1. Resumen ejecutivo brutalmente honesto

Coparent Global ya no es una demostracion vacia. Tiene una base backend seria para un MVP: autenticacion JWT y Google, aislamiento familiar en los servicios principales, calendario, solicitudes de cambio, mensajes inalterables, gastos, balances, notificaciones, confirmacion manual de acciones recibidas por WhatsApp, auditoria y verificacion de compras de Google Play.

La aplicacion tambien tiene una buena intuicion estrategica: reducir conflictos, mantener el foco en los hijos y evitar que WhatsApp modifique datos sin confirmacion. Esas decisiones son mas valiosas que agregar funciones decorativas.

Sin embargo, **todavia no debe presentarse al publico como una plataforma global, verificable o preparada para relaciones de alto conflicto**. La razon no es que falten pantallas. La razon es que los riesgos mas importantes estan en confianza, seguridad y operaciones:

- Los datos familiares almacenados offline quedan en `AsyncStorage` sin una capa adicional de cifrado.
- No existe limitacion de intentos para login, recuperacion de contrasena, invitaciones o webhooks.
- Las cuentas creadas con email y contrasena no verifican la propiedad del email.
- Solicitar eliminacion de cuenta crea un registro, pero no existe un proceso que ejecute la eliminacion o anonimizacion.
- La cadena de auditoria puede bifurcarse con escrituras concurrentes y todavia no ofrece una verificacion independiente.
- La aplicacion movil concentra aproximadamente 3.300 lineas en un solo archivo y no tiene pruebas automatizadas moviles.
- La internacionalizacion es parcial: hay base ES/EN, pero varias pantallas siguen con texto fijo en espanol y existen errores de codificacion.
- Varias capacidades incluidas en planes pagos, como exportaciones profesionales e historial verificable, todavia no estan implementadas de punta a punta.

La conclusion es positiva, pero exigente: **Coparent Global tiene una base prometedora de beta cerrada, no un producto listo para adopcion publica sin supervision**.

## 2. Nivel de madurez

| Dimension | Nivel | Evaluacion |
|---|---:|---|
| Vision de producto | 3.5/5 | Clara, humana y diferenciable, aunque promete mas de lo implementado |
| Backend y autorizacion | 3/5 | Buena base MVP; faltan controles de seguridad de produccion |
| Aplicacion movil | 2.5/5 | Funcional, pero monolitica, con accesibilidad e i18n incompletas |
| Privacidad y cumplimiento | 2/5 | Hay consentimiento y paginas legales, pero falta ejecucion operacional |
| Operaciones y confiabilidad | 2/5 | CI y Crashlytics ayudan; faltan recuperacion, alertas y runbooks |
| Diferenciacion competitiva | 2.5/5 | WhatsApp con aprobacion manual es interesante; el modo sin segundo usuario aun no existe |
| Preparacion para lanzamiento | 2/5 | Apta para prueba cerrada controlada |

**Madurez general estimada: 2.5/5, beta temprana.**

## 3. Evidencia tecnica y verificaciones

### Verificaciones ejecutadas

- Backend TypeScript: compila correctamente con `tsc --noEmit`.
- Backend Jest: 15 suites aprobadas y 36 pruebas aprobadas.
- Mobile TypeScript: aprobado.
- Frontend Next.js: build de produccion aprobado.
- Smoke test contra produccion: aprobado para registro, invitacion, dos cuentas, autorizacion familiar, hijo, calendario, solicitud de cambio, mensajes, gastos, balance y suscripcion.
- Paginas publicas de privacidad, soporte y eliminacion: publicadas y accesibles.

### Cobertura positiva observada

- Autorizacion familiar aplicada en calendario, mensajes, gastos, hijos, configuracion y suscripciones.
- Tokens de invitacion y recuperacion almacenados como hash.
- Contrasenas protegidas con bcrypt costo 12.
- Recuperacion de contrasena invalida sesiones mediante `authVersion`.
- Google Sign-In valida audiencia y email verificado.
- Webhook de WhatsApp valida firma HMAC en produccion.
- Acciones de WhatsApp requieren confirmacion manual dentro de la app.
- Compras Google Play se verifican en backend y las notificaciones Pub/Sub validan identidad.
- CI ejecuta build backend, tests backend, build frontend y typecheck mobile.

### Limitaciones de la verificacion

- No se realizo una prueba de penetracion.
- No se valido un ciclo completo de compra real en Google Play.
- No se realizo restauracion real desde backup.
- No se probo accesibilidad con TalkBack en dispositivos diversos.
- No se ejecuto una prueba prolongada con familias reales de alto conflicto.
- No se pudo ejecutar `npm audit` desde este entorno por falta del ejecutable npm disponible en la sesion.

## 4. Diez fortalezas principales

1. **Autorizacion familiar consistente en el nucleo.** Los servicios centrales comprueban membresia antes de leer o modificar datos.
2. **Mensajeria inalterable por diseno.** Los mensajes enviados no tienen flujo de edicion o eliminacion.
3. **Asistente responsable con control humano.** Sugiere cambios de tono, pero no reemplaza ni envia automaticamente.
4. **WhatsApp con aprobacion manual.** Es una buena decision de seguridad y evita impactos automaticos.
5. **Recuperacion de contrasena bien encaminada.** Usa tokens aleatorios, hash, vencimiento, respuesta anti-enumeracion e invalidacion de sesiones.
6. **Compras verificadas por backend.** La logica no confia solamente en el dispositivo.
7. **Invitaciones revocables y con vencimiento.** El token aleatorio se guarda como hash.
8. **Base internacional util.** Existen locale, moneda, zona horaria, pais y modos de relacion.
9. **Pruebas automatizadas del backend y CI.** Hay una base para evitar regresiones.
10. **Posicionamiento centrado en bienestar infantil.** La aplicacion intenta organizar y reducir conflicto, no vigilar a los hijos.

## 5. Los 20 problemas mas importantes

### 1. La eliminacion de cuenta no elimina datos

- **Problema:** el endpoint crea o cancela una solicitud, pero no existe trabajador, tarea administrativa ni flujo que complete la eliminacion o anonimizacion.
- **Evidencia:** `apps/backend/src/modules/account/account.service.ts`.
- **Riesgo:** incumplimiento de la promesa publica y rechazo de Google Play; exposicion legal y reputacional.
- **Solucion:** definir politica de retencion, proceso verificable, estados, excepciones de auditoria, notificacion final y prueba automatizada.
- **Complejidad:** alta.
- **Prioridad:** critica.

### 2. Datos familiares sensibles guardados offline sin cifrado adicional

- **Problema:** familias, hijos, mensajes, gastos, privacidad y suscripciones se guardan como JSON en `AsyncStorage`.
- **Evidencia:** `apps/mobile/src/offline.ts` y llamadas `cacheData` en `apps/mobile/App.tsx`.
- **Riesgo:** exposicion de informacion familiar, financiera y de menores ante compromiso, backup o inspeccion del dispositivo.
- **Solucion:** minimizar el cache, excluir campos sensibles, cifrar datos offline con claves protegidas por Keystore/Keychain y borrar cache al cerrar sesion.
- **Complejidad:** alta.
- **Prioridad:** critica.

### 3. No hay rate limiting ni proteccion contra abuso automatizado

- **Problema:** no se encontro limitacion para login, registro, recuperacion, preview de invitaciones o webhooks.
- **Evidencia:** `apps/backend/src/main.ts` y modulos de autenticacion.
- **Riesgo:** fuerza bruta, spam, costos por terceros, denegacion de servicio y abuso de tokens.
- **Solucion:** rate limits por IP, cuenta y endpoint; backoff, alertas y limites especificos para integraciones.
- **Complejidad:** media.
- **Prioridad:** critica.

### 4. Las cuentas locales no verifican el email

- **Problema:** una persona puede registrarse declarando un email que no controla.
- **Evidencia:** `AuthService.register` crea y autentica inmediatamente.
- **Riesgo:** suplantacion, confusion de identidad y debilitamiento de invitaciones restringidas por email.
- **Solucion:** estado `emailVerified`, enlace de verificacion, reenvio controlado y restricciones hasta verificar.
- **Complejidad:** media.
- **Prioridad:** critica.

### 5. El registro verificable todavia no es realmente verificable

- **Problema:** la cadena toma el ultimo hash global y luego inserta; dos escrituras concurrentes pueden usar el mismo hash anterior.
- **Evidencia:** `apps/backend/src/modules/audit/audit.service.ts`.
- **Riesgo:** bifurcacion silenciosa de la cadena y afirmaciones de integridad que no pueden sostenerse.
- **Solucion:** secuencia transaccional por familia, bloqueo o versionado, verificador periodico, exportacion con manifest y lenguaje juridico prudente.
- **Complejidad:** alta.
- **Prioridad:** alta.

### 6. No existe estrategia demostrada de backup, restauracion e incidentes

- **Problema:** no se encontro runbook de backup/restauracion, RPO, RTO, simulacro ni respuesta a incidentes.
- **Riesgo:** perdida de registros importantes, recuperacion improvisada y dano reputacional.
- **Solucion:** documentar backups Neon, restauracion probada, responsables, contactos, RPO/RTO y simulacro trimestral.
- **Complejidad:** media.
- **Prioridad:** alta.

### 7. Los comprobantes son referencias, no archivos gestionados de forma segura

- **Problema:** el backend acepta enlaces o identificadores y metadatos, pero no hay subida autenticada, escaneo, expiracion ni control de descarga.
- **Evidencia:** `apps/backend/src/modules/expenses/expenses.service.ts`.
- **Riesgo:** enlaces publicos, contenido malicioso, comprobantes inaccesibles y privacidad inconsistente.
- **Solucion:** almacenamiento privado, URLs firmadas breves, validacion de tipo/tamano, escaneo y politica de retencion.
- **Complejidad:** alta.
- **Prioridad:** alta.

### 8. La gobernanza familiar es asimetrica

- **Problema:** el progenitor principal controla invitaciones, configuracion, eliminacion de hijos y plan; no se encontro transferencia de rol ni remocion consensuada.
- **Evidencia:** `FamiliesService`, `ChildrenService` y `SubscriptionsService`.
- **Riesgo:** la app puede convertirse en instrumento de control en relaciones de alto conflicto.
- **Solucion:** permisos explicitos, transferencia segura, acciones sensibles con confirmacion bilateral o flujo profesional autorizado y registro claro.
- **Complejidad:** alta.
- **Prioridad:** alta.

### 9. JWT largo sin refresh tokens ni gestion de dispositivos

- **Problema:** el ejemplo usa acceso por 7 dias y no existe lista de sesiones, cierre remoto, refresh rotativo o MFA.
- **Riesgo:** un token robado mantiene acceso prolongado.
- **Solucion:** access token corto, refresh rotativo almacenado como hash, sesiones por dispositivo, cierre remoto y MFA opcional.
- **Complejidad:** alta.
- **Prioridad:** alta.

### 10. Configuracion HTTP demasiado abierta

- **Problema:** CORS esta habilitado sin origen restringido; no se encontraron headers de seguridad, validacion estricta de configuracion ni rechazo de campos extra.
- **Evidencia:** `apps/backend/src/main.ts` y `apps/backend/src/app.module.ts`.
- **Riesgo:** superficie de ataque innecesaria y errores de despliegue silenciosos.
- **Solucion:** origenes permitidos por entorno, Helmet, `forbidNonWhitelisted`, limites de body y esquema de variables obligatorio.
- **Complejidad:** baja.
- **Prioridad:** alta.

### 11. Offline puede duplicar operaciones y no resuelve conflictos

- **Problema:** la cola genera un ID local, pero no lo envia al backend como clave de idempotencia. Tampoco hay versionado para resolver ediciones concurrentes.
- **Evidencia:** `apps/mobile/src/offline.ts` y `executeQueuedMutation`.
- **Riesgo:** mensajes u operaciones duplicadas cuando el servidor confirma pero la respuesta se pierde.
- **Solucion:** claves de idempotencia persistentes, versionado, estados de conflicto y reglas por tipo de operacion.
- **Complejidad:** alta.
- **Prioridad:** alta.

### 12. La promesa de funcionar sin el otro progenitor no esta cumplida

- **Problema:** las invitaciones terminan requiriendo cuenta; no existen respuestas limitadas seguras sin registro para eventos, cambios o gastos.
- **Riesgo:** diferencia entre marketing y producto real; baja adopcion cuando la otra parte se niega.
- **Solucion:** enlaces de invitado con alcance minimo, vencimiento, consentimiento y respuesta limitada.
- **Complejidad:** alta.
- **Prioridad:** alta.

### 13. Internacionalizacion parcial y errores de codificacion

- **Problema:** existe diccionario ES/EN, pero calendario, gastos y otras secciones conservan textos fijos en espanol. Hay textos como `estÃ¡`, `invÃ¡lidas` y `Â·`.
- **Evidencia:** `apps/mobile/App.tsx`, `apps/mobile/src/i18n.ts`, `apps/backend/src/modules/auth/auth.service.ts`.
- **Riesgo:** experiencia poco confiable y bloqueo de la propuesta global.
- **Solucion:** prohibir literales de UI fuera del sistema i18n, corregir UTF-8, agregar pruebas de claves y revisar formatos por locale.
- **Complejidad:** media.
- **Prioridad:** alta.

### 14. Aplicacion movil monolitica y sin pruebas automatizadas

- **Problema:** `apps/mobile/App.tsx` tiene aproximadamente 3.300 lineas y concentra navegacion, estado, formularios y logica.
- **Riesgo:** regresiones frecuentes, cambios lentos y dificultad para probar recorridos.
- **Solucion:** separar por features, hooks y pantallas; agregar pruebas de formularios y recorridos criticos.
- **Complejidad:** alta.
- **Prioridad:** alta.

### 15. Accesibilidad insuficiente para una promesa global

- **Problema:** se encontraron pocos roles y labels de accesibilidad en comparacion con la cantidad de controles.
- **Riesgo:** barreras para lectores de pantalla, controles ambiguos y posible incumplimiento de requisitos de accesibilidad.
- **Solucion:** auditoria TalkBack, labels, roles, estados, orden de foco, contraste, texto escalable y tamanos tactiles.
- **Complejidad:** media.
- **Prioridad:** alta.

### 16. Capacidades comerciales anunciadas pero no implementadas

- **Problema:** los planes incluyen exportaciones profesionales e historial verificable, pero no se encontraron endpoints o flujos completos de exportacion.
- **Riesgo:** cobrar por una promesa incompleta y perder confianza.
- **Solucion:** ocultar beneficios no disponibles o implementarlos y verificarlos antes de activar cobros.
- **Complejidad:** media.
- **Prioridad:** alta.

### 17. Monetizacion potencialmente injusta en funciones sensibles

- **Problema:** el asistente de tono, historial verificable y otras capacidades relevantes para alto conflicto quedan en planes superiores.
- **Riesgo:** monetizar vulnerabilidad o seguridad; abandono de familias que mas necesitan reducir conflicto.
- **Solucion:** mantener seguridad, mensajes inalterables, eliminacion, exportacion basica y asistencia esencial dentro del nivel gratuito o con exenciones.
- **Complejidad:** baja.
- **Prioridad:** alta.

### 18. Smoke tests ensucian produccion

- **Problema:** la prueba de produccion crea cuentas, familias y datos QA reales, sin evidencia de limpieza automatizada.
- **Riesgo:** costos, datos basura, metricas falsas y dificultad de auditoria.
- **Solucion:** entorno staging, etiquetas QA, limpieza controlada y prohibicion de datos de prueba persistentes en produccion.
- **Complejidad:** media.
- **Prioridad:** media.

### 19. Observabilidad backend limitada

- **Problema:** Crashlytics cubre el movil, pero no se encontro trazabilidad estructurada, alertas de API, paneles de errores o redaccion centralizada.
- **Riesgo:** incidentes silenciosos y diagnosticos lentos.
- **Solucion:** logs estructurados sin datos familiares, alertas, metricas de latencia/error, correlation IDs y tablero operativo.
- **Complejidad:** media.
- **Prioridad:** media.

### 20. Entorno local y contenedores incompletos

- **Problema:** Docker Compose solo levanta PostgreSQL, usa credenciales previsibles y no tiene healthcheck; no existe Dockerfile propio del backend.
- **Riesgo:** onboarding inconsistente y diferencias entre desarrollo y produccion.
- **Solucion:** variables locales, healthcheck, perfiles, Dockerfile backend opcional y guia reproducible.
- **Complejidad:** baja.
- **Prioridad:** media.

## 6. Funciones a eliminar, simplificar o posponer

### Posponer

- Espacio profesional multi-familia hasta validar familias reales y permisos.
- Llamadas grabadas o transcripciones: alto costo legal, tecnico y de privacidad.
- Afirmaciones de validez judicial o registros "legalmente validos".
- IA remota avanzada hasta definir consentimiento, proveedor, retencion y evaluacion de sesgo.
- Funciones de ubicacion, check-in o seguimiento: pueden facilitar vigilancia o coercion.
- Nuevas integraciones antes de estabilizar WhatsApp, privacidad y eliminacion.

### Simplificar

- Reducir planes iniciales a Gratis, Familia y Profesional futuro.
- Mantener el modo de coparentalidad, pero explicar cambios concretos de permisos antes de activarlo.
- Evitar mostrar beneficios no disponibles.
- Transformar "registro verificable" en "historial de actividad con controles de integridad" hasta completar la tecnologia.

### No eliminar

- Mensajes inalterables.
- Confirmacion manual de WhatsApp.
- Solicitudes de cambio.
- Balances y comprobantes.
- Consentimiento de analitica.
- Aviso juridico prudente.

## 7. Funciones faltantes con mayor impacto

1. Verificacion de email y gestion de sesiones.
2. Ejecucion completa de eliminacion y exportacion de datos personales.
3. Enlaces seguros de respuesta limitada para personas sin cuenta.
4. Reglas de gobernanza y consentimiento para acciones familiares sensibles.
5. Exportacion basica clara para ambos progenitores.
6. Almacenamiento privado y seguro de comprobantes.
7. Plantillas de calendario de custodia y feriados configurables.
8. Recordatorios y digest configurables para reducir notificaciones estresantes.
9. Idempotencia y resolucion de conflictos offline.
10. Centro de ayuda y seguridad con rutas para abuso, coercion y soporte.

## 8. Benchmarking competitivo actual

Datos consultados el 12 de junio de 2026. Los precios y planes pueden cambiar.

| Producto | Fortalezas actuales | Debilidades u oportunidad para Coparent Global |
|---|---|---|
| OurFamilyWizard | Marca madura, mensajes y registros resistentes a alteracion, calendario, gastos, llamadas, profesionales, ToneMeter y asistente de escritura. Precio publicado desde USD 9,17/mes con facturacion anual. | Muy orientado al ecosistema juridico de EE. UU.; barrera de precio y adopcion bilateral. |
| TalkingParents | Mensajes inalterables, llamadas grabadas/transcritas, calendario, pagos y registros descargables. Planes publicados de USD 7, 16 y 32/mes; ofrece exenciones. | Experiencia centrada en documentacion y accountability; oportunidad para una UX global mas simple y menos judicializada. |
| AppClose | Fuerte conjunto de solicitudes, calendario, mensajes, gastos, llamadas y registros. AppClose Solo permite compartir con personas no conectadas. Precio publicado USD 7,99/mes y exenciones por violencia domestica. | Su enfoque y confianza estan muy ligados a EE. UU.; Coparent Global debe superar, no solo imitar, el modo Solo. |
| 2houses | Buen calendario, finanzas, mensajeria, diario, documentos, acceso de mediador y varios idiomas. Precio familiar publicado USD 14,17/mes facturado anualmente. | Menor diferenciacion visible para alto conflicto y asistencia de tono. |
| BestInterest | Posicionamiento claro para alto conflicto, IA, limites de comunicacion y Solo Mode; promueve una opcion gratuita. | Menos profundidad operativa en calendario, gastos y coordinacion integral. Su lenguaje puede resultar excesivamente confrontativo para algunas familias. |
| Coparent Global hoy | Backend propio, ES/EN inicial, modos de relacion, mensajeria inalterable, tono con control humano, gastos, calendario y WhatsApp con aprobacion manual. | Sin confianza de marca, sin modo no-usuario real, sin exportaciones completas, offline inseguro, i18n parcial y operaciones inmaduras. |

### Oportunidad competitiva real

La oportunidad no es ser "otra app con calendario, mensajes y gastos". Ese mercado ya esta cubierto. La oportunidad defendible es:

**Una plataforma global y accesible que permite coordinar con seguridad incluso cuando la otra persona no instala la app, sin automatizar decisiones, sin vigilar a los hijos y sin obligar a judicializar cada interaccion.**

Para que esa propuesta sea creible, el primer diferenciador a construir debe ser el flujo seguro de invitado limitado, seguido por privacidad operacional y gobernanza equilibrada.

## 9. Propuesta de valor unica mejorada

> Coparent Global ayuda a familias separadas a coordinar calendario, mensajes y gastos con menos conflicto. Funciona con reglas claras, confirmaciones humanas y opciones seguras incluso cuando la otra persona no usa la app.

Principios:

- Ninguna accion externa modifica la familia sin confirmacion.
- Ninguna funcion debe facilitar vigilancia o coercion.
- Las funciones esenciales de seguridad y salida no se bloquean por pago.
- Los registros ayudan a documentar hechos, pero no prometen validez juridica universal.
- Los hijos son sujetos a proteger, no objetos a rastrear.

## 10. Personas y casos de uso globales

### Persona A: relacion cooperativa

Valora calendario, recordatorios y gastos sencillos. Abandonara si la aplicacion parece juridica, pesada o cara. Debe poder comenzar en menos de diez minutos.

### Persona B: relacion de alto conflicto

Valora mensajes inalterables, limites, solicitudes formales y exportacion. Abandonara si un progenitor tiene poder unilateral o si teme que los datos puedan borrarse, alterarse o filtrarse.

### Persona C: familia entre dos paises

Necesita zonas horarias, idiomas, monedas y fechas consistentes. Abandonara si los horarios cambian silenciosamente o si la aplicacion asume una unica jurisdiccion.

### Persona D: baja conectividad y poca experiencia tecnologica

Necesita acciones simples, estados claros y recuperacion ante errores. Abandonara si offline duplica datos, los botones no son claros o la navegacion requiere aprendizaje.

### Simulacion de usuarios criticos

- **Satisfecha:** se queda porque puede confirmar un gasto y ver el proximo evento sin discutir por chat.
- **Confundida:** abandona porque encuentra textos mezclados, demasiadas secciones y conceptos como tenant, plan o auditoria que no comprende.
- **Desconfiada:** no invita a la otra persona hasta entender quien puede ver, borrar y exportar cada dato.
- **Alto conflicto:** puede beneficiarse de solicitudes y mensajes inalterables, pero rechazara la app si el progenitor principal controla unilateralmente la familia.

## 11. Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion principal |
|---|---|---|---|
| Exposicion de datos offline | Media | Critico | Cifrado, minimizacion y borrado de cache |
| Solicitudes de eliminacion no ejecutadas | Alta | Critico | Proceso operacional y tecnico completo |
| Fuerza bruta o abuso de API | Alta | Alto | Rate limiting, alertas y backoff |
| Suplantacion por email no verificado | Media | Alto | Verificacion obligatoria |
| Perdida de datos sin restauracion probada | Media | Critico | Backup, restore drill, RPO/RTO |
| Uso coercitivo de rol principal | Media | Alto | Gobernanza equilibrada y acciones sensibles |
| Duplicacion offline | Media | Alto | Idempotencia y versionado |
| Falsa expectativa de validez legal | Media | Alto | Lenguaje prudente y revision juridica |
| Comprobantes o enlaces inseguros | Media | Alto | Storage privado y URLs firmadas |
| Cobro por capacidades no terminadas | Media | Alto | Ocultar o completar beneficios |
| Falla de terceros: WhatsApp, Firebase, Google | Media | Medio | Degradacion segura, monitoreo y runbooks |
| Rechazo de Google Play | Media | Alto | Checklist de politicas y eliminacion real |

## 12. Arquitectura funcional objetivo

La arquitectura actual puede conservarse, pero debe evolucionar con limites mas claros:

1. **Aplicacion movil por features:** autenticacion, familia, calendario, mensajes, gastos, privacidad y suscripciones como modulos separados.
2. **Capa de sincronizacion segura:** cache minimo cifrado, outbox con idempotencia, versiones y conflictos visibles.
3. **API NestJS protegida:** autenticacion, sesiones, rate limiting, validacion estricta, autorizacion familiar y correlation IDs.
4. **Servicios de dominio:** reglas de calendario, mensajes, gastos, gobernanza y privacidad independientes de controladores e integraciones.
5. **Trabajos asincronos:** eliminacion de cuenta, emails, notificaciones, expiraciones, verificacion de auditoria y limpieza QA.
6. **PostgreSQL como fuente de verdad:** transacciones, indices, restricciones e historial de migraciones.
7. **Almacenamiento privado de archivos:** comprobantes cifrados, URLs firmadas, escaneo y retencion.
8. **Auditoria por familia:** cadena secuencial, verificador, manifest de exportacion y lenguaje legal prudente.
9. **Integraciones desacopladas:** WhatsApp, Firebase y Google Play deben degradar sin bloquear el nucleo.
10. **Observabilidad y recuperacion:** logs sin contenido familiar, metricas, alertas, backup, restauracion y runbooks.

## 13. Roadmap priorizado de 90 dias

### Dias 1 a 14: puerta de seguridad

- Verificar emails de cuentas locales.
- Agregar rate limiting, Helmet, CORS restringido y validacion de entorno.
- Implementar proceso real de eliminacion/anonimizacion.
- Definir y probar backup/restauracion.
- Minimizar y proteger datos offline.
- Corregir textos corruptos y afirmaciones comerciales no implementadas.
- Separar QA de produccion.

**Criterio de salida:** ningun riesgo critico abierto.

### Dias 15 a 30: beta cerrada confiable

- Agregar idempotencia y reglas de sincronizacion offline.
- Dividir `App.tsx` por features.
- Completar ES/EN y formatos regionales.
- Ejecutar auditoria TalkBack y corregir accesibilidad.
- Probar recorridos con dos cuentas en al menos cinco modelos Android.
- Instrumentar API, alertas y tablero operativo.

**Criterio de salida:** 99% de flujos criticos completados sin ayuda y crash-free superior a 99,5%.

### Dias 31 a 60: validar diferenciacion

- Construir prototipo seguro de respuesta limitada sin cuenta.
- Probar gobernanza familiar equilibrada.
- Implementar exportacion basica para ambos progenitores.
- Probar almacenamiento privado de comprobantes.
- Realizar entrevistas con familias, mediadores y organizaciones de apoyo.

**Criterio de salida:** al menos 60% de invitados no usuarios completa una accion limitada sin asistencia.

### Dias 61 a 90: candidato a lanzamiento

- Fortalecer y verificar cadena de auditoria.
- Completar revision juridica y de privacidad.
- Ejecutar simulacro de incidente y restauracion.
- Completar prueba cerrada de Google Play con metricas.
- Validar planes y precio sin bloquear funciones esenciales.
- Preparar release candidate y checklist de rollback.

**Criterio de salida:** cero riesgos criticos, riesgos altos aceptados explicitamente y soporte operativo disponible.

## 14. Modelo gratuito e ingresos eticos

### Gratis permanente

- Una familia y funciones esenciales.
- Calendario compartido.
- Mensajes inalterables.
- Solicitudes de cambio.
- Gastos basicos y balance.
- Eliminacion y exportacion basica.
- Asistencia minima para evitar mensajes agresivos.
- Acceso seguro para situaciones de vulnerabilidad.

### Familia

- Comprobantes gestionados.
- Reportes avanzados.
- Mayor capacidad offline.
- Plantillas de calendario.
- Historial extendido y automatizaciones no sensibles.

### Profesional futuro

- Acceso autorizado de solo lectura.
- Gestion multi-familia.
- Exportaciones y reportes profesionales.
- Controles organizacionales y soporte.

### Reglas eticas

- No cobrar por eliminar una cuenta, protegerla o salir de una situacion insegura.
- No vender datos ni usar publicidad dirigida.
- No monetizar vigilancia, geolocalizacion o miedo.
- Ofrecer exenciones o acceso subsidiado.
- Explicar que una suscripcion familiar no otorga control superior sobre la otra persona.

## 15. Experimentos economicos para validar demanda

1. Acompanamiento manual de diez familias durante cuatro semanas.
2. Prototipo visual de enlaces de invitado y medicion de intencion antes de construirlo completo.
3. Entrevistas de precio con tres opciones, sin cobrar todavia.
4. Dos mensajes de posicionamiento: "menos conflicto" contra "organizacion familiar clara".
5. Prueba con mediadores y organizaciones de apoyo, sin prometer validez judicial.
6. Medir cuantos invitados aceptan realmente y por que rechazan.
7. Prueba de onboarding con personas de baja experiencia tecnologica.

## 16. Metricas recomendadas

### Adopcion

- Porcentaje que crea familia.
- Porcentaje que invita a la otra persona.
- Tasa de aceptacion de invitaciones.
- Tiempo hasta primer evento, mensaje y gasto.
- Familias con dos progenitores activos semanalmente.

### Reduccion de conflicto

- Porcentaje de mensajes revisados antes de enviar.
- Porcentaje que usa una sugerencia neutral.
- Disminucion de mensajes repetidos sobre el mismo asunto.
- Tiempo de resolucion de solicitudes de cambio.
- Porcentaje de gastos observados o rechazados.
- Encuesta breve de estres antes y despues de cuatro semanas.

### Seguridad y privacidad

- Intentos bloqueados por rate limiting.
- Intentos de acceso familiar no autorizado.
- Tiempo de cumplimiento de eliminacion.
- Exito mensual de restauracion.
- Incidentes y tiempo de deteccion/resolucion.
- Porcentaje de usuarios con email verificado.

### Calidad

- Crash-free users.
- Tasa de error por endpoint.
- Latencia p95.
- Duplicaciones offline.
- Flujos criticos completados sin soporte.

### Negocio etico

- Conversion paga sin deterioro de adopcion conjunta.
- Uso del plan gratis despues de 90 dias.
- Exenciones otorgadas.
- Cancelaciones por precio.
- Reclamos relacionados con control, privacidad o seguridad.

## 17. Checklist obligatorio antes de publicar

### Seguridad

- [ ] Email verificado.
- [ ] Rate limiting y proteccion de abuso.
- [ ] CORS y headers de seguridad.
- [ ] Sesiones revocables y tokens de menor duracion.
- [ ] Datos offline minimizados y protegidos.
- [ ] Comprobantes privados.
- [ ] Auditoria verificada bajo concurrencia.

### Privacidad y legal

- [ ] Eliminacion real probada.
- [ ] Exportacion de datos personales.
- [ ] Politica de retencion documentada.
- [ ] Revision legal de menores y transferencias internacionales.
- [ ] Data Safety de Google Play consistente con la implementacion.
- [ ] Lenguaje sin promesas universales de validez juridica.

### Producto y UX

- [ ] Todos los textos traducidos.
- [ ] Cero texto corrupto.
- [ ] TalkBack y texto escalable probados.
- [ ] Gobernanza familiar revisada para alto conflicto.
- [ ] Beneficios pagos realmente disponibles.
- [ ] Prueba con dos cuentas reales y baja conectividad.

### Operaciones

- [ ] Backup y restauracion probados.
- [ ] Runbook de incidentes.
- [ ] Alertas backend.
- [ ] Entorno staging separado.
- [ ] Soporte y SLA inicial definidos.
- [ ] Rollback ensayado.

## 18. Decision final

### Decision: publicar solo para pruebas cerradas

Coparent Global puede entrar en una prueba cerrada con usuarios informados y soporte cercano. No deberia lanzarse todavia a publico general ni activar cobros reales a gran escala.

La prioridad durante los proximos 30 dias no debe ser agregar mas funciones. Debe ser convertir la confianza prometida en controles demostrables: verificacion de identidad basica, proteccion contra abuso, eliminacion real, datos offline protegidos, gobernanza equilibrada y operaciones recuperables.

Cuando esas bases esten resueltas, la mejor apuesta estrategica es construir el flujo seguro para coordinar con una persona que no instala la app. Ese es el diferenciador con mayor potencial internacional.

## 19. Fuentes de benchmarking y criterios

- OurFamilyWizard features: https://www.ourfamilywizard.com/product-features
- OurFamilyWizard pricing: https://www.ourfamilywizard.com/plans-and-pricing
- TalkingParents features: https://talkingparents.com/features
- TalkingParents pricing: https://talkingparents.com/pricing
- AppClose: https://appclose.com/
- AppClose Solo support: https://support.appclose.com/hc/en-us/sections/360002288373-APPCLOSE-SOLO
- AppClose fee waivers: https://support.appclose.com/hc/en-us/articles/45803225192091-AppClose-Subscription-Fee-Waiver-Frequently-Asked-Questions
- 2houses features: https://www.2houses.com/en/features
- 2houses pricing: https://www.2houses.com/en/pricing
- BestInterest: https://bestinterest.app/
- Custody X Change: https://www.custodyxchange.com/
- Google Play account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
- European Commission, children's data: https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/legal-grounds-processing-data/are-there-any-specific-safeguards-data-about-children_en
- FTC COPPA: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
- OWASP MASVS secure storage: https://mas.owasp.org/MASVS/05-MASVS-STORAGE/
- OWASP API resource consumption and rate limiting: https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/
