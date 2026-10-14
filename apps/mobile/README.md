# Purrpose Android app

A Capacitor shell around `apps/web`: the web build is packed inside the APK,
so the app opens instantly (even offline) and talks to the API over HTTPS.

- App id: `space.purrpose.app` (permanent — never change it after release).
- The WebView's origin is `https://app.purrpose.space` (`server.hostname`), so the
  API's existing CORS allow-list already covers it.
- The web app knows it runs inside the app from the user agent (`PurrposeApp/…`,
  see `apps/web/src/lib/platform.ts`).
- `assets/` holds the icon and splash sources; `pnpm --filter @purrpose/mobile assets`
  regenerates the Android icons from them.

## Builds (GitHub Actions)

1. **Android bootstrap** (run once): creates this package, adds Capacitor to the
   lockfile, generates the `android/` project and icons, and commits them to `main`.
2. **Android build**: builds the web app, syncs it into `android/`, builds a release
   APK and signs it with the upload key from the repository secrets
   `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`.
   The API address comes from the repository variable `VITE_API_URL`.

The signing key never lives in the repository. Keep the `.jks` file and its
password backed up: without them the app can never be updated.
