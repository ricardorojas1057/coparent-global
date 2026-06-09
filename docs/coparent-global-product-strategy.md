# Coparent Global - Product Strategy

Fecha de analisis: 2026-06-06

## Resumen

Coparent Global debe ser una infraestructura familiar simple y confiable, no una herramienta para ganar discusiones. Su posicion diferencial es combinar:

- uso individual o compartido, incluso cuando el otro progenitor no instala la app;
- modos de relacion que reducen superficie de conflicto;
- comunicacion responsable que sugiere, explica y nunca reemplaza automaticamente;
- operacion internacional y de bajo costo;
- registros verificables con afirmaciones legales prudentes;
- experiencia accesible, offline-first y centrada en las necesidades de los hijos.

## Matriz competitiva

| Producto | Fortalezas | Debilidades y oportunidad para Coparent Global |
| --- | --- | --- |
| OurFamilyWizard | Mensajeria con timestamps, ToneMeter/Writing Assistant, calendario y cambios, gastos, PDFs, cuentas gratuitas para terceros y profesionales. Marca reconocida por profesionales. | Precio anual relevante; pagos OFWpay limitados a Estados Unidos; enfoque y lenguaje muy orientados a registro/legal; la experiencia completa requiere que ambos participen. Coparent Global debe ofrecer un nucleo gratuito, internacional y util en modo individual. |
| TalkingParents | Mensajes inalterables, registros, llamadas documentadas, calendario, pagos, Info Library y asistencia de escritura. | Desde el 30 de marzo de 2026 la app requiere suscripcion paga; Writing Assist queda en nivel alto; fuerte enfoque estadounidense y de evidencia. Coparent Global debe hacer gratuita la comunicacion esencial y evitar promesas universales de admisibilidad. |
| AppClose | Mensajes permanentes, calendario y swaps, pagos, circulos profesionales/familiares y comunicacion con no usuarios por SMS/email. | La propuesta se volvio paga en 2026; reportes de usuarios mencionan friccion tecnica; gran amplitud puede elevar complejidad. Coparent Global debe priorizar rendimiento, enlaces seguros y flujos limitados para no usuarios. |
| 2houses | Calendario, diario, finanzas, mensajeria y experiencia familiar mas cooperativa; presencia internacional. | Menor foco visible en alto conflicto, accesibilidad offline y registros verificables; participacion externa limitada. Coparent Global debe adaptarse al nivel de conflicto sin volver hostil la experiencia. |
| coParenter | Mediacion, solicitudes, calendario, mensajes no editables, filtros de conflicto y check-ins. | Servicios profesionales y precios centrados en Estados Unidos; filtros que bloquean pueden quitar agencia al usuario. Coparent Global debe sugerir y explicar, nunca censurar o enviar automaticamente. |
| Alimentor 2 | Funciona solo o sincronizado, compra unica, privacidad local, buen registro y exportacion. | Ecosistema principalmente Apple y colaboracion limitada. Coparent Global debe llevar la utilidad individual a Android/web y permitir transicion gradual a colaboracion. |
| Fayr / amicable | Fayr ofrece registro, gastos y ubicacion; amicable prioriza una experiencia cooperativa y mensajeria app-email. | Cobertura internacional, terceros, alto conflicto y accesibilidad varian. La oportunidad es unir experiencia amable con controles estructurados y operacion global. |

### Fuentes de benchmarking

- OurFamilyWizard: https://www.ourfamilywizard.com/plans-and-pricing
- TalkingParents: https://talkingparents.com/features y https://talkingparents.com/pricing
- AppClose: https://appclose.com/pro/features/
- 2houses: https://www.2houses.com/en/
- coParenter: https://coparenter.com/
- Fayr: https://www.fayr.com/
- Alimentor 2: https://apps.apple.com/us/app/alimentor-2-custody-tracker/id1428802675
- amicable: https://amicable.io/co-parenting-app-faqs/

Los precios y prestaciones cambian. Deben revalidarse antes de decisiones comerciales.

## Problemas reales prioritarios

1. El otro progenitor se niega a instalar, pagar o abrir la app.
2. Mensajes impulsivos elevan el conflicto y desordenan decisiones simples.
3. Las familias duplican informacion entre chat, calendario, email y fotos.
4. Los gastos generan discusiones por falta de comprobantes, reglas y estado claro.
5. Las apps legales suelen sentirse punitivas; las apps familiares suelen ser insuficientes para alto conflicto.
6. Usuarios con conectividad limitada, equipos antiguos o poca experiencia tecnologica quedan excluidos.
7. Fechas, moneda, zona horaria y jurisdiccion se vuelven ambiguas en familias internacionales.
8. Exportar todo produce volumen, no claridad para mediadores o profesionales.
9. El registro de ubicacion y la participacion de hijos pueden transformarse en vigilancia.
10. El costo recurrente fuerza a familias vulnerables a volver a canales desordenados.

