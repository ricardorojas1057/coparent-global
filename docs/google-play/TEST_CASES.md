# Casos de prueba para Coparent Global

Marcar cada caso como `OK`, `Falla` o `No probado`.

| ID | Flujo | Resultado esperado |
| --- | --- | --- |
| AUTH-01 | Registrar una cuenta con email | La cuenta se crea, recibe un enlace y solo permite ingresar despues de verificarlo |
| AUTH-02 | Ingresar con Google | La sesion se inicia sin pedir contrasena local |
| FAM-01 | Crear o aceptar una familia | La familia aparece en Inicio |
| FAM-02 | Agregar un hijo ficticio | Se selecciona fecha desde el control y se guarda |
| FAM-03 | Responder una invitacion desde la web sin cuenta | Registra interes o rechazo, pero no concede acceso familiar |
| CAL-01 | Crear evento con nombre, tipo y responsable | El evento aparece con fecha y hora correctas |
| CAL-02 | Solicitar un cambio | La otra cuenta puede aceptar o rechazar |
| CAL-03 | Editar y cancelar evento | El historial conserva la operacion |
| MSG-01 | Enviar mensaje | El mensaje aparece y no puede editarse silenciosamente |
| MSG-02 | Solicitar revision de tono | La sugerencia no reemplaza el texto automaticamente |
| EXP-01 | Registrar gasto compartido | Se crean asignaciones y saldo |
| EXP-02 | Registrar gasto pagado por una parte | Se guarda sin reparto incorrecto |
| EXP-03 | Compartir una imagen de gasto y confirmar el borrador | El comprobante privado queda asociado, protegido y con hash |
| EXP-04 | Revisar reporte mensual | Totales y comparaciones son coherentes |
| EXP-05 | Intentar abrir comprobante desde una cuenta ajena | El backend rechaza el acceso |
| EXP-06 | Generar exportacion verificable | Incluye manifiesto, hash SHA-256 y aviso de alcance legal |
| OFF-01 | Enviar mensaje sin conexion y cerrar la app | La cola cifrada persiste, sincroniza al volver y no duplica el mensaje |
| I18N-01 | Cambiar a ingles | Navegacion y opciones principales aparecen en ingles |
| PRIV-01 | Activar diagnosticos y enviar prueba | Solo funciona luego del consentimiento |
| PRIV-02 | Solicitar y cancelar eliminacion | El estado cambia correctamente |
| PRIV-03 | Confirmar eliminacion definitiva | La sesion se cierra, el acceso queda revocado y los datos personales se anonimizan |
| PUSH-01 | Recibir notificacion | La notificacion llega al usuario correspondiente |
| BILL-01 | Comprar con tester de licencia | El backend verifica y activa el plan correcto |
| BILL-02 | Restaurar compra | La familia recupera el plan adquirido |

## Reporte de una falla

- ID del caso:
- Modelo de celular:
- Version de Android:
- Pasos realizados:
- Resultado observado:
- Resultado esperado:
- Captura sin datos privados:
- Frecuencia: siempre / algunas veces / una vez:
