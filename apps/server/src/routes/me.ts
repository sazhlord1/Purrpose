import type { FastifyInstance } from 'fastify';
import { userIdOf } from '../auth.js';
import { clock } from '../clock.js';
import { getPrisma } from '../db.js';
import { AppError } from '../errors.js';
import { ensureWelcomePurr, honorStaked } from '../services/purr.js';
import { ownedItemIds, unlockedCatIds, userLoadout } from '../services/shop.js';
import { walletView } from '../services/wallet.js';

export function registerMeRoutes(app: FastifyInstance): void {
  app.get('/api/v1/me', async request => {
    const userId = userIdOf(request);
    const prisma = getPrisma();
    // Everyone gets the welcome PURR once — including people who joined before it existed.
    await ensureWelcomePurr(prisma, userId);
    const [user, balances, cats, items, loadout, purrStaked] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, createdAt: true, email: true, role: true, purrBalance: true, firstName: true, welcomeSeenAt: true },
      }),
      walletView(prisma, userId),
      unlockedCatIds(prisma, userId, request.role),
      ownedItemIds(prisma, userId, request.role),
      userLoadout(prisma, userId, request.role),
      honorStaked(prisma, userId),
    ]);
    if (!user) throw new AppError('NOT_FOUND', undefined, 'User not found');
    const welcome = user.welcomeSeenAt
      ? null
      : await prisma.purrTransaction.findFirst({ where: { userId, type: 'WELCOME' }, select: { amount: true } });
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
      purrStaked,
      welcomePurr: welcome?.amount ?? null,
      unlockedCatIds: cats,
      ownedItemIds: items,
      loadout,
      serverTime: clock.now(),
    };
  });

  /** The welcome-gift message was shown; don't show it again (on any device). */
  app.post('/api/v1/me/welcome-seen', async request => {
    const userId = userIdOf(request);
    await getPrisma().user.updateMany({ where: { id: userId, welcomeSeenAt: null }, data: { welcomeSeenAt: new Date() } });
    return { ok: true };
  });
}
