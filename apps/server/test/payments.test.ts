import { createHmac } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { clock } from '../src/clock.js';
import { checkDatabase, getPrisma } from '../src/db.js';
import { resetEnvCache } from '../src/env.js';
import { formEncode, verifyWebhookSignature } from '../src/services/stripe.js';
import { wipeDatabase } from './helpers.js';

const prisma = getPrisma();
const dbReady = await checkDatabase(prisma);
let app: FastifyInstance;
const WHSEC = 'whsec_testsecret';

async function call(method: 'GET' | 'POST', url: string, token?: string, body?: object) {
  return app.inject({ method, url, headers: token ? { authorization: `Bearer ${token}` } : {}, payload: body });
}
const guest = async () => (await call('POST', '/api/v1/session')).json().token as string;
async function register(email: string): Promise<string> {
  const token = await guest();
  const res = await call('POST', '/api/v1/auth/register', token, { email, password: 'pass-word-123', firstName: 'Sam', lastName: 'Cat' });
  expect(res.statusCode).toBe(200);
  return res.json().token;
}
const me = async (token: string) => (await call('GET', '/api/v1/me', token)).json();

/** A pretend Stripe: remembers the sessions it created, and whether they're paid. */
const sessions = new Map<string, { amount: number; currency: string; paid: boolean; userId: string; metadata: Record<string, string> }>();
let created = 0;
let lastBody = '';
const fakeFetch = vi.fn(async (url: string | URL, init?: RequestInit) => {
  const u = String(url);
  if (u === 'https://api.stripe.com/v1/checkout/sessions' && init?.method === 'POST') {
    lastBody = String(init.body);
    const p = new URLSearchParams(lastBody);
    const id = `cs_test_${++created}abc`;
    const qty = Number(p.get('line_items[0][quantity]'));
    const unit = Number(p.get('line_items[0][price_data][unit_amount]'));
    sessions.set(id, {
      amount: qty * unit,
      currency: p.get('line_items[0][price_data][currency]') ?? '',
      paid: false,
      userId: p.get('client_reference_id') ?? '',
      metadata: { userId: p.get('metadata[userId]') ?? '', kind: p.get('metadata[kind]') ?? '' },
    });
    return new Response(JSON.stringify({ id, url: `https://checkout.stripe.com/c/pay/${id}`, livemode: false }), { status: 200 });
  }
  const m = u.match(/^https:\/\/api\.stripe\.com\/v1\/checkout\/sessions\/(cs_test_\w+)$/);
  if (m && sessions.has(m[1])) return new Response(JSON.stringify(sessionObject(m[1])), { status: 200 });
  return new Response(JSON.stringify({ error: { message: 'No such session' } }), { status: 404 });
});
function sessionObject(id: string) {
  const s = sessions.get(id)!;
  return {
    id,
    url: null,
    status: s.paid ? 'complete' : 'open',
    payment_status: s.paid ? 'paid' : 'unpaid',
    amount_total: s.amount,
    currency: s.currency,
    livemode: false,
    client_reference_id: s.userId,
    metadata: s.metadata,
  };
}
const sessionIdOf = (url: string) => url.split('/').pop() as string;
function signed(payload: object, secret = WHSEC, t = Math.floor(Date.now() / 1000)) {
  const body = JSON.stringify(payload);
  const v1 = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  return { body, header: `t=${t},v1=${v1}` };
}
async function webhook(payload: object, secret?: string) {
  const { body, header } = signed(payload, secret);
  return app.inject({ method: 'POST', url: '/api/v1/stripe/webhook', headers: { 'content-type': 'application/json', 'stripe-signature': header }, payload: body });
}

describe('Stripe helpers', () => {
  it('form-encodes nested params the way Stripe expects', () => {
    const s = formEncode({ mode: 'payment', line_items: [{ quantity: 2, price_data: { unit_amount: 299 } }], metadata: { k: 'a b' }, skip: undefined });
    expect(decodeURIComponent(s)).toBe('mode=payment&line_items[0][quantity]=2&line_items[0][price_data][unit_amount]=299&metadata[k]=a b');
  });
  it('accepts only fresh, correctly signed webhooks', () => {
    const { body, header } = signed({ a: 1 });
    expect(verifyWebhookSignature(Buffer.from(body), header, WHSEC)).toBe(true);
    expect(verifyWebhookSignature(Buffer.from(body + ' '), header, WHSEC)).toBe(false);
    expect(verifyWebhookSignature(Buffer.from(body), header, 'whsec_other')).toBe(false);
    expect(verifyWebhookSignature(Buffer.from(body), header, WHSEC, Date.now() + 3_600_000)).toBe(false);
    expect(verifyWebhookSignature(Buffer.from(body), undefined, WHSEC)).toBe(false);
  });
});

