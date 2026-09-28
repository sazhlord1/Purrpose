import type { FastifyInstance, FastifyRequest } from 'fastify';
import { credentialsSchema } from '@purrpose/shared';
import { userIdOf } from '../auth.js';
import { getPrisma } from '../db.js';
import { getEnv } from '../env.js';
import { AppError } from '../errors.js';
import { credentialLimiter } from '../ratelimit.js';
import { login, logout, registerAccount } from '../services/accounts.js';
import { parse } from '../validate.js';

function limitCredentials(request: FastifyRequest, email: string): void {
  const msg = 'Too many attempts. Take a short cat nap and try again in a few minutes.';
  credentialLimiter.hit(`ip:${request.ip}`, msg);
  credentialLimiter.hit(`email:${email}`, msg);
}

/** Public: sign in from any device. */
export function registerPublicAuthRoutes(app: FastifyInstance): void {
  app.post('/api/v1/auth/login', async request => {
    const { email, password } = parse(credentialsSchema, request.body);
    limitCredentials(request, email);
    return login(getPrisma(), email, password);
  });

  /** Separate admin entrance: only succeeds for accounts with the ADMIN role. */
  app.post('/api/v1/auth/admin/login', async request => {
    const { email, password } = parse(credentialsSchema, request.body);
    limitCredentials(request, email);
    return login(getPrisma(), email, password, { adminOnly: true });
  });
}

/** Authenticated: upgrade the current guest to an account, or sign out. */
export function registerAccountRoutes(app: FastifyInstance): void {
  app.post('/api/v1/auth/register', async request => {
    const { email, password } = parse(credentialsSchema, request.body);
    limitCredentials(request, email);
    return registerAccount(getPrisma(), getEnv(), userIdOf(request), email, password);
  });

  app.post('/api/v1/auth/logout', async (request, reply) => {
    if (!request.sessionHash) throw new AppError('UNAUTHORIZED');
    await logout(getPrisma(), request.sessionHash);
    return reply.code(204).send();
  });
}
