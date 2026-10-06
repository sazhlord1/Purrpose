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

  /** PURR purchases: 'disabled' (default), 'sandbox' (free test credits), 'live' (provider). */
  PAYMENTS_MODE: z.enum(['disabled', 'sandbox', 'live']).default('disabled'),

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

export function allowedOrigins(env: Env): string[] {
  return (env.WEB_ORIGIN ?? '')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}
