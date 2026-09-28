import type { FastifyInstance } from 'fastify';
import { adminGrantSchema } from '@purrpose/shared';
import { requireAdmin } from '../auth.js';
import { getPrisma } from '../db.js';
import { AppError } from '../errors.js';
import { creditPurr } from '../services/shop.js';
import { parse } from '../validate.js';

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  await app.register(async function adminScope(scope) {
    scope.addHook('onRequest', requireAdmin);

    scope.get('/api/v1/admin/stats', async () => {
      const prisma = getPrisma();
      const since = new Date(Date.now() - 24 * 3_600_000);
      const [users, accounts, active, completed, failed, newToday, purrSold, unlocks] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { email: { not: null } } }),
        prisma.commitment.count({ where: { status: 'ACTIVE' } }),
        prisma.commitment.count({ where: { status: 'COMPLETED' } }),
        prisma.commitment.count({ where: { status: 'FAILED' } }),
        prisma.user.count({ where: { createdAt: { gte: since } } }),
        prisma.purrTransaction.aggregate({ where: { type: 'PURCHASE' }, _sum: { amount: true } }),
        prisma.catUnlock.groupBy({ by: ['catId'], _count: { catId: true } }),
      ]);
      return {
        users,
        accounts,
        newUsers24h: newToday,
        commitments: { active, completed, failed },
        purrPurchased: purrSold._sum.amount ?? 0,
        unlocksByCat: Object.fromEntries(unlocks.map(u => [u.catId, u._count.catId])),
      };
    });

    scope.post('/api/v1/admin/purr/grant', async request => {
      const { email, amount } = parse(adminGrantSchema, request.body);
      const prisma = getPrisma();
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!user) throw new AppError('NOT_FOUND', { email }, 'No account with that email');
      const purr = await creditPurr(prisma, user.id, amount, 'ADMIN_GRANT', {
        itemId: `grant:by:${request.userId}`,
      });
      return { email, purr };
    });
  });
}
