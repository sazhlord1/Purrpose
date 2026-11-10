import type { FastifyInstance } from 'fastify';
import { bazaarVerifySchema } from '@purrpose/shared';
import { userIdOf } from '../auth.js';
import { getPrisma } from '../db.js';
import { getEnv } from '../env.js';
import { AppError } from '../errors.js';
import { isGuestUser } from '../services/accounts.js';
import { bazaarEnabled, bazaarPayload, finishBazaarConnect, verifyBazaarPurchase } from '../services/bazaar.js';
import { parse } from '../validate.js';

/** Cafe Bazaar purchases from the Iranian Android app (signed-in routes). */
export function registerBazaarRoutes(app: FastifyInstance): void {
  /** Is buying through Bazaar switched on? And the payload this account sends with its purchases. */
  app.get('/api/v1/bazaar', async request => ({
    enabled: await bazaarEnabled(getPrisma(), getEnv()),
    payload: bazaarPayload(userIdOf(request)),
  }));

  app.post('/api/v1/bazaar/verify', async request => {
    const userId = userIdOf(request);
    const { productId, purchaseToken } = parse(bazaarVerifySchema, request.body);
    const env = getEnv();
    const prisma = getPrisma();
    if (!(await bazaarEnabled(prisma, env))) throw new AppError('PAYMENTS_UNAVAILABLE', undefined, 'Purchases are not available yet');
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, googleId: true, phone: true } });
    // Purchases need an account: a guest's device data can vanish, and the purchase with it.
    if (!user || isGuestUser(user)) {
      throw new AppError('ACCOUNT_REQUIRED', undefined, 'Sign in with your phone number first, so what you buy is safe');
    }
    const result = await verifyBazaarPurchase(prisma, env, userId, productId, purchaseToken);
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { purrBalance: true } });
    return { ...result, purr: me?.purrBalance ?? 0 };
  });
}

/**
 * Bazaar sends the admin's browser back here after they approve our developer-API client
 * (public: no bearer token on a redirect). We swap the code for tokens and send the admin
 * back to the admin page with the result.
 */
export function registerBazaarCallback(app: FastifyInstance): void {
  app.get('/api/v1/bazaar/oauth/callback', async (request, reply) => {
    const q = request.query as { code?: unknown; state?: unknown; error?: unknown };
    const code = typeof q.code === 'string' ? q.code : '';
    const state = typeof q.state === 'string' && q.state ? q.state : undefined;
    let result = 'ok';
    if (!code) result = 'denied';
    else {
      try {
        await finishBazaarConnect(getPrisma(), getEnv(), code, state);
      } catch (err) {
        result = err instanceof AppError && err.code === 'FORBIDDEN' ? 'expired' : 'error';
      }
    }
    return reply.redirect(`/admin?bazaar=${result}`, 302);
  });
}
