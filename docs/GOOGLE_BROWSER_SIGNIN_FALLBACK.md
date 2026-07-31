# Google Sign-In browser fallback

Coparent Global keeps the native Google Sign-In button, but Android can return
`DEVELOPER_ERROR` when Play signing, upload signing, Firebase and OAuth clients
are not fully aligned. The current Play build keeps the native button and also
has a browser-based fallback:

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

## Play build test checklist

Use this checklist only with the app installed from Google Play, not with a
local APK/AAB. The current Android config is `versionName 0.10.0` and
`versionCode 36`.

1. Add the tester Gmail in Play Console.
2. Open the opt-in link with the same Gmail used on the Android phone:
   `https://play.google.com/apps/testing/ar.coparent.app`
3. Install or update Coparent Global from Google Play.
4. Open the app and tap `Continuar con Google`.
5. Expected result: Google opens, the account is accepted, and the app enters
   the protected family area.
6. If `DEVELOPER_ERROR` appears, verify:
   - Android OAuth client uses package `ar.coparent.app`.
   - Android OAuth client includes the Play App Signing SHA-1.
   - Firebase app has the same SHA-1 and the latest `google-services.json`.
   - The Web OAuth client has this redirect URI:
     `https://coparent-argentina-api.vercel.app/auth/google/mobile/callback`
   - Vercel production env vars match the Web OAuth client.
7. Also test the fallback: if native Google Sign-In fails, use the browser flow
   and confirm the deep link returns to the app.
