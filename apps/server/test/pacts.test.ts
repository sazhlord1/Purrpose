import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { clock } from '../src/clock.js';
import { checkDatabase, getPrisma } from '../src/db.js';
import { getEnv, resetEnvCache } from '../src/env.js';
import { ensureAdmin } from '../src/services/accounts.js';
import { makeCommitmentEngine } from '../src/services/commitments.js';
import { wipeDatabase } from './helpers.js';

const prisma = getPrisma();
const dbReady = await checkDatabase(prisma);
let app: FastifyInstance;

async function call(method: 'GET' | 'POST' | 'DELETE', url: string, token?: string, body?: object) {
  return app.inject({ method, url, headers: token ? { authorization: `Bearer ${token}` } : {}, payload: body });
}
const guest = async () => (await call('POST', '/api/v1/session')).json().token as string;
const me = async (token: string) => (await call('GET', '/api/v1/me', token)).json();
const meals = async (token: string) =>
  (await me(token)).balances.find((b: { creditType: string }) => b.creditType === 'MEALS');
async function register(email: string, firstName = 'Sam'): Promise<string> {
  const token = await guest();
  const res = await call('POST', '/api/v1/auth/register', token, { email, password: 'pass-word-123', firstName, lastName: 'Cat' });
  expect(res.statusCode).toBe(200);
  return res.json().token;
}

