import { userIdOf } from '../auth.js';
import type { FastifyInstance } from 'fastify';
import { topUpSchema } from '@purrpose/shared';
import { topUp } from '../services/wallet.js';
import { getPrisma } from '../db.js';
import { clock } from '../clock.js';
import { parse } from '../validate.js';

export function registerWalletRoutes(app: FastifyInstance): void {
  app.post('/api/v1/wallet/topup', async request => {
    const userId = userIdOf(request);
    const input = parse(topUpSchema, request.body);
    const amount = await topUp(getPrisma(), userId, input.creditType, input.amount);
    return { creditType: input.creditType, amount, serverTime: clock.now() };
  });
}
