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

describe.skipIf(!dbReady)('Mutation rate limiting', () => {
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
    await prisma.cat.upsert({
      where: { id: 'orange' },
      update: {},
      create: { id: 'orange', name: 'Miso', type: 'ORANGE', personality: 'chaotic', config: {} },
    });
    const session = await app.inject({ method: 'POST', url: '/api/v1/session' });
    token = session.json().token;
  });

  it('allows 30 mutations per minute then returns 429, reads exempt', async () => {
    for (let i = 0; i < 30; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/wallet/topup',
        headers: { authorization: `Bearer ${token}` },
        payload: { creditType: 'MEALS', amount: 1 },
      });
      expect(res.statusCode).toBe(200);
    }

    const blocked = await app.inject({
      method: 'POST',
      url: '/api/v1/wallet/topup',
      headers: { authorization: `Bearer ${token}` },
      payload: { creditType: 'MEALS', amount: 1 },
    });
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json().error.code).toBe('RATE_LIMITED');
    expect(blocked.json().error.details.retryAfterMs).toBeGreaterThan(0);

    const read = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(read.statusCode).toBe(200);
    expect(read.json().balances[0].amount).toBe(40);
  });

  it('tracks buckets per token independently', async () => {
    const other = await app.inject({ method: 'POST', url: '/api/v1/session' });
    const otherToken = other.json().token;

    for (let i = 0; i < 30; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/wallet/topup',
        headers: { authorization: `Bearer ${token}` },
        payload: { creditType: 'MEALS', amount: 1 },
      });
    }

    const otherRes = await app.inject({
      method: 'POST',
      url: '/api/v1/wallet/topup',
      headers: { authorization: `Bearer ${otherToken}` },
      payload: { creditType: 'MEALS', amount: 1 },
    });
    expect(otherRes.statusCode).toBe(200);
  });
});
