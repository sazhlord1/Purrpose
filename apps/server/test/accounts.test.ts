import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { clock } from '../src/clock.js';
import { checkDatabase, getPrisma } from '../src/db.js';
import { getEnv } from '../src/env.js';
import { hashToken } from '../src/security.js';
import { ensureAdmin, googleSignIn } from '../src/services/accounts.js';
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

    const reg = await call('POST', '/api/v1/auth/register', token, { email: ' Me@Example.com ', password: 'hunter2hunter2', firstName: 'Test', lastName: 'Cat' });
    expect(reg.statusCode).toBe(200);
    const accountToken = reg.json().token;
    expect(reg.json().email).toBe('me@example.com');
    // Old guest token is rotated out.
    expect((await call('GET', '/api/v1/me', token)).statusCode).toBe(401);

    const me = (await call('GET', '/api/v1/me', accountToken)).json();
    expect(me.user.email).toBe('me@example.com');
    expect(me.user.firstName).toBe('Test');
    expect(me.user.role).toBe('USER');
    expect((await call('GET', '/api/v1/commitments', accountToken)).json().commitments).toHaveLength(1);

    const bad = await call('POST', '/api/v1/auth/login', undefined, { email: 'me@example.com', password: 'wrong-password' });
    expect(bad.statusCode).toBe(401);
    expect(bad.json().error.code).toBe('INVALID_CREDENTIALS');

    const login = await call('POST', '/api/v1/auth/login', undefined, { email: 'me@example.com', password: 'hunter2hunter2' });
    expect(login.statusCode).toBe(200);
    expect((await call('GET', '/api/v1/commitments', login.json().token)).json().commitments).toHaveLength(1);

    const dupe = await call('POST', '/api/v1/auth/register', await guest(), { email: 'me@example.com', password: 'another-pass', firstName: 'Test', lastName: 'Cat' });
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
    await call('POST', '/api/v1/auth/register', userToken, { email: 'user@test.dev', password: 'user-pass-123', firstName: 'Test', lastName: 'Cat' });
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

  it('moves guest progress into the account on password sign-in (welcome credits not doubled)', async () => {
    // An existing account, made on another device.
    const first = await guest();
    await call('POST', '/api/v1/auth/register', first, { email: 'owner@test.dev', password: 'owner-pass-123', firstName: 'Test', lastName: 'Cat' });
    const account = await prisma.user.findUniqueOrThrow({ where: { email: 'owner@test.dev' } });
    const mealsBefore = (await prisma.creditBalance.findUniqueOrThrow({
      where: { userId_creditType: { userId: account.id, creditType: 'MEALS' } },
    })).amount;

    // New device: play as a guest for a while.
    const g = await guest();
    expect((await call('POST', '/api/v1/commitments', g, commitmentBody('orange'))).statusCode).toBe(201);
    await call('POST', '/api/v1/wallet/topup', g, { creditType: 'MEALS', amount: 5 });
    await call('POST', '/api/v1/shop/checkout', g, { packId: 'purr_150' });
    expect((await call('POST', '/api/v1/shop/unlock', g, { catId: 'mochi' })).statusCode).toBe(200);
    const guestId = (await call('GET', '/api/v1/me', g)).json().user.id;

    const login = await call('POST', '/api/v1/auth/login', g, { email: 'owner@test.dev', password: 'owner-pass-123' });
    expect(login.statusCode).toBe(200);
    const t = login.json().token;

    expect((await call('GET', '/api/v1/commitments', t)).json().commitments).toHaveLength(1);
    expect((await call('GET', '/api/v1/me', t)).json().unlockedCatIds).toContain('mochi');
    const meals = await prisma.creditBalance.findUniqueOrThrow({
      where: { userId_creditType: { userId: account.id, creditType: 'MEALS' } },
    });
    expect(meals.amount).toBe(mealsBefore + 5); // the top-up came along, the guest's welcome gift did not
    expect(await prisma.user.findUnique({ where: { id: guestId } })).toBeNull();
    expect((await call('GET', '/api/v1/me', g)).statusCode).toBe(401);
  });

  it('never merges one real account into another', async () => {
    const a = await guest();
    await call('POST', '/api/v1/auth/register', a, { email: 'a@test.dev', password: 'a-pass-1234', firstName: 'Test', lastName: 'Cat' });
    const b = await guest();
    const bReg = await call('POST', '/api/v1/auth/register', b, { email: 'b@test.dev', password: 'b-pass-1234', firstName: 'Test', lastName: 'Cat' });
    const bToken = bReg.json().token;
    expect((await call('POST', '/api/v1/commitments', bToken, commitmentBody('orange'))).statusCode).toBe(201);

    const switched = await call('POST', '/api/v1/auth/login', bToken, { email: 'a@test.dev', password: 'a-pass-1234' });
    expect(switched.statusCode).toBe(200);
    expect((await call('GET', '/api/v1/commitments', switched.json().token)).json().commitments).toHaveLength(0);
    const bUser = await prisma.user.findUniqueOrThrow({ where: { email: 'b@test.dev' } });
    expect(await prisma.commitment.count({ where: { userId: bUser.id } })).toBe(1);
  });

  it('Google sign-in turns this device\'s guest into an account', async () => {
    const g = await guest();
    await call('POST', '/api/v1/commitments', g, commitmentBody('orange'));
    const res = await googleSignIn(prisma, getEnv(), { sub: 'g-1', email: 'new@gmail.com', name: 'New', emailAuthoritative: true, firstName: null, lastName: null }, hashToken(g));
    const me = (await call('GET', '/api/v1/me', res.token)).json();
    expect(me.user.email).toBe('new@gmail.com');
    expect((await call('GET', '/api/v1/commitments', res.token)).json().commitments).toHaveLength(1);
    expect((await call('GET', '/api/v1/me', g)).statusCode).toBe(401);

    // Same Google account later, from a fresh device with its own guest progress.
    const g2 = await guest();
    await call('POST', '/api/v1/commitments', g2, commitmentBody('orange'));
    const again = await googleSignIn(prisma, getEnv(), { sub: 'g-1', email: 'new@gmail.com', name: 'New', emailAuthoritative: true, firstName: null, lastName: null }, hashToken(g2));
    expect(again.userId).toBe(res.userId);
    expect((await call('GET', '/api/v1/commitments', again.token)).json().commitments).toHaveLength(2);
  });

  it('linking Google to an unverified password account drops that password', async () => {
    const squatter = await guest();
    await call('POST', '/api/v1/auth/register', squatter, { email: 'victim@gmail.com', password: 'squatter-pw-1', firstName: 'Test', lastName: 'Cat' });

    const res = await googleSignIn(prisma, getEnv(), { sub: 'g-victim', email: 'victim@gmail.com', name: 'V', emailAuthoritative: true, firstName: null, lastName: null });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: res.userId } });
    expect(user.googleId).toBe('g-victim');
    expect(user.passwordHash).toBeNull();
    expect(user.emailVerifiedAt).not.toBeNull();
    // The squatter's sessions and password no longer work.
    const squat = await call('POST', '/api/v1/auth/login', undefined, { email: 'victim@gmail.com', password: 'squatter-pw-1' });
    expect(squat.statusCode).toBe(401);
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(1);
  });

  it('a non-Gmail Google account cannot unlock an existing password account', async () => {
    const owner = await guest();
    await call('POST', '/api/v1/auth/register', owner, { email: 'alice@company.com', password: 'alice-pass-12', firstName: 'Test', lastName: 'Cat' });
    await expect(
      googleSignIn(prisma, getEnv(), { sub: 'g-x', email: 'alice@company.com', name: 'X', emailAuthoritative: false, firstName: null, lastName: null }),
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN' });
    const alice = await prisma.user.findUniqueOrThrow({ where: { email: 'alice@company.com' } });
    expect(alice.passwordHash).not.toBeNull();
    expect(alice.googleId).toBeNull();
  });

  it('the admin can sign in with their real Gmail and stays admin (password kept)', async () => {
    const env = { ...getEnv(), ADMIN_EMAIL: ADMIN.email, ADMIN_PASSWORD: ADMIN.password };
    await ensureAdmin(prisma, env);
    const profile = { sub: 'g-admin', email: ADMIN.email, name: 'A', emailAuthoritative: true, firstName: null, lastName: null };
    const res = await googleSignIn(prisma, env, profile);
    expect(res.role).toBe('ADMIN');
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN.email } });
    expect(admin.googleId).toBe('g-admin');
    expect(admin.passwordHash).not.toBeNull();
    // A Google account that can't prove it owns the admin address is turned away.
    await expect(
      googleSignIn(prisma, env, { ...profile, sub: 'g-other', emailAuthoritative: false }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
