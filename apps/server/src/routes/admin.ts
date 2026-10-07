import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { adminGrantSchema, idParamsSchema } from '@purrpose/shared';
import { requireAdmin } from '../auth.js';
import { getPrisma } from '../db.js';
import { AppError } from '../errors.js';
import { toHabitDto } from '../services/habits.js';
import { creditPurr } from '../services/shop.js';
import { walletView } from '../services/wallet.js';
import { parse } from '../validate.js';

const adminUsersQuery = z.object({
  q: z.string().max(100).optional(),
  guests: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform(v => v === 'true' || v === '1'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  await app.register(async function adminScope(scope) {
    scope.addHook('onRequest', requireAdmin);

    scope.get('/api/v1/admin/stats', async () => {
      const prisma = getPrisma();
      const since = new Date(Date.now() - 24 * 3_600_000);
      const [users, accounts, active, completed, failed, newToday, purrSold, unlocks, habits] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { email: { not: null } } }),
        prisma.commitment.count({ where: { status: 'ACTIVE' } }),
        prisma.commitment.count({ where: { status: 'COMPLETED' } }),
        prisma.commitment.count({ where: { status: 'FAILED' } }),
        prisma.user.count({ where: { createdAt: { gte: since } } }),
        prisma.purrTransaction.aggregate({ where: { type: 'PURCHASE' }, _sum: { amount: true } }),
        prisma.catUnlock.groupBy({ by: ['catId'], _count: { catId: true } }),
        prisma.habit.groupBy({ by: ['status'], _count: { _all: true } }),
      ]);
      return {
        users,
        accounts,
        newUsers24h: newToday,
        commitments: { active, completed, failed },
        habits: Object.fromEntries(habits.map(h => [h.status, h._count._all])),
        purrPurchased: purrSold._sum.amount ?? 0,
        unlocksByCat: Object.fromEntries(unlocks.map(u => [u.catId, u._count.catId])),
      };
    });

    /** Registered users (guests optional), newest first, with a progress summary each. */
    scope.get('/api/v1/admin/users', async request => {
      const q = parse(adminUsersQuery, request.query);
      const prisma = getPrisma();
      const term = q.q?.trim();
      const where = {
        ...(q.guests ? {} : { email: { not: null } }),
        ...(term
          ? {
              OR: [
                { email: { contains: term, mode: 'insensitive' as const } },
                { firstName: { contains: term, mode: 'insensitive' as const } },
                { lastName: { contains: term, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      };
      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: q.offset,
          take: q.limit,
          select: {
            id: true, email: true, firstName: true, lastName: true, role: true, googleId: true,
            createdAt: true, lastLoginAt: true, purrBalance: true,
          },
        }),
      ]);
      const ids = users.map(u => u.id);
      const [pacts, habits, fed] = await Promise.all([
        prisma.commitment.groupBy({ by: ['userId', 'status'], where: { userId: { in: ids } }, _count: { _all: true } }),
        prisma.habit.groupBy({
          by: ['userId', 'status'],
          where: { userId: { in: ids } },
          _count: { _all: true },
          _sum: { slipCount: true },
        }),
        prisma.creditTransaction.groupBy({
          by: ['userId'],
          where: { userId: { in: ids }, type: 'FAILURE_DEDUCTION' },
          _sum: { amount: true },
        }),
      ]);
      const count = (rows: { userId: string; status: string; _count: { _all: number } }[], id: string, status: string) =>
        rows.find(r => r.userId === id && r.status === status)?._count._all ?? 0;
      return {
        total,
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          name: [u.firstName, u.lastName].filter(Boolean).join(' ') || null,
          role: u.role,
          viaGoogle: u.googleId !== null,
          createdAtISO: u.createdAt.toISOString(),
          lastLoginAtISO: u.lastLoginAt?.toISOString() ?? null,
          purr: u.purrBalance,
          pacts: { active: count(pacts, u.id, 'ACTIVE'), kept: count(pacts, u.id, 'COMPLETED'), failed: count(pacts, u.id, 'FAILED') },
          habits: {
            active: count(habits, u.id, 'ACTIVE'),
            kept: count(habits, u.id, 'KEPT'),
            broken: count(habits, u.id, 'BROKEN'),
            slips: habits.filter(h => h.userId === u.id).reduce((n, h) => n + (h._sum.slipCount ?? 0), 0),
          },
          fed: fed.find(f => f.userId === u.id)?._sum.amount ?? 0,
        })),
      };
    });

    /** One user's whole story: wallet, every pact and habit, and what the cats got. */
    scope.get('/api/v1/admin/users/:id', async request => {
      const { id } = parse(idParamsSchema, request.params);
      const prisma = getPrisma();
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true, email: true, firstName: true, lastName: true, role: true, googleId: true,
          createdAt: true, lastLoginAt: true, purrBalance: true,
        },
      });
      if (!user) throw new AppError('NOT_FOUND', { id }, 'User not found');
      const [balances, commitments, habits, losses, focus, cats, items] = await Promise.all([
        walletView(prisma, id),
        prisma.commitment.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 200 }),
        prisma.habit.findMany({ where: { userId: id }, include: { slips: true }, orderBy: { createdAt: 'desc' }, take: 100 }),
        prisma.creditTransaction.findMany({
          where: { userId: id, type: 'FAILURE_DEDUCTION' },
          orderBy: { createdAt: 'desc' },
          take: 200,
          include: { commitment: { select: { title: true } }, habit: { select: { title: true } } },
        }),
        prisma.focusSession.aggregate({ where: { userId: id }, _sum: { durationSec: true }, _count: { _all: true } }),
        prisma.catUnlock.findMany({ where: { userId: id }, select: { catId: true } }),
        prisma.itemUnlock.findMany({ where: { userId: id }, select: { itemId: true } }),
      ]);
      return {
        user: {
          id: user.id,
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
          role: user.role,
          viaGoogle: user.googleId !== null,
          createdAtISO: user.createdAt.toISOString(),
          lastLoginAtISO: user.lastLoginAt?.toISOString() ?? null,
          purr: user.purrBalance,
        },
        balances,
        focus: { sessions: focus._count._all, minutes: Math.round((focus._sum.durationSec ?? 0) / 60) },
        unlockedCats: cats.map(c => c.catId),
        ownedItems: items.map(i => i.itemId),
        commitments: commitments.map(c => ({
          id: c.id,
          title: c.title,
          status: c.status,
          catId: c.catId,
          consequenceType: c.consequenceType,
          consequenceAmount: c.consequenceAmount,
          createdAtISO: c.createdAt.toISOString(),
          deadlineISO: c.deadline.toISOString(),
          settledAtISO: (c.completedAt ?? c.failedAt)?.toISOString() ?? null,
        })),
        habits: habits.map(toHabitDto),
        losses: losses.map(l => ({
          id: l.id,
          creditType: l.creditType,
          amount: l.amount,
          title: l.commitment?.title ?? l.habit?.title ?? null,
          source: l.habitId ? 'habit' : 'pact',
          atISO: l.createdAt.toISOString(),
        })),
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
