import type { FastifyInstance } from 'fastify';
import { getPrisma } from '../db.js';
import { clock } from '../clock.js';
import { getEnv } from '../env.js';
import { sessionLimiter } from '../ratelimit.js';
import { createGuestSession } from '../services/accounts.js';

export function registerSessionRoutes(app: FastifyInstance): void {
  /** Anonymous (guest) bootstrap. Rate-limited per IP to stop account spam. */
  app.post('/api/v1/session', async request => {
    // Production only: local e2e suites legitimately create lots of guests from 127.0.0.1.
    if (getEnv().NODE_ENV === 'production') {
      sessionLimiter.hit(`ip:${request.ip}`, 'Too many new sessions from this network. Try again later.');
    }
    const result = await createGuestSession(getPrisma());
    return { ...result, serverTime: clock.now() };
  });
}
