import { userIdOf } from '../auth.js';
import type { FastifyInstance } from 'fastify';
import { topUpSchema } from '@purrpose/shared';
import { topUp } from '../services/wallet.js';
import { getPrisma } from '../db.js';
import { getEnv } from '../env.js';
import { AppError } from '../errors.js';
import { clock } from '../clock.js';
import { parse } from '../validate.js';

export function registerWalletRoutes(app: FastifyInstance): void {
  /**
   * Free food top-up: only in sandbox mode (testing) or for admins. Real players buy
   * food through the payment provider, so strict pacts always stake food that was paid for.
   */
  app.post('/api/v1/wallet/topup', async request => {
    const userId = userIdOf(request);
    if (getEnv().PAYMENTS_MODE !== 'sandbox' && request.role !== 'ADMIN') {
      throw new AppError('PAYMENTS_UNAVAILABLE', undefined, 'Buying food is not open yet');
    }
    const input = parse(topUpSchema, request.body);
    const amount = await topUp(getPrisma(), userId, input.creditType, input.amount);
    return { creditType: input.creditType, amount, serverTime: clock.now() };
  });
}
