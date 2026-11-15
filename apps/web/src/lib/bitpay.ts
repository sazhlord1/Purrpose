import { useQuery } from '@tanstack/react-query';
import type { BazaarSku } from '@purrpose/shared';
import { t } from '../i18n/index.js';
import { api, ApiError } from './api.js';
import { bazaarApp } from './bazaar.js';
import { IS_IR_EDITION } from './edition.js';

/**
 * Paying by bank card on the Iranian website / home-screen PWA (Bitpay). Not in the
 * Android app: there, purchases go through Cafe Bazaar.
 */
export const bitpayPlace = (): boolean => IS_IR_EDITION && !bazaarApp();

/** Is the card gateway switched on on the server (and are we on the website)? */
export function useBitpayOn(): boolean {
  const q = useQuery({
    queryKey: ['bitpay'],
    queryFn: () => api<{ enabled: boolean }>('/bitpay'),
    enabled: bitpayPlace(),
    staleTime: 5 * 60_000,
  });
  return bitpayPlace() && q.data?.enabled === true;
}

/** Opens the payment and leaves for Bitpay's bank page. Never resolves: the page changes. */
export async function payWithBitpay(sku: BazaarSku): Promise<never> {
  const { url } = await api<{ url: string }>('/bitpay/start', { method: 'POST', body: { productId: sku } });
  window.location.assign(url);
  return new Promise<never>(() => undefined);
}

/** What to tell the player when starting a card payment failed. */
export function bitpayFailure(e: unknown): { kind: 'err'; text: string; needsAccount?: boolean } {
  if (e instanceof ApiError && e.code === 'ACCOUNT_REQUIRED') {
    return { kind: 'err', text: t('Create an account first, so what you buy is safe.'), needsAccount: true };
  }
  return { kind: 'err', text: t('Could not open the payment page. Try again in a moment.') };
}
