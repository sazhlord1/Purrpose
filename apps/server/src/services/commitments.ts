import type { CatId, ConsequenceType } from '@purrpose/shared';
import {
  GRACE_WINDOW_MS,
  HONOR_STARTER_BONUS,
  HONOR_STARTER_COUNT,
  HONOR_STARTER_STAKE,
  PROOF_MAX_IMAGE_BYTES,
  REVIEW_WINDOW_MS,
  buildTimeView,
  canStake,
  type CommitmentDto,
  type CreateCommitmentInput,
  type ProofInput,
} from '@purrpose/shared';
import { Prisma, type PrismaClient, type Commitment } from '@prisma/client';
import { AppError } from '../errors.js';
import type { ClockApi } from '../clock.js';
import type { Role } from '../auth.js';
import { generateToken } from '../security.js';
import { stakedActive } from './habits.js';
import { honorStaked, lockUser } from './purr.js';
import { assertCatUsable } from './shop.js';

type Tx = Prisma.TransactionClient;
export type Reviewer = 'witness' | 'admin' | 'auto';

/** A strict (food) pact was lost: its food goes to the cats. */
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

/** An honor (PURR) pact was lost: its PURR stake is gone. Never below zero. */
async function loseHonorStake(tx: Tx, commitment: Commitment): Promise<void> {
  const stake = commitment.purrStake;
  if (stake > 0) {
    await tx.$executeRaw`
      UPDATE "User" SET "purrBalance" = GREATEST(0, "purrBalance" - ${stake})
      WHERE "id" = ${commitment.userId}`;
    await tx.purrTransaction.create({
      data: { userId: commitment.userId, type: 'STAKE_LOST', amount: stake, itemId: `pact:${commitment.id}` },
    });
  }
  await tx.appEvent.create({
    data: { userId: commitment.userId, name: 'commitment_failed', payload: { commitmentId: commitment.id, mode: 'HONOR' } },
  });
}

/** Whatever losing costs, for either kind of pact. */
async function settleLoss(tx: Tx, commitment: Commitment): Promise<void> {
  if (commitment.mode === 'HONOR') await loseHonorStake(tx, commitment);
  else await deductForFailure(tx, commitment);
}

/** Kept honor pact: the stake simply unlocks; a starter pact also pays its bonus. */
async function rewardHonorWin(tx: Tx, commitment: Commitment): Promise<void> {
  if (commitment.mode !== 'HONOR' || !commitment.starter) return;
  await tx.user.update({
    where: { id: commitment.userId },
    data: { purrBalance: { increment: HONOR_STARTER_BONUS } },
  });
  await tx.purrTransaction.create({
    data: {
      userId: commitment.userId,
      type: 'PACT_BONUS',
      amount: HONOR_STARTER_BONUS,
      itemId: `pact:${commitment.id}`,
    },
  });
}

/** JPEG / PNG / WebP magic numbers: the declared type must match the bytes. */
function imageMatches(type: string, bytes: Buffer): boolean {
  if (type === 'image/jpeg') return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === 'image/webp') return bytes.length > 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

