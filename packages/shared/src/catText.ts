import { CAT_SEED } from './cats.js';
import { CAT_FA } from './catsFa.js';
import type { CatId } from './enums.js';
import { getLocale, type Locale } from './i18n.js';

/** Subtitle shown under each cat in the cat picker. */
const CAT_SUBTITLE_EN: Record<CatId, string> = {
  orange: 'Golden Tabby · Joyful Sunbather',
  tuxedo: 'The Aristocrat · Striped Cap Tuxedo',
  black: 'Midnight Velvet · Luminous Eyes',
  boba: 'Sweet Calico · Cheeky Side-Glance',
  mochi: 'Snow White · Soft Marshmallow',
  oreo: 'Masked Tuxedo · Mustache Gentleman',
  pepper: 'Polka-Dot · Bubbly Sweetheart',
  yuki: 'Expressive Sketch · Playful Spirit',
};

/** What each cat says when you try to stake more food than you have. */
const CAT_OVERSTAKE_EN: Record<CatId, string> = {
  orange: 'Bold of you. You don’t have that many!',
  tuxedo: 'One cannot stake what one does not have.',
  black: 'you don’t have that many. i counted.',
  boba: 'even in my sleep, i know you lack the snacks for that.',
  mochi: 'i checked the pantry... not enough snacks, friend.',
  oreo: 'my mustache senses an overdraft! check your balance.',
  pepper: 'more snacks needed for that! check your pantry!',
  yuki: 'energy overload! you need more snacks to stake that!',
};

export function catSubtitle(id: string, locale: Locale = getLocale()): string {
  const key = id as CatId;
  return (locale === 'fa' ? CAT_FA[key]?.subtitle : undefined) ?? CAT_SUBTITLE_EN[key] ?? '';
}

export function catOverstake(id: string, locale: Locale = getLocale()): string | undefined {
  const key = id as CatId;
  return (locale === 'fa' ? CAT_FA[key]?.overstake : undefined) ?? CAT_OVERSTAKE_EN[key];
}

const ORIGINAL = new Map(CAT_SEED.map(c => [c.id, { name: c.name, quirks: c.config.quirks }]));

/**
 * Swaps every cat's name and lines to the given locale, in place, so everything
 * that reads CAT_SEED (bubbles, captions, pickers) speaks that language.
 */
export function localizeCats(locale: Locale): void {
  for (const c of CAT_SEED) {
    const en = ORIGINAL.get(c.id);
    if (!en) continue;
    const fa = locale === 'fa' ? CAT_FA[c.id] : undefined;
    c.name = fa?.name ?? en.name;
    c.config.quirks = fa ? { ...fa.quirks } : en.quirks;
  }
}

/** A cat's name in a given locale without touching CAT_SEED (e.g. on the server). */
export function catNameIn(id: string, locale: Locale): string {
  const key = id as CatId;
  if (locale === 'fa' && CAT_FA[key]) return CAT_FA[key].name;
  return ORIGINAL.get(key)?.name ?? id;
}
