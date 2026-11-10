import { z } from 'zod';
import { DEFAULT_GOOGLE_CLIENT_ID } from '@purrpose/shared';

const bool = z
  .enum(['true', 'false', '1', '0'])
  .optional()
  .transform(v => (v === undefined ? undefined : v === 'true' || v === '1'));

/** Treat empty strings (e.g. a blank variable on the hosting dashboard) as "not set". */
const opt = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(v => (typeof v === 'string' && v.trim() === '' ? undefined : v), schema.optional());

const envSchema = z.object({
  /** Defaults to production so a missing variable can never expose /dev routes. */
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  PORT: z.coerce.number().int().default(3000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  /** Comma-separated list of allowed browser origins, e.g. https://purrpose.vercel.app */
  WEB_ORIGIN: opt(z.string()),
  /** Trust X-Forwarded-For from the platform proxy (Render, Fly, etc.). */
  TRUST_PROXY: bool,

  /**
   * Folder with the built web app (apps/web/dist). When set, this server also serves the
   * website on the same address (the Iranian edition on Liara: one app, no CORS).
   */
  WEB_DIST: opt(z.string()),
  /** Static landing page (apps/landing-ir) and the addresses that show it instead of the app. */
  LANDING_DIST: opt(z.string()),
  LANDING_HOSTS: z.string().default('purrpose.ir,www.purrpose.ir'),

  /** Admin account bootstrap. The password is hashed on startup, never stored raw. */
  ADMIN_EMAIL: opt(z.string().email()),
  ADMIN_PASSWORD: opt(z.string().min(8)),

  /** OAuth client id for "Sign in with Google" (public; the web app uses the same one). */
  GOOGLE_CLIENT_ID: opt(z.string()).transform(v => v ?? DEFAULT_GOOGLE_CLIENT_ID),

  /**
   * Purchases (PURR packs and pantry food): 'disabled' (default), 'sandbox' (free test
   * credits, never in production) or 'stripe' (Stripe Checkout; 'live' means the same).
   * Whether Stripe charges real money depends only on the key: sk_test_… or sk_live_….
   */
  PAYMENTS_MODE: z.preprocess(
    v => (typeof v === 'string' ? v.trim().toLowerCase() || undefined : v),
    z.enum(['disabled', 'sandbox', 'stripe', 'live']).default('disabled'),
  ),
  /** Stripe secret key (sk_test_… / sk_live_… or a restricted rk_…). Never commit it. */
  STRIPE_SECRET_KEY: opt(z.string().regex(/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/, 'Not a Stripe secret key')),
  /** Signing secret of the Stripe webhook endpoint (whsec_…). Optional: without it,
   * purchases are settled when the buyer returns from Checkout. */
  STRIPE_WEBHOOK_SECRET: opt(z.string().startsWith('whsec_')),
  /**
   * Also give new players the old free starter food (10 meals, 2 dry food, 1 vet care).
   * Off by default: new players get welcome PURR only, and food is bought. Tests turn it on.
   */
  STARTER_FOOD: bool,
  /**
   * Cafe Bazaar (Iranian edition): the panel API token (Bazaar's current method: app page →
   * "API پیشخان بازار" → "دریافت توکن جدید"; sent as the CAFEBAZAAR-PISHKHAN-API-SECRET
   * header). Preferred over the OAuth client below, which is the older method. With it set,
   * the Android app can buy food and PURR through Bazaar. Never commit it.
   */
  BAZAAR_API_SECRET: opt(z.string().min(8)),
  /**
   * Or the developer-API *client* (OAuth): id and secret from the panel, redirect URL
   * https://app.purrpose.ir/api/v1/bazaar/oauth/callback. The admin connects it once from
   * the admin page; the refresh token Bazaar returns is kept in the database.
   */
  BAZAAR_CLIENT_ID: opt(z.string().min(8)),
  BAZAAR_CLIENT_SECRET: opt(z.string().min(8)),
  /** Where Bazaar sends the admin back after connecting the client (must match the panel). */
  BAZAAR_REDIRECT_URI: z.string().url().default('https://app.purrpose.ir/api/v1/bazaar/oauth/callback'),
  /** The Android package the purchases belong to. */
  BAZAAR_PACKAGE_NAME: z.string().default('space.purrpose.app'),

  /**
   * Sign-in with a mobile number + SMS code (Iranian edition). Provider 'kavenegar', 'smsir'
   * or 'ippanel' (with SMS_API_KEY and SMS_TEMPLATE), or 'console' for local development
   * (prints the code; refused in production). Unset = phone sign-in is off.
   */
  SMS_PROVIDER: opt(z.string().transform(v => v.trim().toLowerCase()).pipe(z.enum(['kavenegar', 'smsir', 'ippanel', 'console']))),
  /** The gateway's API key. Only in the hosting dashboard — never commit it. */
  SMS_API_KEY: opt(z.string()),
  /** Kavenegar: the verify template's name. sms.ir: the numeric template id. IPPanel: the pattern code. */
  SMS_TEMPLATE: opt(z.string()),
  /** sms.ir / IPPanel: the template's variable name for the code (e.g. #CODE# → CODE, %code% → code). */
  SMS_CODE_PARAM: z.string().default('CODE'),
  /** IPPanel only: the sender line the pattern is sent from (e.g. 3000505 or +983000505). */
  SMS_FROM: opt(z.string()),

  /** Web push (VAPID). Generate with: pnpm --filter @purrpose/server vapid:generate */
  VAPID_PUBLIC_KEY: opt(z.string()),
  VAPID_PRIVATE_KEY: opt(z.string()),
  VAPID_SUBJECT: z.string().default('mailto:admin@purrpose.app'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (!cached) cached = envSchema.parse(process.env);
  return cached;
}

/** Test helper: forget the cached env so a test can change process.env. */
export function resetEnvCache(): void {
  cached = undefined;
}

/** What the app can actually do: 'stripe' needs a key, otherwise nothing can be bought. */
export function paymentsMode(env: Env): 'disabled' | 'sandbox' | 'stripe' {
  if (env.PAYMENTS_MODE === 'sandbox') return 'sandbox';
  if ((env.PAYMENTS_MODE === 'stripe' || env.PAYMENTS_MODE === 'live') && env.STRIPE_SECRET_KEY) return 'stripe';
  return 'disabled';
}

export function allowedOrigins(env: Env): string[] {
  return (env.WEB_ORIGIN ?? '')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}