## Propuesta de valor unica

> Coparent Global ayuda a coordinar la vida de los hijos con menos conflicto, aun cuando solo una persona use la app.

Principios de producto:

- La coordinacion esencial es gratuita.
- Cada accion importante tiene contexto, responsable, estado e historial.
- La comunicacion conserva la voz del usuario; la app solo ayuda a volverla clara.
- Alto conflicto significa mas estructura y menos ambiguedad, no mas vigilancia.
- Los hijos son sujetos de cuidado, no participantes del conflicto financiero o legal.
- Los registros son verificables, pero su validez depende de cada jurisdiccion.

## Personas y casos de uso

### Sofia - coparentalidad cooperativa entre paises

Vive en Argentina; el otro progenitor vive en Espana. Necesita zona horaria clara, calendario compartido, gastos en distintas monedas y comunicacion bilingue.

### Daniel - comunicacion estructurada

Ambos usan la app, pero las conversaciones se desordenan. Necesita mensajes por tema, solicitudes con aceptar/rechazar y resumen de decisiones.

### Amina - alto conflicto y uso individual

El otro progenitor no instalara la app. Necesita registrar intentos, compartir enlaces de respuesta limitada y conservar un historial privado, sin rastreo permanente.

### Mei - conectividad limitada

Usa Android economico y conexion intermitente. Necesita ver informacion reciente offline y enviar operaciones cuando vuelve internet.

### Laura - mediadora

Necesita acceso acotado, exportaciones por periodo y tema, y trazabilidad sin acceso innecesario a datos personales.

### Abuelo o cuidador autorizado

Solo necesita ver ciertos eventos, contactos y rutinas; no debe acceder a finanzas ni conversaciones privadas.

## Arquitectura funcional objetivo

### Dominios

- Identidad y consentimiento: sesiones, dispositivos, privacidad, eliminacion.
- Familia y permisos: familias, miembros, roles, modos de relacion, terceros.
- Comunicacion: mensajes inmutables, temas, asistencia responsable, recibos de lectura.
- Coordinacion: calendario, recurrencias, cambios, respuestas por enlace.
- Finanzas: gastos, comprobantes, reglas, reembolsos, saldos y monedas.
- Bienestar: salud, escuela, rutinas y contactos importantes.
- Evidencia y exportacion: auditoria encadenada, filtros, exportaciones y avisos juridicos.
- Integraciones: WhatsApp, email, enlaces seguros y calendarios externos.
- Sincronizacion: cola offline, idempotencia, resolucion de conflictos y versiones.

### Principios tecnicos

- NestJS modular; cada dominio valida membresia y rol en servicio.
- PostgreSQL/Prisma como fuente de verdad.
- Operaciones mutables con `updatedAt`, version y auditoria; mensajes enviados son inmutables.
- IDs de idempotencia para operaciones offline.
- Fechas almacenadas en UTC con zona horaria familiar y zona de visualizacion.
- Archivos mediante proveedor de objetos, URL firmada y metadatos; no guardar binarios en PostgreSQL.
- Procesamiento asincrono para notificaciones, exportaciones y analisis de comunicacion.
- Datos sensibles minimizados, cifrados en transito y con politica de retencion explicita.

## Modos de relacion

| Modo | Comportamiento |
| --- | --- |
| Cooperativo | Mensajeria libre, edicion de eventos propios, confirmaciones simples y recordatorios suaves. |
| Estructurado | Mensajes por categoria, solicitudes formales para cambios, confirmacion de gastos y resumen de acuerdos. |
| Alto conflicto | Mensajes inmutables y acotados, asistencia de tono visible, cambios solo por solicitud, confirmaciones explicitas, permisos minimos y exportaciones claras. |

El modo nunca debe ocultar urgencias medicas ni impedir comunicacion necesaria.

## Riesgos

### Legales

- La admisibilidad de registros cambia por jurisdiccion. Nunca afirmar validez universal.
- Grabaciones, ubicacion y datos de menores requieren consentimiento y reglas locales.
- Eliminacion de cuenta puede entrar en tension con obligaciones de conservacion y registros compartidos.
- Pagos y transferencias pueden requerir licencias y cumplimiento financiero.

