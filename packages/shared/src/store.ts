/** PURR — Purrpose's in-app token. Bought with real money, spent in the shop. */
export const PURR_SYMBOL = 'PURR';

export interface PurrPack {
  id: string;
  purr: number;
  /** What Stripe charges, in US cents. The label is derived from it. */
  priceCents: number;
  priceLabel: string;
  bonusLabel?: string;
}

/** Prices are in US dollars (the English/international version only). */
export const PAYMENT_CURRENCY = 'usd';

/** "$1.99" from 199. */
export function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const pack = (purr: number, priceCents: number, bonusLabel?: string): PurrPack => ({
  id: `purr_${purr}`,
  purr,
  priceCents,
  priceLabel: usd(priceCents),
  ...(bonusLabel ? { bonusLabel } : {}),
});

export const PURR_PACKS: readonly PurrPack[] = [
  pack(150, 199),
  pack(250, 250),
  pack(500, 349),
  pack(1000, 500, 'Best value'),
];

export function purrPackById(id: string): PurrPack | undefined {
  return PURR_PACKS.find(p => p.id === id);
}

/** Real cat food for strict pacts, bought per unit. A dry-food unit is one kilogram. */
export const FOOD_PRICES = {
  MEALS: { cents: 299, unit: 'can', maxQty: 50 },
  DRY_FOOD: { cents: 1000, unit: 'kg', maxQty: 20 },
  VET_CARE: { cents: 15000, unit: 'visit', maxQty: 3 },
} as const satisfies Record<'MEALS' | 'DRY_FOOD' | 'VET_CARE', { cents: number; unit: string; maxQty: number }>;

/**
 * Iranian edition, sold through Cafe Bazaar. What one unit really costs us (Aban 1405,
 * the team's numbers) and the price in the Bazaar panel, in toman. The owner chose
 * these prices; at a 30% Bazaar share a can and a kilo of dry food sell below cost.
 */
export const FOOD_PRICES_IRT = { MEALS: 189_000, DRY_FOOD: 749_000, VET_CARE: 1_490_000 } as const;

/** PURR packs in the Iranian edition (toman, Cafe Bazaar). Same pack ids as the global edition. */
export const PURR_PACK_PRICES_IRT: Readonly<Record<string, number>> = {
  purr_150: 39_000,
  purr_250: 59_000,
  purr_500: 99_000,
  purr_1000: 169_000,
};

/**
 * The Cafe Bazaar products (one-time, consumable), exactly as defined in the Bazaar
 * panel. The SKU decides what gets credited; the price shown is ours (Bazaar charges
 * what its panel says, in rials including tax: toman × 10).
 */
export type BazaarProduct =
  | { kind: 'food'; item: 'MEALS' | 'DRY_FOOD' | 'VET_CARE'; quantity: 1; toman: number }
  | { kind: 'purr'; item: string; quantity: 1; toman: number };

export const BAZAAR_PRODUCTS = {
  food_meals: { kind: 'food', item: 'MEALS', quantity: 1, toman: FOOD_PRICES_IRT.MEALS },
  food_dry: { kind: 'food', item: 'DRY_FOOD', quantity: 1, toman: FOOD_PRICES_IRT.DRY_FOOD },
  food_vet: { kind: 'food', item: 'VET_CARE', quantity: 1, toman: FOOD_PRICES_IRT.VET_CARE },
  purr_150: { kind: 'purr', item: 'purr_150', quantity: 1, toman: 39_000 },
  purr_250: { kind: 'purr', item: 'purr_250', quantity: 1, toman: 59_000 },
  purr_500: { kind: 'purr', item: 'purr_500', quantity: 1, toman: 99_000 },
  purr_1000: { kind: 'purr', item: 'purr_1000', quantity: 1, toman: 169_000 },
} as const satisfies Record<string, BazaarProduct>;

export type BazaarSku = keyof typeof BAZAAR_PRODUCTS;
export const BAZAAR_SKUS = Object.keys(BAZAAR_PRODUCTS) as BazaarSku[];

/** The Bazaar SKU that sells one unit of this food. */
export const BAZAAR_FOOD_SKU: Record<'MEALS' | 'DRY_FOOD' | 'VET_CARE', BazaarSku> = {
  MEALS: 'food_meals',
  DRY_FOOD: 'food_dry',
  VET_CARE: 'food_vet',
};

/**
 * disabled: nothing can be bought · sandbox: free test credits (never in production) ·
 * stripe: real checkout through Stripe (test or live, depending on the key).
 */
export type PaymentsMode = 'disabled' | 'sandbox' | 'stripe';

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
  failure: 'نشد که بشه. گربه‌ت داره غذا می‌خوره.',
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
