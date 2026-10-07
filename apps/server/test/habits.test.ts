import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { clock } from '../src/clock.js';
import { checkDatabase, getPrisma } from '../src/db.js';
import { getEnv } from '../src/env.js';
import { ensureAdmin } from '../src/services/accounts.js';
import { wipeDatabase } from './helpers.js';

const prisma = getPrisma();
const dbReady = await checkDatabase(prisma);
let app: FastifyInstance;

async function call(method: 'GET' | 'POST' | 'DELETE', url: string, token?: string, body?: object) {
  return app.inject({ method, url, headers: token ? { authorization: `Bearer ${token}` } : {}, payload: body });
}
const guest = async () => (await call('POST', '/api/v1/session')).json().token as string;
const meals = async (token: string) =>
  (await call('GET', '/api/v1/me', token)).json().balances.find((b: { creditType: string }) => b.creditType === 'MEALS');
const habitBody = { title: 'No sugar', catId: 'orange', consequenceType: 'MEALS', stakeAmount: 2, maxSlips: 4, durationDays: 7 };

describe.skipIf(!dbReady)('Detective Cheat habits', () => {
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

  it('stakes food, locks ½ meal per slip and closes the case on the 4th', async () => {
    const t = await guest();
    const created = await call('POST', '/api/v1/habits', t, habitBody);
    expect(created.statusCode).toBe(201);
    const id = created.json().habit.id;
    expect((await meals(t)).stakedActive).toBe(2);

    const one = (await call('POST', `/api/v1/habits/${id}/slip`, t)).json().habit;
    expect(one).toMatchObject({ slipCount: 1, locked: 0.5, status: 'ACTIVE' });
    await call('POST', `/api/v1/habits/${id}/slip`, t);
    await call('POST', `/api/v1/habits/${id}/slip`, t);
    const last = (await call('POST', `/api/v1/habits/${id}/slip`, t)).json().habit;
    expect(last).toMatchObject({ slipCount: 4, locked: 2, status: 'BROKEN', lostAmount: 2 });
    expect(last.slips).toHaveLength(4);

    const after = await meals(t);
    expect(after.amount).toBe(8); // starter 10 − 2
    expect(after.stakedActive).toBe(0);
    expect((await call('POST', `/api/v1/habits/${id}/slip`, t)).json().error.code).toBe('ALREADY_SETTLED');

    const history = (await call('GET', '/api/v1/history', t)).json();
    expect(history.totals.donatedByType.MEALS).toBe(2);
    expect(history.entries[0]).toMatchObject({ habitId: id, title: 'No sugar', amount: 2 });
  });

  it('when the period ends, the locked share goes to the cats and the rest comes back', async () => {
    const t = await guest();
    const id = (await call('POST', '/api/v1/habits', t, { ...habitBody, stakeAmount: 4 })).json().habit.id;
    await call('POST', `/api/v1/habits/${id}/slip`, t); // 1 of 4 → 1 meal locked
    clock.advance(8 * 24 * 3_600_000);
    const [h] = (await call('GET', '/api/v1/habits', t)).json().habits;
    expect(h).toMatchObject({ status: 'KEPT', lostAmount: 1 });
    const m = await meals(t);
    expect(m.amount).toBe(9);
    expect(m.stakedActive).toBe(0);
  });

  it("can't stake food that pacts already hold", async () => {
    const t = await guest();
    const big = await call('POST', '/api/v1/habits', t, { ...habitBody, stakeAmount: 9 });
    expect(big.statusCode).toBe(201);
    const pact = await call('POST', '/api/v1/commitments', t, {
      title: 'x',
      deadlineISO: new Date(clock.now() + 3_600_000).toISOString(),
      catId: 'orange',
      consequenceType: 'MEALS',
      consequenceAmount: 2,
    });
    expect(pact.json().error.code).toBe('INSUFFICIENT_AVAILABLE');
  });

  it('a fresh habit can be withdrawn, but not after a confession', async () => {
    const t = await guest();
    const a = (await call('POST', '/api/v1/habits', t, habitBody)).json().habit.id;
    expect((await call('DELETE', `/api/v1/habits/${a}`, t)).statusCode).toBe(204);
    const b = (await call('POST', '/api/v1/habits', t, habitBody)).json().habit.id;
    await call('POST', `/api/v1/habits/${b}/slip`, t);
    expect((await call('DELETE', `/api/v1/habits/${b}`, t)).json().error.code).toBe('GRACE_EXPIRED');
  });

  it("can't confess on someone else's habit", async () => {
    const owner = await guest();
    const id = (await call('POST', '/api/v1/habits', owner, habitBody)).json().habit.id;
    const other = await guest();
    expect((await call('POST', `/api/v1/habits/${id}/slip`, other)).statusCode).toBe(404);
  });

  it('admins can list registered users and open one user\'s pacts, habits and losses', async () => {
    const t = await guest();
    await call('POST', '/api/v1/auth/register', t, { email: 'sam@test.dev', password: 'sam-pass-123', firstName: 'Sam', lastName: 'Lee' });
    const login = await call('POST', '/api/v1/auth/login', undefined, { email: 'sam@test.dev', password: 'sam-pass-123' });
    const st = login.json().token;
    const id = (await call('POST', '/api/v1/habits', st, habitBody)).json().habit.id;
    await call('POST', `/api/v1/habits/${id}/slip`, st);
    await call('POST', '/api/v1/session'); // a guest, hidden by default

    const env = { ...getEnv(), ADMIN_EMAIL: 'boss@test.dev', ADMIN_PASSWORD: 'boss-pass-123' };
    await ensureAdmin(prisma, env);
    const admin = (await call('POST', '/api/v1/auth/admin/login', undefined, { email: 'boss@test.dev', password: 'boss-pass-123' })).json().token;

    expect((await call('GET', '/api/v1/admin/users', st)).statusCode).toBe(403);
    const list = (await call('GET', '/api/v1/admin/users?q=sam', admin)).json();
    expect(list.total).toBe(1);
    expect(list.users[0]).toMatchObject({ email: 'sam@test.dev', name: 'Sam Lee', habits: { active: 1, slips: 1 } });

    const detail = (await call('GET', `/api/v1/admin/users/${list.users[0].id}`, admin)).json();
    expect(detail.habits[0]).toMatchObject({ title: 'No sugar', slipCount: 1, locked: 0.5 });
    expect(detail.balances.find((b: { creditType: string }) => b.creditType === 'MEALS').stakedActive).toBe(2);
  });
});
