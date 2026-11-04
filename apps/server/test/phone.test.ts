import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { phoneSchema } from '@purrpose/shared';
import { buildApp } from '../src/app.js';
import { clock } from '../src/clock.js';
import { checkDatabase, getPrisma } from '../src/db.js';
import { resetEnvCache } from '../src/env.js';
import { resetSmsSender } from '../src/routes/auth.js';
import { consoleOutbox, makeSmsSender } from '../src/services/sms.js';
import { getEnv } from '../src/env.js';
import { wipeDatabase } from './helpers.js';

describe('phone numbers', () => {
  it('accepts only 09… numbers with 11 digits (Persian digits and spaces are fine)', () => {
    expect(phoneSchema.parse('09121234567')).toBe('09121234567');
    expect(phoneSchema.parse('۰۹۱۲ ۱۲۳ ۴۵۶۷')).toBe('09121234567');
    expect(phoneSchema.parse('0912-123-4567')).toBe('09121234567');
    for (const bad of ['+989121234567', '9121234567', '0912123456', '091212345678', '08121234567', 'abc']) {
      expect(phoneSchema.safeParse(bad).success).toBe(false);
    }
  });

  it('kavenegar and sms.ir senders call the right endpoints', async () => {
    const calls: Array<{ url: string; init?: { method?: string; headers?: Record<string, string>; body?: string } }> = [];
    const ok = (body: unknown) => async (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => {
      calls.push({ url, init });
      return { ok: true, status: 200, text: async () => JSON.stringify(body) };
    };
    const base = { ...getEnv(), NODE_ENV: 'production' as const, SMS_API_KEY: 'KEY', SMS_CODE_PARAM: 'CODE' };

    const kave = makeSmsSender({ ...base, SMS_PROVIDER: 'kavenegar', SMS_TEMPLATE: 'purrpose' }, ok({ return: { status: 200 } }));
    await kave!.sendCode('09121234567', '12345');
    expect(calls[0]!.url).toBe('https://api.kavenegar.com/v1/KEY/verify/lookup.json?receptor=09121234567&token=12345&template=purrpose');

    const smsir = makeSmsSender({ ...base, SMS_PROVIDER: 'smsir', SMS_TEMPLATE: '123456' }, ok({ status: 1 }));
    await smsir!.sendCode('09121234567', '12345');
    expect(calls[1]!.url).toBe('https://api.sms.ir/v1/send/verify');
    expect(calls[1]!.init?.headers?.['x-api-key']).toBe('KEY');
    expect(JSON.parse(calls[1]!.init!.body!)).toEqual({ mobile: '09121234567', templateId: 123456, parameters: [{ name: 'CODE', value: '12345' }] });

    const ipp = makeSmsSender(
      { ...base, SMS_PROVIDER: 'ippanel', SMS_TEMPLATE: 'pat123', SMS_FROM: '3000505', SMS_CODE_PARAM: 'code' },
      ok({ data: { message_outbox_ids: [1] }, meta: { status: true, message_code: '200-1' } }),
    );
    await ipp!.sendCode('09121234567', '12345');
    expect(calls[2]!.url).toBe('https://edge.ippanel.com/v1/api/send');
    expect(calls[2]!.init?.headers?.authorization).toBe('KEY');
    expect(JSON.parse(calls[2]!.init!.body!)).toEqual({
      sending_type: 'pattern',
      from_number: '+983000505',
      code: 'pat123',
      recipients: ['+989121234567'],
      params: { code: '12345' },
    });
    // No sender line, no IPPanel.
    expect(makeSmsSender({ ...base, SMS_PROVIDER: 'ippanel', SMS_TEMPLATE: 'pat123', SMS_FROM: undefined })).toBeNull();

    // A gateway that says no is an error, not a silent success.
    const refused = makeSmsSender({ ...base, SMS_PROVIDER: 'smsir', SMS_TEMPLATE: '1' }, ok({ status: 0, message: 'no credit' }));
    await expect(refused!.sendCode('09121234567', '12345')).rejects.toMatchObject({ code: 'SMS_FAILED' });

    // The console provider is refused in production; nothing is set up without a key.
    expect(makeSmsSender({ ...base, SMS_PROVIDER: 'console' })).toBeNull();
    expect(makeSmsSender({ ...base, SMS_PROVIDER: 'kavenegar', SMS_API_KEY: undefined, SMS_TEMPLATE: 'x' })).toBeNull();
  });
});

const prisma = getPrisma();
const dbReady = await checkDatabase(prisma);
let app: FastifyInstance;

async function call(method: 'GET' | 'POST', url: string, token?: string, body?: object) {
  return app.inject({ method, url, headers: token ? { authorization: `Bearer ${token}` } : {}, payload: body });
}

const PHONE = '09121234567';

async function codeFor(phone: string): Promise<string> {
  const r = await call('POST', '/api/v1/auth/phone/send', undefined, { phone });
  expect(r.statusCode).toBe(200);
  return consoleOutbox.get(phone)!;
}

describe.skipIf(!dbReady)('sign in with a phone number', () => {
  const previous = process.env.SMS_PROVIDER;
  beforeAll(async () => {
    process.env.SMS_PROVIDER = 'console';
    resetEnvCache();
    resetSmsSender();
    app = await buildApp();
  });
  afterAll(async () => {
    if (previous === undefined) delete process.env.SMS_PROVIDER;
    else process.env.SMS_PROVIDER = previous;
    resetEnvCache();
    resetSmsSender();
    await app?.close();
    await prisma.$disconnect();
  });
  beforeEach(async () => {
    clock.reset();
    consoleOutbox.clear();
    await wipeDatabase(prisma);
  });

  it('is switched on and refuses numbers that are not 09… with 11 digits', async () => {
    expect((await call('GET', '/api/v1/auth/phone')).json()).toEqual({ enabled: true });
    expect((await call('POST', '/api/v1/auth/phone/send', undefined, { phone: '9121234567' })).statusCode).toBe(400);
    expect((await call('POST', '/api/v1/auth/phone/send', undefined, { phone: '+989121234567' })).statusCode).toBe(400);
  });

  it('turns this device’s guest into the account, keeping its pacts', async () => {
    const guest = (await call('POST', '/api/v1/session')).json().token as string;
    const pact = await call('POST', '/api/v1/commitments', guest, {
      title: 'Ship it',
      deadlineISO: new Date(clock.now() + 24 * 3_600_000).toISOString(),
      catId: 'orange',
      mode: 'HONOR',
    });
    expect(pact.statusCode).toBe(201);

    const code = await codeFor(PHONE);
    expect(code).toMatch(/^\d{5}$/);
    const res = await call('POST', '/api/v1/auth/phone/verify', guest, { phone: PHONE, code });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.isNew).toBe(true);
    expect(body.phone).toBe(PHONE);

    const me = (await call('GET', '/api/v1/me', body.token)).json();
    expect(me.user.phone).toBe(PHONE);
    expect((await call('GET', '/api/v1/commitments', body.token)).json().commitments).toHaveLength(1);

    // Name after the code.
    expect((await call('POST', '/api/v1/me/name', body.token, { firstName: 'سارا', lastName: '' })).statusCode).toBe(200);
    expect((await call('GET', '/api/v1/me', body.token)).json().user.firstName).toBe('سارا');

    // The old guest token is gone; the code can't be used twice.
    expect((await call('GET', '/api/v1/me', guest)).statusCode).toBe(401);
    expect((await call('POST', '/api/v1/auth/phone/verify', undefined, { phone: PHONE, code })).json().error.code).toBe('CODE_INVALID');
  });

  it('signs in to the existing account from another device, bringing that device’s guest progress', async () => {
    const first = (await call('POST', '/api/v1/auth/phone/verify', undefined, { phone: PHONE, code: await codeFor(PHONE) })).json();
    expect(first.isNew).toBe(true);

    clock.advance(61_000);
    const otherDevice = (await call('POST', '/api/v1/session')).json().token as string;
    await call('POST', '/api/v1/commitments', otherDevice, {
      title: 'Read a chapter',
      deadlineISO: new Date(clock.now() + 24 * 3_600_000).toISOString(),
      catId: 'orange',
      mode: 'HONOR',
    });
    const again = await call('POST', '/api/v1/auth/phone/verify', otherDevice, { phone: PHONE, code: await codeFor(PHONE) });
    expect(again.statusCode).toBe(200);
    expect(again.json().isNew).toBe(false);
    expect(again.json().userId).toBe(first.userId);
    expect(await prisma.user.count({ where: { phone: PHONE } })).toBe(1);
  });

  it('limits resends and wrong guesses', async () => {
    const code = await codeFor(PHONE);
    // Asking again within a minute is refused.
    expect((await call('POST', '/api/v1/auth/phone/send', undefined, { phone: PHONE })).statusCode).toBe(429);

    const wrong = code === '00000' ? '11111' : '00000';
    for (let i = 0; i < 5; i++) {
      const r = await call('POST', '/api/v1/auth/phone/verify', undefined, { phone: PHONE, code: wrong });
      expect(r.json().error.code).toBe('CODE_INVALID');
    }
    // After 5 wrong tries even the right code stops working.
    expect((await call('POST', '/api/v1/auth/phone/verify', undefined, { phone: PHONE, code })).json().error.code).toBe('CODE_INVALID');
  });

  it('a code expires after 3 minutes', async () => {
    const code = await codeFor(PHONE);
    await prisma.phoneCode.update({ where: { phone: PHONE }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await call('POST', '/api/v1/auth/phone/verify', undefined, { phone: PHONE, code })).json().error.code).toBe('CODE_INVALID');
  });

  it('a witness can be picked by mobile number and decides after signing in with it', async () => {
    const WITNESS = '09351234567';
    const owner = (await call('POST', '/api/v1/auth/phone/verify', undefined, { phone: PHONE, code: await codeFor(PHONE) })).json().token as string;
    // Persian digits are fine; the owner's own number is refused.
    const mine = await call('POST', '/api/v1/commitments', owner, {
      title: 'Ship the report',
      deadlineISO: new Date(clock.now() + 24 * 3_600_000).toISOString(),
      catId: 'tuxedo',
      mode: 'STRICT',
      consequenceType: 'MEALS',
      consequenceAmount: 1,
      donationConsent: true,
      witnessEmail: PHONE,
    });
    expect(mine.json().error.code).toBe('WITNESS_IS_YOU');
    const res = await call('POST', '/api/v1/commitments', owner, {
      title: 'Ship the report',
      deadlineISO: new Date(clock.now() + 24 * 3_600_000).toISOString(),
      catId: 'tuxedo',
      mode: 'STRICT',
      consequenceType: 'MEALS',
      consequenceAmount: 1,
      donationConsent: true,
      witnessEmail: '۰۹۳۵ ۱۲۳ ۴۵۶۷',
    });
    expect(res.statusCode).toBe(201);
    const pact = res.json().commitment;
    expect(pact.witnessEmail).toBe(WITNESS);

    const stranger = (await call('POST', '/api/v1/session')).json().token as string;
    expect((await call('GET', `/api/v1/witness/${pact.witnessToken}`, stranger)).json().witness.isWitness).toBe(false);

    const friend = (await call('POST', '/api/v1/auth/phone/verify', undefined, { phone: WITNESS, code: await codeFor(WITNESS) })).json().token as string;
    expect((await call('GET', `/api/v1/witness/${pact.witnessToken}`, friend)).json().witness.isWitness).toBe(true);
  });
});