### Privacidad y seguridad

- Riesgo alto por datos de menores, salud, ubicacion y conflicto familiar.
- Un enlace para no usuarios puede filtrarse; debe expirar, limitar acciones y poder revocarse.
- Profesionales y familiares deben tener permisos por recurso, no acceso total.
- La IA no debe entrenarse con contenido familiar sin consentimiento separado.
- Auditoria encadenada detecta cambios, pero no equivale por si sola a certificacion juridica.

### Tecnicos y de producto

- La sincronizacion offline puede duplicar gastos o mensajes sin idempotencia.
- Las zonas horarias pueden producir intercambios incorrectos.
- Una asistencia de tono con falsos positivos puede aumentar frustracion.
- Demasiadas funciones reducen accesibilidad; cada flujo debe seguir siendo comprensible.

## Roadmap priorizado

### MVP global

- Espanol e ingles; moneda, locale y zona horaria por familia.
- Mensajeria familiar segura e inmutable con sugerencias locales simples.
- Modos cooperativo, estructurado y alto conflicto.
- Calendario CRUD y solicitudes de cambio.
- Gastos, comprobante referenciado, reembolsos y resumen de saldos.
- WhatsApp con confirmacion, enlaces seguros para no usuarios.
- Cache offline de lectura y cola idempotente de acciones esenciales.
- Privacidad, consentimiento, exportacion basica y solicitud de eliminacion.

### Version 1

- Bienestar infantil: salud, escuela, contactos y rutinas.
- Exportaciones filtradas y verificables.
- Reglas recurrentes de custodia y feriados por pais.
- Notificaciones push/email y respuestas limitadas por enlace.
- Monedas multiples con importes originales, sin conversion financiera automatica obligatoria.
- Accesibilidad auditada y telemetria respetuosa de privacidad.

### Version profesional

- Roles granulares para mediadores, abogados y cuidadores.
- Espacios profesionales separados de conversaciones parentales.
- Plantillas y exportaciones por jurisdiccion con descargos claros.
- Gestion institucional, retencion configurable y registro de accesos.
- Mediacion y derivaciones a profesionales humanos.

## Modelo gratuito e ingresos eticos

### Gratis permanente

- Una familia, mensajes esenciales, calendario, gastos, modos de relacion y exportacion basica.
- Participacion mediante enlaces y WhatsApp.
- Acceso sin publicidad dirigida y sin venta de datos.

### Plus familiar

- Mas almacenamiento, automatizaciones, calendarios avanzados, exportaciones ampliadas y soporte prioritario.
- Precio localizado y plan familiar, no cobro obligatorio a cada progenitor.

### Profesional

- Suscripcion de mediadores/organizaciones por herramientas profesionales, no por acceso a datos familiares.
- Becas y exenciones simples para familias vulnerables.

No monetizar conflicto, datos sensibles, urgencia legal ni acceso basico al otro progenitor.

## Metricas

### Reduccion de conflicto

- Porcentaje de sugerencias aceptadas voluntariamente.
- Reduccion de mensajes con lenguaje agresivo antes de envio.
- Solicitudes resueltas sin cadena adicional de mensajes.
- Tiempo medio hasta acuerdo o rechazo claro.
- Encuesta voluntaria de tension antes/despues, sin diagnosticos.

### Adopcion y utilidad

- Familias activas a 4 y 12 semanas.
- Porcentaje de familias con un solo usuario que obtiene valor semanal.
- Activacion de segundo progenitor o respuesta por enlace.
- Operaciones offline sincronizadas sin error.
- Tiempo para completar evento, gasto y solicitud.
- Uso por idioma, pais, conectividad y tecnologias de asistencia.

### Confianza

- Incidentes de privacidad y seguridad.
- Exportaciones generadas con filtros claros.
- Solicitudes de eliminacion completadas dentro del plazo comunicado.
- Tasa de acciones duplicadas o conflictos de sincronizacion.

## Primera etapa de implementacion

La primera etapa debe entregar una vertical completa y comprobable:

1. Fundaciones globales: locale, zona horaria, moneda y modo de relacion.
2. Mensajeria familiar inmutable con asistencia responsable opcional.
3. Calendario editable con solicitudes de cambio.
4. Gastos con comprobante referenciado, reembolsos y saldos.
5. Privacidad y solicitud de eliminacion.
6. Movil bilingue con navegacion profesional y base offline.

No se incluyen aun pagos reales, grabaciones, rastreo continuo, consejo legal ni IA generativa remota.
