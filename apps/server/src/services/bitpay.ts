import type { PrismaClient } from '@prisma/client';
import { BAZAAR_PRODUCTS, type BazaarSku } from '@purrpose/shared';
import type { Env } from '../env.js';
import { AppError } from '../errors.js';
import { creditPurchase } from './payments.js';

/**
 * Bitpay card payments (Iranian edition, website / home-screen PWA only — the Android
 * app sells through Cafe Bazaar, whose rules don't allow another gateway in the app).
 *
 * Bitpay's flow (gateway guide v2.2):
 *  1. POST gateway-send {api, amount (rials, ≥ 5000), redirect} → a positive id_get, or a
 *     negative error code.
 *  2. Send the buyer to gateway-<id_get>-get to pay.
 *  3. Bitpay sends the buyer back to `redirect?trans_id=…&id_get=…`.
 *  4. POST gateway-result-second {api, trans_id, id_get, json=1} → {status, amount, …};
 *     status 1 = paid, 11 = already verified.
 *
 * One Payment row per id_get (id `bitpay:<id_get>`) holds who gets what and the amount in
 * rials (`amountCents`, currency IRR); it moves pending → paid once, in the transaction
 * that credits the buyer, so a second return (refresh, back button) credits nothing.
 * Products and prices are the same as on Cafe Bazaar (BAZAAR_PRODUCTS, toman × 10 = rials).
 */

/** Bitpay's published key for its test gateway (their test guide). Not a secret. */
export const BITPAY_TEST_API = 'adxcv-zzadq-polkjsad-opp13opoz-1sdf455aadzmck1244567';

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

const defaultFetch = (): FetchLike => fetch as unknown as FetchLike;

export function bitpayEnabled(env: Env): boolean {
  return env.BITPAY_TEST || Boolean(env.BITPAY_API);
}

function base(env: Env): string {
  return env.BITPAY_TEST ? 'https://bitpay.ir/payment-test' : 'https://bitpay.ir/payment';
}

function apiKey(env: Env): string {
  return env.BITPAY_TEST ? BITPAY_TEST_API : (env.BITPAY_API ?? '');
}

async function post(url: string, form: Record<string, string>, fetchImpl: FetchLike): Promise<string> {
  let res: Awaited<ReturnType<FetchLike>>;
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json, text/plain' },
      body: new URLSearchParams(form).toString(),
    });
  } catch (err) {
    console.error('[bitpay] unreachable', err instanceof Error ? err.message : err);
    throw new AppError('PAYMENT_PROVIDER', undefined, 'Could not reach the payment gateway. Try again in a moment.');
  }
  const text = (await res.text()).trim();
  if (!res.ok) {
    console.error(`[bitpay] HTTP ${res.status} ${text.slice(0, 120)}`);
    throw new AppError('PAYMENT_PROVIDER', undefined, 'The payment gateway is not answering. Try again in a moment.');
  }
  return text;
}

const SEND_ERRORS: Record<string, string> = {
  '-1': 'API key does not match',
  '-2': 'amount is not a number or below 5000 rials',
  '-3': 'redirect is empty',
  '-4': 'no gateway for this API key, or the address does not match the one registered at Bitpay',
  '-5': 'gateway error',
};

/** Opens a payment for one product and returns the Bitpay page to send the buyer to. */
export async function startBitpay(
  prisma: PrismaClient,
  env: Env,
  userId: string,
  sku: BazaarSku,
  mobile: string | null,
  fetchImpl: FetchLike = defaultFetch(),
): Promise<{ url: string; paymentId: string }> {
  if (!bitpayEnabled(env)) throw new AppError('PAYMENTS_UNAVAILABLE', undefined, 'Paying on the website is not available yet');
  const product = BAZAAR_PRODUCTS[sku];
  const rials = product.toman * 10;
  const form: Record<string, string> = {
    api: apiKey(env),
    amount: String(rials),
    redirect: env.BITPAY_REDIRECT_URL,
    description: `Purrpose ${sku}`,
  };
  // Shows the buyer's saved cards on the bank page.
  if (mobile) form.mobileNum = mobile;
  const text = await post(`${base(env)}/gateway-send`, form, fetchImpl);
  const idGet = Number.parseInt(text, 10);
  if (!Number.isInteger(idGet) || idGet <= 0) {
    console.error(`[bitpay] gateway-send refused: ${text.slice(0, 40)} (${SEND_ERRORS[text] ?? 'unknown'})`);
    throw new AppError('PAYMENT_PROVIDER', undefined, 'The payment gateway refused the payment. Try again later.');
  }
  const id = `bitpay:${idGet}`;
  await prisma.payment.create({
    data: {
      id,
      userId,
      kind: product.kind,
      item: product.item,
      quantity: product.quantity,
      amountCents: rials,
      currency: 'IRR',
      status: 'pending',
      livemode: !env.BITPAY_TEST,
    },
  });
  return { url: `${base(env)}/gateway-${idGet}-get`, paymentId: id };
}

export type BitpayOutcome =
  | { status: 'paid'; kind: 'purr' | 'food'; item: string; quantity: number; credited: boolean }
  | { status: 'failed' };

/**
 * The buyer is back from Bitpay: ask Bitpay whether this payment really went through for
 * the right amount, and credit it once.
 */
export async function finishBitpay(
  prisma: PrismaClient,
  env: Env,
  transId: string,
  idGet: string,
  fetchImpl: FetchLike = defaultFetch(),
): Promise<BitpayOutcome> {
  if (!/^\d{1,18}$/.test(transId) || !/^\d{1,18}$/.test(idGet)) return { status: 'failed' };
  const payment = await prisma.payment.findUnique({ where: { id: `bitpay:${idGet}` } });
  if (!payment) return { status: 'failed' };
  const done = (credited: boolean): BitpayOutcome => ({
    status: 'paid',
    kind: payment.kind as 'purr' | 'food',
    item: payment.item,
    quantity: payment.quantity,
    credited,
  });
  if (payment.status === 'paid') return done(false);

  const text = await post(
    `${base(env)}/gateway-result-second`,
    { api: apiKey(env), trans_id: transId, id_get: idGet, json: '1' },
    fetchImpl,
  );
  let body: { status?: unknown; amount?: unknown } = {};
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    body = { status: Number.parseInt(text, 10) };
  }
  const status = Number(body.status);
  // 1 = paid now; 11 = Bitpay already verified it (our earlier try got cut off).
  if (status !== 1 && status !== 11) {
    if (status !== -4) console.warn(`[bitpay] verify ${idGet}: status ${String(body.status).slice(0, 10)}`);
    return { status: 'failed' };
  }
  if (Number(body.amount) !== payment.amountCents) {
    console.error(`[bitpay] verify ${idGet}: amount ${String(body.amount)} ≠ ${payment.amountCents}`);
    throw new AppError('CONFLICT', undefined, 'Payment does not match');
  }

  const credited = await prisma.$transaction(async tx => {
    const moved = await tx.payment.updateMany({ where: { id: payment.id, status: 'pending' }, data: { status: 'paid', paidAt: new Date() } });
    if (moved.count !== 1) return false;
    await creditPurchase(tx, payment, payment.id);
    await tx.appEvent.create({
      data: {
        userId: payment.userId,
        name: 'payment_paid',
        payload: { provider: 'bitpay', paymentId: payment.id, transId, kind: payment.kind, item: payment.item, rials: payment.amountCents },
      },
    });
    return true;
  });
  return done(credited);
}
