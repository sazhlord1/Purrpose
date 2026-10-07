import type { ConsequenceType, CreateHabitInput, HabitDto, HabitStatus } from '@purrpose/shared';
import { GRACE_WINDOW_MS, canStake, habitLocked, habitLoss } from '@purrpose/shared';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { Role } from '../auth.js';
import type { ClockApi } from '../clock.js';
import { AppError } from '../errors.js';
import { assertCatUsable } from './shop.js';

type Tx = Prisma.TransactionClient;
type HabitRow = Prisma.HabitGetPayload<{ include: { slips: true } }>;

const DAY_MS = 24 * 3_600_000;

/** Food staked on everything still running (pacts + habits) for one credit type. */
export async function stakedActive(tx: Tx | PrismaClient, userId: string, type: ConsequenceType): Promise<number> {
  const [pacts, habits] = await Promise.all([
    tx.commitment.aggregate({
      where: { userId, status: 'ACTIVE', consequenceType: type },
      _sum: { consequenceAmount: true },
    }),
    tx.habit.aggregate({
      where: { userId, status: 'ACTIVE', consequenceType: type },
      _sum: { stakeAmount: true },
    }),
  ]);
  return (pacts._sum.consequenceAmount ?? 0) + (habits._sum.stakeAmount ?? 0);
}

/** Takes `amount` credits for the cats (clamped at 0, like failed pacts). */
async function feedTheCats(tx: Tx, habit: { id: string; userId: string; consequenceType: ConsequenceType }, amount: number) {
  if (amount <= 0) return;
  await tx.creditTransaction.create({
    data: {
      userId: habit.userId,
      type: 'FAILURE_DEDUCTION',
      creditType: habit.consequenceType,
      amount,
      habitId: habit.id,
    },
  });
  const dec = await tx.creditBalance.updateMany({
    where: { userId: habit.userId, creditType: habit.consequenceType, amount: { gte: amount } },
    data: { amount: { decrement: amount } },
  });
  if (dec.count === 0) {
    await tx.creditBalance.updateMany({
      where: { userId: habit.userId, creditType: habit.consequenceType },
      data: { amount: 0 },
    });
    await tx.appEvent.create({ data: { userId: habit.userId, name: 'SETTLE_CLAMP', payload: { habitId: habit.id } } });
  }
}

export function toHabitDto(h: HabitRow): HabitDto {
  return {
    id: h.id,
    title: h.title,
    catId: h.catId as HabitDto['catId'],
    consequenceType: h.consequenceType as ConsequenceType,
    stakeAmount: h.stakeAmount,
    maxSlips: h.maxSlips,
    slipCount: h.slipCount,
    status: h.status as HabitStatus,
    startedAtISO: h.startedAt.toISOString(),
    endsAtISO: h.endsAt.toISOString(),
    settledAtISO: h.settledAt?.toISOString() ?? null,
    lostAmount: h.lostAmount,
    locked: habitLocked(h.stakeAmount, h.slipCount, h.maxSlips),
    slips: [...h.slips]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(s => ({ id: s.id, atISO: s.createdAt.toISOString() })),
  };
}

