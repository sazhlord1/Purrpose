import type { CatId, ConsequenceType } from '@purrpose/shared';
import {
  GRACE_WINDOW_MS,
  buildTimeView,
  canStake,
  type CommitmentDto,
  type CreateCommitmentInput,
} from '@purrpose/shared';
import { Prisma, type PrismaClient, type Commitment } from '@prisma/client';
import { AppError } from '../errors.js';
import type { ClockApi } from '../clock.js';
import type { Role } from '../auth.js';
import { stakedActive } from './habits.js';
import { assertCatUsable } from './shop.js';

type Tx = Prisma.TransactionClient;

async function deductForFailure(tx: Tx, commitment: Commitment): Promise<void> {
  await tx.creditTransaction.create({
    data: {
      userId: commitment.userId,
      type: 'FAILURE_DEDUCTION',
      creditType: commitment.consequenceType,
      amount: commitment.consequenceAmount,
      commitmentId: commitment.id,
    },
  });
  await tx.appEvent.create({
    data: {
      userId: commitment.userId,
      name: 'commitment_failed',
      payload: { commitmentId: commitment.id },
    },
  });
  const dec = await tx.creditBalance.updateMany({
    where: {
      userId: commitment.userId,
      creditType: commitment.consequenceType,
      amount: { gte: commitment.consequenceAmount },
    },
    data: { amount: { decrement: commitment.consequenceAmount } },
  });
  if (dec.count === 0) {
    await tx.creditBalance.updateMany({
      where: { userId: commitment.userId, creditType: commitment.consequenceType },
      data: { amount: 0 },
    });
    await tx.appEvent.create({
      data: {
        userId: commitment.userId,
        name: 'SETTLE_CLAMP',
        payload: { commitmentId: commitment.id },
      },
    });
  }
}

