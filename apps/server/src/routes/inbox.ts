import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../db.js';
import { getEnv } from '../env.js';
import { AppError } from '../errors.js';
import { userIdOf } from '../auth.js';
import { isGuestUser } from '../services/accounts.js';
import { ensureWelcomeMessage, listInbox, sendTeamMessage } from '../services/inbox.js';
import { parse } from '../validate.js';

/** Messages: the player's inbox. */
export function registerInboxRoutes(app: FastifyInstance): void {
  app.get('/api/v1/inbox', async request => {
    const userId = userIdOf(request);
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, googleId: true, phone: true, role: true } });
    if (!user) throw new AppError('UNAUTHORIZED');
    if (isGuestUser(user)) return { messages: [], unread: 0, guest: true };
    await ensureWelcomeMessage(prisma, userId);
    return { ...(await listInbox(prisma, userId)), guest: false };
  });

  app.post('/api/v1/inbox/read', async request => {
    const userId = userIdOf(request);
    const { ids } = parse(z.object({ ids: z.array(z.string().min(1).max(40)).max(200).optional() }), request.body ?? {});
    await getPrisma()
      .inboxMessage.updateMany({ where: { userId, readAt: null, ...(ids ? { id: { in: ids } } : {}) }, data: { readAt: new Date() } })
      .catch(() => undefined);
    return { ok: true };
  });
}

/** Admin: send a message to one account or to everyone (inside the admin scope). */
export function registerInboxAdminRoutes(scope: FastifyInstance): void {
  scope.post('/api/v1/admin/messages', async request => {
    const input = parse(
      z.object({
        title: z.string().trim().min(1).max(120),
        body: z.string().trim().min(1).max(4000),
        userId: z.string().trim().min(1).max(64).optional(),
      }),
      request.body,
    );
    const prisma = getPrisma();
    const sent = await sendTeamMessage(prisma, getEnv(), input);
    await prisma.appEvent.create({
      data: { userId: request.userId ?? null, name: 'admin_message', payload: { title: input.title, to: input.userId ?? 'all', sent } },
    });
    return { sent };
  });
  scope.get('/api/v1/admin/messages', async () => {
    const events = await getPrisma().appEvent.findMany({
      where: { name: 'admin_message' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return { sent: events.map(e => ({ atISO: e.createdAt.toISOString(), ...(e.payload as object) })) };
  });
}
