import type { FastifyInstance } from 'fastify';
import { createCommitmentSchema, idParamsSchema } from '@purrpose/shared';
import type { CommitmentEngine } from '../services/commitments.js';
import { parse } from '../validate.js';
import { clock } from '../clock.js';

export function registerCommitmentRoutes(
  app: FastifyInstance,
  engine: CommitmentEngine,
): void {
  app.post('/api/v1/commitments', async (request, reply) => {
    const userId = request.userId as string;
    const input = parse(createCommitmentSchema(clock.now()), request.body);
    const commitment = await engine.createCommitment(userId, input);
    return reply.code(201).send({ commitment: engine.toDto(commitment), serverTime: clock.now() });
  });

  app.get('/api/v1/commitments', async request => {
    const userId = request.userId as string;
    const commitments = await engine.listCommitments(userId);
    return { commitments, serverTime: clock.now() };
  });

  app.get('/api/v1/commitments/:id', async request => {
    const userId = request.userId as string;
    const { id } = parse(idParamsSchema, request.params);
    const commitment = await engine.getCommitment(userId, id);
    return { commitment, serverTime: clock.now() };
  });

  app.post('/api/v1/commitments/:id/complete', async request => {
    const userId = request.userId as string;
    const { id } = parse(idParamsSchema, request.params);
    const commitment = await engine.completeCommitment(userId, id);
    return { commitment: engine.toDto(commitment), serverTime: clock.now() };
  });

  app.delete('/api/v1/commitments/:id', async (request, reply) => {
    const userId = request.userId as string;
    const { id } = parse(idParamsSchema, request.params);
    await engine.graceDelete(userId, id);
    return reply.code(204).send();
  });
}
