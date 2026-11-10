import { createHash, randomBytes } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { BAZAAR_PRODUCTS, type BazaarSku } from '@purrpose/shared';
import type { Env } from '../env.js';
import { AppError } from '../errors.js';
import { creditPurchase } from './payments.js';

/**
 * Cafe Bazaar in-app purchases (Iranian edition, Android app only).
 *
 * The app buys with Bazaar's own billing (Poolakey) and sends us the purchase token.
 * We ask Bazaar's developer API whether that token is a real, unrefunded purchase of that
 * product in our package, credit it once, and tell the app to consume it so it can be
 * bought again. One Payment row per token (id `bazaar:<token>`) makes crediting exactly-once:
 * a second verify of the same token (a retry, a restart, two taps) credits nothing.
 */

export const BAZAAR_BASE = 'https://pardakht.cafebazaar.ir/devapi/v2';
export const BAZAAR_API = `${BAZAAR_BASE}/api`;

/**
 * The "developer payload" the app sends with each purchase (Bazaar's security guide: use one
 * that identifies your own user, and check it on the server). Bazaar hands it back when we
 * validate the token, so a token bought by one account can't be claimed by another.
 */
export function bazaarPayload(userId: string): string {
  return `p1.${createHash('sha256').update(`purrpose-bazaar:${userId}`).digest('base64url').slice(0, 22)}`;
}

/** How we sign in to Bazaar's developer API: a panel API secret, or an OAuth client. */
export function bazaarAuthMode(env: Env): 'secret' | 'oauth' | 'none' {
  if (env.BAZAAR_API_SECRET) return 'secret';
  if (env.BAZAAR_CLIENT_ID && env.BAZAAR_CLIENT_SECRET) return 'oauth';
  return 'none';
}

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

const defaultFetch = (): FetchLike => fetch as unknown as FetchLike;

// ── OAuth client (the "client" made in the panel) ─────────────────────────────
// The admin connects once (admin page → Bazaar's consent page → our callback); the
// long-lived refresh token is kept in the database (an AppEvent, newest wins) and
// short-lived access tokens are fetched from it and cached in memory.

const TOKEN_EVENT = 'bazaar_oauth_token';
const STATE_EVENT = 'bazaar_oauth_state';
let accessCache: { token: string; expiresAt: number } | null = null;

export function resetBazaarTokenCache(): void {
  accessCache = null;
}

async function storedRefreshToken(prisma: PrismaClient): Promise<string | null> {
  const row = await prisma.appEvent.findFirst({ where: { name: TOKEN_EVENT }, orderBy: { createdAt: 'desc' } });
  const t = (row?.payload as { refreshToken?: unknown } | null)?.refreshToken;
  return typeof t === 'string' && t ? t : null;
}

/** Is buying through Bazaar switched on (the server can ask Bazaar about purchases)? */
export async function bazaarEnabled(prisma: PrismaClient, env: Env): Promise<boolean> {
  const mode = bazaarAuthMode(env);
  if (mode === 'secret') return true;
  if (mode === 'oauth') return (await storedRefreshToken(prisma)) !== null;
  return false;
}

/** The page on Bazaar where the admin approves our client. `state` ties the answer to this request. */
export function bazaarAuthorizeUrl(env: Env, state: string): string {
  const q = new URLSearchParams({
    response_type: 'code',
    access_type: 'offline',
    redirect_uri: env.BAZAAR_REDIRECT_URI,
    client_id: env.BAZAAR_CLIENT_ID ?? '',
    state,
  });
  return `${BAZAAR_BASE}/auth/authorize/?${q.toString()}`;
}

export async function startBazaarConnect(prisma: PrismaClient, env: Env, adminId: string): Promise<string> {
  if (bazaarAuthMode(env) !== 'oauth') {
    throw new AppError('PAYMENTS_UNAVAILABLE', undefined, 'Set BAZAAR_CLIENT_ID and BAZAAR_CLIENT_SECRET first');
  }
  const state = randomBytes(18).toString('base64url');
  await prisma.appEvent.create({ data: { userId: adminId, name: STATE_EVENT, payload: { state } } });
  return bazaarAuthorizeUrl(env, state);
}

