import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { clock } from '../src/clock.js';
import { checkDatabase, getPrisma } from '../src/db.js';
import { wipeDatabase } from './helpers.js';
import type { ConsequenceType } from '@purrpose/shared';

const prisma = getPrisma();
const dbReady = await checkDatabase(prisma);

let app: FastifyInstance;

type InjectOptions = {
  token?: string;
  body?: object;
};

async function api(method: 'GET' | 'POST' | 'DELETE', url: string, opts: InjectOptions = {}) {
  return app.inject({
    method,
    url,
    headers: opts.token ? { authorization: `Bearer ${opts.token}` } : {},
    payload: opts.body,
  });
}

async function wipe() {
  await wipeDatabase(prisma);
}

async function newSession(): Promise<{ token: string; userId: string }> {
  const res = await api('POST', '/api/v1/session');
  expect(res.statusCode).toBe(200);
  const body = res.json();
  return { token: body.token, userId: body.userId };
}

function balanceOf(balances: Array<{ creditType: string; amount: number }>, type: string) {
  return balances.find(b => b.creditType === type)?.amount ?? 0;
}

describe.skipIf(!dbReady)('Purrpose API', () => {
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
  });

  it('exposes a public health endpoint', async () => {
    const res = await api('GET', '/api/v1/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true });
  });

  it('rejects unauthenticated access', async () => {
    const res = await api('GET', '/api/v1/me');
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');
  });

  it('bootstraps an anonymous session with an exact-once starter grant', async () => {
    const { token } = await newSession();
    const me = (await api('GET', '/api/v1/me', { token })).json();
    expect(balanceOf(me.balances, 'MEALS')).toBe(10);
    expect(balanceOf(me.balances, 'DRY_FOOD')).toBe(2);
    expect(balanceOf(me.balances, 'VET_CARE')).toBe(1);
    for (const b of me.balances) {
      expect(b.available).toBe(b.amount);
      expect(b.stakedActive).toBe(0);
    }
    const cats = (await api('GET', '/api/v1/cats')).json();
    expect(cats.cats.map((c: { id: string }) => c.id)).toEqual(['black', 'boba', 'mochi', 'orange', 'oreo', 'pepper', 'tuxedo', 'yuki']);
    expect([...cats.freeCatIds].sort()).toEqual(['black', 'orange', 'tuxedo']);
  });

  it('creates commitments and enforces availability atomically', async () => {
    const { token } = await newSession();
    const ok = await api('POST', '/api/v1/commitments', {
      token,
      body: {
        title: 'Finish YouTube video',
        deadlineISO: new Date(clock.now() + 30 * 24 * 3_600_000).toISOString(),
        catId: 'orange',
        consequenceType: 'MEALS',
        consequenceAmount: 5,
      },
    });
    expect(ok.statusCode).toBe(201);
    expect(ok.json().commitment.status).toBe('ACTIVE');

    const denied = await api('POST', '/api/v1/commitments', {
      token,
      body: {
        title: 'Overstake',
        deadlineISO: new Date(clock.now() + 24 * 3_600_000).toISOString(),
        catId: 'black',
        consequenceType: 'MEALS',
        consequenceAmount: 6,
      },
    });
    expect(denied.statusCode).toBe(409);
    expect(denied.json().error.code).toBe('INSUFFICIENT_AVAILABLE');
    expect(denied.json().error.details.available).toBe(5);

    const badInput = await api('POST', '/api/v1/commitments', {
      token,
      body: { title: '', deadlineISO: 'nope', catId: 'orange', consequenceType: 'MEALS', consequenceAmount: 1 },
    });
    expect(badInput.statusCode).toBe(400);
    expect(badInput.json().error.code).toBe('INVALID_INPUT');
  });

  it('escapes phases over time and settles failure exactly once on read', async () => {
    const { token, userId } = await newSession();
    const deadlineMs = clock.now() + 30 * 24 * 3_600_000;
    const created = await api('POST', '/api/v1/commitments', {
      token,
      body: {
        title: 'Write thesis',
        deadlineISO: new Date(deadlineMs).toISOString(),
        catId: 'tuxedo',
        consequenceType: 'MEALS',
        consequenceAmount: 3,
      },
    });
    const id = created.json().commitment.id;

    expect((await api('GET', '/api/v1/commitments', { token })).json().commitments[0].phase).toBe(
      'INITIAL',
    );

    clock.advance(61_000);
    expect((await api('GET', '/api/v1/commitments', { token })).json().commitments[0].phase).toBe(
      'WAITING',
    );

    clock.advance(13 * 24 * 3_600_000);
    expect((await api('GET', `/api/v1/commitments/${id}`, { token })).json().commitment.phase).toBe(
      'ANTICIPATING',
    );

    clock.advance(12 * 24 * 3_600_000);
    expect((await api('GET', `/api/v1/commitments/${id}`, { token })).json().commitment.phase).toBe(
      'VERY_CLOSE',
    );

    clock.advance(6 * 24 * 3_600_000);
    const settledList = (await api('GET', '/api/v1/commitments', { token })).json();
    expect(settledList.commitments[0].status).toBe('FAILED');

    const me = (await api('GET', '/api/v1/me', { token })).json();
    expect(balanceOf(me.balances, 'MEALS')).toBe(7);

    const deductions = await prisma.creditTransaction.count({
      where: { commitmentId: id, type: 'FAILURE_DEDUCTION' },
    });
    expect(deductions).toBe(1);

    const history = (await api('GET', '/api/v1/history', { token })).json();
    expect(history.totals.failed).toBe(1);
    expect(history.totals.donatedByType.MEALS).toBe(3);

    void userId;
  });

  it('completes once, keeps credits intact, and rejects duplicates', async () => {
    const { token } = await newSession();
    const created = await api('POST', '/api/v1/commitments', {
      token,
      body: {
        title: 'Clean desk',
        deadlineISO: new Date(clock.now() + 2 * 3_600_000).toISOString(),
        catId: 'black',
        consequenceType: 'MEALS',
        consequenceAmount: 2,
      },
    });
    const id = created.json().commitment.id;

    const done = await api('POST', `/api/v1/commitments/${id}/complete`, { token });
    expect(done.statusCode).toBe(200);
    expect(done.json().commitment.status).toBe('COMPLETED');

    const stakedAfter = (await api('GET', '/api/v1/me', { token })).json().balances.find(
      (b: { creditType: string }) => b.creditType === 'MEALS',
    );
    expect(stakedAfter.amount).toBe(10);
    expect(stakedAfter.stakedActive).toBe(0);
    expect(stakedAfter.available).toBe(10);

    const dup = await api('POST', `/api/v1/commitments/${id}/complete`, { token });
    expect(dup.statusCode).toBe(409);
    expect(dup.json().error.code).toBe('ALREADY_SETTLED');

    const history = (await api('GET', '/api/v1/history', { token })).json();
    expect(history.totals.completed).toBe(1);
    expect(history.totals.donatedByType.MEALS).toBe(0);
  });

  it('arbitrates complete-vs-settle races into exactly one failure deduction', async () => {
    const { token, userId } = await newSession();
    const deadline = new Date(clock.now() - 60_000);
    const commitment = await prisma.commitment.create({
      data: {
        userId,
        title: 'Already late',
        deadline,
        catId: 'orange',
        consequenceType: 'MEALS' as ConsequenceType,
        consequenceAmount: 4,
        createdAt: new Date(clock.now() - 120_000),
      },
    });

    const [completeRes, listRes] = await Promise.all([
      api('POST', `/api/v1/commitments/${commitment.id}/complete`, { token }),
      api('GET', '/api/v1/commitments', { token }),
    ]);

    expect(completeRes.statusCode).toBe(409);
    expect(completeRes.json().error.code).toBe('FAILED_AT_DEADLINE');
    expect(listRes.statusCode).toBe(200);
    expect(['ACTIVE', 'FAILED']).toContain(listRes.json().commitments[0].status);

    const settled = (await api('GET', '/api/v1/commitments', { token })).json();
    expect(settled.commitments[0].status).toBe('FAILED');

    const deductions = await prisma.creditTransaction.count({
      where: { commitmentId: commitment.id, type: 'FAILURE_DEDUCTION' },
    });
    expect(deductions).toBe(1);
    expect(balanceOf((await api('GET', '/api/v1/me', { token })).json().balances, 'MEALS')).toBe(6);
  });

  it('supports concurrent settlements without double deduction', async () => {
    const { token, userId } = await newSession();
    const commitment = await prisma.commitment.create({
      data: {
        userId,
        title: 'Late twice over',
        deadline: new Date(clock.now() - 60_000),
        catId: 'tuxedo',
        consequenceType: 'MEALS' as ConsequenceType,
        consequenceAmount: 5,
        createdAt: new Date(clock.now() - 120_000),
      },
    });

    const results = await Promise.all(
      Array.from({ length: 4 }, () => api('GET', '/api/v1/commitments', { token })),
    );
    for (const r of results) expect(r.statusCode).toBe(200);

    const deductions = await prisma.creditTransaction.count({
      where: { commitmentId: commitment.id, type: 'FAILURE_DEDUCTION' },
    });
    expect(deductions).toBe(1);
    expect(balanceOf((await api('GET', '/api/v1/me', { token })).json().balances, 'MEALS')).toBe(5);
  });

  it('allows grace deletion only inside the five-minute window', async () => {
    const { token } = await newSession();
    const created = await api('POST', '/api/v1/commitments', {
      token,
      body: {
        title: 'Typo commitment',
        deadlineISO: new Date(clock.now() + 24 * 3_600_000).toISOString(),
        catId: 'orange',
        consequenceType: 'VET_CARE',
        consequenceAmount: 1,
      },
    });
    const id = created.json().commitment.id;

    const gone = await api('DELETE', `/api/v1/commitments/${id}`, { token });
    expect(gone.statusCode).toBe(204);

    const again = await api('DELETE', `/api/v1/commitments/${id}`, { token });
    expect(again.statusCode).toBe(404);

    const stale = await api('POST', '/api/v1/commitments', {
      token,
      body: {
        title: 'Stale commitment',
        deadlineISO: new Date(clock.now() + 48 * 3_600_000).toISOString(),
        catId: 'orange',
        consequenceType: 'MEALS',
        consequenceAmount: 1,
      },
    });
    clock.advance(10 * 60_000);
    const expired = await api('DELETE', `/api/v1/commitments/${stale.json().commitment.id}`, {
      token,
    });
    expect(expired.statusCode).toBe(409);
    expect(expired.json().error.code).toBe('GRACE_EXPIRED');
  });

  it('tops up credits and ledgers the movement', async () => {
    const { token } = await newSession();
    const res = await api('POST', '/api/v1/wallet/topup', {
      token,
      body: { creditType: 'MEALS', amount: 7 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().amount).toBe(17);

    const invalid = await api('POST', '/api/v1/wallet/topup', {
      token,
      body: { creditType: 'MEALS', amount: 0 },
    });
    expect(invalid.statusCode).toBe(400);

    const history = (await api('GET', '/api/v1/history', { token })).json();
    expect(history.entries.some((e: { type: string }) => e.type === 'TOPUP')).toBe(true);
  });
});
