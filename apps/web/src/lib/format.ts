import { dateLocale, getLocale, t } from '../i18n/index.js';

export function fmtRemaining(ms: number): string {
  if (ms <= 0) return t('time is up');
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return t('seconds');
  if (minutes < 60) return t('{m} min', { m: minutes });
  const hours = Math.floor(minutes / 60);
  const fa = getLocale() === 'fa';
  // Persian drops a zero part ("۲ ساعت", not "۲ ساعت و ۰ دقیقه").
  if (hours < 24) {
    return fa && minutes % 60 === 0 ? t('{h}h', { h: hours }) : t('{h}h {m}min', { h: hours, m: minutes % 60 });
  }
  const days = Math.floor(hours / 24);
  return fa && hours % 24 === 0 ? t('{d}d', { d: days }) : t('{d}d {h}h', { d: days, h: hours % 24 });
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(dateLocale(), {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
