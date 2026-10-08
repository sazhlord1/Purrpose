/**
 * Tiny i18n core shared by every package (web, cats, server).
 *
 * - English text is the key: `t('Good morning')`. A locale's dictionary maps the
 *   English string to its translation; anything missing falls back to English.
 * - `{name}`-style placeholders are filled from `vars`. Numbers in `vars` are
 *   written with the locale's digits (۱۲۳ in Persian).
 * - The locale is chosen once at startup (the web app reloads on change), so
 *   plain functions are enough — no React context needed.
 */

export type Locale = 'en' | 'fa';
export const LOCALES: readonly Locale[] = ['en', 'fa'];

let current: Locale = 'en';
const dictionaries: Record<Locale, Record<string, string>> = { en: {}, fa: {} };

export function setLocale(locale: Locale): void {
  current = locale;
}

export function getLocale(): Locale {
  return current;
}

export function isRtl(locale: Locale = current): boolean {
  return locale === 'fa';
}

/** Adds translations for a locale (later calls override earlier keys). */
export function registerTranslations(locale: Locale, dict: Record<string, string>): void {
  Object.assign(dictionaries[locale], dict);
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** "12.5" → "۱۲٫۵" in Persian; unchanged in English. */
export function localDigits(text: string, locale: Locale = current): string {
  if (locale !== 'fa') return text;
  return text.replace(/[0-9]/g, d => FA_DIGITS[Number(d)] as string).replace(/(\d|[۰-۹])\.(?=[۰-۹])/g, '$1٫');
}

/** Formats a number for display in the current locale. */
export function num(n: number, locale: Locale = current): string {
  const s = Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
  return localDigits(s, locale);
}

export type TVars = Record<string, string | number | null | undefined>;

/** Translate `en` into the current locale and fill `{placeholders}`. */
export function t(en: string, vars?: TVars, locale: Locale = current): string {
  const template = (locale === 'en' ? undefined : dictionaries[locale][en]) ?? en;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const v = vars[key];
    if (v === undefined || v === null) return whole;
    return typeof v === 'number' ? num(v, locale) : v;
  });
}

/** True when a translation exists (handy for tests / missing-string checks). */
export function hasTranslation(en: string, locale: Locale = current): boolean {
  return locale === 'en' || en in dictionaries[locale];
}
