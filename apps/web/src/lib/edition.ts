/**
 * Which build this is. The global build (English + Persian, Stripe, Google sign-in)
 * runs on Cloudflare + Render; the Iranian build (VITE_EDITION=ir) runs on Liara inside
 * Iran: Persian only, no Stripe, no Google sign-in, and nothing loaded from servers
 * outside Iran, so it keeps working when the international internet is cut.
 */
export const IS_IR_EDITION: boolean =
  typeof import.meta !== 'undefined' && (import.meta.env?.VITE_EDITION as string | undefined)?.trim().toLowerCase() === 'ir';
