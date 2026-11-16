import type { PrismaClient } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Content for the Iranian website (purrpose.ir) and its blog: the leaderboard,
 * this month's help to shelter cats, food delivery posts and uploaded media.
 */

export const MEDIA_TYPES: Record<string, { ext: string; max: number }> = {
  'image/jpeg': { ext: 'jpg', max: 6 * 1024 * 1024 },
  'image/png': { ext: 'png', max: 6 * 1024 * 1024 },
  'image/webp': { ext: 'webp', max: 6 * 1024 * 1024 },
  'image/gif': { ext: 'gif', max: 6 * 1024 * 1024 },
  'video/mp4': { ext: 'mp4', max: 40 * 1024 * 1024 },
  'video/webm': { ext: 'webm', max: 40 * 1024 * 1024 },
  'video/quicktime': { ext: 'mov', max: 40 * 1024 * 1024 },
};
export const MEDIA_BODY_LIMIT = 41 * 1024 * 1024;

const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000; // Iran has no daylight saving time since 2022.

/** Start of the current Persian (Shamsi) month in Tehran, as a UTC instant, and its name. */
export function persianMonth(now: Date): { start: Date; name: string } {
  const day = Number(new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', { day: 'numeric', timeZone: 'Asia/Tehran' }).format(now));
  const name = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long', year: 'numeric', timeZone: 'Asia/Tehran' }).format(now);
  const tehran = new Date(now.getTime() + TEHRAN_OFFSET_MS);
  const midnight = Date.UTC(tehran.getUTCFullYear(), tehran.getUTCMonth(), tehran.getUTCDate()) - TEHRAN_OFFSET_MS;
  return { start: new Date(midnight - (Math.max(1, day) - 1) * 86_400_000), name };
}

/** "Sara K." — first name and the first letter of the last name; nothing else about the user. */
export function publicName(u: { firstName: string | null; lastName: string | null; name: string | null }): string | null {
  const first = (u.firstName ?? u.name ?? '').trim().split(/\s+/)[0] ?? '';
  if (!first) return null;
  const last = (u.lastName ?? (u.firstName ? '' : (u.name ?? '').trim().split(/\s+/)[1] ?? '')).trim();
  return last ? `${first} ${[...last][0]}.` : first;
}

export interface SiteStats {
  leaders: { name: string; wins: number }[];
  month: { name: string; meals: number; dryFood: number; vetCare: number };
  total: { meals: number; dryFood: number; vetCare: number; pactsKept: number };
}

let cached: { at: number; value: SiteStats } | null = null;
export function clearSiteStatsCache(): void {
  cached = null;
}

/** Cached for a few minutes: the home page asks on every visit. */
export async function siteStats(prisma: PrismaClient, now = new Date()): Promise<SiteStats> {
  if (cached && now.getTime() - cached.at < 5 * 60_000) return cached.value;

  const top = await prisma.commitment.groupBy({
    by: ['userId'],
    where: { status: 'COMPLETED', user: { role: 'USER' } },
    _count: { _all: true },
    orderBy: { _count: { userId: 'desc' } },
    take: 30,
  });
  const users = await prisma.user.findMany({
    where: { id: { in: top.map(t => t.userId) } },
    select: { id: true, firstName: true, lastName: true, name: true },
  });
  const byId = new Map(users.map(u => [u.id, u]));
  const leaders: SiteStats['leaders'] = [];
  for (const t of top) {
    const u = byId.get(t.userId);
    const name = u ? publicName(u) : null;
    if (name) leaders.push({ name, wins: t._count._all });
    if (leaders.length === 10) break;
  }

  const month = persianMonth(now);
  const sum = async (since?: Date) => {
    const rows = await prisma.creditTransaction.groupBy({
      by: ['creditType'],
      where: { type: 'FAILURE_DEDUCTION', ...(since ? { createdAt: { gte: since } } : {}) },
      _sum: { amount: true },
    });
    const of = (t: string) => Math.abs(rows.find(r => r.creditType === t)?._sum.amount ?? 0);
    return { meals: of('MEALS'), dryFood: of('DRY_FOOD'), vetCare: of('VET_CARE') };
  };
  const [thisMonth, allTime, pactsKept] = await Promise.all([
    sum(month.start),
    sum(),
    prisma.commitment.count({ where: { status: 'COMPLETED' } }),
  ]);

  const value: SiteStats = { leaders, month: { name: month.name, ...thisMonth }, total: { ...allTime, pactsKept } };
  cached = { at: now.getTime(), value };
  return value;
}

/** Sends a stored picture or video, with byte ranges (phones won't play a video without them). */
export async function sendMedia(
  prisma: PrismaClient,
  id: string,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<boolean> {
  if (!/^[a-z0-9]{5,40}$/.test(id)) return false;
  const media = await prisma.storedMedia.findUnique({ where: { id } }).catch(() => null);
  if (!media || !MEDIA_TYPES[media.type]) return false;
  const data = Buffer.from(media.data);
  reply.header('Content-Type', media.type);
  reply.header('Accept-Ranges', 'bytes');
  reply.header('Cache-Control', 'public, max-age=31536000, immutable');
  reply.header('Cross-Origin-Resource-Policy', 'cross-origin');
  const range = /^bytes=(\d*)-(\d*)$/.exec(String(request.headers.range ?? ''));
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : data.length - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : data.length - 1;
    start = Math.max(0, start);
    end = Math.min(end, data.length - 1);
    if (start > end) {
      reply.header('Content-Range', `bytes */${data.length}`);
      await reply.code(416).send();
      return true;
    }
    reply.header('Content-Range', `bytes ${start}-${end}/${data.length}`);
    await reply.code(206).send(data.subarray(start, end + 1));
    return true;
  }
  await reply.code(200).send(request.method === 'HEAD' ? undefined : data);
  return true;
}
