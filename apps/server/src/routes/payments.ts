import type { FastifyInstance } from 'fastify';
import { confirmPaymentSchema } from '@purrpose/shared';
import { userIdOf } from '../auth.js';
import { getPrisma } from '../db.js';
import { getEnv } from '../env.js';
import { AppError } from '../errors.js';
import { confirmCheckout, settleSession } from '../services/payments.js';
import { verifyWebhookSignature, type CheckoutSession } from '../services/stripe.js';
import { parse } from '../validate.js';

/** Back from Stripe Checkout (signed in). */
export function registerPaymentRoutes(app: FastifyInstance): void {
  app.post('/api/v1/payments/confirm', async request => {
    const { sessionId } = parse(confirmPaymentSchema, request.body);
    return confirmCheckout(getPrisma(), getEnv(), userIdOf(request), sessionId);
  });
}

/**
 * Stripe's webhook (public, signed). Needs the raw body for the signature, so it lives
 * in its own scope with a JSON parser that keeps the bytes.
 */
export async function registerStripeWebhook(app: FastifyInstance): Promise<void> {
  await app.register(async scope => {
    scope.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => done(null, body));
    scope.post('/api/v1/stripe/webhook', { bodyLimit: 1_000_000 }, async (request, reply) => {
      const secret = getEnv().STRIPE_WEBHOOK_SECRET;
      if (!secret) throw new AppError('PAYMENTS_UNAVAILABLE', undefined, 'Webhook not configured');
      const raw = request.body as Buffer;
      const sig = request.headers['stripe-signature'];
      if (!verifyWebhookSignature(raw, typeof sig === 'string' ? sig : undefined, secret)) {
        return reply.code(400).send({ error: { code: 'INVALID_INPUT', message: 'Bad signature' } });
      }
      const event = JSON.parse(raw.toString('utf8')) as { type: string; data?: { object?: CheckoutSession } };
      if (
        (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') &&
        event.data?.object?.id
      ) {
        try {
          await settleSession(getPrisma(), event.data.object);
        } catch (err) {
          // Not one of ours (e.g. another integration on the same Stripe account): acknowledge.
          if (!(err instanceof AppError && err.code === 'NOT_FOUND')) throw err;
        }
      }
      return { received: true };
    });
  });
}