const honor = (purrStake?: number) => ({
  title: 'Read 20 pages',
  deadlineISO: new Date(clock.now() + 24 * 3_600_000).toISOString(),
  catId: 'orange',
  mode: 'HONOR',
  ...(purrStake ? { purrStake } : {}),
});
const strict = (witnessEmail?: string) => ({
  title: 'Ship the report',
  deadlineISO: new Date(clock.now() + 24 * 3_600_000).toISOString(),
  catId: 'tuxedo',
  mode: 'STRICT',
  consequenceType: 'MEALS',
  consequenceAmount: 3,
  donationConsent: true,
  ...(witnessEmail ? { witnessEmail } : {}),
});
/** 1×1 transparent PNG. */
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe.skipIf(!dbReady)('Honor and strict pacts', () => {
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

  it('gives new players 120 PURR and no food, and shows the welcome once', async () => {
    process.env.STARTER_FOOD = 'false';
    resetEnvCache();
    try {
      const token = await guest();
      const first = await me(token);
      expect(first.purr).toBe(120);
      expect(first.welcomePurr).toBe(120);
      expect(first.balances.every((b: { amount: number }) => b.amount === 0)).toBe(true);
      expect((await call('POST', '/api/v1/me/welcome-seen', token)).statusCode).toBe(200);
      const again = await me(token);
      expect(again.welcomePurr).toBeNull();
      expect(again.purr).toBe(120); // never granted twice
    } finally {
      process.env.STARTER_FOOD = 'true';
      resetEnvCache();
    }
  });

  it('honor pacts: three starters at 40 PURR, +10 for each kept, the stake is lost on a miss', async () => {
    const token = await guest();
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await call('POST', '/api/v1/commitments', token, honor(15)); // starters ignore the asked stake
      expect(res.statusCode).toBe(201);
      expect(res.json().commitment).toMatchObject({ mode: 'HONOR', purrStake: 40, starter: true, proofRequired: false });
      ids.push(res.json().commitment.id);
    }
    expect((await me(token)).purrStaked).toBe(120);
    // Nothing left to stake.
    const broke = await call('POST', '/api/v1/commitments', token, honor(10));
    expect(broke.json().error.code).toBe('INSUFFICIENT_PURR');

    // Kept: stake unlocks and the bonus arrives.
    const kept = await call('POST', `/api/v1/commitments/${ids[0]}/complete`, token);
    expect(kept.json().commitment.status).toBe('COMPLETED');
    let now = await me(token);
    expect(now.purr).toBe(130);
    expect(now.purrStaked).toBe(80);
    await call('POST', `/api/v1/commitments/${ids[1]}/complete`, token);

    // Missed: the third one's stake is gone.
    clock.advance(25 * 3_600_000);
    const list = (await call('GET', '/api/v1/commitments', token)).json().commitments;
    expect(list.find((c: { id: string }) => c.id === ids[2]).status).toBe('FAILED');
    now = await me(token);
    expect(now.purr).toBe(100); // 120 + 10 + 10 − 40
    expect(now.purrStaked).toBe(0);

    // After the starters: any stake ≥ 10, no bonus.
    const fourth = await call('POST', '/api/v1/commitments', token, honor(25));
    expect(fourth.json().commitment).toMatchObject({ purrStake: 25, starter: false });
    await call('POST', `/api/v1/commitments/${fourth.json().commitment.id}/complete`, token);
    expect((await me(token)).purr).toBe(100);
  });

  it('PURR locked in honor pacts cannot be spent in the shop', async () => {
    const token = await guest();
    for (let i = 0; i < 3; i++) await call('POST', '/api/v1/commitments', token, honor());
    await call('POST', '/api/v1/shop/checkout', token, { packId: 'purr_150' }); // sandbox: 270 PURR, 120 locked
    const yuki = await call('POST', '/api/v1/shop/unlock', token, { catId: 'yuki' }); // 250 > 150 free
    expect(yuki.json().error.code).toBe('INSUFFICIENT_PURR');
    const mochi = await call('POST', '/api/v1/shop/unlock', token, { catId: 'mochi' }); // 150 ≤ 150 free
    expect(mochi.statusCode).toBe(200);
  });

  it('strict pacts need a proof; the witness decides', async () => {
    const owner = await register('owner@test.dev', 'Ava');
    const same = await call('POST', '/api/v1/commitments', owner, strict('Owner@Test.dev'));
    expect(same.json().error.code).toBe('WITNESS_IS_YOU');

    const created = await call('POST', '/api/v1/commitments', owner, strict('friend@test.dev'));
    expect(created.statusCode).toBe(201);
    const pact = created.json().commitment;
    expect(pact).toMatchObject({ mode: 'STRICT', proofRequired: true, witnessEmail: 'friend@test.dev' });
    expect(pact.witnessToken).toBeTruthy();

    const plain = await call('POST', `/api/v1/commitments/${pact.id}/complete`, owner);
    expect(plain.json().error.code).toBe('PROOF_REQUIRED');

    const proof = await call('POST', `/api/v1/commitments/${pact.id}/proof`, owner, {
      text: 'Sent it to the team at 5pm',
      image: { type: 'image/png', data: PNG },
    });
    expect(proof.statusCode).toBe(200);
    expect(proof.json().commitment.status).toBe('ACTIVE');
    expect(proof.json().commitment.proofSubmittedAtISO).toBeTruthy();
    const wrongType = await call('POST', `/api/v1/commitments/${pact.id}/proof`, owner, { text: 'again' });
    expect(wrongType.json().error.code).toBe('ALREADY_SETTLED');

    // Waiting for review: the deadline passing does not fail it, and the food stays locked.
    clock.advance(25 * 3_600_000);
    const listed = (await call('GET', '/api/v1/commitments', owner)).json().commitments[0];
    expect(listed.status).toBe('ACTIVE');
    expect((await meals(owner)).stakedActive).toBe(3);

    // The owner sees the page but can't judge their own proof.
    const asOwner = (await call('GET', `/api/v1/witness/${pact.witnessToken}`, owner)).json().witness;
    expect(asOwner).toMatchObject({ isOwner: true, isWitness: false, title: 'Ship the report', ownerName: 'Ava' });
    expect((await call('POST', `/api/v1/witness/${pact.witnessToken}/review`, owner, { approve: true })).json().error.code).toBe('NOT_WITNESS');

    // Someone else with the link but another email can't either.
    const stranger = await register('stranger@test.dev');
    expect((await call('POST', `/api/v1/witness/${pact.witnessToken}/review`, stranger, { approve: true })).statusCode).toBe(403);

    const friend = await register('friend@test.dev', 'Bo');
    const view = (await call('GET', `/api/v1/witness/${pact.witnessToken}`, friend)).json().witness;
    expect(view).toMatchObject({ isWitness: true, proof: { text: 'Sent it to the team at 5pm', hasImage: true } });
    const img = await call('GET', `/api/v1/witness/${pact.witnessToken}/image`, friend);
    expect(img.statusCode).toBe(200);
    expect(img.headers['content-type']).toBe('image/png');

    const rejected = await call('POST', `/api/v1/witness/${pact.witnessToken}/review`, friend, { approve: false, note: 'No screenshot of the email' });
    expect(rejected.statusCode).toBe(200);
    const after = (await call('GET', `/api/v1/commitments/${pact.id}`, owner)).json().commitment;
    expect(after).toMatchObject({ status: 'FAILED', reviewedBy: 'witness', reviewNote: 'No screenshot of the email' });
    const m = await meals(owner);
    expect(m.amount).toBe(7); // 10 − 3 went to the cats
    expect((await call('POST', `/api/v1/witness/${pact.witnessToken}/review`, friend, { approve: true })).json().error.code).toBe('ALREADY_SETTLED');
  });

  it('a strict pact needs the donation box ticked, and the consent is recorded', async () => {
    const owner = await register('consent@test.dev');
    const unticked = { ...strict(), donationConsent: undefined };
    const refused = await call('POST', '/api/v1/commitments', owner, unticked);
    expect(refused.statusCode).toBe(400);
    expect(refused.json().error.details.fieldErrors.donationConsent).toBeTruthy();
    const ok = await call('POST', '/api/v1/commitments', owner, strict());
    expect(ok.statusCode).toBe(201);
    const ev = await prisma.appEvent.findFirst({ where: { name: 'commitment_created', payload: { path: ['commitmentId'], equals: ok.json().commitment.id } } });
    expect(ev?.payload).toMatchObject({ donationConsent: true, consentText: 'donation-v1' });
    // Honor pacts don't need it.
    expect((await call('POST', '/api/v1/commitments', owner, honor())).statusCode).toBe(201);
  });

  it('a rejected proof can be appealed once within 3 days; the admin can overturn it', async () => {
    const owner = await register('appeal@test.dev');
    const friend = await register('judge@test.dev');
    const make = async () => {
      const p = (await call('POST', '/api/v1/commitments', owner, strict('judge@test.dev'))).json().commitment;
      await call('POST', `/api/v1/commitments/${p.id}/proof`, owner, { text: 'Did the whole thing' });
      await call('POST', `/api/v1/witness/${p.witnessToken}/review`, friend, { approve: false, note: 'Not convinced' });
      return p.id as string;
    };
    const a = await make();
    const b = await make();
    expect((await meals(owner)).amount).toBe(4); // 10 − 3 − 3

    const detail = (await call('GET', `/api/v1/commitments/${a}`, owner)).json().commitment;
    expect(detail.appeal).toBeNull();
    expect(detail.appealUntilISO).toBeTruthy();
    expect((await call('POST', `/api/v1/commitments/${a}/appeal`, owner, { text: 'short' })).statusCode).toBe(400);
    const sent = await call('POST', `/api/v1/commitments/${a}/appeal`, owner, { text: 'I did send it, here is why the witness missed it.' });
    expect(sent.statusCode).toBe(200);
    expect(sent.json().appeal.status).toBe('pending');
    expect((await call('POST', `/api/v1/commitments/${a}/appeal`, owner, { text: 'Once more, please look again.' })).json().error.code).toBe('APPEAL_CLOSED');

    // Too late for the second one.
    clock.advance(3 * 24 * 3_600_000 + 60_000);
    expect((await call('POST', `/api/v1/commitments/${b}/appeal`, owner, { text: 'I did send it, honestly I did.' })).json().error.code).toBe('APPEAL_CLOSED');
    expect((await call('GET', `/api/v1/commitments/${b}`, owner)).json().commitment.appealUntilISO).toBeNull();

    const env = { ...getEnv(), ADMIN_EMAIL: 'boss@test.dev', ADMIN_PASSWORD: 'boss-pass-123' };
    await ensureAdmin(prisma, env);
    const admin = (await call('POST', '/api/v1/auth/admin/login', undefined, { email: 'boss@test.dev', password: 'boss-pass-123' })).json().token;
    expect((await call('GET', '/api/v1/admin/appeals', owner)).statusCode).toBe(403);
    const list = (await call('GET', '/api/v1/admin/appeals', admin)).json().appeals;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: a, reviewNote: 'Not convinced', appeal: { status: 'pending' } });

    const decided = await call('POST', `/api/v1/admin/appeals/${a}`, admin, { overturn: true, note: 'Proof was fine' });
    expect(decided.json().appeal.status).toBe('overturned');
    const after = (await call('GET', `/api/v1/commitments/${a}`, owner)).json().commitment;
    expect(after).toMatchObject({ status: 'COMPLETED', appeal: { status: 'overturned', note: 'Proof was fine' } });
    expect((await meals(owner)).amount).toBe(7); // the 3 meals came back
    expect((await call('POST', `/api/v1/admin/appeals/${a}`, admin, { overturn: false })).json().error.code).toBe('ALREADY_SETTLED');
  });

  it('strict pacts without a witness go to the admin; undecided proofs are approved after 48h', async () => {
    const owner = await register('solo@test.dev');
    const a = (await call('POST', '/api/v1/commitments', owner, strict())).json().commitment;
    const b = (await call('POST', '/api/v1/commitments', owner, strict())).json().commitment;
    for (const p of [a, b]) {
      expect((await call('POST', `/api/v1/commitments/${p.id}/proof`, owner, { text: 'done and dusted' })).statusCode).toBe(200);
    }

    const env = { ...getEnv(), ADMIN_EMAIL: 'boss@test.dev', ADMIN_PASSWORD: 'boss-pass-123' };
    await ensureAdmin(prisma, env);
    const admin = (await call('POST', '/api/v1/auth/admin/login', undefined, { email: 'boss@test.dev', password: 'boss-pass-123' })).json().token;
    expect((await call('GET', '/api/v1/admin/reviews', owner)).statusCode).toBe(403);
    const queue = (await call('GET', '/api/v1/admin/reviews', admin)).json().reviews;
    expect(queue).toHaveLength(2);
    expect(queue[0]).toMatchObject({ witnessEmail: null, proof: { text: 'done and dusted', hasImage: false } });

    expect((await call('POST', `/api/v1/admin/reviews/${a.id}`, admin, { approve: true })).json().status).toBe('COMPLETED');

    const engine = makeCommitmentEngine(prisma, clock);
    clock.advance(47 * 3_600_000);
    expect(await engine.autoApproveDue()).toEqual([]);
    clock.advance(2 * 3_600_000);
    expect(await engine.autoApproveDue()).toEqual([b.id]);
    const done = (await call('GET', `/api/v1/commitments/${b.id}`, owner)).json().commitment;
    expect(done).toMatchObject({ status: 'COMPLETED', reviewedBy: 'auto' });
    expect((await meals(owner)).amount).toBe(10); // both kept: no food lost
  });

  it('free food top-ups are closed unless payments are in sandbox mode', async () => {
    const token = await guest();
    process.env.PAYMENTS_MODE = 'disabled';
    resetEnvCache();
    try {
      const res = await call('POST', '/api/v1/wallet/topup', token, { creditType: 'MEALS', amount: 5 });
      expect(res.json().error.code).toBe('PAYMENTS_UNAVAILABLE');
    } finally {
      process.env.PAYMENTS_MODE = 'sandbox';
      resetEnvCache();
    }
  });

  it("signing in on a device with guest play keeps the account's PURR honest", async () => {
    const account = await register('main@test.dev');
    await call('POST', '/api/v1/auth/logout', account);
    const device = await guest();
    // The guest uses its own welcome PURR on a starter pact.
    expect((await call('POST', '/api/v1/commitments', device, honor())).statusCode).toBe(201);
    const login = await call('POST', '/api/v1/auth/login', device, { email: 'main@test.dev', password: 'pass-word-123' });
    expect(login.statusCode).toBe(200);
    const after = await me(login.json().token);
    expect(after.purr).toBe(120); // the account's own welcome only
    expect(after.purrStaked).toBe(0); // the guest's free honor pact didn't come along
  });
});
