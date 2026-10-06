import type { FastifyInstance } from 'fastify';
import { userIdOf } from '../auth.js';
import { clock } from '../clock.js';
import { getPrisma } from '../db.js';
import { AppError } from '../errors.js';
import { ownedItemIds, unlockedCatIds, userLoadout } from '../services/shop.js';
import { walletView } from '../services/wallet.js';

export function registerMeRoutes(app: FastifyInstance): void {
  app.get('/api/v1/me', async request => {
    const userId = userIdOf(request);
    const prisma = getPrisma();
    const [user, balances, cats, items, loadout] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, createdAt: true, email: true, role: true, purrBalance: true, firstName: true },
      }),
      walletView(prisma, userId),
      unlockedCatIds(prisma, userId, request.role),
      ownedItemIds(prisma, userId, request.role),
      userLoadout(prisma, userId, request.role),
    ]);
    if (!user) throw new AppError('NOT_FOUND', undefined, 'User not found');
    return {
      user: {
        id: user.id,
        createdAtISO: user.createdAt.toISOString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
      },
      balances,
      purr: user.purrBalance,
      unlockedCatIds: cats,
      ownedItemIds: items,
      loadout,
      serverTime: clock.now(),
    };
  });
}
