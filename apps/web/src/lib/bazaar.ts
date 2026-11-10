/**
 * Cafe Bazaar in-app purchases (Iranian edition, Android app only).
 *
 * Flow: Bazaar's payment screen (native plugin "BazaarBilling", Poolakey) → we send the
 * purchase token to our server, which checks it with Bazaar's developer API and credits
 * it exactly once → we consume it in Bazaar so the product can be bought again.
 * If the app closes between paying and crediting, restoreBazaarPurchases() finishes the
 * job next time (Bazaar keeps unconsumed purchases until we consume them).
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { BazaarSku } from '@purrpose/shared';
import { t } from '../i18n/index.js';
import { api, ApiError } from './api.js';
import { isGuestAccount } from './auth.js';
import { IS_IR_EDITION } from './edition.js';

interface BazaarPurchase {
  productId: string;
  purchaseToken: string;
  orderId?: string;
}

interface BazaarBillingPlugin {
  connect(options: { rsaPublicKey: string }): Promise<{ connected: boolean }>;
  purchase(options: { productId: string; payload?: string }): Promise<BazaarPurchase>;
  consume(options: { purchaseToken: string }): Promise<{ consumed: boolean }>;
  getPurchases(): Promise<{ purchases: BazaarPurchase[] }>;
}

const Bazaar = registerPlugin<BazaarBillingPlugin>('BazaarBilling');

/**
 * Bazaar's RSA public key for this app (public, from the panel's in-app billing tab).
 * Poolakey uses it to check Bazaar's signature on the phone; the server also checks
 * every purchase with Bazaar's developer API before crediting it.
 */
const RSA_PUBLIC_KEY =
  'MIHNMA0GCSqGSIb3DQEBAQUAA4G7ADCBtwKBrwDD2F0SGfWkULjed061dyOFjPELR3pPyNvKwOoBP9IHcF/E1CwA817+jwvzDPiQmLYqSRe/XuijMrlQoeGXxta6rLorNY9U/AHYammt6dUx7HrWJRDfF0iqr2WbR4Ov/o3VPAtfY/J9DS/4y7eKH0iQa53x2ia2tDobDrg1gu2nrfV3qN7OunxMQeai9SDHJF1GpF7xww92SpTPZU+Up97skoKCzL+jHUFK1a+fRyECAwEAAQ==';

/** Only the Iranian Android app can buy through Bazaar (not the website, not the global app). */
export function bazaarApp(): boolean {
  return IS_IR_EDITION && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export interface BazaarCredit {
  kind: 'purr' | 'food';
  item: string;
  quantity: number;
  credited: boolean;
  purr: number;
}

/** Why a Bazaar purchase didn't go through, in words the shop can show. */
export class BazaarError extends Error {
  constructor(
    readonly reason: 'cancelled' | 'no-bazaar' | 'failed' | 'server',
    message: string,
  ) {
    super(message);
  }
}

function codeOf(err: unknown): string | undefined {
  return typeof err === 'object' && err && 'code' in err ? String((err as { code: unknown }).code) : undefined;
}

async function connect(): Promise<void> {
  try {
    await Bazaar.connect({ rsaPublicKey: RSA_PUBLIC_KEY });
  } catch (err) {
    throw new BazaarError('no-bazaar', err instanceof Error ? err.message : String(err));
  }
}

async function creditAndConsume(p: BazaarPurchase): Promise<BazaarCredit> {
  // The server's answer decides; if it fails we keep the purchase unconsumed so it can be retried.
  const res = await api<BazaarCredit & { consume: boolean }>('/bazaar/verify', {
    method: 'POST',
    body: { productId: p.productId, purchaseToken: p.purchaseToken },
  });
  if (res.consume) await Bazaar.consume({ purchaseToken: p.purchaseToken }).catch(() => undefined);
  return res;
}

/** Buys one unit of a Bazaar product and credits it. */
export async function buyWithBazaar(sku: BazaarSku): Promise<BazaarCredit> {
  // Check the account before anyone pays: the server only credits signed-in players.
  const me = await api<{ user: { email: string | null; phone?: string | null } }>('/me');
  if (isGuestAccount(me.user)) {
    const e = new BazaarError('server', 'account required');
    e.cause = new ApiError(403, 'ACCOUNT_REQUIRED', 'Sign in first');
    throw e;
  }
  await connect();
  let purchase: BazaarPurchase;
  try {
    purchase = await Bazaar.purchase({ productId: sku, payload: sku });
  } catch (err) {
    if (codeOf(err) === 'CANCELLED') throw new BazaarError('cancelled', 'cancelled');
    if (codeOf(err) === 'NOT_CONNECTED') throw new BazaarError('no-bazaar', 'not connected');
    throw new BazaarError('failed', err instanceof Error ? err.message : String(err));
  }
  try {
    return await creditAndConsume(purchase);
  } catch (err) {
    // Paid but not credited yet (network, server): it stays in Bazaar and is retried on the next restore.
    const e = new BazaarError('server', err instanceof Error ? err.message : String(err));
    e.cause = err;
    throw e;
  }
}

/** Credits any purchase that was paid but never credited (the app closed, the network dropped). */
export async function restoreBazaarPurchases(): Promise<BazaarCredit[]> {
  if (!bazaarApp()) return [];
  try {
    await connect();
    const { purchases } = await Bazaar.getPurchases();
    const done: BazaarCredit[] = [];
    for (const p of purchases) {
      try {
        done.push(await creditAndConsume(p));
      } catch {
        // Not ours to credit right now (e.g. signed out, or another account's): leave it.
      }
    }
    return done;
  } catch {
    return [];
  }
}

/** What to tell the player when a Cafe Bazaar purchase didn't finish. */
export function bazaarFailure(e: unknown): { kind: 'ok' | 'err'; text: string; needsAccount?: boolean } {
  if (e instanceof BazaarError) {
    if (e.reason === 'cancelled') return { kind: 'ok', text: t('Purchase cancelled. Nothing was charged.') };
    if (e.reason === 'no-bazaar') return { kind: 'err', text: t('Cafe Bazaar is not installed or you are not signed in to it.') };
    if (e.reason === 'server') {
      if (e.cause instanceof ApiError && e.cause.code === 'ACCOUNT_REQUIRED') return { kind: 'err', text: t('Create an account first, so what you buy is safe.'), needsAccount: true };
      return { kind: 'err', text: t('Paid, but not added yet. Open the shop again in a minute and it will be added.') };
    }
  }
  return { kind: 'err', text: t('Purchase failed.') };
}
