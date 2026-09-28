import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { clock } from '../clock.js';
import { getPrisma } from '../db.js';
import { getEnv } from '../env.js';
import { parse } from '../validate.js';
import { ensureAdmin } from '../services/accounts.js';

const travelQuerySchema = z.object({ addMinutes: z.coerce.number().min(-1000000).max(1000000) });

export function registerDevRoutes(app: FastifyInstance): void {
  app.get('/api/v1/dev/time-travel', async request => {
    const { addMinutes } = parse(travelQuerySchema, request.query);
    clock.advance(Math.round(addMinutes * 60_000));
    return { serverTime: clock.now(), offsetMs: clock.offsetMs };
  });

  app.post('/api/v1/dev/reset-demo', async () => {
    const prisma = getPrisma();
    await prisma.$transaction(async tx => {
      await tx.notificationLog.deleteMany({});
      await tx.pushSubscription.deleteMany({});
      await tx.focusSession.deleteMany({});
      await tx.catUnlock.deleteMany({});
      await tx.itemUnlock.deleteMany({});
      await tx.purrTransaction.deleteMany({});
      await tx.creditTransaction.deleteMany({});
      await tx.commitment.deleteMany({});
      await tx.creditBalance.deleteMany({});
      await tx.appEvent.deleteMany({});
      await tx.session.deleteMany({});
      await tx.user.deleteMany({});
    });
    clock.reset();
    await ensureAdmin(prisma, getEnv());
    return { ok: true, serverTime: clock.now() };
  });

  app.get('/api/v1/dev/events', async () => {
    const counts = await getPrisma().appEvent.groupBy({
      by: ['name'],
      _count: { name: true },
    });
    return {
      events: counts.map(c => ({ name: c.name, count: c._count.name })),
    };
  });
}
