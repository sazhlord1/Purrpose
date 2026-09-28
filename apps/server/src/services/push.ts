import type { PrismaClient } from '@prisma/client';
import { NOTIF_COPY, catById } from '@purrpose/shared';
import type { Env } from '../env.js';
import { sendWebPush, type VapidKeys } from './webpush.js';

type Kind = 'T24H' | 'T1H' | 'FAILED';

const HOUR = 3_600_000;

export function vapidKeys(env: Env): VapidKeys | null {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return null;
  return { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY, subject: env.VAPID_SUBJECT };
}

function messageFor(kind: Kind, c: { id: string; title: string; catId: string }) {
  const cat = catById(c.catId)?.name ?? 'Your cat';
  const body =
    kind === 'T24H' ? NOTIF_COPY.t24h : kind === 'T1H' ? NOTIF_COPY.t1h : NOTIF_COPY.failure;
  return {
    title: kind === 'FAILED' ? `${cat} won.` : `“${c.title}”`,
    body,
    url: `/commitment/${c.id}`,
    tag: `${c.id}:${kind}`,
  };
}

async function sendToUser(prisma: PrismaClient, keys: VapidKeys, userId: string, payload: object, topic: string) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  for (const sub of subs) {
    try {
      const result = await sendWebPush(sub, payload, keys, { ttlSec: 6 * 3600, urgency: 'high', topic });
      if (result === 'gone') await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
    } catch (err) {
      console.error('[push] send failed', err);
    }
  }
}

/**
 * Claims the (commitment, kind) slot first — the NotificationLog primary key
 * means concurrent sweeps can never send the same notification twice.
 */
async function claimAndSend(
  prisma: PrismaClient,
  keys: VapidKeys,
  kind: Kind,
  c: { id: string; userId: string; title: string; catId: string },
) {
  const claimed = await prisma.notificationLog.createMany({
    data: [{ commitmentId: c.id, kind }],
    skipDuplicates: true,
  });
  if (claimed.count === 0) return;
  await sendToUser(prisma, keys, c.userId, messageFor(kind, c), `${c.id.slice(-20)}${kind}`);
}

/** Runs from the 1-minute sweep. `failedIds` = commitments the sweep just settled. */
export async function dispatchPushNotifications(
  prisma: PrismaClient,
  env: Env,
  nowMs: number,
  failedIds: string[],
): Promise<void> {
  const keys = vapidKeys(env);
  if (!keys) return;

  const withSubs = { user: { pushSubs: { some: {} } } };
  const select = { id: true, userId: true, title: true, catId: true } as const;

  // "24h left" — only for commitments that existed before the 24h mark
  // (otherwise it would fire right after creating a short commitment).
  const t24 = await prisma.commitment.findMany({
    where: {
      ...withSubs,
      status: 'ACTIVE',
      deadline: { gt: new Date(nowMs + HOUR), lte: new Date(nowMs + 24 * HOUR) },
      notifications: { none: { kind: 'T24H' } },
    },
    select: { ...select, createdAt: true, deadline: true },
    take: 200,
  });
  for (const c of t24) {
    if (c.deadline.getTime() - c.createdAt.getTime() > 24 * HOUR + 10 * 60_000) {
      await claimAndSend(prisma, keys, 'T24H', c);
    }
  }

  const t1 = await prisma.commitment.findMany({
    where: {
      ...withSubs,
      status: 'ACTIVE',
      deadline: { gt: new Date(nowMs), lte: new Date(nowMs + HOUR) },
      notifications: { none: { kind: 'T1H' } },
    },
    select: { ...select, createdAt: true, deadline: true },
    take: 200,
  });
  for (const c of t1) {
    if (c.deadline.getTime() - c.createdAt.getTime() > HOUR + 5 * 60_000) {
      await claimAndSend(prisma, keys, 'T1H', c);
    }
  }

  if (failedIds.length > 0) {
    const failed = await prisma.commitment.findMany({ where: { id: { in: failedIds }, ...withSubs }, select });
    for (const c of failed) await claimAndSend(prisma, keys, 'FAILED', c);
  }
}
