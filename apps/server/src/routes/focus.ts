import type { FastifyInstance } from 'fastify';
import { focusSessionSchema } from '@purrpose/shared';
import { userIdOf } from '../auth.js';
import { clock } from '../clock.js';
import { getPrisma } from '../db.js';
import { AppError } from '../errors.js';
import { assertCatUsable } from '../services/shop.js';
import { parse } from '../validate.js';

export function registerFocusRoutes(app: FastifyInstance): void {
  app.post('/api/v1/focus/sessions', async (request, reply) => {
    const userId = userIdOf(request);
    const input = parse(focusSessionSchema, request.body);
    const prisma = getPrisma();
    await assertCatUsable(prisma, userId, request.role, input.catId);

    if (input.commitmentId) {
      const owned = await prisma.commitment.findFirst({
        where: { id: input.commitmentId, userId },
        select: { id: true },
      });
      if (!owned) throw new AppError('NOT_FOUND', { commitmentId: input.commitmentId }, 'Commitment not found');
    }

    // Don't trust client time blindly: a session can't claim more focus than has elapsed
    // since it started (with 10 minutes of slack for clock skew). The schema caps it at 12h.
    const endedAt = new Date(clock.now());
    const startedAt = new Date(Date.parse(input.startedAtISO));
    const elapsedSec = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
    const durationSec = elapsedSec > 0 ? Math.max(1, Math.min(input.durationSec, elapsedSec + 600)) : input.durationSec;

    const session = await prisma.focusSession.create({
      data: {
        userId,
        commitmentId: input.commitmentId ?? null,
        catId: input.catId,
        durationSec,
        startedAt,
        endedAt,
      },
    });
    return reply.code(201).send({ id: session.id, durationSec });
  });

  app.get('/api/v1/focus/summary', async request => {
    const userId = userIdOf(request);
    const prisma = getPrisma();
    const dayAgo = new Date(clock.now() - 24 * 3_600_000);
    const [total, today, byCommitment] = await Promise.all([
      prisma.focusSession.aggregate({ where: { userId }, _sum: { durationSec: true } }),
      prisma.focusSession.aggregate({ where: { userId, endedAt: { gte: dayAgo } }, _sum: { durationSec: true } }),
      prisma.focusSession.groupBy({
        by: ['commitmentId'],
        where: { userId, commitmentId: { not: null } },
        _sum: { durationSec: true },
      }),
    ]);
    return {
      totalSec: total._sum.durationSec ?? 0,
      todaySec: today._sum.durationSec ?? 0,
      byCommitment: Object.fromEntries(
        byCommitment.map(r => [r.commitmentId as string, r._sum.durationSec ?? 0]),
      ),
    };
  });
}
