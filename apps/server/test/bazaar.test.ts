import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { clock } from '../src/clock.js';
import { checkDatabase, getPrisma } from '../src/db.js';
import { getEnv, resetEnvCache } from '../src/env.js';
import { ensureAdmin } from '../src/services/accounts.js';
import { resetBazaarTokenCache } from '../src/services/bazaar.js';
import { wipeDatabase } from './helpers.js';

const prisma = getPrisma();
const dbReady = await checkDatabase(prisma);
let app: FastifyInstance;
const SECRET = 'bazaar-test-secret';

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

/** A pretend Cafe Bazaar developer API: knows some tokens, one of them refunded. */
const purchases = new Map<string, { sku: string; purchaseState: number }>();
const seen: Array<{ url: string; secret?: string }> = [];
const tokenCalls: URLSearchParams[] = [];
const fakeFetch = vi.fn(async (url: string | URL, init?: RequestInit) => {
  const u = String(url);
  const headers = (init?.headers ?? {}) as Record<string, string>;
  seen.push({ url: u, secret: headers['CAFEBAZAAR-PISHKHAN-API-SECRET'] });
  if (u === 'https://pardakht.cafebazaar.ir/devapi/v2/auth/token/') {
    const form = new URLSearchParams(String(init?.body));
    tokenCalls.push(form);
    if (form.get('client_secret') !== 'client-secret-xyz') return new Response(JSON.stringify({ error: 'invalid_client' }), { status: 401 });
    const refresh = form.get('grant_type') === 'authorization_code' ? { refresh_token: 'refresh-abc' } : {};
    return new Response(JSON.stringify({ access_token: `access-${tokenCalls.length}`, token_type: 'Bearer', expires_in: 3600, ...refresh }), { status: 200 });
  }
  const m = u.match(/^https:\/\/pardakht\.cafebazaar\.ir\/devapi\/v2\/api\/validate\/space\.purrpose\.app\/inapp\/([^/]+)\/purchases\/([^/?]+)\/(\?access_token=access-\d+)?$/);
  const p = m ? purchases.get(decodeURIComponent(m[2]!)) : undefined;
  const authed = headers['CAFEBAZAAR-PISHKHAN-API-SECRET'] === SECRET || Boolean(m?.[3]);
  if (!m || !authed || !p || p.sku !== m[1]) {
    return new Response(JSON.stringify({ error: 'not_found', error_description: 'The requested purchase is not found!' }), { status: 404 });
  }
  return new Response(JSON.stringify({ consumptionState: 1, purchaseState: p.purchaseState, kind: 'androidpublisher#inappPurchase', developerPayload: '', purchaseTime: 1_700_000_000_000 }), { status: 200 });
});

