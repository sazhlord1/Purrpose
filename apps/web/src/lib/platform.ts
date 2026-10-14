/**
 * True inside the Purrpose Android app (Capacitor). The app adds "PurrposeApp/<version>"
 * to the WebView's user agent (apps/mobile/capacitor.config.json → appendUserAgent).
 */
export function isNativeApp(): boolean {
  return typeof navigator !== 'undefined' && /\bPurrposeApp\//.test(navigator.userAgent);
}