async function tokenRequest(env: Env, form: Record<string, string>, fetchImpl: FetchLike) {
  let res: Awaited<ReturnType<FetchLike>>;
  try {
    res = await fetchImpl(`${BAZAAR_BASE}/auth/token/`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: new URLSearchParams({ client_id: env.BAZAAR_CLIENT_ID ?? '', client_secret: env.BAZAAR_CLIENT_SECRET ?? '', ...form }).toString(),
    });
  } catch (err) {
    console.error('[bazaar] token unreachable', err instanceof Error ? err.message : err);
    throw new AppError('PAYMENT_PROVIDER', undefined, 'Could not reach Cafe Bazaar. Try again in a moment.');
  }
  const text = await res.text();
  let body: { access_token?: string; refresh_token?: string; expires_in?: number; error?: string } = {};
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    /* handled below */
  }
  if (!res.ok || !body.access_token) {
    // Never log the tokens; the error name is enough.
    console.error(`[bazaar] token request failed: HTTP ${res.status} ${String(body.error ?? '').slice(0, 80)}`);
    throw new AppError('PAYMENT_PROVIDER', undefined, 'Cafe Bazaar refused the sign-in. Connect it again from the admin page.');
  }
  return body as { access_token: string; refresh_token?: string; expires_in?: number };
}

/**
 * Bazaar sent the admin back with a code: swap it for tokens and keep the refresh token.
 * The code must come back with a `state` we handed out in the last 15 minutes.
 */
export async function finishBazaarConnect(
  prisma: PrismaClient,
  env: Env,
  code: string,
  state: string | undefined,
  fetchImpl: FetchLike = defaultFetch(),
): Promise<void> {
  if (bazaarAuthMode(env) !== 'oauth') throw new AppError('PAYMENTS_UNAVAILABLE', undefined, 'Bazaar client is not set up');
  const since = new Date(Date.now() - 15 * 60_000);
  const asked = await prisma.appEvent.findFirst({
    where: { name: STATE_EVENT, createdAt: { gte: since }, ...(state ? { payload: { path: ['state'], equals: state } } : {}) },
    orderBy: { createdAt: 'desc' },
  });
  if (!asked) throw new AppError('FORBIDDEN', undefined, 'Start the connection from the admin page first');
  const tokens = await tokenRequest(env, { grant_type: 'authorization_code', code, redirect_uri: env.BAZAAR_REDIRECT_URI }, fetchImpl);
  if (!tokens.refresh_token) throw new AppError('PAYMENT_PROVIDER', undefined, 'Cafe Bazaar sent no refresh token. Connect again.');
  await prisma.$transaction([
    prisma.appEvent.create({ data: { userId: asked.userId, name: TOKEN_EVENT, payload: { refreshToken: tokens.refresh_token } } }),
    prisma.appEvent.deleteMany({ where: { name: STATE_EVENT } }),
  ]);
  accessCache = { token: tokens.access_token, expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000 - 60_000 };
}

async function accessToken(prisma: PrismaClient, env: Env, fetchImpl: FetchLike): Promise<string> {
  if (accessCache && accessCache.expiresAt > Date.now()) return accessCache.token;
  const refresh = await storedRefreshToken(prisma);
  if (!refresh) throw new AppError('PAYMENTS_UNAVAILABLE', undefined, 'Purchases are not available yet');
  const tokens = await tokenRequest(env, { grant_type: 'refresh_token', refresh_token: refresh }, fetchImpl);
  accessCache = { token: tokens.access_token, expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000 - 60_000 };
  return accessCache.token;
}

/** URL + headers for a developer-API call, signed in the way the server is set up. */
async function signed(prisma: PrismaClient, env: Env, url: string, fetchImpl: FetchLike) {
  const mode = bazaarAuthMode(env);
  if (mode === 'none') throw new AppError('PAYMENTS_UNAVAILABLE', undefined, 'Purchases are not available yet');
  const headers: Record<string, string> = { accept: 'application/json' };
  // The current method (Bazaar docs, "راه اندازی API (روش جدید)"): the panel token in this header.
  if (mode === 'secret') headers['CAFEBAZAAR-PISHKHAN-API-SECRET'] = env.BAZAAR_API_SECRET!;
  else url += `?access_token=${encodeURIComponent(await accessToken(prisma, env, fetchImpl))}`;
  return { url, headers, mode };
}