describe.skipIf(!dbReady)('Cafe Bazaar purchases', () => {
  beforeAll(async () => {
    process.env.BAZAAR_API_SECRET = SECRET;
    resetEnvCache();
    vi.stubGlobal('fetch', fakeFetch);
    app = await buildApp();
  });
  afterAll(async () => {
    delete process.env.BAZAAR_API_SECRET;
    resetEnvCache();
    vi.unstubAllGlobals();
    await app?.close();
    await prisma.$disconnect();
  });
  beforeEach(async () => {
    clock.reset();
    purchases.clear();
    seen.length = 0;
    await wipeDatabase(prisma);
  });

  it('credits a real purchase exactly once, and only to the account that bought it', async () => {
    expect((await call('GET', '/api/v1/bazaar', await guest())).json()).toEqual({ enabled: true });
    purchases.set('tok-150', { sku: 'purr_150', purchaseState: 0 });

    // A guest can't buy: the purchase would vanish with the device.
    const asGuest = await call('POST', '/api/v1/bazaar/verify', await guest(), { productId: 'purr_150', purchaseToken: 'tok-150' });
    expect(asGuest.json().error.code).toBe('ACCOUNT_REQUIRED');

    const buyer = await register('buyer@test.dev');
    const before = (await me(buyer)).purr;
    const first = await call('POST', '/api/v1/bazaar/verify', buyer, { productId: 'purr_150', purchaseToken: 'tok-150' });
    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({ kind: 'purr', item: 'purr_150', credited: true, consume: true, purr: before + 150 });
    expect(seen.at(-1)).toEqual({
      url: 'https://pardakht.cafebazaar.ir/devapi/v2/api/validate/space.purrpose.app/inapp/purr_150/purchases/tok-150/',
      secret: SECRET,
    });

    // The app retries (or restarts and restores): nothing more is added, it's told to consume.
    const again = await call('POST', '/api/v1/bazaar/verify', buyer, { productId: 'purr_150', purchaseToken: 'tok-150' });
    expect(again.json()).toMatchObject({ credited: false, consume: true, purr: before + 150 });

    // Someone else can't claim the same token.
    const thief = await register('thief@test.dev');
    expect((await call('POST', '/api/v1/bazaar/verify', thief, { productId: 'purr_150', purchaseToken: 'tok-150' })).json().error.code).toBe('CONFLICT');

    const payment = await prisma.payment.findUnique({ where: { id: 'bazaar:tok-150' } });
    expect(payment).toMatchObject({ kind: 'purr', item: 'purr_150', amountCents: 390_000, currency: 'irr', status: 'paid' });
  });

  it('food goes to the pantry; unknown, mismatched and refunded purchases are refused', async () => {
    const buyer = await register('food@test.dev');
    const meals = async () => (await me(buyer)).balances.find((b: { creditType: string }) => b.creditType === 'MEALS')?.amount ?? 0;
    const start = await meals();
    purchases.set('tok-can', { sku: 'food_meals', purchaseState: 0 });
    const ok = await call('POST', '/api/v1/bazaar/verify', buyer, { productId: 'food_meals', purchaseToken: 'tok-can' });
    expect(ok.json()).toMatchObject({ kind: 'food', item: 'MEALS', quantity: 1, credited: true });
    expect(await meals()).toBe(start + 1);

    expect((await call('POST', '/api/v1/bazaar/verify', buyer, { productId: 'food_vet', purchaseToken: 'nope-123' })).json().error.code).toBe('NOT_FOUND');
    // A can's token presented as a vet visit is not a vet visit.
    purchases.set('tok-can2', { sku: 'food_meals', purchaseState: 0 });
    expect((await call('POST', '/api/v1/bazaar/verify', buyer, { productId: 'food_vet', purchaseToken: 'tok-can2' })).json().error.code).toBe('NOT_FOUND');
    purchases.set('tok-refund', { sku: 'food_dry', purchaseState: 1 });
    expect((await call('POST', '/api/v1/bazaar/verify', buyer, { productId: 'food_dry', purchaseToken: 'tok-refund' })).json().error.code).toBe('CONFLICT');
    expect((await call('POST', '/api/v1/bazaar/verify', buyer, { productId: 'gold_bar', purchaseToken: 'tok-can' })).statusCode).toBe(400);
    expect(await meals()).toBe(start + 1);
  });

  it('works with an OAuth client the admin connects once', async () => {
    delete process.env.BAZAAR_API_SECRET;
    process.env.BAZAAR_CLIENT_ID = 'client-id-123';
    process.env.BAZAAR_CLIENT_SECRET = 'client-secret-xyz';
    process.env.ADMIN_EMAIL = 'boss@test.dev';
    process.env.ADMIN_PASSWORD = 'boss-pass-123';
    resetEnvCache();
    resetBazaarTokenCache();
    tokenCalls.length = 0;
    try {
      await ensureAdmin(prisma, getEnv());
      const admin = (await call('POST', '/api/v1/auth/admin/login', undefined, { email: 'boss@test.dev', password: 'boss-pass-123' })).json().token;
      const buyer = await register('oauth@test.dev');
      // Not connected yet: off.
      expect((await call('GET', '/api/v1/bazaar', buyer)).json()).toEqual({ enabled: false });
      expect((await call('GET', '/api/v1/admin/bazaar', admin)).json()).toEqual({ mode: 'oauth', enabled: false });
      expect((await call('POST', '/api/v1/admin/bazaar/connect', buyer)).statusCode).toBe(403);

      const { url } = (await call('POST', '/api/v1/admin/bazaar/connect', admin)).json();
      const auth = new URL(url);
      expect(auth.origin + auth.pathname).toBe('https://pardakht.cafebazaar.ir/devapi/v2/auth/authorize/');
      expect(auth.searchParams.get('client_id')).toBe('client-id-123');
      expect(auth.searchParams.get('access_type')).toBe('offline');
      expect(auth.searchParams.get('redirect_uri')).toBe('https://app.purrpose.ir/api/v1/bazaar/oauth/callback');
      const state = auth.searchParams.get('state')!;

      // A made-up state doesn't connect anything.
      const forged = await app.inject({ method: 'GET', url: '/api/v1/bazaar/oauth/callback?code=c1&state=forged' });
      expect(forged.headers.location).toBe('/admin?bazaar=expired');

      const back = await app.inject({ method: 'GET', url: `/api/v1/bazaar/oauth/callback?code=c1&state=${state}` });
      expect(back.statusCode).toBe(302);
      expect(back.headers.location).toBe('/admin?bazaar=ok');
      expect(tokenCalls[0]!.get('grant_type')).toBe('authorization_code');
      expect(tokenCalls[0]!.get('code')).toBe('c1');
      expect((await call('GET', '/api/v1/bazaar', buyer)).json()).toEqual({ enabled: true });

      purchases.set('tok-oauth', { sku: 'purr_500', purchaseState: 0 });
      const res = await call('POST', '/api/v1/bazaar/verify', buyer, { productId: 'purr_500', purchaseToken: 'tok-oauth' });
      expect(res.json()).toMatchObject({ credited: true, item: 'purr_500' });
      expect(seen.at(-1)!.url).toMatch(/\/purchases\/tok-oauth\/\?access_token=access-1$/);

      // After a restart (no cached access token) the stored refresh token gets a new one.
      resetBazaarTokenCache();
      purchases.set('tok-oauth2', { sku: 'purr_150', purchaseState: 0 });
      expect((await call('POST', '/api/v1/bazaar/verify', buyer, { productId: 'purr_150', purchaseToken: 'tok-oauth2' })).json().credited).toBe(true);
      expect(tokenCalls.at(-1)!.get('grant_type')).toBe('refresh_token');
      expect(tokenCalls.at(-1)!.get('refresh_token')).toBe('refresh-abc');
    } finally {
      delete process.env.BAZAAR_CLIENT_ID;
      delete process.env.BAZAAR_CLIENT_SECRET;
      delete process.env.ADMIN_EMAIL;
      delete process.env.ADMIN_PASSWORD;
      process.env.BAZAAR_API_SECRET = SECRET;
      resetEnvCache();
      resetBazaarTokenCache();
    }
  });

  it('is off without the Bazaar secret', async () => {
    delete process.env.BAZAAR_API_SECRET;
    resetEnvCache();
    try {
      const buyer = await register('off@test.dev');
      expect((await call('GET', '/api/v1/bazaar', buyer)).json()).toEqual({ enabled: false });
      expect((await call('POST', '/api/v1/bazaar/verify', buyer, { productId: 'purr_150', purchaseToken: 'tok-x' })).json().error.code).toBe('PAYMENTS_UNAVAILABLE');
    } finally {
      process.env.BAZAAR_API_SECRET = SECRET;
      resetEnvCache();
    }
  });
});
