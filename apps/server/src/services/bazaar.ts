import { Prisma, type PrismaClient } from '@prisma/client';
import { BAZAAR_PRODUCTS, type BazaarSku } from '@purrpose/shared';
import type { Env } from '../env.js';
import { AppError } from '../errors.js';
import { creditPurchase } from './payments.js';

/**
 * Cafe Bazaar in-app purchases (Iranian edition, Android app only).
 *
 * The app buys with Bazaar's own billing (Poolakey) and sends us the purchase token.
 * We ask Bazaar's developer API whether that token is a real, unrefunded purchase of that
 * product in our package, credit it once, and tell the app to consume it so it can be
 * bought again. One Payment row per token (id `bazaar:<token>`) makes crediting exactly-once:
 * a second verify of the same token (a retry, a restart, two taps) credits nothing.
 */

export const BAZAAR_API = 'https://pardakht.cafebazaar.ir/devapi/v2/api';

export function bazaarEnabled(env: Env): boolean {
  return Boolean(env.BAZAAR_API_SECRET);
}

/** What Bazaar says about a purchase token. */
export interface BazaarPurchase {
  /** 0 = bought, 1 = refunded. */
  purchaseState: number;
  /** 0 = consumed, 1 = not consumed yet. */
  consumptionState: number;
  purchaseTime?: number;
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

/** Looks the purchase up with Bazaar. null = Bazaar doesn't know this token for this product. */
export async function lookUpPurchase(
  env: Env,
  sku: BazaarSku,
  token: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<BazaarPurchase | null> {
  if (!env.BAZAAR_API_SECRET) throw new AppError('PAYMENTS_UNAVAILABLE', undefined, 'Purchases are not available yet');
  const url = `${BAZAAR_API}/validate/${encodeURIComponent(env.BAZAAR_PACKAGE_NAME)}/inapp/${encodeURIComponent(sku)}/purchases/${encodeURIComponent(token)}/`;
  let res: Awaited<ReturnType<FetchLike>>;
  try {
    res = await fetchImpl(url, {
      method: 'GET',
      headers: { 'CAFEBAZAAR-PISHKHAN-API-SECRET': env.BAZAAR_API_SECRET, accept: 'application/json' },
    });
  } catch (err) {
    console.error('[bazaar] validate unreachable', err instanceof Error ? err.message : err);
    throw new AppError('PAYMENT_PROVIDER', undefined, 'Could not reach Cafe Bazaar. Try again in a moment.');
  }
  const text = await res.text();
  if (res.status === 404) return null;
  if (!res.ok) {
    console.error(`[bazaar] validate failed: HTTP ${res.status} ${text.slice(0, 300)}`);
    throw new AppError('PAYMENT_PROVIDER', undefined, 'Cafe Bazaar could not check this purchase. Try again in a moment.');
  }
  let body: Partial<BazaarPurchase> & { error?: unknown };
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    throw new AppError('PAYMENT_PROVIDER', undefined, 'Cafe Bazaar sent an unreadable answer');
  }
  if (body.error || typeof body.purchaseState !== 'number') return null;
  return {
    purchaseState: body.purchaseState,
    consumptionState: Number(body.consumptionState ?? 1),
    purchaseTime: typeof body.purchaseTime === 'number' ? body.purchaseTime : undefined,
  };
}

export interface BazaarResult {
  kind: 'purr' | 'food';
  item: string;
  quantity: number;
  /** false: this token was already credited earlier (nothing added now). */
  credited: boolean;
  /** The app should consume the purchase in Bazaar now (so the product can be bought again). */
  consume: true;
}

export async function verifyBazaarPurchase(
  prisma: PrismaClient,
  env: Env,
  userId: string,
  sku: BazaarSku,
  token: string,
  fetchImpl?: FetchLike,
): Promise<BazaarResult> {
  const product = BAZAAR_PRODUCTS[sku];
  const id = `bazaar:${token}`;
  const result = (credited: boolean): BazaarResult => ({
    kind: product.kind,
    item: product.item,
    quantity: product.quantity,
    credited,
    consume: true,
  });

  const known = await prisma.payment.findUnique({ where: { id } });
  if (known) {
    if (known.userId !== userId) throw new AppError('CONFLICT', undefined, 'This purchase belongs to another account');
    return result(false);
  }

  const purchase = await lookUpPurchase(env, sku, token, fetchImpl);
  if (!purchase) throw new AppError('NOT_FOUND', undefined, 'Cafe Bazaar does not know this purchase');
  if (purchase.purchaseState !== 0) throw new AppError('CONFLICT', undefined, 'This purchase was refunded');

  try {
    await prisma.$transaction(async tx => {
      await tx.payment.create({
        data: {
          id,
          userId,
          kind: product.kind,
          item: product.item,
          quantity: product.quantity,
          // Rials, the unit Bazaar charges in (the column is "the smallest unit" of `currency`).
          amountCents: product.toman * 10,
          currency: 'irr',
          status: 'paid',
          livemode: true,
          paidAt: new Date(),
        },
      });
      await creditPurchase(tx, { userId, kind: product.kind, item: product.item, quantity: product.quantity }, id);
      await tx.appEvent.create({
        data: { userId, name: 'payment_paid', payload: { provider: 'bazaar', sku, kind: product.kind, item: product.item, quantity: product.quantity, toman: product.toman } },
      });
    });
  } catch (err) {
    // Two verifies of the same token raced: the other one credited it.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const row = await prisma.payment.findUnique({ where: { id } });
      if (row && row.userId !== userId) throw new AppError('CONFLICT', undefined, 'This purchase belongs to another account');
      return result(false);
    }
    throw err;
  }
  return result(true);
}
