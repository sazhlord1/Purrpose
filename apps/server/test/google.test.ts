import { generateKeyPairSync, sign, type KeyObject } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createGoogleVerifier } from '../src/services/google.js';

const CLIENT = 'test-client.apps.googleusercontent.com';
const NOW = 1_800_000_000_000;

function keypair(kid: string) {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return { kid, privateKey, jwk: { ...publicKey.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig' } };
}

function token(privateKey: KeyObject, kid: string, claims: Record<string, unknown>, alg = 'RS256'): string {
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const head = `${enc({ alg, kid, typ: 'JWT' })}.${enc(claims)}`;
  return `${head}.${sign('RSA-SHA256', Buffer.from(head), privateKey).toString('base64url')}`;
}

const good = (over: Record<string, unknown> = {}) => ({
  iss: 'https://accounts.google.com',
  aud: CLIENT,
  sub: '1234567890',
  email: 'Cat.Lover@Gmail.com',
  email_verified: true,
  name: 'Cat Lover',
  iat: NOW / 1000 - 10,
  exp: NOW / 1000 + 3600,
  ...over,
});

describe('Google ID token verification', () => {
  const k = keypair('k1');
  let fetches = 0;
  const verify = createGoogleVerifier(async () => {
    fetches += 1;
    return { keys: [k.jwk], maxAgeMs: 3_600_000 };
  }, () => NOW);

  it('accepts a valid token and normalises the email', async () => {
    const p = await verify(token(k.privateKey, 'k1', good()), CLIENT);
    expect(p).toEqual({ sub: '1234567890', email: 'cat.lover@gmail.com', name: 'Cat Lover', emailAuthoritative: true });
  });

  it('trusts the email only for Gmail and Workspace accounts', async () => {
    const other = await verify(token(k.privateKey, 'k1', good({ email: 'me@company.com' })), CLIENT);
    expect(other.emailAuthoritative).toBe(false);
    const workspace = await verify(token(k.privateKey, 'k1', good({ email: 'me@company.com', hd: 'company.com' })), CLIENT);
    expect(workspace.emailAuthoritative).toBe(true);
  });

  it('does not refetch keys for every unknown kid', async () => {
    const before = fetches;
    await expect(verify(token(k.privateKey, 'made-up-1', good()), CLIENT)).rejects.toBeTruthy();
    await expect(verify(token(k.privateKey, 'made-up-2', good()), CLIENT)).rejects.toBeTruthy();
    expect(fetches).toBe(before);
  });

  it('caches Google keys between calls', async () => {
    const before = fetches;
    await verify(token(k.privateKey, 'k1', good()), CLIENT);
    await verify(token(k.privateKey, 'k1', good()), CLIENT);
    expect(fetches).toBe(before);
  });

  it.each([
    ['another app', { aud: 'someone-else' }],
    ['a foreign issuer', { iss: 'https://evil.example' }],
    ['an expired token', { exp: NOW / 1000 - 3600 }],
    ['a token from the future', { iat: NOW / 1000 + 3600 }],
    ['an unverified email', { email_verified: false }],
    ['no subject', { sub: '' }],
  ])('rejects %s', async (_label, over) => {
    await expect(verify(token(k.privateKey, 'k1', good(over)), CLIENT)).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('rejects a token signed by someone else', async () => {
    const forger = keypair('k1');
    await expect(verify(token(forger.privateKey, 'k1', good()), CLIENT)).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('rejects a tampered payload', async () => {
    const [h, , s] = token(k.privateKey, 'k1', good()).split('.');
    const forged = Buffer.from(JSON.stringify(good({ email: 'victim@gmail.com' }))).toString('base64url');
    await expect(verify(`${h}.${forged}.${s}`, CLIENT)).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('rejects other algorithms, unknown keys and garbage', async () => {
    await expect(verify(token(k.privateKey, 'k1', good(), 'none'), CLIENT)).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(verify(token(k.privateKey, 'nope', good()), CLIENT)).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(verify('not.a.jwt', CLIENT)).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(verify('abc', CLIENT)).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });
});
