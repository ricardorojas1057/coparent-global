# Endurecimiento de seguridad 0.8.1

Fecha: 12 de junio de 2026

## Cambios implementados

- Configuracion compartida de seguridad para servidor local y Vercel.
- CORS restringido por entorno.
- Headers de seguridad y respuestas sin cache.
- Rechazo de campos DTO desconocidos.
- Limite preventivo de tamano de solicitudes.
- Rate limiting base para autenticacion, invitaciones y webhooks.
- Validacion de variables criticas de produccion.
- Verificacion obligatoria de email para nuevas cuentas locales.
- Cuentas Google marcadas como verificadas por el proveedor.
- Flujo web para confirmar email y opcion movil para reenviar el enlace.
- Eliminacion definitiva con revocacion de sesiones, borrado de tokens e integraciones personales y anonimizacion.
- Promocion del siguiente integrante cuando quien elimina la cuenta era progenitor principal.
- Datos offline sensibles conservados solamente en memoria durante la sesion.
- Identificador idempotente para evitar mensajes duplicados al reintentar sincronizacion.
- Bloqueo transaccional de la cadena de auditoria para evitar bifurcaciones concurrentes.
- Smoke test de produccion ajustado para usar cuentas QA verificadas en lugar de crear cuentas nuevas.

## Migraciones nuevas

- `20260612230000_email_verification_and_account_lifecycle`
- `20260612233000_message_idempotency`

## Requisitos antes de desplegar backend

1. Confirmar `DATABASE_URL`, `JWT_SECRET` de al menos 32 caracteres y `PUBLIC_WEB_URL`.
2. Configurar `RESEND_API_KEY` y `MAIL_FROM` para habilitar registro por email.
3. Agregar `CORS_ALLOWED_ORIGINS` si existen otros frontends web autorizados.
4. Ejecutar las migraciones Prisma.
5. Desplegar backend y luego frontend.
6. Probar registro, verificacion de email, login, eliminacion definitiva y dos cuentas.

Si el correo transaccional no esta configurado, el backend permanece operativo y Google Sign-In funciona, pero el
registro por email responde que esta temporalmente pausado.

## Decisiones de privacidad

El almacenamiento persistente offline en texto plano fue eliminado. La version 0.8.1 conserva cache y cola solamente
durante la sesion activa. Esto reduce funcionalidad offline entre reinicios, pero evita persistir mensajes, datos de
menores y gastos sin cifrado. La persistencia offline completa debe volver solamente con almacenamiento cifrado,
idempotencia y resolucion de conflictos probados.

## Verificacion realizada

- Prisma schema valido.
- Backend TypeScript aprobado.
- Root/API TypeScript aprobado.
- Mobile TypeScript aprobado.
- Frontend TypeScript y build Next.js aprobados.
- 18 suites y 43 pruebas backend aprobadas.

## Pendientes

- Usar un rate limiter compartido o Vercel Firewall para limites globales entre instancias serverless.
- Implementar refresh tokens rotativos y gestion de sesiones/dispositivos.
- Agregar almacenamiento cifrado si se restaura offline persistente.
- Realizar prueba de penetracion y revision legal.
