import { userIdOf } from '../auth.js';
import type { FastifyInstance } from 'fastify';
import { CONSEQUENCE_TYPES, historyResponseSchema, type ConsequenceType } from '@purrpose/shared';
import { getPrisma } from '../db.js';

export function registerHistoryRoutes(app: FastifyInstance): void {
  app.get('/api/v1/history', async request => {
    const userId = userIdOf(request);
    const prisma = getPrisma();

    const [completed, failed, donated, entries] = await Promise.all([
      prisma.commitment.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.commitment.count({ where: { userId, status: 'FAILED' } }),
      prisma.creditTransaction.groupBy({
        by: ['creditType'],
        where: { userId, type: 'FAILURE_DEDUCTION' },
        _sum: { amount: true },
      }),
      prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { commitment: { select: { title: true } }, habit: { select: { title: true } } },
      }),
    ]);

    const donatedByType: Record<ConsequenceType, number> = Object.fromEntries(
      CONSEQUENCE_TYPES.map(t => [t, 0]),
    ) as Record<ConsequenceType, number>;
    for (const row of donated) {
      donatedByType[row.creditType as ConsequenceType] = row._sum.amount ?? 0;
    }

    return historyResponseSchema.parse({
      totals: { completed, failed, donatedByType },
      entries: entries.map(txn => ({
        id: txn.id,
        type: txn.type,
        creditType: txn.creditType,
        amount: txn.amount,
        commitmentId: txn.commitmentId,
        habitId: txn.habitId,
        title: txn.commitment?.title ?? txn.habit?.title ?? null,
        atISO: txn.createdAt.toISOString(),
      })),
    });
  });
}
