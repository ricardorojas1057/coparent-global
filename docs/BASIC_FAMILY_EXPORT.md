# Exportacion familiar basica

## Objetivo

La exportacion familiar basica permite compartir desde la app un HTML imprimible con informacion operativa de la familia:

- Integrantes.
- Hijos/as.
- Calendario.
- Gastos.
- Saldos.
- Mensajes familiares.

## Endpoint

```text
GET /families/:familyId/exports/basic?language=es
GET /families/:familyId/exports/basic?language=en
```

Requiere autenticacion JWT y valida que el usuario integre la familia solicitada.

## Seguridad

- El backend genera la exportacion; la app no arma datos sensibles por su cuenta.
- Si el usuario no pertenece a la familia, el backend responde `403`.
- Cada exportacion registra auditoria con accion `EXPORT_BASIC_FAMILY_HTML`.
- El resultado incluye digest SHA-256 del HTML.

## Alcance

Esta exportacion es un resumen operativo. No es una constancia legal universal, no reemplaza una exportacion verificable y no debe interpretarse como asesoramiento legal.

## Formato

El backend devuelve:

- `fileName`
- `mimeType`
- `html`
- `text`
- `manifest`

La app guarda el HTML en cache local y abre el menu nativo de compartir.

