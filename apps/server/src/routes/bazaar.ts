import type { FastifyInstance } from 'fastify';
import { bazaarVerifySchema } from '@purrpose/shared';
import { userIdOf } from '../auth.js';
import { getPrisma } from '../db.js';
import { getEnv } from '../env.js';
import { AppError } from '../errors.js';
import { isGuestUser } from '../services/accounts.js';
import { bazaarEnabled, verifyBazaarPurchase } from '../services/bazaar.js';
import { parse } from '../validate.js';

/** Cafe Bazaar purchases from the Iranian Android app. */
export function registerBazaarRoutes(app: FastifyInstance): void {
  /** Is buying through Bazaar switched on (the server has the Bazaar API secret)? */
  app.get('/api/v1/bazaar', async () => ({ enabled: bazaarEnabled(getEnv()) }));

  app.post('/api/v1/bazaar/verify', async request => {
    const userId = userIdOf(request);
    const { productId, purchaseToken } = parse(bazaarVerifySchema, request.body);
    const env = getEnv();
    if (!bazaarEnabled(env)) throw new AppError('PAYMENTS_UNAVAILABLE', undefined, 'Purchases are not available yet');
    const prisma = getPrisma();
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
