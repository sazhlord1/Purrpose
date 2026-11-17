/**
 * Picks a pact's deadline: quick jumps, a month calendar (up to a year out) and two
 * scroll wheels for the hour and minute. In Persian the days are Solar Hijri
 * (Intl's Persian calendar, "۲۲ آبان"), the week runs right to left and the
 * digits are Persian; the time stays 24-hour, read left to right.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { dateLocale, getLocale, t } from '../i18n/index.js';
import { fmtRemaining } from '../lib/format.js';

const DAY_MS = 24 * 3_600_000;
const STEP_MIN = 5;
const ITEM_H = 40;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 / STEP_MIN }, (_, i) => i * STEP_MIN);

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Same calendar day `days` later (DST-safe: built from the date, not by adding ms). */
function addDays(dayStart: number, days: number): number {
  const d = new Date(dayStart);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

function at(dayStart: number, h: number, m: number): number {
  const d = new Date(dayStart);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

/** Rounds up to the next 5-minute mark. */
export function ceilToStep(ms: number): number {
  const step = STEP_MIN * 60_000;
  return Math.ceil(ms / step) * step;
}

function two(n: number): string {
  return new Intl.NumberFormat(dateLocale(), { minimumIntegerDigits: 2, useGrouping: false }).format(n);
}

interface DeadlinePickerProps {
  value: number;
  /** Earliest allowed moment (already a few minutes from now). */
  min: number;
  /** Latest allowed moment. */
  max: number;
  onChange: (ms: number) => void;
  /** "now" by the server's clock, for the "… left" line. */
  now: number;
}

export function DeadlinePicker({ value, min, max, onChange, now }: DeadlinePickerProps) {
  const fa = getLocale() === 'fa';
  const lo = ceilToStep(min);
  const hi = Math.floor(max / (STEP_MIN * 60_000)) * STEP_MIN * 60_000;
  const clamp = (ms: number) => Math.min(Math.max(ms, lo), hi);

  const today = startOfDay(lo);

  const sel = new Date(value);
  const selDay = startOfDay(value);
  const h = sel.getHours();
  const m = Math.round(sel.getMinutes() / STEP_MIN) * STEP_MIN;

  const fmt = useMemo(() => {
    const loc = dateLocale();
    return {
      weekday: new Intl.DateTimeFormat(loc, { weekday: fa ? 'long' : 'short' }),
      day: new Intl.DateTimeFormat(loc, { day: 'numeric' }),
      month: new Intl.DateTimeFormat(loc, { month: fa ? 'long' : 'short' }),
      full: new Intl.DateTimeFormat(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      monthYear: new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }),
      narrowDay: new Intl.DateTimeFormat(loc, { weekday: 'narrow' }),
    };
  }, [fa]);

  /**
   * Whole months (Solar Hijri in Persian) from this month to the last allowed day, as
   * calendar grids. Weeks start on Saturday in Persian, Sunday in English.
   */
  const months = useMemo(() => {
    const key = (d: number) => fmt.monthYear.format(d);
    let start = today;
    while (key(addDays(start, -1)) === key(today)) start = addDays(start, -1);
    let end = startOfDay(hi);
    while (key(addDays(end, 1)) === key(end)) end = addDays(end, 1);
    const out: Array<{ label: string; cells: Array<number | null> }> = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const label = key(d);
      let month = out[out.length - 1];
      if (!month || month.label !== label) {
        month = { label, cells: [] };
        const lead = fa ? (new Date(d).getDay() + 1) % 7 : new Date(d).getDay();
        for (let i = 0; i < lead; i++) month.cells.push(null);
        out.push(month);
      }
      month.cells.push(d);
    }
    return out;
  }, [today, hi, fmt, fa]);
  const weekdays = useMemo(() => {
    // Any week: 2024-01-06 was a Saturday, 2024-01-07 a Sunday.
    const first = fa ? new Date(2024, 0, 6).getTime() : new Date(2024, 0, 7).getTime();
    return Array.from({ length: 7 }, (_, i) => fmt.narrowDay.format(addDays(first, i)));
  }, [fmt, fa]);
  const selMonth = Math.max(0, months.findIndex(mo => mo.cells.includes(startOfDay(value))));
  const [shownMonth, setShownMonth] = useState(selMonth);
  useEffect(() => setShownMonth(selMonth), [selMonth]);
  const month = months[Math.min(shownMonth, months.length - 1)];

  const pickDay = (d: number) => onChange(clamp(at(d, h, m)));
  const pickHour = (hour: number) => onChange(clamp(at(selDay, hour, m)));
  const pickMinute = (minute: number) => onChange(clamp(at(selDay, h, minute)));

  const QUICK: Array<[string, number, number]> = [
    [t('Morning'), 9, 0],
    [t('Noon'), 12, 0],
    [t('Evening'), 18, 0],
    [t('Night'), 22, 0],
  ];

  const left = fmtRemaining(value - now);

  return (
    <div className="dlp">
      <div className="dlp-summary" aria-live="polite">
        <span className="dlp-summary-date">{fmt.full.format(value)}</span>
        <span className="dlp-summary-time" dir="ltr">
          {two(h)}:{two(m)}
        </span>
        <span className="dlp-summary-left">{t('{time} left', { time: left })}</span>
      </div>

      <div className="dlp-jumps" role="group" aria-label={t('Quick picks')}>
        {(
          [
            [t('Tomorrow'), 1],
            [t('In a week'), 7],
            [t('In a month'), 30],
            [t('In 3 months'), 91],
          ] as Array<[string, number]>
        ).map(([label, n]) => {
          const ms = at(addDays(today, n), h, m);
          return (
            <button key={n} type="button" className={`dlp-jump${startOfDay(ms) === selDay ? ' is-on' : ''}`} disabled={ms > hi} onClick={() => onChange(clamp(ms))}>
              {label}
            </button>
          );
        })}
      </div>

      {month && (
        <div className="dlp-cal">
          <div className="dlp-cal-head">
            <button type="button" className="dlp-cal-nav" aria-label={t('Previous month')} disabled={shownMonth <= 0} onClick={() => setShownMonth(i => Math.max(0, i - 1))}>
              {fa ? '›' : '‹'}
            </button>
            <strong>{month.label}</strong>
            <button
              type="button"
              className="dlp-cal-nav"
              aria-label={t('Next month')}
              disabled={shownMonth >= months.length - 1}
              onClick={() => setShownMonth(i => Math.min(months.length - 1, i + 1))}
            >
              {fa ? '‹' : '›'}
            </button>
          </div>
          <div className="dlp-cal-grid" role="radiogroup" aria-label={t('Deadline day')}>
            {weekdays.map((w, i) => (
              <span key={`w${i}`} className="dlp-cal-wd" aria-hidden>
                {w}
              </span>
            ))}
            {month.cells.map((d, i) =>
              d === null ? (
                <span key={`e${i}`} />
              ) : (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={d === selDay}
                  aria-label={fmt.full.format(d)}
                  disabled={d < today || d > hi}
                  className={`dlp-cal-day${d === selDay ? ' is-on' : ''}${d === today ? ' is-today' : ''}${
                    (fa ? new Date(d).getDay() === 5 : [0, 6].includes(new Date(d).getDay())) ? ' is-weekend' : ''
                  }`}
                  onClick={() => pickDay(d)}
                >
                  {fmt.day.format(d)}
                </button>
              ),
            )}
          </div>
        </div>
      )}

      <div className="dlp-time">
        <div className="dlp-wheels" dir="ltr">
          <Wheel
            label={t('Hour')}
            items={HOURS}
            value={h}
            onPick={pickHour}
            isDisabled={hour => at(selDay, hour, 55) < lo || at(selDay, hour, 0) > hi}
          />
          <span className="dlp-colon">:</span>
          <Wheel
            label={t('Minute')}
            items={MINUTES}
            value={m}
            onPick={pickMinute}
            isDisabled={minute => at(selDay, h, minute) < lo || at(selDay, h, minute) > hi}
          />
        </div>
        <div className="dlp-quick">
          {QUICK.map(([label, qh, qm]) => {
            const ms = at(selDay, qh, qm);
            const off = ms < lo || ms > hi;
            return (
              <button
                key={label}
                type="button"
                className={`dlp-quick-btn${h === qh && m === qm ? ' is-on' : ''}`}
                disabled={off}
                onClick={() => onChange(ms)}
              >
                <span>{label}</span>
                <small dir="ltr">
                  {two(qh)}:{two(qm)}
                </small>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** A scroll wheel (snap list) of numbers; the middle row is the chosen one. */
function Wheel({
  label,
  items,
  value,
  onPick,
  isDisabled,
}: {
  label: string;
  items: number[];
  value: number;
  onPick: (v: number) => void;
  isDisabled: (v: number) => boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<number | undefined>(undefined);
  /** Set while we scroll it ourselves, so that scroll isn't read as a pick. */
  const auto = useRef(false);
  const index = Math.max(0, items.indexOf(value));
  const first = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = index * ITEM_H;
    if (Math.abs(el.scrollTop - target) < 2) return;
    auto.current = true;
    el.scrollTo({ top: target, behavior: first.current ? 'auto' : 'smooth' });
    first.current = false;
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => (auto.current = false), 450);
  }, [index]);
  useEffect(() => () => window.clearTimeout(settle.current), []);

  const onScroll = () => {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      if (auto.current) {
        auto.current = false;
        return;
      }
      const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)));
      if (items[i] !== value) onPick(items[i]!);
      else el.scrollTo({ top: i * ITEM_H, behavior: 'smooth' });
    }, 130);
  };

  const step = (dir: 1 | -1) => {
    const i = Math.min(items.length - 1, Math.max(0, index + dir));
    onPick(items[i]!);
  };

  return (
    <div className="dlp-wheel">
      <div
        ref={ref}
        className="dlp-wheel-list"
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuetext={two(value)}
        onScroll={onScroll}
        onKeyDown={e => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            step(-1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            step(1);
          }
        }}
      >
        {items.map(v => (
          <button
            key={v}
            type="button"
            tabIndex={-1}
            className={`dlp-wheel-item${v === value ? ' is-on' : ''}${isDisabled(v) ? ' is-off' : ''}`}
            onClick={() => onPick(v)}
          >
            {two(v)}
          </button>
        ))}
      </div>
      <span className="dlp-wheel-label">{label}</span>
    </div>
  );
}
