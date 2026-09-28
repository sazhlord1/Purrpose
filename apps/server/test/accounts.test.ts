import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { clock } from '../src/clock.js';
import { checkDatabase, getPrisma } from '../src/db.js';
import { getEnv } from '../src/env.js';
import { hashToken } from '../src/security.js';
import { ensureAdmin } from '../src/services/accounts.js';
import { wipeDatabase } from './helpers.js';

const prisma = getPrisma();
const dbReady = await checkDatabase(prisma);
let app: FastifyInstance;

async function call(method: 'GET' | 'POST' | 'DELETE', url: string, token?: string, body?: object) {
  return app.inject({
    method,
    url,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    payload: body,
  });
}

async function guest(): Promise<string> {
  return (await call('POST', '/api/v1/session')).json().token;
}

const commitmentBody = (catId: string) => ({
  title: 'Ship it',
  deadlineISO: new Date(clock.now() + 24 * 3_600_000).toISOString(),
  catId,
  consequenceType: 'MEALS',
  consequenceAmount: 1,
});

const ADMIN = { email: 'admin@test.dev', password: 'admin-pass-123' };

describe.skipIf(!dbReady)('accounts, admin, PURR shop, focus, push', () => {
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
  });

  it('stores only a hash of the session token', async () => {
    const token = await guest();
    expect(await prisma.session.findUnique({ where: { tokenHash: token } })).toBeNull();
    expect(await prisma.session.findUnique({ where: { tokenHash: hashToken(token) } })).not.toBeNull();
  });

  it('registers a guest in place (keeps data) and logs in from another device', async () => {
    const token = await guest();
    expect((await call('POST', '/api/v1/commitments', token, commitmentBody('orange'))).statusCode).toBe(201);

    const reg = await call('POST', '/api/v1/auth/register', token, { email: ' Me@Example.com ', password: 'hunter2hunter2' });
    expect(reg.statusCode).toBe(200);
    const accountToken = reg.json().token;
    expect(reg.json().email).toBe('me@example.com');
    // Old guest token is rotated out.
    expect((await call('GET', '/api/v1/me', token)).statusCode).toBe(401);

    const me = (await call('GET', '/api/v1/me', accountToken)).json();
    expect(me.user.email).toBe('me@example.com');
    expect(me.user.role).toBe('USER');
    expect((await call('GET', '/api/v1/commitments', accountToken)).json().commitments).toHaveLength(1);

    const bad = await call('POST', '/api/v1/auth/login', undefined, { email: 'me@example.com', password: 'wrong-password' });
    expect(bad.statusCode).toBe(401);
    expect(bad.json().error.code).toBe('INVALID_CREDENTIALS');

    const login = await call('POST', '/api/v1/auth/login', undefined, { email: 'me@example.com', password: 'hunter2hunter2' });
    expect(login.statusCode).toBe(200);
    expect((await call('GET', '/api/v1/commitments', login.json().token)).json().commitments).toHaveLength(1);

    const dupe = await call('POST', '/api/v1/auth/register', await guest(), { email: 'me@example.com', password: 'another-pass' });
    expect(dupe.json().error.code).toBe('EMAIL_TAKEN');

    const out = await call('POST', '/api/v1/auth/logout', login.json().token);
    expect(out.statusCode).toBe(204);
    expect((await call('GET', '/api/v1/me', login.json().token)).statusCode).toBe(401);
  });

  it('rate-limits repeated credential attempts', async () => {
    let last = 0;
    for (let i = 0; i < 11; i++) {
      last = (await call('POST', '/api/v1/auth/login', undefined, { email: 'x@y.dev', password: 'nope-nope' })).statusCode;
    }
    expect(last).toBe(429);
  });

  it('locks premium cats until unlocked with PURR', async () => {
    const token = await guest();
    const me = (await call('GET', '/api/v1/me', token)).json();
    expect(me.unlockedCatIds.sort()).toEqual(['black', 'orange', 'tuxedo']);
    expect(me.purr).toBe(0);

    const locked = await call('POST', '/api/v1/commitments', token, commitmentBody('mochi'));
    expect(locked.statusCode).toBe(403);
    expect(locked.json().error.code).toBe('CAT_LOCKED');

    const broke = await call('POST', '/api/v1/shop/unlock', token, { catId: 'mochi' });
    expect(broke.json().error.code).toBe('INSUFFICIENT_PURR');

    const bought = await call('POST', '/api/v1/shop/checkout', token, { packId: 'purr_150' });
    expect(bought.json()).toMatchObject({ status: 'credited', purr: 150 });

    const unlocked = await call('POST', '/api/v1/shop/unlock', token, { catId: 'mochi' });
    expect(unlocked.statusCode).toBe(200);
    expect(unlocked.json().purr).toBe(0);

    const twice = await call('POST', '/api/v1/shop/unlock', token, { catId: 'mochi' });
    expect(twice.json().error.code).toBe('ALREADY_OWNED');

    expect((await call('POST', '/api/v1/commitments', token, commitmentBody('mochi'))).statusCode).toBe(201);
    const shop = (await call('GET', '/api/v1/shop', token)).json();
    expect(shop.cats.find((c: { id: string }) => c.id === 'mochi').owned).toBe(true);
    expect(shop.cats.find((c: { id: string }) => c.id === 'yuki').owned).toBe(false);
  });

  it('admin logs in through the admin entrance and has every cat', async () => {
    expect(await ensureAdmin(prisma, { ...getEnv(), ADMIN_EMAIL: ADMIN.email, ADMIN_PASSWORD: ADMIN.password })).toBe('created');
    expect(await ensureAdmin(prisma, { ...getEnv(), ADMIN_EMAIL: ADMIN.email, ADMIN_PASSWORD: ADMIN.password })).toBe('unchanged');

    // A normal user cannot use the admin entrance.
    const userToken = await guest();
    await call('POST', '/api/v1/auth/register', userToken, { email: 'user@test.dev', password: 'user-pass-123' });
    const denied = await call('POST', '/api/v1/auth/admin/login', undefined, { email: 'user@test.dev', password: 'user-pass-123' });
    expect(denied.statusCode).toBe(401);

    const login = await call('POST', '/api/v1/auth/admin/login', undefined, ADMIN);
    expect(login.statusCode).toBe(200);
    const token = login.json().token;
    expect(login.json().role).toBe('ADMIN');

    const me = (await call('GET', '/api/v1/me', token)).json();
    expect(me.unlockedCatIds).toHaveLength(8);
    expect((await call('POST', '/api/v1/commitments', token, commitmentBody('yuki'))).statusCode).toBe(201);

    const grant = await call('POST', '/api/v1/admin/purr/grant', token, { email: 'user@test.dev', amount: 500 });
    expect(grant.json()).toMatchObject({ email: 'user@test.dev', purr: 500 });
    expect((await call('GET', '/api/v1/admin/stats', token)).json().accounts).toBe(2);

    // Non-admins get 403 from admin routes.
    const userLogin = await call('POST', '/api/v1/auth/login', undefined, { email: 'user@test.dev', password: 'user-pass-123' });
    expect((await call('GET', '/api/v1/admin/stats', userLogin.json().token)).statusCode).toBe(403);
  });

  it('records focus sessions server-side and caps claimed time', async () => {
    const token = await guest();
    const c = (await call('POST', '/api/v1/commitments', token, commitmentBody('orange'))).json().commitment;
    const res = await call('POST', '/api/v1/focus/sessions', token, {
      commitmentId: c.id,
      catId: 'orange',
      durationSec: 1500,
      startedAtISO: new Date(clock.now() - 1500 * 1000).toISOString(),
    });
    expect(res.statusCode).toBe(201);

    // Claims 3h of focus but only started 10 minutes ago → capped.
    const capped = await call('POST', '/api/v1/focus/sessions', token, {
      catId: 'orange',
      durationSec: 3 * 3600,
      startedAtISO: new Date(clock.now() - 600 * 1000).toISOString(),
    });
    expect(capped.json().durationSec).toBeLessThanOrEqual(1200);

    const summary = (await call('GET', '/api/v1/focus/summary', token)).json();
    expect(summary.byCommitment[c.id]).toBe(1500);
    expect(summary.totalSec).toBe(1500 + capped.json().durationSec);

    const locked = await call('POST', '/api/v1/focus/sessions', token, {
      catId: 'yuki',
      durationSec: 60,
      startedAtISO: new Date(clock.now() - 60_000).toISOString(),
    });
    expect(locked.json().error.code).toBe('CAT_LOCKED');
  });

  it('rejects push subscriptions when VAPID is not configured', async () => {
    const token = await guest();
    expect((await call('GET', '/api/v1/push/public-key')).json().publicKey).toBeFalsy();
    const res = await call('POST', '/api/v1/push/subscribe', token, {
      endpoint: 'https://push.example.com/abc',
      keys: { p256dh: 'x'.repeat(87), auth: 'y'.repeat(22) },
    });
    expect(res.json().error.code).toBe('PUSH_UNAVAILABLE');
  });

  it('sends security headers', async () => {
    const res = await call('GET', '/api/v1/healthz');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['cache-control']).toBe('no-store');
  });
});