export function makeCommitmentEngine(prisma: PrismaClient, clock: ClockApi) {
  async function createCommitment(
    userId: string,
    role: Role | undefined,
    input: CreateCommitmentInput,
  ): Promise<Commitment> {
    return prisma.$transaction(async tx => {
      await assertCatUsable(tx, userId, role, input.catId);
      const base = {
        userId,
        title: input.title,
        description: input.description ?? null,
        deadline: new Date(input.deadlineISO),
        status: 'ACTIVE' as const,
        catId: input.catId,
        createdAt: new Date(clock.now()),
      };

      let commitment: Commitment;
      if (input.mode === 'HONOR') {
        const balance = await lockUser(tx, userId);
        const honorSoFar = await tx.commitment.count({ where: { userId, mode: 'HONOR' } });
        const starter = honorSoFar < HONOR_STARTER_COUNT;
        const stake = starter ? HONOR_STARTER_STAKE : input.purrStake;
        if (!stake) throw new AppError('INVALID_INPUT', { fieldErrors: { purrStake: ['Pick how much PURR to stake'] } }, 'Pick how much PURR to stake');
        const available = balance - (await honorStaked(tx, userId));
        if (available < stake) {
          throw new AppError('INSUFFICIENT_PURR', { needed: stake, available }, `You need ${stake} PURR`);
        }
        commitment = await tx.commitment.create({
          data: {
            ...base,
            mode: 'HONOR',
            purrStake: stake,
            starter,
            // Food fields are unused for honor pacts.
            consequenceType: 'MEALS',
            consequenceAmount: 0,
          },
        });
      } else {
        const consequenceType = input.consequenceType as ConsequenceType;
        const consequenceAmount = input.consequenceAmount as number;
        const rows = await tx.$queryRaw<{ amount: number }[]>`
          SELECT "amount" FROM "CreditBalance"
          WHERE "userId" = ${userId} AND "creditType" = ${consequenceType}::"ConsequenceType"
          FOR UPDATE`;
        const balanceAmount = rows[0]?.amount ?? 0;
        const staked = await stakedActive(tx, userId, consequenceType);
        const check = canStake(balanceAmount, staked, consequenceAmount);
        if (!check.ok) {
          throw new AppError(
            'INSUFFICIENT_AVAILABLE',
            { available: check.available },
            'Not enough available credits',
          );
        }
        let witnessEmail: string | null = null;
        if (input.witnessEmail && input.mode === 'STRICT') {
          const owner = await tx.user.findUnique({ where: { id: userId }, select: { email: true } });
          if (owner?.email && owner.email.toLowerCase() === input.witnessEmail) {
            throw new AppError('WITNESS_IS_YOU', undefined, 'Your witness needs an email that is not yours');
          }
          witnessEmail = input.witnessEmail;
        }
        commitment = await tx.commitment.create({
          data: {
            ...base,
            mode: 'STRICT',
            consequenceType,
            consequenceAmount,
            // Older app versions don't send a mode and know nothing about proofs.
            proofRequired: input.mode === 'STRICT',
            witnessEmail,
            witnessToken: witnessEmail ? generateToken() : null,
          },
        });
      }

      await tx.appEvent.create({
        data: {
          userId,
          name: 'commitment_created',
          payload: {
            commitmentId: commitment.id,
            catId: input.catId,
            mode: commitment.mode,
            consequenceType: commitment.consequenceType,
            consequenceAmount: commitment.consequenceAmount,
            purrStake: commitment.purrStake,
            witness: Boolean(commitment.witnessEmail),
          },
        },
      });
      return commitment;
    });
  }

  /** Overdue pacts without a proof are lost. A pact waiting for review is never failed by the clock. */
  async function settleDue(userId?: string): Promise<string[]> {
    const now = new Date(clock.now());
    return prisma.$transaction(async tx => {
      const rows = await tx.$queryRaw<{ id: string; deadline: Date }[]>`
        SELECT c."id", c."deadline"
        FROM "Commitment" c
        WHERE c."status" = 'ACTIVE' AND c."deadline" < ${now} AND c."proofSubmittedAt" IS NULL
        ${userId ? Prisma.sql`AND c."userId" = ${userId}` : Prisma.empty}
        FOR UPDATE SKIP LOCKED`;

      const settledIds: string[] = [];
      for (const row of rows) {
        const updated = await tx.commitment.updateMany({
          where: { id: row.id, status: 'ACTIVE', proofSubmittedAt: null },
          data: { status: 'FAILED', failedAt: row.deadline },
        });
        if (updated.count === 0) continue;
        const commitment = await tx.commitment.findUniqueOrThrow({ where: { id: row.id } });
        await settleLoss(tx, commitment);
        settledIds.push(row.id);
      }
      return settledIds;
    });
  }

  /** Loses the pact if its deadline has already passed (shared by "I did it" and "send proof"). */
  async function failIfLate(tx: Tx, commitment: Commitment): Promise<void> {
    if (new Date(clock.now()) < commitment.deadline) return;
    const lost = await tx.commitment.updateMany({
      where: { id: commitment.id, status: 'ACTIVE', proofSubmittedAt: null },
      data: { status: 'FAILED', failedAt: commitment.deadline },
    });
    if (lost.count === 1) await settleLoss(tx, commitment);
    throw new AppError('FAILED_AT_DEADLINE', { finalStatus: 'FAILED' });
  }

  async function completeCommitment(userId: string, id: string): Promise<Commitment> {
    const result = await prisma.$transaction(async tx => {
      const commitment = await tx.commitment.findFirst({ where: { id, userId } });
      if (!commitment) throw new AppError('NOT_FOUND', { id }, 'Commitment not found');
      if (commitment.status !== 'ACTIVE') {
        throw new AppError('ALREADY_SETTLED', { finalStatus: commitment.status });
      }
      if (commitment.proofRequired) {
        throw new AppError('PROOF_REQUIRED', undefined, 'Send a proof to finish this pact');
      }
      try {
        await failIfLate(tx, commitment);
      } catch (err) {
        // Commit the loss, then report it (any other error rolls everything back).
        if (err instanceof AppError && err.code === 'FAILED_AT_DEADLINE') return err;
        throw err;
      }
      const now = new Date(clock.now());
      const won = await tx.commitment.updateMany({
        where: { id: commitment.id, status: 'ACTIVE' },
        data: { status: 'COMPLETED', completedAt: now },
      });
      if (won.count !== 1) throw new AppError('ALREADY_SETTLED', { finalStatus: 'SETTLED_BY_RACE' });
      await rewardHonorWin(tx, commitment);
      await tx.appEvent.create({
        data: { userId, name: 'commitment_completed', payload: { commitmentId: commitment.id } },
      });
      return tx.commitment.findUniqueOrThrow({ where: { id: commitment.id } });
    });
    if (result instanceof AppError) throw result;
    return result;
  }

  /** Strict pact: "I did it" = a proof that waits for the witness, the admin, or the 48h clock. */
  async function submitProof(userId: string, id: string, input: ProofInput): Promise<Commitment> {
    let image: Buffer | null = null;
    if (input.image) {
      image = Buffer.from(input.image.data, 'base64');
      if (image.length === 0 || image.length > PROOF_MAX_IMAGE_BYTES || !imageMatches(input.image.type, image)) {
        throw new AppError('INVALID_INPUT', { fieldErrors: { image: ['That photo could not be used'] } }, 'That photo could not be used');
      }
    }
    const result = await prisma.$transaction(async tx => {
      const commitment = await tx.commitment.findFirst({ where: { id, userId } });
      if (!commitment) throw new AppError('NOT_FOUND', { id }, 'Commitment not found');
      if (commitment.status !== 'ACTIVE' || commitment.proofSubmittedAt) {
        throw new AppError('ALREADY_SETTLED', { finalStatus: commitment.status });
      }
      if (!commitment.proofRequired) throw new AppError('INVALID_INPUT', undefined, 'This pact needs no proof');
      try {
        await failIfLate(tx, commitment);
      } catch (err) {
        if (err instanceof AppError && err.code === 'FAILED_AT_DEADLINE') return err;
        throw err;
      }
      const now = new Date(clock.now());
      const marked = await tx.commitment.updateMany({
        where: { id, status: 'ACTIVE', proofSubmittedAt: null },
        data: { proofSubmittedAt: now, reviewDueAt: new Date(now.getTime() + REVIEW_WINDOW_MS) },
      });
      if (marked.count !== 1) throw new AppError('ALREADY_SETTLED', { finalStatus: 'SETTLED_BY_RACE' });
      await tx.commitmentProof.create({
        data: { commitmentId: id, text: input.text, image, imageType: image ? input.image?.type ?? null : null },
      });
      await tx.appEvent.create({
        data: { userId, name: 'proof_submitted', payload: { commitmentId: id, image: Boolean(image), witness: Boolean(commitment.witnessEmail) } },
      });
      return tx.commitment.findUniqueOrThrow({ where: { id } });
    });
    if (result instanceof AppError) throw result;
    return result;
  }

  /** Approve → kept (the food stays). Reject → lost (the food goes to the cats). Exactly once. */
  async function reviewProof(id: string, approve: boolean, by: Reviewer, note?: string): Promise<Commitment> {
    return prisma.$transaction(async tx => {
      const commitment = await tx.commitment.findUnique({ where: { id } });
      if (!commitment) throw new AppError('NOT_FOUND', { id }, 'Commitment not found');
      if (commitment.status !== 'ACTIVE' || !commitment.proofSubmittedAt || commitment.reviewedAt) {
        throw new AppError('ALREADY_SETTLED', { finalStatus: commitment.status });
      }
      const now = new Date(clock.now());
      const done = await tx.commitment.updateMany({
        where: { id, status: 'ACTIVE', reviewedAt: null },
        data: approve
          ? { status: 'COMPLETED', completedAt: commitment.proofSubmittedAt, reviewedAt: now, reviewedBy: by, reviewNote: note ?? null }
          : { status: 'FAILED', failedAt: now, reviewedAt: now, reviewedBy: by, reviewNote: note ?? null },
      });
      if (done.count !== 1) throw new AppError('ALREADY_SETTLED', { finalStatus: 'SETTLED_BY_RACE' });
      if (!approve) await deductForFailure(tx, commitment);
      await tx.appEvent.create({
        data: { userId: commitment.userId, name: approve ? 'proof_approved' : 'proof_rejected', payload: { commitmentId: id, by } },
      });
      return tx.commitment.findUniqueOrThrow({ where: { id } });
    });
  }

  /** Nobody decided within the review window: the proof counts. */
  async function autoApproveDue(): Promise<string[]> {
    const due = await prisma.commitment.findMany({
      where: { status: 'ACTIVE', reviewedAt: null, proofSubmittedAt: { not: null }, reviewDueAt: { lte: new Date(clock.now()) } },
      select: { id: true },
      take: 200,
    });
    const approved: string[] = [];
    for (const { id } of due) {
      try {
        await reviewProof(id, true, 'auto');
        approved.push(id);
      } catch (err) {
        if (!(err instanceof AppError)) throw err;
      }
    }
    return approved;
  }

  /** Photos are only kept for a while after the decision. */
  async function purgeOldProofImages(olderThanMs = 30 * 24 * 3_600_000): Promise<number> {
    const cutoff = new Date(clock.now() - olderThanMs);
    const res = await prisma.commitmentProof.updateMany({
      where: { image: { not: null }, commitment: { reviewedAt: { lte: cutoff } } },
      data: { image: null, imageType: null },
    });
    return res.count;
  }

  async function graceDelete(userId: string, id: string): Promise<void> {
    const commitment = await prisma.commitment.findFirst({ where: { id, userId } });
    if (!commitment) throw new AppError('NOT_FOUND', { id }, 'Commitment not found');
    if (
      commitment.status !== 'ACTIVE' ||
      commitment.proofSubmittedAt ||
      clock.now() - Number(commitment.createdAt) > GRACE_WINDOW_MS
    ) {
      throw new AppError('GRACE_EXPIRED', { id }, 'Grace window expired');
    }
    const deleted = await prisma.commitment.deleteMany({
      where: { id, userId, status: 'ACTIVE', proofSubmittedAt: null },
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
      mode: commitment.mode,
      purrStake: commitment.purrStake,
      starter: commitment.starter,
      proofRequired: commitment.proofRequired,
      witnessEmail: commitment.witnessEmail,
      witnessToken: commitment.witnessToken,
      proofSubmittedAtISO: commitment.proofSubmittedAt?.toISOString() ?? null,
      reviewDueAtISO: commitment.reviewDueAt?.toISOString() ?? null,
      reviewedAtISO: commitment.reviewedAt?.toISOString() ?? null,
      reviewedBy: (commitment.reviewedBy as 'witness' | 'admin' | 'auto' | null) ?? null,
      reviewNote: commitment.reviewNote,
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
    submitProof,
    reviewProof,
    autoApproveDue,
    purgeOldProofImages,
    graceDelete,
    listCommitments,
    getCommitment,
    toDto,
  };
}

export type CommitmentEngine = ReturnType<typeof makeCommitmentEngine>;
