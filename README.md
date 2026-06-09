# Coparent Global

MVP de coparentalidad centrado en reducir fricciones y mantener organizada la informacion familiar.

## Funcionalidades actuales

- Registro, login JWT, recuperacion de contrasena y acceso con Google.
- Familias, invitaciones seguras y perfiles de progenitores.
- Hijos/as y datos familiares basicos.
- Calendario con nombre, tipo, responsable, fechas, horarios y solicitudes de cambio.
- Mensajeria familiar con asistente de comunicacion responsable.
- Gastos compartidos o individuales, saldos y analisis mensual.
- Integracion WhatsApp con confirmacion manual antes de impactar datos.
- Preparacion offline, auditoria encadenada y controles de privacidad.
- Notificaciones push preparadas mediante Expo Push y Firebase Cloud Messaging.
- Aplicacion Expo Android y sitio publico Next.js.

## Arquitectura

- `apps/backend`: NestJS, Prisma y PostgreSQL.
- `apps/mobile`: Expo React Native.
- `apps/frontend`: Next.js para invitaciones, privacidad, soporte y terminos.
- `packages/shared`: contratos compartidos.

## Desarrollo local

Requisitos: Node.js, npm y Docker Desktop.

```bash
npm install
npm run db:up
npm run prisma:deploy
npm run prisma:seed
npm run backend:dev
```

En otra terminal:

```bash
npm run mobile:dev
```

Crear `apps/backend/.env` a partir de `.env.example`. Nunca publicar archivos `.env`, credenciales de
Firebase, claves de firma Android ni datos reales de familias.

## Verificacion

```bash
npm run backend:build
npm run backend:test
npm run frontend:build
npm run mobile:typecheck
```

## Despliegue

- Backend: `https://coparent-argentina-api.vercel.app`
- Sitio publico: `https://coparent-global.vercel.app`
- Firebase/FCM: consultar `docs/FIREBASE_SETUP.md`

## Estado

El proyecto es un MVP en evolucion. No brinda asesoramiento legal y no afirma validez juridica
universal de sus registros. Antes de usarlo con datos reales se requiere revision legal, de
privacidad, seguridad y operacion por jurisdiccion.

Este repositorio se publica para auditoria y colaboracion. No incluye una licencia de reutilizacion.
