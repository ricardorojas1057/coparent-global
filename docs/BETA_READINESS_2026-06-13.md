# Preparacion de beta cerrada - 13 de junio de 2026

## Estado tecnico alcanzado

- Invitaciones web permiten registrar interes o rechazo sin crear cuenta.
- El acceso familiar definitivo siempre exige autenticacion.
- Cola de mensajes offline persistente en almacenamiento seguro del dispositivo.
- Comprobantes privados con autorizacion familiar, limite de 2 MB, SHA-256 y auditoria.
- Exportacion familiar verificable con manifiesto SHA-256 y aviso de alcance legal.
- Pantalla de gastos traducida en espanol e ingles.

## Protocolo obligatorio con dos cuentas

Usar exclusivamente datos ficticios y dos cuentas controladas por el equipo.

1. Cuenta A crea familia e invitacion.
2. Navegador sin sesion responde interes y luego rechazo; comprobar que nunca obtiene acceso.
3. Cuenta B acepta la invitacion autenticada.
4. Cuenta A crea evento; cuenta B solicita cambio; cuenta A acepta o rechaza.
5. Ambas cuentas envian mensajes y verifican que no pueden editarse silenciosamente.
6. Cuenta A comparte una imagen de gasto menor a 2 MB, confirma el borrador y verifica el comprobante.
7. Una cuenta ajena intenta acceder al gasto, comprobante y exportacion; todo debe ser rechazado.
8. En modo avion se envia un mensaje, se cierra la app y luego se reconecta; debe sincronizar una sola vez.
9. Se cambia a ingles y se completa calendario, mensajes, gastos, perfil y configuracion.
10. Se solicita, cancela y finalmente confirma la eliminacion de una cuenta de prueba.

## Criterios de bloqueo

No avanzar a produccion publica si ocurre cualquiera de estos puntos:

- Acceso cruzado entre familias.
- Perdida o duplicacion de mensajes offline.
- Comprobante visible para una cuenta ajena.
- Invitacion web que concede membresia sin autenticacion.
- Eliminacion de cuenta que no revoca sesiones.
- Pantalla esencial inutilizable en ingles.

## Validaciones externas pendientes

- Prueba cerrada con al menos 12 testers durante 14 dias segun requisitos de Google Play aplicables a la cuenta.
- Prueba de producto con aproximadamente 20 familias voluntarias y datos ficticios o minimizados.
- Revision profesional de privacidad, terminos, datos de menores y retencion por jurisdiccion.
- Confirmacion de que Data Safety coincide con el AAB publicado.

## Preguntas para la revision legal

- Que datos compartidos deben conservarse cuando una persona elimina su cuenta.
- Como informar el alcance de hashes y exportaciones sin prometer validez judicial universal.
- Que consentimiento se requiere para importar contenido originado en WhatsApp.
- Que edades y roles pueden usar la aplicacion.
- Que plazos de retencion y mecanismos de acceso/correccion corresponden por pais.