export function makeHabitEngine(prisma: PrismaClient, clock: ClockApi) {
  async function createHabit(userId: string, role: Role | undefined, input: CreateHabitInput) {
    return prisma.$transaction(async tx => {
      await assertCatUsable(tx, userId, role, input.catId);
      const rows = await tx.$queryRaw<{ amount: number }[]>`
        SELECT "amount" FROM "CreditBalance"
        WHERE "userId" = ${userId} AND "creditType" = ${input.consequenceType}::"ConsequenceType"
        FOR UPDATE`;
      const check = canStake(rows[0]?.amount ?? 0, await stakedActive(tx, userId, input.consequenceType), input.stakeAmount);
      if (!check.ok) {
        throw new AppError('INSUFFICIENT_AVAILABLE', { available: check.available }, 'Not enough available credits');
      }
      const now = clock.now();
      const habit = await tx.habit.create({
        data: {
          userId,
          title: input.title,
          catId: input.catId,
          consequenceType: input.consequenceType,
          stakeAmount: input.stakeAmount,
          maxSlips: input.maxSlips,
          startedAt: new Date(now),
          endsAt: new Date(now + input.durationDays * DAY_MS),
          createdAt: new Date(now),
        },
        include: { slips: true },
      });
      await tx.appEvent.create({
        data: { userId, name: 'habit_created', payload: { habitId: habit.id, ...input } },
      });
      return habit;
    });
  }

  /** Habits whose period is over: KEPT, and the locked share goes to the cats. */
  async function settleDueHabits(userId?: string): Promise<string[]> {
    const now = new Date(clock.now());
    return prisma.$transaction(async tx => {
      const rows = await tx.$queryRaw<{ id: string }[]>`
        SELECT h."id" FROM "Habit" h
        WHERE h."status" = 'ACTIVE' AND h."endsAt" <= ${now}
        ${userId ? Prisma.sql`AND h."userId" = ${userId}` : Prisma.empty}
        FOR UPDATE SKIP LOCKED`;
      const settled: string[] = [];
      for (const { id } of rows) {
        const h = await tx.habit.findUniqueOrThrow({ where: { id } });
        const loss = habitLoss(h.stakeAmount, h.slipCount, h.maxSlips);
        const done = await tx.habit.updateMany({
          where: { id, status: 'ACTIVE' },
          data: { status: 'KEPT', settledAt: h.endsAt, lostAmount: loss },
        });
        if (done.count === 0) continue;
        await feedTheCats(tx, h, loss);
        await tx.appEvent.create({ data: { userId: h.userId, name: 'habit_kept', payload: { habitId: id, loss } } });
        settled.push(id);
      }
      return settled;
    });
  }

  /** "I cheated." Locks another share; the last allowed slip closes the case. */
  async function confessSlip(userId: string, id: string) {
    await settleDueHabits(userId);
    return prisma.$transaction(async tx => {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "Habit" WHERE "id" = ${id} AND "userId" = ${userId} FOR UPDATE`;
      if (locked.length === 0) throw new AppError('NOT_FOUND', { id }, 'Habit not found');
      const h = await tx.habit.findUniqueOrThrow({ where: { id } });
      if (h.status !== 'ACTIVE') throw new AppError('ALREADY_SETTLED', { finalStatus: h.status }, 'This case is closed');
      if (clock.now() >= h.endsAt.getTime()) {
        throw new AppError('ALREADY_SETTLED', { finalStatus: 'KEPT' }, 'This case already ended');
      }

      const slipCount = h.slipCount + 1;
      const broken = slipCount >= h.maxSlips;
      const now = new Date(clock.now());
      await tx.habitSlip.create({ data: { habitId: id, createdAt: now } });
      await tx.habit.update({
        where: { id },
        data: broken
          ? { slipCount, status: 'BROKEN', settledAt: now, lostAmount: h.stakeAmount }
          : { slipCount },
      });
      if (broken) await feedTheCats(tx, h, h.stakeAmount);
      await tx.appEvent.create({
        data: { userId, name: broken ? 'habit_broken' : 'habit_slip', payload: { habitId: id, slipCount } },
      });
      return tx.habit.findUniqueOrThrow({ where: { id }, include: { slips: true } });
    });
  }

  /** Changed your mind? A fresh habit with no slips can be withdrawn for a few minutes. */
  async function graceDelete(userId: string, id: string): Promise<void> {
    const h = await prisma.habit.findFirst({ where: { id, userId } });
    if (!h) throw new AppError('NOT_FOUND', { id }, 'Habit not found');
    if (h.status !== 'ACTIVE' || h.slipCount > 0 || clock.now() - h.createdAt.getTime() > GRACE_WINDOW_MS) {
      throw new AppError('GRACE_EXPIRED', { id }, 'Too late to withdraw this one');
    }
    const gone = await prisma.habit.deleteMany({ where: { id, userId, status: 'ACTIVE', slipCount: 0 } });
    if (gone.count !== 1) throw new AppError('ALREADY_SETTLED', { finalStatus: 'SETTLED_BY_RACE' });
  }

  async function listHabits(userId: string): Promise<HabitDto[]> {
    await settleDueHabits(userId);
    const rows = await prisma.habit.findMany({
      where: { userId },
      include: { slips: true },
      orderBy: [{ status: 'asc' }, { endsAt: 'asc' }],
      take: 100,
    });
    return rows.map(toHabitDto);
  }

  return { createHabit, settleDueHabits, confessSlip, graceDelete, listHabits };
}

export type HabitEngine = ReturnType<typeof makeHabitEngine>;
