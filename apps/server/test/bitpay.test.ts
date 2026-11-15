import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { clock } from '../src/clock.js';
import { checkDatabase, getPrisma } from '../src/db.js';
import { resetEnvCache } from '../src/env.js';
import { BITPAY_TEST_API } from '../src/services/bitpay.js';
import { wipeDatabase } from './helpers.js';

const prisma = getPrisma();
const dbReady = await checkDatabase(prisma);
let app: FastifyInstance;

async function call(method: 'GET' | 'POST', url: string, token?: string, body?: object) {
  return app.inject({ method, url, headers: token ? { authorization: `Bearer ${token}` } : {}, payload: body });
}
const guest = async () => (await call('POST', '/api/v1/session')).json().token as string;
async function register(email: string): Promise<string> {
  const res = await call('POST', '/api/v1/auth/register', await guest(), { email, password: 'pass-word-123', firstName: 'Sam', lastName: 'Cat' });
  expect(res.statusCode).toBe(200);
  return res.json().token;
}
const me = async (token: string) => (await call('GET', '/api/v1/me', token)).json();

/** A pretend Bitpay test gateway. */
let nextId = 500;
const opened = new Map<number, { amount: number; paid: boolean; verified: boolean }>();
const sends: URLSearchParams[] = [];
const fakeFetch = vi.fn(async (url: string | URL, init?: RequestInit) => {
  const u = String(url);
  const form = new URLSearchParams(String(init?.body));
  if (u === 'https://bitpay.ir/payment-test/gateway-send') {
    sends.push(form);
    if (form.get('api') !== BITPAY_TEST_API) return new Response('-1');
    const id = nextId++;
    opened.set(id, { amount: Number(form.get('amount')), paid: false, verified: false });
    return new Response(String(id));
  }
  if (u === 'https://bitpay.ir/payment-test/gateway-result-second') {
    const p = opened.get(Number(form.get('id_get')));
    if (!p || !p.paid || form.get('api') !== BITPAY_TEST_API) return new Response(JSON.stringify({ status: -4 }));
    const status = p.verified ? 11 : 1;
    p.verified = true;
    return new Response(JSON.stringify({ status, amount: p.amount, cardNum: '6037-****-1234', factorId: null }));
  }
  return new Response('not found', { status: 404 });
});

describe.skipIf(!dbReady)('Bitpay (website payments)', () => {
  beforeAll(async () => {
    process.env.BITPAY_TEST = 'true';
    resetEnvCache();
    vi.stubGlobal('fetch', fakeFetch);
    app = await buildApp();
  });
  afterAll(async () => {
    delete process.env.BITPAY_TEST;
    resetEnvCache();
    vi.unstubAllGlobals();
    await app?.close();
    await prisma.$disconnect();
  });
  beforeEach(async () => {
    clock.reset();
    await wipeDatabase(prisma);
    opened.clear();
    sends.length = 0;
  });

  it('guests must sign in first', async () => {
    const res = await call('POST', '/api/v1/bitpay/start', await guest(), { productId: 'food_meals' });
    expect(res.json().error.code).toBe('ACCOUNT_REQUIRED');
  });

  it('pays for a can: start → Bitpay → return credits it once', async () => {
    const token = await register('pay@test.dev');
    expect((await call('GET', '/api/v1/bitpay', token)).json().enabled).toBe(true);
    const before = (await me(token)).balances.find((b: { creditType: string }) => b.creditType === 'MEALS')?.amount ?? 0;

    const start = await call('POST', '/api/v1/bitpay/start', token, { productId: 'food_meals' });
    expect(start.statusCode).toBe(200);
    const id = nextId - 1;
    expect(start.json().url).toBe(`https://bitpay.ir/payment-test/gateway-${id}-get`);
    expect(sends[0]!.get('amount')).toBe('1890000'); // 189,000 toman in rials
    expect(sends[0]!.get('redirect')).toBe('https://purrpose.ir/api/v1/bitpay/return');

    // Back without paying: nothing.
    const unpaid = await call('GET', `/api/v1/bitpay/return?trans_id=77&id_get=${id}`);
    expect(unpaid.headers.location).toBe('https://app.purrpose.ir/pantry?bitpay=failed');

    opened.get(id)!.paid = true;
    const back = await call('GET', `/api/v1/bitpay/return?trans_id=77&id_get=${id}`);
    expect(back.statusCode).toBe(302);
    expect(back.headers.location).toBe('https://app.purrpose.ir/pantry?bitpay=ok&kind=food&item=MEALS&n=1');
    const after = (await me(token)).balances.find((b: { creditType: string }) => b.creditType === 'MEALS').amount;
    expect(after).toBe(before + 1);

    // A refresh of the return page credits nothing more.
    await call('GET', `/api/v1/bitpay/return?trans_id=77&id_get=${id}`);
    expect((await me(token)).balances.find((b: { creditType: string }) => b.creditType === 'MEALS').amount).toBe(before + 1);
  });

  it('a PURR pack lands on the shop page; unknown or junk ids fail', async () => {
    const token = await register('purr@test.dev');
    const before = (await me(token)).purr;
    await call('POST', '/api/v1/bitpay/start', token, { productId: 'purr_150' });
    const id = nextId - 1;
    opened.get(id)!.paid = true;
    const back = await call('GET', `/api/v1/bitpay/return?trans_id=9&id_get=${id}`);
    expect(back.headers.location).toBe('https://app.purrpose.ir/shop?section=purr&bitpay=ok&kind=purr&item=purr_150&n=1');
    expect((await me(token)).purr).toBe(before + 150);
    expect((await call('GET', '/api/v1/bitpay/return?trans_id=9&id_get=99999')).headers.location).toBe('https://app.purrpose.ir/pantry?bitpay=failed');
    expect((await call('GET', '/api/v1/bitpay/return?trans_id=x&id_get=1;drop')).headers.location).toBe('https://app.purrpose.ir/pantry?bitpay=failed');
  });
});
