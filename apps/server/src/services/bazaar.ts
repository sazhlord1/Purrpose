import { randomBytes } from 'node:crypto';
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

/** What Bazaar says about a purchase token. */
export interface BazaarPurchase {
  /** 0 = bought, 1 = refunded. */
  purchaseState: number;
  /** 0 = consumed, 1 = not consumed yet. */
  consumptionState: number;
  purchaseTime?: number;
}

/** Looks the purchase up with Bazaar. null = Bazaar doesn't know this token for this product. */
export async function lookUpPurchase(
  prisma: PrismaClient,
  env: Env,
  sku: BazaarSku,
  token: string,
  fetchImpl: FetchLike = defaultFetch(),
): Promise<BazaarPurchase | null> {
  const mode = bazaarAuthMode(env);
  if (mode === 'none') throw new AppError('PAYMENTS_UNAVAILABLE', undefined, 'Purchases are not available yet');
  let url = `${BAZAAR_API}/validate/${encodeURIComponent(env.BAZAAR_PACKAGE_NAME)}/inapp/${encodeURIComponent(sku)}/purchases/${encodeURIComponent(token)}/`;
  const headers: Record<string, string> = { accept: 'application/json' };
  if (mode === 'secret') headers['CAFEBAZAAR-PISHKHAN-API-SECRET'] = env.BAZAAR_API_SECRET!;
  else url += `?access_token=${encodeURIComponent(await accessToken(prisma, env, fetchImpl))}`;

  let res: Awaited<ReturnType<FetchLike>>;
  try {
    res = await fetchImpl(url, { method: 'GET', headers });
  } catch (err) {
    console.error('[bazaar] validate unreachable', err instanceof Error ? err.message : err);
    throw new AppError('PAYMENT_PROVIDER', undefined, 'Could not reach Cafe Bazaar. Try again in a moment.');
  }
  const text = await res.text();
  if (res.status === 404) return null;
  if (res.status === 401 && mode === 'oauth') accessCache = null; // next try fetches a fresh access token
  if (!res.ok) {
    console.error(`[bazaar] validate failed: HTTP ${res.status} ${text.slice(0, 200)}`);
    throw new AppError('PAYMENT_PROVIDER', undefined, 'Cafe Bazaar could not check this purchase. Try again in a moment.');
  }
  let body: Partial<BazaarPurchase> & { error?: unknown };
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    throw new AppError('PAYMENT_PROVIDER', undefined, 'Cafe Bazaar sent an unreadable answer');
  }
  if (body.error || typeof body.purchaseState !== 'number') return null;
  return {
    purchaseState: body.purchaseState,
    consumptionState: Number(body.consumptionState ?? 1),
    purchaseTime: typeof body.purchaseTime === 'number' ? body.purchaseTime : undefined,
  };
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
    return result(false);
  }

  const purchase = await lookUpPurchase(prisma, env, sku, token, fetchImpl);
  if (!purchase) throw new AppError('NOT_FOUND', undefined, 'Cafe Bazaar does not know this purchase');
  if (purchase.purchaseState !== 0) throw new AppError('CONFLICT', undefined, 'This purchase was refunded');

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
  return result(true);
}
