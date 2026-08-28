import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { bootstrapUserWithStarterGrant } from '../services/wallet.js';
import { getPrisma } from '../db.js';
import { clock } from '../clock.js';

export function registerSessionRoutes(app: FastifyInstance): void {
  app.post('/api/v1/session', async () => {
    const prisma = getPrisma();
    const result = await prisma.$transaction(async tx => {
      const user = await tx.user.create({ data: {} });
      const starterGrantApplied = await bootstrapUserWithStarterGrant(tx, user.id);
      const token = randomUUID();
      await tx.session.create({ data: { token, userId: user.id } });
      await tx.appEvent.create({
        data: {
          userId: user.id,
          name: 'session_started',
          payload: { starterGrantApplied },
        },
      });
      return { userId: user.id, token, starterGrantApplied };
    });
    return { ...result, serverTime: clock.now() };
  });
}
