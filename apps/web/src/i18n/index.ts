import { getLocale, localDigits, localizeCats, registerTranslations, setLocale, t as t2, type Locale } from '@purrpose/shared';
import { FA } from './fa/index.js';

export { t, num, getLocale, type Locale } from '@purrpose/shared';

const LANG_KEY = 'purrpose.lang';

function savedLocale(): Locale | null {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === 'fa' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

/** First visit: Persian browsers start in Persian; everyone else in English. */
function defaultLocale(): Locale {
  if (typeof navigator !== 'undefined' && /^fa\b/i.test(navigator.language ?? '')) return 'fa';
  return 'en';
}

/**
 * Runs once before the app renders: picks the language, loads its strings,
 * swaps the cats' names/lines, and sets <html lang/dir> for RTL.
 */
export function initLocale(): Locale {
  const locale = savedLocale() ?? defaultLocale();
  setLocale(locale);
  registerTranslations('fa', FA);
  localizeCats(locale);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
    document.title = locale === 'fa' ? 'پرپوز' : 'Purrpose';
    if (locale === 'fa') startPersianDigits();
  }
  return locale;
}

/** Switch language: remembered on this device, then the app reloads in it. */
export function setAppLanguage(locale: Locale, after?: () => Promise<void>): void {
  try {
    localStorage.setItem(LANG_KEY, locale);
  } catch {
    /* private mode: the choice lasts until reload */
  }
  void (async () => {
    setLocale(locale);
    await after?.().catch(() => undefined);
    window.location.reload();
  })();
}

export function isRtlUi(): boolean {
  return getLocale() === 'fa';
}

/** "←" in English, "→" in Persian (back always points to where you came from). */
export function backArrow(): string {
  return getLocale() === 'fa' ? '→' : '←';
}

/** "→" in English, "←" in Persian (forward / "go there"). */
export function fwdArrow(): string {
  return getLocale() === 'fa' ? '←' : '→';
}

const SKIP = 'input, textarea, code, pre, script, style, [data-latin], .ltr, [dir="ltr"]';

/**
 * Persian mode shows every number with Persian digits (۱۲۳), including numbers
 * React puts on screen directly (counters, timers, SVG labels). Text nodes are
 * rewritten as they appear or change; inputs, emails and codes are left alone.
 */
function startPersianDigits(): void {
  const fix = (node: Node) => {
    if (node.nodeType !== Node.TEXT_NODE) return;
    const v = node.nodeValue;
    if (!v || !/[0-9]/.test(v)) return;
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP)) return;
    const next = localDigits(v, 'fa');
    if (next !== v) node.nodeValue = next;
  };
  const walk = (root: Node) => {
    if (root.nodeType === Node.TEXT_NODE) return fix(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) fix(n);
  };
  const start = () => {
    walk(document.body);
    new MutationObserver(records => {
      for (const r of records) {
        if (r.type === 'characterData') fix(r.target);
        else r.addedNodes.forEach(walk);
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
}

/** Food type name in the current language ("Cat Meals" / "cat meals" / "کنسرو گربه"). */
export function foodName(type: 'MEALS' | 'DRY_FOOD' | 'VET_CARE', lower = false): string {
  const en = { MEALS: 'Cat Meals', DRY_FOOD: 'Dry Food', VET_CARE: 'Vet Care' }[type];
  return t2(lower ? en.toLowerCase() : en);
}

/** Locale for Intl / toLocaleString: Persian (Solar Hijri calendar) or the browser default. */
export function dateLocale(): string | undefined {
  return getLocale() === 'fa' ? 'fa-IR' : undefined;
}

/** Date + time, e.g. "Oct 8, 2026, 3:15 PM" / "۱۷ مهر ۱۴۰۵، ۱۵:۱۵". */
export function fmtDateTime(iso: string | number | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }): string {
  if (iso === null || iso === undefined) return '—';
  return new Date(iso).toLocaleString(dateLocale(), opts);
}
