import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppError } from '../errors.js';

/**
 * The few Stripe calls Purrpose needs, over plain HTTPS (no SDK): create and read
 * Checkout Sessions, and check webhook signatures.
 */

const API = 'https://api.stripe.com/v1';

type Params = { [key: string]: string | number | boolean | null | undefined | Params | Params[] };

/** Stripe's form encoding: a[b][0][c]=x. */
export function formEncode(params: Params, prefix = ''): string {
  const out: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((v, i) => out.push(formEncode(v, `${name}[${i}]`)));
    } else if (typeof value === 'object') {
      out.push(formEncode(value, name));
    } else {
      out.push(`${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`);
    }
  }
  return out.filter(Boolean).join('&');
}

export interface CheckoutSession {
  id: string;
  url: string | null;
  status: 'open' | 'complete' | 'expired';
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  amount_total: number | null;
  currency: string | null;
  livemode: boolean;
  client_reference_id: string | null;
  metadata: Record<string, string>;
}

async function call<T>(key: string, method: 'GET' | 'POST', path: string, params?: Params): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${key}`,
        ...(params ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
      },
      body: params ? formEncode(params) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new AppError('PAYMENT_PROVIDER', undefined, 'Could not reach the payment provider');
  }
  const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!res.ok) {
    throw new AppError('PAYMENT_PROVIDER', { status: res.status }, body.error?.message ?? 'Payment provider error');
  }
  return body as T;
}

export function createCheckoutSession(key: string, params: Params): Promise<CheckoutSession> {
  return call<CheckoutSession>(key, 'POST', '/checkout/sessions', params);
}

export function retrieveCheckoutSession(key: string, id: string): Promise<CheckoutSession> {
  return call<CheckoutSession>(key, 'GET', `/checkout/sessions/${encodeURIComponent(id)}`);
}

/**
 * Checks a webhook's Stripe-Signature header (t=…,v1=…) against the raw body.
 * Rejects anything older than `toleranceSec` so a captured event can't be replayed.
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  header: string | undefined,
  secret: string,
  nowMs = Date.now(),
  toleranceSec = 300,
): boolean {
  if (!header) return false;
  const parts = header.split(',').map(p => p.trim().split('=') as [string, string]);
  const t = parts.find(([k]) => k === 't')?.[1];
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || signatures.length === 0 || !/^\d+$/.test(t)) return false;
  if (Math.abs(nowMs / 1000 - Number(t)) > toleranceSec) return false;
  const expected = createHmac('sha256', secret).update(`${t}.`).update(rawBody).digest();
  return signatures.some(sig => {
    const given = Buffer.from(sig, 'hex');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
