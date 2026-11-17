import type { PrismaClient } from '@prisma/client';
import type { Env } from '../env.js';
import { sendToUser, vapidKeys } from './push.js';

/** Signed-in players (not guests): the inbox is for accounts. */
export const ACCOUNT_WHERE = { OR: [{ email: { not: null } }, { phone: { not: null } }, { googleId: { not: null } }] };

export interface InboxDto {
  id: string;
  kind: string;
  title: string;
  body: string;
  createdAtISO: string;
  read: boolean;
}

/** The welcome note, once per account (written by the app in the player's language). */
export async function ensureWelcomeMessage(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.inboxMessage
    .createMany({ data: [{ userId, kind: 'welcome', key: `welcome:${userId}` }], skipDuplicates: true })
    .catch(() => undefined); // table missing on an old database: no inbox yet
}

export async function unreadCount(prisma: PrismaClient, userId: string): Promise<number> {
  return prisma.inboxMessage.count({ where: { userId, readAt: null } }).catch(() => 0);
}

export async function listInbox(prisma: PrismaClient, userId: string): Promise<{ messages: InboxDto[]; unread: number }> {
  const rows = await prisma.inboxMessage
    .findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 })
    .catch(() => []);
  return {
    messages: rows.map(m => ({
      id: m.id,
      kind: m.kind,
      title: m.title,
      body: m.body,
      createdAtISO: m.createdAt.toISOString(),
      read: m.readAt !== null,
    })),
    unread: rows.filter(m => m.readAt === null).length,
  };
}

/**
 * A message from the team to one account or to every account. Each one also gets a push
 * ("You have a new message") on devices that allowed notifications.
 */
export async function sendTeamMessage(
  prisma: PrismaClient,
  env: Env,
  input: { title: string; body: string; userId?: string },
): Promise<number> {
  const users = input.userId
    ? await prisma.user.findMany({ where: { id: input.userId }, select: { id: true } })
    : await prisma.user.findMany({ where: ACCOUNT_WHERE, select: { id: true } });
  if (users.length === 0) return 0;
  await prisma.inboxMessage.createMany({
    data: users.map(u => ({ userId: u.id, kind: 'team', title: input.title, body: input.body })),
  });
  const keys = vapidKeys(env);
  if (keys) {
    const withSubs = await prisma.pushSubscription.findMany({
      where: { userId: { in: users.map(u => u.id) } },
      select: { userId: true },
      distinct: ['userId'],
    });
    // Not awaited one by one in the request: big sends shouldn't hold the admin's screen.
    void (async () => {
      for (const { userId } of withSubs) {
        await sendToUser(
          prisma,
          keys,
          userId,
          locale => ({
            title: locale === 'fa' ? 'پرپس' : 'Purrpose',
            body: locale === 'fa' ? 'شما یک پیام جدید دارید.' : 'You have a new message.',
            url: '/messages',
            tag: 'inbox',
          }),
          'inbox',
        );
      }
    })().catch(err => console.error('[inbox] push failed', err));
  }
  return users.length;
}
