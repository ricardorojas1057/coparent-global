# Google Sign-In browser fallback

Coparent Global keeps the native Google Sign-In button, but Android can return
`DEVELOPER_ERROR` when Play signing, upload signing, Firebase and OAuth clients
are not fully aligned. Version code 28 adds a browser-based fallback:

1. The app opens `GET /auth/google/mobile/start`.
2. The backend redirects to Google OAuth using the Web OAuth client.
3. Google redirects back to `GET /auth/google/mobile/callback`.
4. The backend validates the Google account and redirects to
   `coparentglobal://auth/google?accessToken=...`.
5. The mobile app stores the session and loads the protected family area.

## Required Google Cloud setting

In Google Cloud Console, open the Web OAuth client used by the backend:

- Client name: `Coparent Global Web`
- Client ID: `30610428855-ueh3tipa2h3aj508eufk3i4fphhd2qit.apps.googleusercontent.com`

Add this authorized redirect URI:

```text
https://coparent-argentina-api.vercel.app/auth/google/mobile/callback
```

Then copy the Web OAuth client secret.

## Required Vercel environment variables

In the Vercel project `coparent-argentina-api`, configure production:

```text
GOOGLE_WEB_CLIENT_SECRET=<web OAuth client secret>
GOOGLE_WEB_CLIENT_ID=30610428855-ueh3tipa2h3aj508eufk3i4fphhd2qit.apps.googleusercontent.com
PUBLIC_API_URL=https://coparent-argentina-api.vercel.app
GOOGLE_MOBILE_REDIRECT_URI=https://coparent-argentina-api.vercel.app/auth/google/mobile/callback
GOOGLE_MOBILE_DEEP_LINK=coparentglobal://auth/google
```

`GOOGLE_WEB_CLIENT_SECRET` is sensitive and must not be committed to Git.

## Release order

1. Configure Google Cloud redirect URI.
2. Configure Vercel env vars.
3. Deploy the backend.
4. Upload `Coparent-Global-0.10.0-28.aab` to Google Play internal testing.
5. Install from Google Play and test `Continuar con Google`.
