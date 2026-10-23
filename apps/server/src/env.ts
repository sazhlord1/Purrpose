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
  PAYMENTS_MODE: z.enum(['disabled', 'sandbox', 'stripe', 'live']).default('disabled'),
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
