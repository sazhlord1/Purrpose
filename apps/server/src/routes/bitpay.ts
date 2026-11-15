import type { FastifyInstance } from 'fastify';
import { bitpayStartSchema } from '@purrpose/shared';
import { userIdOf } from '../auth.js';
import { getPrisma } from '../db.js';
import { getEnv } from '../env.js';
import { AppError } from '../errors.js';
import { isGuestUser } from '../services/accounts.js';
import { bitpayEnabled, finishBitpay, startBitpay } from '../services/bitpay.js';
import { parse } from '../validate.js';

/** Paying on the Iranian website / PWA through Bitpay (signed-in routes). */
export function registerBitpayRoutes(app: FastifyInstance): void {
  app.get('/api/v1/bitpay', async () => ({ enabled: bitpayEnabled(getEnv()) }));

  app.post('/api/v1/bitpay/start', async request => {
    const userId = userIdOf(request);
    const { productId, returnTo } = parse(bitpayStartSchema, request.body);
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, googleId: true, phone: true } });
    // Purchases need an account: a guest's device data can vanish, and the purchase with it.
    if (!user || isGuestUser(user)) {
      throw new AppError('ACCOUNT_REQUIRED', undefined, 'Sign in with your phone number first, so what you buy is safe');
    }
    const { url, paymentId } = await startBitpay(prisma, getEnv(), userId, productId, user.phone);
    // Where to bring the buyer back to (the page they paid from).
    await prisma.appEvent.create({ data: { userId, name: 'bitpay_started', payload: { paymentId, returnTo: returnTo ?? null } } });
    return { url };
  });
}

/**
 * Bitpay sends the buyer's browser back here (public: a redirect carries no bearer token).
 * We check the payment with Bitpay, credit it once, and send the buyer on to the app with
 * the result in the address (?bitpay=ok&kind=…&item=… or ?bitpay=failed).
 */
export function registerBitpayReturn(app: FastifyInstance): void {
  app.get('/api/v1/bitpay/return', async (request, reply) => {
    const q = request.query as { trans_id?: unknown; id_get?: unknown };
    const transId = typeof q.trans_id === 'string' ? q.trans_id : '';
    const idGet = typeof q.id_get === 'string' ? q.id_get : '';
    const app = getEnv().BITPAY_APP_URL.replace(/\/+$/, '');
    // Back to the page they paid from (stored when the payment started), with the result.
    let page = '/pantry';
    if (/^\d{1,18}$/.test(idGet)) {
      const started = await getPrisma().appEvent.findFirst({
        where: { name: 'bitpay_started', payload: { path: ['paymentId'], equals: `bitpay:${idGet}` } },
        select: { payload: true },
      });
      const back = (started?.payload as { returnTo?: unknown } | null)?.returnTo;
      if (typeof back === 'string' && /^\/(?![\/\\])/.test(back)) page = back;
    }
    const target = new URL(page, `${app}/`);
    for (const k of ['bitpay', 'kind', 'item', 'n']) target.searchParams.delete(k);
    try {
      const out = await finishBitpay(getPrisma(), getEnv(), transId, idGet);
      if (out.status === 'paid') {
        target.searchParams.set('bitpay', 'ok');
        target.searchParams.set('kind', out.kind);
        target.searchParams.set('item', out.item);
        target.searchParams.set('n', String(out.quantity));
      } else target.searchParams.set('bitpay', 'failed');
    } catch (err) {
      console.error('[bitpay] return failed', err instanceof Error ? err.message : err);
      target.searchParams.set('bitpay', 'error');
    }
    return reply.redirect(target.toString(), 302);
  });
}
