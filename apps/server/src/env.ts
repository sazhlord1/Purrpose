import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z.string().optional(),
});

let cached: z.infer<typeof envSchema> | undefined;

export function getEnv() {
  if (!cached) cached = envSchema.parse(process.env);
  return cached;
}