function parseJson(text: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(text) as unknown;
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** What Bazaar says about a purchase token. */
export interface BazaarPurchase {
  /** 0 = bought, 1 = refunded. */
  purchaseState: number;
  /** 0 = consumed, 1 = not consumed yet. */
  consumptionState: number;
  purchaseTime?: number;
  /** The payload the app sent when buying ('' when none). */
  developerPayload: string;
}

/** Looks the purchase up with Bazaar. null = Bazaar doesn't know this token for this product. */
export async function lookUpPurchase(
  prisma: PrismaClient,
  env: Env,
  sku: BazaarSku,
  token: string,
  fetchImpl: FetchLike = defaultFetch(),
): Promise<BazaarPurchase | null> {
  const req = await signed(
    prisma,
    env,
    `${BAZAAR_API}/validate/${encodeURIComponent(env.BAZAAR_PACKAGE_NAME)}/inapp/${encodeURIComponent(sku)}/purchases/${encodeURIComponent(token)}/`,
    fetchImpl,
  );
  let res: Awaited<ReturnType<FetchLike>>;
  try {
    res = await fetchImpl(req.url, { method: 'GET', headers: req.headers });
  } catch (err) {
    console.error('[bazaar] validate unreachable', err instanceof Error ? err.message : err);
    throw new AppError('PAYMENT_PROVIDER', undefined, 'Could not reach Cafe Bazaar. Try again in a moment.');
  }
  const text = await res.text();
  const body = parseJson(text);
  if (res.status === 404) {
    // Bazaar: only error "not_found" means the purchase never happened. "invalid_value"
    // (wrong package name or product id) is our set-up, not the buyer: keep the purchase
    // unconsumed so it is credited once the set-up is fixed.
    if (!body || body.error === 'not_found') return null;
    console.error(`[bazaar] validate set-up error: ${String(body.error)} ${String(body.error_description ?? '').slice(0, 120)}`);
    throw new AppError('PAYMENT_PROVIDER', undefined, 'Cafe Bazaar could not check this purchase. Try again in a moment.');
  }
  if (res.status === 401 && req.mode === 'oauth') accessCache = null; // next try fetches a fresh access token
  if (!res.ok) {
    console.error(`[bazaar] validate failed: HTTP ${res.status} ${text.slice(0, 200)}`);
    throw new AppError('PAYMENT_PROVIDER', undefined, 'Cafe Bazaar could not check this purchase. Try again in a moment.');
  }
  if (!body) throw new AppError('PAYMENT_PROVIDER', undefined, 'Cafe Bazaar sent an unreadable answer');
  const state = body.purchaseState;
  if (body.error || typeof state !== 'number') return null;
  const time = body.purchaseTime;
  const payload = body.developerPayload;
  return {
    purchaseState: state,
    consumptionState: Number(body.consumptionState ?? 1),
    purchaseTime: typeof time === 'number' ? time : undefined,
    developerPayload: typeof payload === 'string' ? payload : '',
  };
}

/**
 * Consumes the purchase on Bazaar's side too (POST /api/consume/<package>/purchases/), so it
 * can be bought again even if the app closes before its own consume. Best effort: the app
 * consumes as well, and "already_consumed" is fine.
 */
export async function consumeOnBazaar(prisma: PrismaClient, env: Env, token: string, fetchImpl: FetchLike = defaultFetch()): Promise<boolean> {
  try {
    const req = await signed(prisma, env, `${BAZAAR_API}/consume/${encodeURIComponent(env.BAZAAR_PACKAGE_NAME)}/purchases/`, fetchImpl);
    const res = await fetchImpl(req.url, {
      method: 'POST',
      headers: { ...req.headers, 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const text = await res.text();
    if (res.ok) return true;
    const body = parseJson(text);
    if (body?.error === 'already_consumed') return true;
    console.warn(`[bazaar] consume: HTTP ${res.status} ${String(body?.error ?? '').slice(0, 60)}`);
    return false;
  } catch (err) {
    console.warn('[bazaar] consume failed', err instanceof Error ? err.message : err);
    return false;
  }
}

/**
 * Admin self-test without spending money: ask Bazaar about a made-up token. With the right
 * key, package and product Bazaar answers 404 "not_found"; a wrong key gets 401/403, a
 * wrong package or product id gets "invalid_value".
 */
export async function checkBazaarSetup(
  prisma: PrismaClient,
  env: Env,
  fetchImpl: FetchLike = defaultFetch(),
): Promise<{ ok: boolean; problem?: 'off' | 'unreachable' | 'key' | 'package' | 'product' | 'unknown'; status?: number }> {
  if (!(await bazaarEnabled(prisma, env))) return { ok: false, problem: 'off' };
  let res: Awaited<ReturnType<FetchLike>>;
  try {
    const sku: BazaarSku = 'purr_150';
    const req = await signed(prisma, env, `${BAZAAR_API}/validate/${encodeURIComponent(env.BAZAAR_PACKAGE_NAME)}/inapp/${sku}/purchases/purrpose-setup-check/`, fetchImpl);
    res = await fetchImpl(req.url, { method: 'GET', headers: req.headers });
  } catch (err) {
    if (err instanceof AppError) return { ok: false, problem: 'key' };
    return { ok: false, problem: 'unreachable' };
  }
  const body = parseJson(await res.text());
  if (res.status === 404 && body?.error === 'not_found') return { ok: true, status: 404 };
  if (res.status === 401 || res.status === 403) return { ok: false, problem: 'key', status: res.status };
  if (res.status === 404 && body?.error === 'invalid_value') {
    const d = String(body.error_description ?? '').toLowerCase();
    return { ok: false, problem: d.includes('package') ? 'package' : 'product', status: 404 };
  }
  return { ok: false, problem: 'unknown', status: res.status };
}

export interface BazaarResult {
  kind: 'purr' | 'food';
  item: string;
  quantity: number;
  /** false: this token was already credited earlier (nothing added now). */
  credited: boolean;
  /** The app should consume the purchase in Bazaar now (so the product can be bought again). */
  consume: true;
}

export async function verifyBazaarPurchase(
  prisma: PrismaClient,
  env: Env,
  userId: string,
  sku: BazaarSku,
  token: string,
  fetchImpl?: FetchLike,
): Promise<BazaarResult> {
  const product = BAZAAR_PRODUCTS[sku];
  const id = `bazaar:${token}`;
  const result = (credited: boolean): BazaarResult => ({
    kind: product.kind,
    item: product.item,
    quantity: product.quantity,
    credited,
    consume: true,
  });

  const known = await prisma.payment.findUnique({ where: { id } });
  if (known) {
    if (known.userId !== userId) throw new AppError('CONFLICT', undefined, 'This purchase belongs to another account');
    await consumeOnBazaar(prisma, env, token, fetchImpl);
    return result(false);
  }

  const purchase = await lookUpPurchase(prisma, env, sku, token, fetchImpl);
  if (!purchase) throw new AppError('NOT_FOUND', undefined, 'Cafe Bazaar does not know this purchase');
  if (purchase.purchaseState !== 0) throw new AppError('CONFLICT', undefined, 'This purchase was refunded');
  // Bought by another of our accounts (its payload names that account). Older or empty
  // payloads carry no account, so the first signed-in claim keeps them.
  if (purchase.developerPayload.startsWith('p1.') && purchase.developerPayload !== bazaarPayload(userId)) {
    throw new AppError('CONFLICT', undefined, 'This purchase belongs to another account');
  }

  try {
    await prisma.$transaction(async tx => {
      await tx.payment.create({
        data: {
          id,
          userId,
          kind: product.kind,
          item: product.item,
          quantity: product.quantity,
          // Rials, the unit Bazaar charges in (the column is "the smallest unit" of `currency`).
          amountCents: product.toman * 10,
          currency: 'irr',
          status: 'paid',
          livemode: true,
          paidAt: new Date(),
        },
      });
      await creditPurchase(tx, { userId, kind: product.kind, item: product.item, quantity: product.quantity }, id);
      await tx.appEvent.create({
        data: { userId, name: 'payment_paid', payload: { provider: 'bazaar', sku, kind: product.kind, item: product.item, quantity: product.quantity, toman: product.toman } },
      });
    });
  } catch (err) {
    // Two verifies of the same token raced: the other one credited it.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const row = await prisma.payment.findUnique({ where: { id } });
      if (row && row.userId !== userId) throw new AppError('CONFLICT', undefined, 'This purchase belongs to another account');
      return result(false);
    }
    throw err;
  }
  await consumeOnBazaar(prisma, env, token, fetchImpl);
  return result(true);
}
