import type { ConsequenceType } from '@purrpose/shared';
import { clampBalance } from '@purrpose/shared';
import type { PrismaClient, Prisma } from '@prisma/client';

export const STARTER_GRANT: Array<{ creditType: ConsequenceType; amount: number }> = [
  { creditType: 'MEALS', amount: 10 },
  { creditType: 'DRY_FOOD', amount: 2 },
  { creditType: 'VET_CARE', amount: 1 },
];

const ALL_TYPES: ConsequenceType[] = ['MEALS', 'DRY_FOOD', 'VET_CARE'];

type Tx = Prisma.TransactionClient;

export async function bootstrapUserWithStarterGrant(tx: Tx, userId: string): Promise<boolean> {
  const existingTxns = await tx.creditTransaction.count({ where: { userId } });
  if (existingTxns > 0) return false;
  for (const grant of STARTER_GRANT) {
    await tx.creditBalance.upsert({
      where: { userId_creditType: { userId, creditType: grant.creditType } },
      update: { amount: { increment: grant.amount } },
      create: { userId, creditType: grant.creditType, amount: grant.amount },
    });
    await tx.creditTransaction.create({
      data: {
        userId,
        type: 'STARTER_GRANT',
        creditType: grant.creditType,
        amount: grant.amount,
      },
    });
  }
  return true;
}

export async function topUp(
  prisma: PrismaClient,
  userId: string,
  creditType: ConsequenceType,
  amount: number,
): Promise<number> {
  return prisma.$transaction(async tx => {
    const balance = await tx.creditBalance.upsert({
      where: { userId_creditType: { userId, creditType } },
      update: { amount: { increment: amount } },
      create: { userId, creditType, amount },
    });
    await tx.creditTransaction.create({
      data: { userId, type: 'TOPUP', creditType, amount },
    });
    await tx.appEvent.create({
      data: { userId, name: 'topup', payload: { creditType, amount } },
    });
    return balance.amount;
  });
}

export async function walletView(prisma: PrismaClient, userId: string) {
  const [balances, staked, habitStakes] = await Promise.all([
    prisma.creditBalance.findMany({ where: { userId } }),
    prisma.commitment.groupBy({
      by: ['consequenceType'],
      where: { userId, status: 'ACTIVE' },
      _sum: { consequenceAmount: true },
    }),
    prisma.habit.groupBy({
      by: ['consequenceType'],
      where: { userId, status: 'ACTIVE' },
      _sum: { stakeAmount: true },
    }),
  ]);
  const amountByType = new Map(balances.map(b => [b.creditType as ConsequenceType, b.amount]));
  const stakedByType = new Map(
    staked.map(s => [s.consequenceType as ConsequenceType, s._sum.consequenceAmount ?? 0]),
  );
  for (const h of habitStakes) {
    const t = h.consequenceType as ConsequenceType;
    stakedByType.set(t, (stakedByType.get(t) ?? 0) + (h._sum.stakeAmount ?? 0));
  }
  return ALL_TYPES.map(creditType => {
    const amount = amountByType.get(creditType) ?? 0;
    const stakedActive = stakedByType.get(creditType) ?? 0;
    return {
      creditType,
      amount,
      stakedActive,
      available: clampBalance(amount - stakedActive),
    };
  });
}
