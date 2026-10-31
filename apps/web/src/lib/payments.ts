import { getLocale } from '../i18n/index.js';
import { IS_IR_EDITION } from './edition.js';

/**
 * Buying with real money (Stripe, US dollars) is only in the English version. The
 * Persian version will sell through Cafe Bazaar's own in-app billing instead.
 */
export function canBuyHere(): boolean {
  return !IS_IR_EDITION && getLocale() !== 'fa';
}

/** Leaves the app for Stripe's hosted checkout page. */
export function goToCheckout(url: string): void {
  window.location.assign(url);
}
