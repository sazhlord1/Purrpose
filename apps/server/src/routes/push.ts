import type { FastifyInstance } from 'fastify';
import { pushSubscribeSchema, pushUnsubscribeSchema } from '@purrpose/shared';
import { userIdOf } from '../auth.js';
import { getPrisma } from '../db.js';
import { getEnv } from '../env.js';
import { AppError } from '../errors.js';
import { parse } from '../validate.js';

/** Public: the browser needs the VAPID public key before it can subscribe. */
export function registerPublicPushRoutes(app: FastifyInstance): void {
  app.get('/api/v1/push/public-key', async () => ({ publicKey: getEnv().VAPID_PUBLIC_KEY ?? null }));
}

export function registerPushRoutes(app: FastifyInstance): void {
  app.post('/api/v1/push/subscribe', async (request, reply) => {
    if (!getEnv().VAPID_PUBLIC_KEY) throw new AppError('PUSH_UNAVAILABLE', undefined, 'Push is not configured');
    const userId = userIdOf(request);
    const { endpoint, keys } = parse(pushSubscribeSchema, request.body);
    const prisma = getPrisma();
    // An endpoint belongs to exactly one browser; re-point it if the user changed accounts.
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId, p256dh: keys.p256dh, auth: keys.auth },
      create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });
    // Cap devices per user so one account can't bloat the table.
    const subs = await prisma.pushSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (subs.length > 10) {
      await prisma.pushSubscription.deleteMany({ where: { id: { in: subs.slice(10).map(s => s.id) } } });
    }
    return reply.code(201).send({ ok: true });
  });

  app.post('/api/v1/push/unsubscribe', async (request, reply) => {
    const userId = userIdOf(request);
    const { endpoint } = parse(pushUnsubscribeSchema, request.body);
    await getPrisma().pushSubscription.deleteMany({ where: { endpoint, userId } });
    return reply.code(204).send();
  });
}
