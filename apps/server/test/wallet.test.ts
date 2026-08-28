import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { clock } from '../src/clock.js';
import { checkDatabase, getPrisma } from '../src/db.js';
import type { ConsequenceType } from '@purrpose/shared';

const prisma = getPrisma();
const dbReady = await checkDatabase(prisma);

let app: FastifyInstance;
let token: string;

async function seedCats() {
  await prisma.cat.upsert({
    where: { id: 'orange' },
    update: {},
    create: { id: 'orange', name: 'Miso', type: 'ORANGE', personality: 'chaotic', config: {} },
  });
}

async function wipe() {
  await prisma.creditTransaction.deleteMany({});
  await prisma.commitment.deleteMany({});
  await prisma.creditBalance.deleteMany({});
  await prisma.appEvent.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
}

async function call(method: 'GET' | 'POST', url: string, body?: unknown) {
  return app.inject({
    method,
    url,
    headers: { authorization: `Bearer ${token}` },
    ...(body !== undefined ? { payload: body } : {}),
  });
}

async function mealsBalance() {
  const res = await call('GET', '/api/v1/me');
  return res.json().balances.find((b: { creditType: string }) => b.creditType === 'MEALS');
}

describe.skipIf(!dbReady)('Wallet economy', () => {
  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app?.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    clock.reset();
    await wipe();
    await seedCats();
    const session = await app.inject({ method: 'POST', url: '/api/v1/session' });
    token = session.json().token;
  });

  it('accumulates repeated top-ups and ledgers every movement', async () => {
    const first = await call('POST', '/api/v1/wallet/topup', { creditType: 'MEALS', amount: 5 });
    expect(first.statusCode).toBe(200);
    expect(first.json().amount).toBe(15);

    const second = await call('POST', '/api/v1/wallet/topup', { creditType: 'MEALS', amount: 7 });
    expect(second.json().amount).toBe(22);

    const history = (await call('GET', '/api/v1/history')).json();
    const topups = history.entries.filter((e: { type: string }) => e.type === 'TOPUP');
    expect(topups).toHaveLength(2);
    expect(topups.map((t: { amount: number }) => t.amount).sort()).toEqual([5, 7]);
  });

  it('recreates a missing balance row on demand', async () => {
    await prisma.creditBalance.delete({
      where: { userId_creditType: { userId: (await prisma.session.findUniqueOrThrow({ where: { token } })).userId, creditType: 'VET_CARE' } },
    });
    const res = await call('POST', '/api/v1/wallet/topup', { creditType: 'VET_CARE', amount: 3 });
    expect(res.statusCode).toBe(200);
    expect(res.json().amount).toBe(3);
  });

  it('handles concurrent top-ups atomically', async () => {
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        call('POST', '/api/v1/wallet/topup', { creditType: 'MEALS', amount: 2 }),
      ),
    );
    for (const r of results) expect(r.statusCode).toBe(200);
    expect((await mealsBalance()).amount).toBe(18);

    const ledger = await prisma.creditTransaction.count({
      where: { type: 'TOPUP', creditType: 'MEALS' },
    });
    expect(ledger).toBe(4);
  });

  it('keeps balance − active stakes = available through a full stake lifecycle', async () => {
    const deadline = new Date(clock.now() + 3_600_000).toISOString();
    const created = await call('POST', '/api/v1/commitments', {
      title: 'Stake six',
      deadlineISO: deadline,
      catId: 'orange',
      consequenceType: 'MEALS' as ConsequenceType,
      consequenceAmount: 6,
    });
    expect(created.statusCode, created.body).toBe(201);
    let meals = await mealsBalance();
    expect(meals).toMatchObject({ amount: 10, stakedActive: 6, available: 4 });

    const over = await call('POST', '/api/v1/commitments', {
      title: 'Stake five more',
      deadlineISO: deadline,
      catId: 'orange',
      consequenceType: 'MEALS',
      consequenceAmount: 5,
    });
    expect(over.statusCode).toBe(409);
    expect(over.json().error.details.available).toBe(4);

    const id = created.json().commitment.id;
    const done = await call('POST', `/api/v1/commitments/${id}/complete`);
    expect(done.statusCode).toBe(200);
    meals = await mealsBalance();
    expect(meals).toMatchObject({ amount: 10, stakedActive: 0, available: 10 });

    const second = await call('POST', '/api/v1/commitments', {
      title: 'Stake everything',
      deadlineISO: deadline,
      catId: 'black',
      consequenceType: 'MEALS',
      consequenceAmount: 10,
    });
    expect(second.statusCode).toBe(201);

    clock.advance(2 * 3_600_000);
    await call('GET', '/api/v1/commitments');
    meals = await mealsBalance();
    expect(meals).toMatchObject({ amount: 0, stakedActive: 0, available: 0 });

    const blocked = await call('POST', '/api/v1/wallet/topup', { creditType: 'MEALS', amount: 0 });
    expect(blocked.statusCode).toBe(400);
  });
});
