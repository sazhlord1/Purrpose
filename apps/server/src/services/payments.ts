import type { PrismaClient } from '@prisma/client';
import {
  FOOD_PRICES,
  PAYMENT_CURRENCY,
  purrPackById,
  type ConsequenceType,
} from '@purrpose/shared';
import { allowedOrigins, paymentsMode, type Env } from '../env.js';
import { AppError } from '../errors.js';
import { createCheckoutSession, retrieveCheckoutSession, type CheckoutSession } from './stripe.js';

/**
 * Stripe Checkout for the international (English) version: PURR packs and pantry food.
 * Prices come from the shared catalogue, never from the client. A purchase is credited
 * exactly once, whichever arrives first: the webhook, or the buyer coming back.
 */

const FOOD_NAMES: Record<ConsequenceType, string> = {
  MEALS: 'Cat meal (can)',
  DRY_FOOD: 'Dry cat food (1 kg)',
  VET_CARE: 'Vet care (one visit)',
};

function stripeKey(env: Env): string {
  if (paymentsMode(env) !== 'stripe' || !env.STRIPE_SECRET_KEY) {
    throw new AppError('PAYMENTS_UNAVAILABLE', undefined, 'Purchases are not available yet');
  }
  return env.STRIPE_SECRET_KEY;
}

/** Where Stripe sends the buyer back: the web app they came from, if it is one of ours. */
function returnBase(env: Env, origin: string | undefined): string {
  const allowed = allowedOrigins(env);
  const clean = origin?.replace(/\/$/, '');
  if (clean && allowed.includes(clean)) return clean;
  if (allowed[0]) return allowed[0];
  if (env.NODE_ENV !== 'production') return clean ?? 'http://localhost:5173';
  throw new AppError('PAYMENTS_UNAVAILABLE', undefined, 'WEB_ORIGIN is not set');
}

interface Line {
  kind: 'purr' | 'food';
  item: string;
  quantity: number;
  unitCents: number;
  name: string;
  description: string;
  returnPath: string;
}

async function startCheckout(prisma: PrismaClient, env: Env, userId: string, origin: string | undefined, line: Line) {
  const key = stripeKey(env);
  const base = returnBase(env, origin);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  // Purchases need an account: a guest's browser data can vanish, and the purchase with it.
  if (!user?.email) throw new AppError('ACCOUNT_REQUIRED', undefined, 'Create an account first, so what you buy is safe');
  const session = await createCheckoutSession(key, {
    mode: 'payment',
    client_reference_id: userId,
    customer_email: user?.email ?? undefined,
    success_url: `${base}${line.returnPath}?checkout=done&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}${line.returnPath}?checkout=cancelled`,
    line_items: [
      {
        quantity: line.quantity,
        price_data: {
          currency: PAYMENT_CURRENCY,
          unit_amount: line.unitCents,
          product_data: { name: line.name, description: line.description },
        },
      },
    ],
    metadata: { userId, kind: line.kind, item: line.item, quantity: String(line.quantity) },
  });
  if (!session.url) throw new AppError('PAYMENT_PROVIDER', undefined, 'Checkout could not start');
  await prisma.payment.create({
    data: {
      id: session.id,
      userId,
      kind: line.kind,
      item: line.item,
      quantity: line.quantity,
      amountCents: line.unitCents * line.quantity,
      currency: PAYMENT_CURRENCY,
      livemode: session.livemode,
    },
  });
  await prisma.appEvent.create({
    data: { userId, name: 'checkout_started', payload: { kind: line.kind, item: line.item, quantity: line.quantity } },
  });
  return { status: 'redirect' as const, url: session.url };
}

export function startPurrCheckout(prisma: PrismaClient, env: Env, userId: string, packId: string, origin?: string) {
  const pack = purrPackById(packId);
  if (!pack) throw new AppError('NOT_FOUND', { packId }, 'Unknown pack');
  return startCheckout(prisma, env, userId, origin, {
    kind: 'purr',
    item: pack.id,
    quantity: 1,
    unitCents: pack.priceCents,
    name: `${pack.purr} PURR`,
    description: 'PURR for the Purrpose app: unlock cats and toys, or stake it in “on my word” pacts.',
    returnPath: '/shop',
  });
}