export function makeCommitmentEngine(prisma: PrismaClient, clock: ClockApi) {
  async function createCommitment(
    userId: string,
    role: Role | undefined,
    input: CreateCommitmentInput,
  ): Promise<Commitment> {
    return prisma.$transaction(async tx => {
      await assertCatUsable(tx, userId, role, input.catId);
      const rows = await tx.$queryRaw<{ amount: number }[]>`
        SELECT "amount" FROM "CreditBalance"
        WHERE "userId" = ${userId} AND "creditType" = ${input.consequenceType}::"ConsequenceType"
        FOR UPDATE`;
      const balanceAmount = rows[0]?.amount ?? 0;
      const staked = await stakedActive(tx, userId, input.consequenceType);
      const check = canStake(balanceAmount, staked, input.consequenceAmount);
      if (!check.ok) {
        throw new AppError(
          'INSUFFICIENT_AVAILABLE',
          { available: check.available },
          'Not enough available credits',
        );
      }
      return tx.commitment.create({
        data: {
          userId,
          title: input.title,
          description: input.description ?? null,
          deadline: new Date(input.deadlineISO),
          status: 'ACTIVE',
          catId: input.catId,
          consequenceType: input.consequenceType,
          consequenceAmount: input.consequenceAmount,
          createdAt: new Date(clock.now()),
        },
      }).then(async commitment => {
        await tx.appEvent.create({
          data: {
            userId,
            name: 'commitment_created',
            payload: {
              commitmentId: commitment.id,
              catId: input.catId,
              consequenceType: input.consequenceType,
              consequenceAmount: input.consequenceAmount,
            },
          },
        });
        return commitment;
      });
    });
  }

  async function settleDue(userId?: string): Promise<string[]> {
    const now = new Date(clock.now());
    return prisma.$transaction(async tx => {
      const rows = await tx.$queryRaw<{
        id: string;
        userId: string;
        title: string;
        consequenceType: ConsequenceType;
        consequenceAmount: number;
        deadline: Date;
      }[]>`
        SELECT c."id", c."userId", c."title", c."consequenceType", c."consequenceAmount", c."deadline"
        FROM "Commitment" c
        WHERE c."status" = 'ACTIVE' AND c."deadline" < ${now}
        ${userId ? Prisma.sql`AND c."userId" = ${userId}` : Prisma.empty}
        FOR UPDATE SKIP LOCKED`;

      const settledIds: string[] = [];
      for (const row of rows) {
        const updated = await tx.commitment.updateMany({
          where: { id: row.id, status: 'ACTIVE' },
          data: { status: 'FAILED', failedAt: row.deadline },
        });
        if (updated.count === 0) continue;
        const commitment = await tx.commitment.findUniqueOrThrow({ where: { id: row.id } });
        await deductForFailure(tx, commitment);
        settledIds.push(row.id);
      }
      return settledIds;
    });
  }

  async function completeCommitment(userId: string, id: string): Promise<Commitment> {
    return prisma.$transaction(async tx => {
      const commitment = await tx.commitment.findFirst({ where: { id, userId } });
      if (!commitment) throw new AppError('NOT_FOUND', { id }, 'Commitment not found');
      if (commitment.status !== 'ACTIVE') {
        throw new AppError('ALREADY_SETTLED', { finalStatus: commitment.status });
      }
      const now = new Date(clock.now());
      if (now >= commitment.deadline) {
        const lost = await tx.commitment.updateMany({
          where: { id: commitment.id, status: 'ACTIVE' },
          data: { status: 'FAILED', failedAt: commitment.deadline },
        });
        if (lost.count === 1) await deductForFailure(tx, commitment);
        throw new AppError('FAILED_AT_DEADLINE', { finalStatus: 'FAILED' });
      }
      const won = await tx.commitment.updateMany({
        where: { id: commitment.id, status: 'ACTIVE' },
        data: { status: 'COMPLETED', completedAt: now },
      });
      if (won.count !== 1) throw new AppError('ALREADY_SETTLED', { finalStatus: 'SETTLED_BY_RACE' });
      await tx.appEvent.create({
        data: {
          userId,
          name: 'commitment_completed',
          payload: { commitmentId: commitment.id },
        },
      });
      return tx.commitment.findUniqueOrThrow({ where: { id: commitment.id } });
    });
  }

  async function graceDelete(userId: string, id: string): Promise<void> {
    const commitment = await prisma.commitment.findFirst({ where: { id, userId } });
    if (!commitment) throw new AppError('NOT_FOUND', { id }, 'Commitment not found');
    if (commitment.status !== 'ACTIVE' || clock.now() - Number(commitment.createdAt) > GRACE_WINDOW_MS) {
      throw new AppError('GRACE_EXPIRED', { id }, 'Grace window expired');
    }
    const deleted = await prisma.commitment.deleteMany({
      where: { id, userId, status: 'ACTIVE' },
    });
    if (deleted.count !== 1) throw new AppError('ALREADY_SETTLED', { finalStatus: 'SETTLED_BY_RACE' });
  }

  function toDto(commitment: Commitment): CommitmentDto & { remainingMs?: number; phase?: string } {
    const createdAtISO = commitment.createdAt.toISOString();
    const deadlineISO = commitment.deadline.toISOString();
    const view = buildTimeView({
      commitmentId: commitment.id,
      catId: commitment.catId,
      status: commitment.status,
      createdAtISO,
      deadlineISO,
      nowMs: clock.now(),
    });
    return {
      id: commitment.id,
      title: commitment.title,
      description: commitment.description,
      deadlineISO,
      status: commitment.status,
      catId: commitment.catId as CatId,
      consequenceType: commitment.consequenceType as ConsequenceType,
      consequenceAmount: commitment.consequenceAmount,
      createdAtISO,
      completedAtISO: commitment.completedAt?.toISOString() ?? null,
      failedAtISO: commitment.failedAt?.toISOString() ?? null,
      phase: view.phase,
      remainingMs: view.msRemaining,
    };
  }

  async function listCommitments(userId: string): Promise<CommitmentDto[]> {
    await settleDue(userId);
    const rows = await prisma.commitment.findMany({
      where: { userId },
      orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
    });
    return rows.map(toDto);
  }

  async function getCommitment(userId: string, id: string): Promise<CommitmentDto> {
    await settleDue(userId);
    const row = await prisma.commitment.findFirst({ where: { id, userId } });
    if (!row) throw new AppError('NOT_FOUND', { id }, 'Commitment not found');
    await prisma.appEvent.create({
      data: { userId, name: 'detail_opened', payload: { commitmentId: id } },
    });
    return toDto(row);
  }

  return {
    createCommitment,
    settleDue,
    completeCommitment,
    graceDelete,
    listCommitments,
    getCommitment,
    toDto,
  };
}

export type CommitmentEngine = ReturnType<typeof makeCommitmentEngine>;

