# Google Play checklist

## Build tecnico

- Reemplazar `https://api.coparent.example.com` en `apps/mobile/eas.json` por la URL HTTPS real del backend.
- Crear proyecto EAS con `eas init` desde `apps/mobile`.
- Iniciar sesion con `eas login`.
- Generar Android App Bundle con `npm run mobile:build:android`.
- Subir el `.aab` a Play Console en testing interno/cerrado antes de produccion.

## Play Console

- Crear app Android en Play Console.
- Usar package name `ar.coparent.app`.
- Completar ficha: nombre, descripcion corta, descripcion larga, categoria, datos de contacto.
- Subir icono, feature graphic y screenshots de telefono.
- Completar Data Safety.
- Cargar URL publica de politica de privacidad.
- Cargar URL publica de eliminacion de cuenta/datos.
- Configurar Play App Signing.
- Publicar primero en Internal testing.

## Privacidad y cumplimiento

- La app crea cuentas, por lo que debe ofrecer baja de cuenta/datos dentro de la app y via URL externa.
- Declarar datos personales: email, nombre, telefono opcional, informacion familiar, datos de menores.
- Declarar que los datos viajan cifrados en transito cuando el backend use HTTPS.
- Evitar permisos Android innecesarios.
- No publicar apuntando a `localhost` ni a una API sin HTTPS.
