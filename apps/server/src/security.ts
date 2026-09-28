import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';

/** 256-bit random bearer token, URL-safe. Only the client ever sees it. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/** What we store in the Session table instead of the raw token. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

// scrypt parameters (OWASP-recommended baseline). Encoded into every hash so
// they can be raised later without breaking existing passwords.
const N = 16_384;
const R = 8;
const P = 1;
const KEYLEN = 64;

function scrypt(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, KEYLEN, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

/** Format: scrypt$N$r$p$saltB64$hashB64 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, N, R, P);
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) {
    // Burn comparable time so "no such user" is not distinguishable by timing.
    await scrypt(password, randomBytes(16), N, R, P);
    return false;
  }
  const [scheme, n, r, p, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), Number(n), Number(r), Number(p));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