describe.skipIf(!dbReady)('Stripe Checkout purchases', () => {
  beforeAll(async () => {
    app = await buildApp();
  });
  afterAll(async () => {
    await app?.close();
    await prisma.$disconnect();
  });
  beforeEach(async () => {
    clock.reset();
    await wipeDatabase(prisma);
    sessions.clear();
    process.env.PAYMENTS_MODE = 'stripe';
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake123';
    process.env.STRIPE_WEBHOOK_SECRET = WHSEC;
    resetEnvCache();
    vi.stubGlobal('fetch', fakeFetch);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    process.env.PAYMENTS_MODE = 'sandbox';
    resetEnvCache();
  });

  it('shows Stripe prices and test mode in the shop', async () => {
    const token = await register('shop@example.com');
    const shop = (await call('GET', '/api/v1/shop', token)).json();
    expect(shop.paymentsMode).toBe('stripe');
    expect(shop.paymentsTest).toBe(true);
    expect(shop.packs.map((p: { purr: number; priceLabel: string }) => `${p.purr}=${p.priceLabel}`)).toEqual([
      '150=$1.99',
      '250=$2.50',
      '500=$3.49',
      '1000=$5.00',
    ]);
    expect(shop.foodPrices.MEALS.cents).toBe(299);
  });

  it('asks guests to make an account before buying', async () => {
    const token = await guest();
    const res = await call('POST', '/api/v1/shop/checkout', token, { packId: 'purr_150' });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('ACCOUNT_REQUIRED');
  });

  it('credits a PURR pack exactly once, and only when paid', async () => {
    const token = await register('buyer@example.com');
    const start = await call('POST', '/api/v1/shop/checkout', token, { packId: 'purr_150' });
    expect(start.statusCode).toBe(200);
    expect(start.json().status).toBe('redirect');
    expect(lastBody).toContain('unit_amount%5D=199');
    const sessionId = sessionIdOf(start.json().url);
    const before = (await me(token)).purr;

    const pending = await call('POST', '/api/v1/payments/confirm', token, { sessionId });
    expect(pending.json()).toEqual({ status: 'pending' });

    sessions.get(sessionId)!.paid = true;
    const paid = (await call('POST', '/api/v1/payments/confirm', token, { sessionId })).json();
    expect(paid).toMatchObject({ status: 'paid', kind: 'purr', credited: true });
    expect((await me(token)).purr).toBe(before + 150);

    // Coming back twice, or the webhook arriving too, never credits again.
    const again = (await call('POST', '/api/v1/payments/confirm', token, { sessionId })).json();
    expect(again.credited).toBe(false);
    const hook = await webhook({ type: 'checkout.session.completed', data: { object: sessionObject(sessionId) } });
    expect(hook.statusCode).toBe(200);
    expect((await me(token)).purr).toBe(before + 150);
  });

  it('buys pantry food through the webhook, signed only', async () => {
    const token = await register('food@example.com');
    const start = await call('POST', '/api/v1/wallet/checkout', token, { creditType: 'MEALS', quantity: 3 });
    expect(start.statusCode).toBe(200);
    expect(lastBody).toContain('quantity%5D=3');
    const sessionId = sessionIdOf(start.json().url);
    sessions.get(sessionId)!.paid = true;

    const forged = await webhook({ type: 'checkout.session.completed', data: { object: sessionObject(sessionId) } }, 'whsec_wrong');
    expect(forged.statusCode).toBe(400);
    const meals = async () => (await me(token)).balances.find((b: { creditType: string }) => b.creditType === 'MEALS')?.amount ?? 0;
    const before = await meals();

    await webhook({ type: 'checkout.session.completed', data: { object: sessionObject(sessionId) } });
    await webhook({ type: 'checkout.session.completed', data: { object: sessionObject(sessionId) } });
    expect(await meals()).toBe(before + 3);
  });

  it('refuses too much food in one go, and other people’s payments', async () => {
    const token = await register('a@example.com');
    const tooMuch = await call('POST', '/api/v1/wallet/checkout', token, { creditType: 'VET_CARE', quantity: 4 });
    expect(tooMuch.statusCode).toBe(400);
    const start = await call('POST', '/api/v1/shop/checkout', token, { packId: 'purr_500' });
    const sessionId = sessionIdOf(start.json().url);
    sessions.get(sessionId)!.paid = true;
    const other = await register('b@example.com');
    const res = await call('POST', '/api/v1/payments/confirm', other, { sessionId });
    expect(res.statusCode).toBe(404);
    expect((await me(other)).purr).toBe(120);
  });

  it('a session whose amount was changed is not credited', async () => {
    const token = await register('tamper@example.com');
    const start = await call('POST', '/api/v1/shop/checkout', token, { packId: 'purr_1000' });
    const sessionId = sessionIdOf(start.json().url);
    const s = sessions.get(sessionId)!;
    s.paid = true;
    s.amount = 1;
    const res = await call('POST', '/api/v1/payments/confirm', token, { sessionId });
    expect(res.statusCode).toBe(409);
    expect((await me(token)).purr).toBe(120);
  });
});
