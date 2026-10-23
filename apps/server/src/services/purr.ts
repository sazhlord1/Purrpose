import { PURR_WELCOME } from '@purrpose/shared';
import type { Prisma, PrismaClient } from '@prisma/client';

type Db = PrismaClient | Prisma.TransactionClient;

/** PURR locked in the user's open honor pacts (part of purrBalance, not spendable). */
export async function honorStaked(db: Db, userId: string): Promise<number> {
  const agg = await db.commitment.aggregate({
    where: { userId, mode: 'HONOR', status: 'ACTIVE' },
    _sum: { purrStake: true },
  });
  return agg._sum.purrStake ?? 0;
}

/** Row lock on the user, so PURR checks and moves can't interleave. */
export async function lockUser(tx: Prisma.TransactionClient, userId: string): Promise<number> {
  const rows = await tx.$queryRaw<{ purrBalance: number }[]>`
    SELECT "purrBalance" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
  return rows[0]?.purrBalance ?? 0;
}

/**
 * Gives the one-time welcome PURR. Idempotent and race-safe: the ledger row's
 * unique reference is inserted with ON CONFLICT DO NOTHING, and the balance only
 * moves when that insert actually happened.
 */
export async function grantWelcomePurr(tx: Prisma.TransactionClient, userId: string): Promise<boolean> {
  const inserted = await tx.purrTransaction.createMany({
    data: [{ userId, type: 'WELCOME', amount: PURR_WELCOME, reference: `welcome:${userId}` }],
    skipDuplicates: true,
  });
  if (inserted.count !== 1) return false;
  await tx.user.update({ where: { id: userId }, data: { purrBalance: { increment: PURR_WELCOME } } });
  await tx.appEvent.create({ data: { userId, name: 'welcome_purr', payload: { amount: PURR_WELCOME } } });
  return true;
}

/** For users who existed before the welcome gift: give it the first time they show up. */
export async function ensureWelcomePurr(prisma: PrismaClient, userId: string): Promise<void> {
  const has = await prisma.purrTransaction.findFirst({ where: { userId, type: 'WELCOME' }, select: { id: true } });
  if (has) return;
  await prisma.$transaction(tx => grantWelcomePurr(tx, userId));
}
