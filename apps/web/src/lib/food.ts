import { BAZAAR_PRODUCTS, FOOD_PACKS, FOOD_PRICES_IRT, VET_PACK_NAMES, num, type BazaarSku, type ConsequenceType } from '@purrpose/shared';
import { foodQty, t } from '../i18n/index.js';
import { toman } from './format.js';

/** What a pack is called in the buy sheet: "250 g", "Vaccine pack", "1 can". */
export function packLabel(sku: BazaarSku): string {
  const p = BAZAAR_PRODUCTS[sku];
  if (p.kind !== 'food') return sku;
  if (p.item === 'VET_CARE') return t(VET_PACK_NAMES[p.quantity] ?? 'Care pack');
  if (p.item === 'MEALS') return t('{n} can', { n: num(p.quantity) });
  return foodQty(p.item, p.quantity);
}

/** Iranian price line of a food: one price for a can, a range for dry food and care packs. */
export function priceRange(type: ConsequenceType): string {
  const packs = FOOD_PACKS[type].map(sku => BAZAAR_PRODUCTS[sku].toman);
  if (packs.length < 2) return t('{price} per can', { price: toman(FOOD_PRICES_IRT[type]) });
  return t('from {min} to {max}', { min: toman(Math.min(...packs)), max: toman(Math.max(...packs)) });
}

