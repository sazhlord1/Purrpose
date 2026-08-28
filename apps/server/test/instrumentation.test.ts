import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { clock } from '../src/clock.js';
import { checkDatabase, getPrisma } from '../src/db.js';

const prisma = getPrisma();
const dbReady = await checkDatabase(prisma);

let app: FastifyInstance;
let token: string;

async function wipe() {
  await prisma.creditTransaction.deleteMany({});
  await prisma.commitment.deleteMany({});
  await prisma.creditBalance.deleteMany({});
  await prisma.appEvent.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
}

async function eventNames(): Promise<Record<string, number>> {
  const rows = await prisma.appEvent.groupBy({ by: ['name'], _count: { name: true } });
  return Object.fromEntries(rows.map(r => [r.name, r._count.name]));
}

describe.skipIf(!dbReady)('AppEvent instrumentation', () => {
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
    const session = await app.inject({ method: 'POST', url: '/api/v1/session' });
    token = session.json().token;
  });

  it('emits the full validation event set across the commitment lifecycle', async () => {
    const headers = { authorization: `Bearer ${token}` };

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/commitments',
      headers,
      payload: {
        title: 'Instrument me',
        deadlineISO: new Date(clock.now() + 3_600_000).toISOString(),
        catId: 'orange',
        consequenceType: 'MEALS',
        consequenceAmount: 3,
      },
    });
    expect(created.statusCode).toBe(201);
    const id = created.json().commitment.id;

    await app.inject({
      method: 'GET',
      url: `/api/v1/commitments/${id}`,
      headers,
    });

    const done = await app.inject({
      method: 'POST',
      url: `/api/v1/commitments/${id}/complete`,
      headers,
    });
    expect(done.statusCode).toBe(200);

    await app.inject({
      method: 'POST',
      url: '/api/v1/wallet/topup',
      headers,
      payload: { creditType: 'MEALS', amount: 2 },
    });

    const names = await eventNames();
    expect(names.session_started).toBeGreaterThanOrEqual(1);
    expect(names.commitment_created).toBe(1);
    expect(names.detail_opened).toBe(1);
    expect(names.commitment_completed).toBe(1);
    expect(names.topup).toBe(1);
  });

  it('emits commitment_failed exactly once through settlement', async () => {
    const headers = { authorization: `Bearer ${token}` };
    const commitment = await prisma.commitment.create({
      data: {
        userId: (await prisma.session.findUniqueOrThrow({ where: { token } })).userId,
        title: 'Doomed instrument',
        deadline: new Date(clock.now() - 60_000),
        catId: 'orange',
        consequenceType: 'MEALS',
        consequenceAmount: 2,
        createdAt: new Date(clock.now() - 120_000),
      },
    });

    await Promise.all([
      app.inject({ method: 'GET', url: '/api/v1/commitments', headers }),
      app.inject({ method: 'GET', url: '/api/v1/commitments', headers }),
      app.inject({ method: 'GET', url: `/api/v1/commitments/${commitment.id}`, headers }),
    ]);

    const names = await eventNames();
    expect(names.commitment_failed).toBe(1);
  });
});
