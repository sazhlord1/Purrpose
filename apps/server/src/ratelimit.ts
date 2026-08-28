import type { FastifyRequest } from 'fastify';
import { AppError } from './errors.js';

const buckets = new Map<string, number[]>();

export const RATE_LIMIT = 30;
export const RATE_WINDOW_MS = 60_000;

function tokenOf(request: FastifyRequest): string {
  const header = request.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7).trim() : 'anon';
}

export async function rateLimitMutations(request: FastifyRequest): Promise<void> {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return;
  }
  const token = tokenOf(request);
  const now = Date.now();
  const window = (buckets.get(token) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (window.length >= RATE_LIMIT) {
    const oldest = window[0];
    throw new AppError(
      'RATE_LIMITED',
      { retryAfterMs: RATE_WINDOW_MS - (now - oldest) },
      'Too many actions. Even cats need a breather.',
    );
  }
  window.push(now);
  buckets.set(token, window);
  if (buckets.size > 5_000) {
    for (const [key, stamps] of buckets) {
      if (stamps.every(t => now - t >= RATE_WINDOW_MS)) buckets.delete(key);
    }
  }
}
