import { createPublicKey, verify, type JsonWebKey } from 'node:crypto';
import { AppError } from '../errors.js';

/**
 * Verifies a "Sign in with Google" ID token (a JWT signed by Google) without any
 * extra dependency: fetch Google's public keys, check the RS256 signature, then
 * the claims. Spec: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
 */

export const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);
/** Tolerated clock difference between Google and this server. */
const SKEW_S = 60;

export interface GoogleProfile {
  /** Stable Google account id. */
  sub: string;
  /** Lower-cased. */
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  /**
   * Google only vouches for an email's *current* ownership for @gmail.com and
   * Workspace (hd) accounts. Other addresses were checked once, at sign-up.
   */
  emailAuthoritative: boolean;
}

interface Jwk extends JsonWebKey {
  kid?: string;
}

export type FetchCerts = () => Promise<{ keys: Jwk[]; maxAgeMs: number }>;

async function fetchGoogleCerts(): Promise<{ keys: Jwk[]; maxAgeMs: number }> {
  const res = await fetch(GOOGLE_CERTS_URL, { signal: AbortSignal.timeout(5000), redirect: 'error' });
  if (!res.ok) throw new Error(`Google certs: HTTP ${res.status}`);
  const body = (await res.json()) as { keys?: Jwk[] };
  const maxAge = /max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')?.[1];
  return { keys: body.keys ?? [], maxAgeMs: Math.min(Number(maxAge ?? 3600), 24 * 3600) * 1000 };
}

function invalid(): AppError {
  return new AppError('INVALID_CREDENTIALS', undefined, 'Google sign-in failed. Please try again.');
}

function decodePart(part: string | undefined): Record<string, unknown> {
  if (!part) throw invalid();
  try {
    const value: unknown = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
    if (!value || typeof value !== 'object') throw new Error('not an object');
    return value as Record<string, unknown>;
  } catch {
    throw invalid();
  }
}

export function createGoogleVerifier(fetchCerts: FetchCerts = fetchGoogleCerts, now: () => number = Date.now) {
  let cache: { keys: Jwk[]; expires: number; fetchedAt: number } | null = null;
  let inflight: Promise<void> | null = null;

  function refresh(): Promise<void> {
    inflight ??= fetchCerts()
      .then(fresh => {
        cache = { keys: fresh.keys, expires: now() + fresh.maxAgeMs, fetchedAt: now() };
      })
      .catch(() => {
        throw new AppError('INTERNAL', undefined, 'Could not reach Google. Please try again.');
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  }

  async function keyFor(kid: string): Promise<Jwk | undefined> {
    const stale = !cache || cache.expires <= now();
    // An unknown kid may mean Google rotated its keys — but refetch at most once a
    // minute, so made-up kids can't make us hammer Google.
    const unknown = cache !== null && !cache.keys.some(k => k.kid === kid) && now() - cache.fetchedAt > 60_000;
    if (stale || unknown) await refresh();
    return cache?.keys.find(k => k.kid === kid);
  }

  return async function verifyGoogleIdToken(idToken: string, clientId: string): Promise<GoogleProfile> {
    const parts = idToken.split('.');
    if (parts.length !== 3) throw invalid();
    const [h, p, sig] = parts as [string, string, string];
    const header = decodePart(h);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw invalid();

    const jwk = await keyFor(header.kid);
    if (!jwk) throw invalid();
    const ok = verify(
      'RSA-SHA256',
      Buffer.from(`${h}.${p}`),
      createPublicKey({ key: jwk, format: 'jwk' }),
      Buffer.from(sig, 'base64url'),
    );
    if (!ok) throw invalid();

    const c = decodePart(p);
    const nowS = Math.floor(now() / 1000);
    if (typeof c.iss !== 'string' || !ISSUERS.has(c.iss)) throw invalid();
    if (c.aud !== clientId) throw invalid();
    if (typeof c.exp !== 'number' || c.exp + SKEW_S < nowS) throw invalid();
    if (typeof c.iat === 'number' && c.iat - SKEW_S > nowS) throw invalid();
    if (typeof c.sub !== 'string' || c.sub.length === 0 || c.sub.length > 255) throw invalid();
    if (typeof c.email !== 'string' || c.email_verified !== true) {
      throw new AppError('INVALID_CREDENTIALS', undefined, 'Your Google account email is not verified.');
    }
    const name = typeof c.name === 'string' ? c.name.slice(0, 80) : null;
    const email = c.email.trim().toLowerCase();
    const emailAuthoritative = email.endsWith('@gmail.com') || (typeof c.hd === 'string' && c.hd.length > 0);
    const part = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 40) : null);
    const firstName = part(c.given_name) ?? (name ? part(name.split(/\s+/)[0]) : null);
    return { sub: c.sub, email, name, firstName, lastName: part(c.family_name), emailAuthoritative };
  };
}

/** Shared verifier for the app (keeps Google's keys cached between requests). */
export const verifyGoogleIdToken = createGoogleVerifier();
