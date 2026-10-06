import type { FastifyRequest } from 'fastify';
import { bearerToken } from './auth.js';
import { AppError } from './errors.js';
import { hashToken } from './security.js';

/**
 * Sliding-window, in-memory rate limiter. Fine for a single server instance
 * (Render web service). If you scale to several instances, move the buckets to
 * Redis/Postgres so the limit is shared.
 */
export function createLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, number[]>();

  function hit(key: string, message: string): void {
    const now = Date.now();
    const recent = (buckets.get(key) ?? []).filter(t => now - t < windowMs);
    if (recent.length >= limit) {
      throw new AppError('RATE_LIMITED', { retryAfterMs: windowMs - (now - recent[0]) }, message);
    }
    recent.push(now);
    buckets.set(key, recent);
    if (buckets.size > 10_000) {
      for (const [k, stamps] of buckets) {
        if (stamps.every(t => now - t >= windowMs)) buckets.delete(k);
      }
    }
  }

  return { hit, reset: () => buckets.clear() };
}

export const RATE_LIMIT = 30;
export const RATE_WINDOW_MS = 60_000;

const mutationLimiter = createLimiter(RATE_LIMIT, RATE_WINDOW_MS);
/** Login / register / admin login: 10 attempts per 15 minutes per IP+email. */
export const credentialLimiter = createLimiter(10, 15 * 60_000);
/**
 * Sign in with Google: needs a token signed by Google, so there's nothing to brute-force.
 * The limit is looser because many phones share one IP (carrier NAT).
 */
export const googleLimiter = createLimiter(30, 15 * 60_000);
/** Anonymous session creation: 30 per hour per IP. */
export const sessionLimiter = createLimiter(30, 60 * 60_000);

export async function rateLimitMutations(request: FastifyRequest): Promise<void> {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return;
  }
  const token = bearerToken(request);
  mutationLimiter.hit(
    token ? `t:${hashToken(token)}` : `ip:${request.ip}`,
    'Too many actions. Even cats need a breather.',
  );
}

export function resetRateLimits(): void {
  mutationLimiter.reset();
  credentialLimiter.reset();
  googleLimiter.reset();
  sessionLimiter.reset();
}
