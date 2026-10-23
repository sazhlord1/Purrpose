import { userIdOf } from '../auth.js';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { createCommitmentSchema, idParamsSchema, proofSchema, reviewSchema, type WitnessView } from '@purrpose/shared';
import type { CommitmentEngine } from '../services/commitments.js';
import { getPrisma } from '../db.js';
import { AppError } from '../errors.js';
import { parse } from '../validate.js';
import { clock } from '../clock.js';
import { z } from 'zod';

/** Proof photos are shrunk in the browser to well under this. */
const PROOF_BODY_LIMIT = 1024 * 1024;
const tokenParamsSchema = z.object({ token: z.string().min(20).max(64) });

async function sendProofImage(reply: FastifyReply, commitmentId: string) {
  const proof = await getPrisma().commitmentProof.findUnique({
    where: { commitmentId },
    select: { image: true, imageType: true },
  });
  if (!proof?.image || !proof.imageType) throw new AppError('NOT_FOUND', undefined, 'No photo');
  return reply.header('Content-Type', proof.imageType).header('Cache-Control', 'private, no-store').send(Buffer.from(proof.image));
}

export function registerCommitmentRoutes(
  app: FastifyInstance,
  engine: CommitmentEngine,
): void {
  app.post('/api/v1/commitments', async (request, reply) => {
    const userId = userIdOf(request);
    const input = parse(createCommitmentSchema(clock.now()), request.body);
    const commitment = await engine.createCommitment(userId, request.role, input);
    return reply.code(201).send({ commitment: engine.toDto(commitment), serverTime: clock.now() });
  });

  app.get('/api/v1/commitments', async request => {
    const userId = userIdOf(request);
    const commitments = await engine.listCommitments(userId);
    return { commitments, serverTime: clock.now() };
  });

  app.get('/api/v1/commitments/:id', async request => {
    const userId = userIdOf(request);
    const { id } = parse(idParamsSchema, request.params);
    const commitment = await engine.getCommitment(userId, id);
    return { commitment, serverTime: clock.now() };
  });

  app.post('/api/v1/commitments/:id/complete', async request => {
    const userId = userIdOf(request);
    const { id } = parse(idParamsSchema, request.params);
    const commitment = await engine.completeCommitment(userId, id);
    return { commitment: engine.toDto(commitment), serverTime: clock.now() };
  });

  /** Strict pacts: "I did it" with a short note and an optional photo. */
  app.post('/api/v1/commitments/:id/proof', { bodyLimit: PROOF_BODY_LIMIT }, async request => {
    const userId = userIdOf(request);
    const { id } = parse(idParamsSchema, request.params);
    const input = parse(proofSchema, request.body);
    const commitment = await engine.submitProof(userId, id, input);
    return { commitment: engine.toDto(commitment), serverTime: clock.now() };
  });

  app.get('/api/v1/commitments/:id/proof-image', async (request, reply) => {
    const userId = userIdOf(request);
    const { id } = parse(idParamsSchema, request.params);
    const own = await getPrisma().commitment.findFirst({ where: { id, userId }, select: { id: true } });
    if (!own) throw new AppError('NOT_FOUND', { id }, 'Commitment not found');
    return sendProofImage(reply, id);
  });

  app.delete('/api/v1/commitments/:id', async (request, reply) => {
    const userId = userIdOf(request);
    const { id } = parse(idParamsSchema, request.params);
    await engine.graceDelete(userId, id);
    return reply.code(204).send();
  });

  // ─── Witness ───────────────────────────────────────────────────────────────
  // The link only finds the pact; acting on it needs to be signed in with the witness's email.

  async function loadByToken(token: string, viewerId: string) {
    const prisma = getPrisma();
    const [c, viewer] = await Promise.all([
      prisma.commitment.findUnique({
        where: { witnessToken: token },
        include: { proof: { select: { text: true, createdAt: true, imageType: true } }, user: { select: { firstName: true } } },
      }),
      prisma.user.findUnique({ where: { id: viewerId }, select: { email: true } }),
    ]);
    if (!c || !c.witnessEmail) throw new AppError('NOT_FOUND', undefined, 'This witness link does not work');
    const isOwner = c.userId === viewerId;
    const isWitness = !isOwner && Boolean(viewer?.email) && viewer?.email?.toLowerCase() === c.witnessEmail;
    return { c, isOwner, isWitness };
  }

  app.get('/api/v1/witness/:token', async request => {
    const viewerId = userIdOf(request);
    const { token } = parse(tokenParamsSchema, request.params);
    const owner = await getPrisma().commitment.findUnique({ where: { witnessToken: token }, select: { userId: true } });
    if (owner) await engine.settleDue(owner.userId);
    const { c, isOwner, isWitness } = await loadByToken(token, viewerId);
    const view: WitnessView = {
      title: c.title,
      ownerName: c.user.firstName,
      catId: c.catId as WitnessView['catId'],
      deadlineISO: c.deadline.toISOString(),
      status: c.status,
      stakeLabel: { type: c.consequenceType, amount: c.consequenceAmount },
      witnessEmail: c.witnessEmail as string,
      isWitness,
      isOwner,
      proof: c.proof && c.proofSubmittedAt
        ? { text: c.proof.text, hasImage: Boolean(c.proof.imageType), submittedAtISO: c.proofSubmittedAt.toISOString() }
        : null,
      reviewDueAtISO: c.reviewDueAt?.toISOString() ?? null,
      reviewedBy: (c.reviewedBy as WitnessView['reviewedBy']) ?? null,
      reviewNote: c.reviewNote,
    };
    return { witness: view, serverTime: clock.now() };
  });

  app.get('/api/v1/witness/:token/image', async (request, reply) => {
    const viewerId = userIdOf(request);
    const { token } = parse(tokenParamsSchema, request.params);
    const { c, isOwner, isWitness } = await loadByToken(token, viewerId);
    if (!isOwner && !isWitness) throw new AppError('NOT_WITNESS', undefined, 'Sign in as the witness to see the photo');
    return sendProofImage(reply, c.id);
  });

  app.post('/api/v1/witness/:token/review', async request => {
    const viewerId = userIdOf(request);
    const { token } = parse(tokenParamsSchema, request.params);
    const input = parse(reviewSchema, request.body);
    const { c, isWitness } = await loadByToken(token, viewerId);
    if (!isWitness) throw new AppError('NOT_WITNESS', undefined, 'Only the witness can decide');
    await engine.reviewProof(c.id, input.approve, 'witness', input.note);
    return { ok: true, serverTime: clock.now() };
  });
}