export function startFoodCheckout(
  prisma: PrismaClient,
  env: Env,
  userId: string,
  creditType: ConsequenceType,
  quantity: number,
  origin?: string,
) {
  const price = FOOD_PRICES[creditType];
  if (quantity > price.maxQty) {
    throw new AppError('INVALID_INPUT', { fieldErrors: { quantity: [`At most ${price.maxQty}`] } }, `At most ${price.maxQty}`);
  }
  return startCheckout(prisma, env, userId, origin, {
    kind: 'food',
    item: creditType,
    quantity,
    unitCents: price.cents,
    name: FOOD_NAMES[creditType],
    description: 'Real cat food for your Purrpose pantry. Keep your strict pacts and it stays yours; miss one and it goes to a shelter.',
    returnPath: '/pantry',
  });
}

export type PaymentResult =
  | { status: 'paid'; kind: 'purr' | 'food'; item: string; quantity: number; credited: boolean }
  | { status: 'pending' };

/**
 * Credits a paid Checkout Session once. Safe to call any number of times, from the
 * webhook and from the return page at the same moment: only the call that moves the
 * payment from pending to paid credits anything.
 */
export async function settleSession(prisma: PrismaClient, session: CheckoutSession): Promise<PaymentResult> {
  const payment = await prisma.payment.findUnique({ where: { id: session.id } });
  if (!payment) throw new AppError('NOT_FOUND', { sessionId: session.id }, 'Unknown payment');
  // The payment row (created with the session, keyed by its id) is the source of truth for
  // who gets what; the session just has to match its amount.
  const expectedTotal = payment.amountCents;
  if (
    (session.amount_total !== null && session.amount_total !== expectedTotal) ||
    (session.currency !== null && session.currency !== payment.currency)
  ) {
    throw new AppError('CONFLICT', { sessionId: session.id }, 'Payment does not match');
  }
  if (session.payment_status !== 'paid') {
    return payment.status === 'paid'
      ? { status: 'paid', kind: payment.kind as 'purr' | 'food', item: payment.item, quantity: payment.quantity, credited: false }
      : { status: 'pending' };
  }

  const credited = await prisma.$transaction(async tx => {
    const moved = await tx.payment.updateMany({
      where: { id: payment.id, status: 'pending' },
      data: { status: 'paid', paidAt: new Date() },
    });
    if (moved.count !== 1) return false; // already credited (webhook and return raced)
    if (payment.kind === 'purr') {
      const pack = purrPackById(payment.item);
      if (!pack) throw new AppError('NOT_FOUND', { packId: payment.item }, 'Unknown pack');
      await tx.purrTransaction.create({
        data: { userId: payment.userId, type: 'PURCHASE', amount: pack.purr, itemId: `pack:${pack.id}`, reference: `stripe:${payment.id}` },
      });
      await tx.user.update({ where: { id: payment.userId }, data: { purrBalance: { increment: pack.purr } } });
    } else {
      const creditType = payment.item as ConsequenceType;
      await tx.creditBalance.upsert({
        where: { userId_creditType: { userId: payment.userId, creditType } },
        update: { amount: { increment: payment.quantity } },
        create: { userId: payment.userId, creditType, amount: payment.quantity },
      });
      await tx.creditTransaction.create({
        data: { userId: payment.userId, type: 'TOPUP', creditType, amount: payment.quantity },
      });
    }
    await tx.appEvent.create({
      data: {
        userId: payment.userId,
        name: 'payment_paid',
        payload: { kind: payment.kind, item: payment.item, quantity: payment.quantity, amountCents: payment.amountCents, livemode: payment.livemode },
      },
    });
    return true;
  });
  return { status: 'paid', kind: payment.kind as 'purr' | 'food', item: payment.item, quantity: payment.quantity, credited };
}

/** The buyer is back from Checkout: ask Stripe how it went, and credit if paid. */
export async function confirmCheckout(prisma: PrismaClient, env: Env, userId: string, sessionId: string): Promise<PaymentResult> {
  const payment = await prisma.payment.findUnique({ where: { id: sessionId }, select: { userId: true } });
  // Only the buyer can ask about their payment (anyone else learns nothing).
  if (!payment || payment.userId !== userId) throw new AppError('NOT_FOUND', undefined, 'Unknown payment');
  const session = await retrieveCheckoutSession(stripeKey(env), sessionId);
  return settleSession(prisma, session);
}
