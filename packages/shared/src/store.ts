/** PURR — Purrpose's in-app token. Bought with real money, spent in the shop. */
export const PURR_SYMBOL = 'PURR';

export interface PurrPack {
  id: string;
  purr: number;
  /** Display price only. The real charge is decided by the payment provider. */
  priceLabel: string;
  bonusLabel?: string;
}

export const PURR_PACKS: readonly PurrPack[] = [
  { id: 'purr_150', purr: 150, priceLabel: '$1.99' },
  { id: 'purr_400', purr: 400, priceLabel: '$4.99', bonusLabel: '+10%' },
  { id: 'purr_900', purr: 900, priceLabel: '$9.99', bonusLabel: '+25%' },
];

export function purrPackById(id: string): PurrPack | undefined {
  return PURR_PACKS.find(p => p.id === id);
}

export type PaymentsMode = 'disabled' | 'sandbox' | 'live';

/** Shop item ids are namespaced so the ledger can hold more than cats later. */
export const catItemId = (catId: string): string => `cat:${catId}`;

/** Copy shared by in-page notifications and web push. */
export const NOTIF_COPY = {
  reminder: 'Your cat is still waiting.',
  t24h: '24 hours left. Your cat has started checking the food cabinet.',
  t1h: 'Your cat knows what time it is.',
  success: 'You did it. Your cat is disappointed.',
  failure: 'You failed. Your cat is eating.',
} as const;

export const NOTIF_COPY_FA: Record<keyof typeof NOTIF_COPY, string> = {
  reminder: 'گربه‌ت هنوز منتظره.',
  t24h: '۲۴ ساعت مونده. گربه‌ت داره به کابینت غذا سر می‌زنه.',
  t1h: 'گربه‌ت می‌دونه ساعت چنده.',
  success: 'انجامش دادی. گربه‌ت حسابی پکره.',
  failure: 'نشد. گربه‌ت داره غذا می‌خوره.',
};

/** Notification copy in a locale (push is sent in the language of the device). */
export function notifCopy(locale: 'en' | 'fa'): Record<keyof typeof NOTIF_COPY, string> {
  return locale === 'fa' ? NOTIF_COPY_FA : NOTIF_COPY;
}

/**
 * OAuth client id for "Sign in with Google". Public by design (it ships in the
 * web page); override with GOOGLE_CLIENT_ID / VITE_GOOGLE_CLIENT_ID if needed.
 */
export const DEFAULT_GOOGLE_CLIENT_ID = '258964168311-leoev7t50aefv0b0k3i3mcle15pt96p6.apps.googleusercontent.com';

export const SESSION_TTL_MS = 90 * 24 * 3_600_000;
export const GRACE_WINDOW_MS = 5 * 60_000;
