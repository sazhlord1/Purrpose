import type { FastifyInstance, FastifyRequest } from 'fastify';
import { credentialsSchema, googleSignInSchema, registerSchema } from '@purrpose/shared';
import { bearerToken, userIdOf } from '../auth.js';
import { getPrisma } from '../db.js';
import { getEnv } from '../env.js';
import { AppError } from '../errors.js';
import { credentialLimiter, googleLimiter } from '../ratelimit.js';
import { googleSignIn, login, logout, registerAccount } from '../services/accounts.js';
import { verifyGoogleIdToken } from '../services/google.js';
import { hashToken } from '../security.js';
import { parse } from '../validate.js';

function limitCredentials(request: FastifyRequest, email: string): void {
  const msg = 'Too many attempts. Take a short cat nap and try again in a few minutes.';
  credentialLimiter.hit(`ip:${request.ip}`, msg);
  credentialLimiter.hit(`email:${email}`, msg);
}

/** The session this device already has (usually a guest), so its progress can follow the sign-in. */
function deviceSessionHash(request: FastifyRequest): string | undefined {
  const token = bearerToken(request);
  return token ? hashToken(token) : undefined;
}

/** Public: sign in from any device. */
export function registerPublicAuthRoutes(app: FastifyInstance): void {
  app.post('/api/v1/auth/login', async request => {
    const { email, password } = parse(credentialsSchema, request.body);
    limitCredentials(request, email);
    return login(getPrisma(), email, password, { deviceSessionHash: deviceSessionHash(request) });
  });

  /** "Sign in with Google": the browser sends the ID token Google gave it. */
  app.post('/api/v1/auth/google', async request => {
    const { credential } = parse(googleSignInSchema, request.body);
    googleLimiter.hit(`ip:${request.ip}`, 'Too many attempts. Take a short cat nap and try again in a few minutes.');
    const env = getEnv();
    const profile = await verifyGoogleIdToken(credential, env.GOOGLE_CLIENT_ID);
    return googleSignIn(getPrisma(), env, profile, deviceSessionHash(request));
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
    const { email, password, firstName, lastName } = parse(registerSchema, request.body);
    limitCredentials(request, email);
    return registerAccount(getPrisma(), getEnv(), userIdOf(request), email, password, { firstName, lastName });
  });

  app.post('/api/v1/auth/logout', async (request, reply) => {
    if (!request.sessionHash) throw new AppError('UNAUTHORIZED');
    await logout(getPrisma(), request.sessionHash);
    return reply.code(204).send();
  });
}
