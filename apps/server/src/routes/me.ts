import type { FastifyInstance } from 'fastify';
import { walletView } from '../services/wallet.js';
import { getPrisma } from '../db.js';
import { clock } from '../clock.js';
import { AppError } from '../errors.js';

export function registerMeRoutes(app: FastifyInstance): void {
  app.get('/api/v1/me', async request => {
    const userId = request.userId;
    if (!userId) throw new AppError('UNAUTHORIZED');
    const prisma = getPrisma();
    const [user, balances] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, createdAt: true } }),
      walletView(prisma, userId),
    ]);
    if (!user) throw new AppError('NOT_FOUND', undefined, 'User not found');
    return {
      user: { id: user.id, createdAtISO: user.createdAt.toISOString() },
      balances,
      serverTime: clock.now(),
    };
  });
}
