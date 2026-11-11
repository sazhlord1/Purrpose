import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { markTourSeen, tourSeen, useToursAllowed } from '../lib/tour.js';
import { isRtlUi, num, t } from '../i18n/index.js';

export interface TourStep {
  /** CSS selector of the thing to light up; omit for a centered message. */
  target?: string;
  title: string;
  body: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;
const GAP = 12;
const BUBBLE_MAX = 340;

function rectOf(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

function isVisible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

/**
 * A guided tour for one screen: the page darkens, one thing at a time stays lit,
 * and a bubble next to it says what it is. Shown once per device (Settings can
 * bring it back), skippable at any step, keyboard friendly.
 */
export function Tour({ id, steps, delayMs = 700 }: { id: string; steps: TourStep[]; delayMs?: number }) {
  const allowed = useToursAllowed();
  const [active, setActive] = useState<TourStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [bubbleH, setBubbleH] = useState(0);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const stepsKey = useMemo(() => steps.map(s => s.target ?? s.title).join('|'), [steps]);

  // Start once the page has settled, nothing else is on screen, and it wasn't seen before.
  useEffect(() => {
    if (active || !allowed || tourSeen(id)) return undefined;
    const timer = window.setTimeout(() => {
      if (tourSeen(id)) return;
      // Only steps whose target is actually on this screen right now.
      const present = steps.filter(s => {
        if (!s.target) return true;
        const el = document.querySelector(s.target);
        return el !== null && isVisible(el);
      });
      if (present.length === 0) return;
      setIndex(0);
      setActive(present);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [allowed, id, stepsKey, active, delayMs]);

  const step = active?.[index];

  const measure = useCallback(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    setRect(el && isVisible(el) ? rectOf(el) : null);
  }, [step]);

  // Bring the lit thing into view, then follow it on scroll/resize.
  useLayoutEffect(() => {
    if (!step) return undefined;
    const el = step.target ? document.querySelector(step.target) : null;
    if (el) {
      const r = el.getBoundingClientRect();
      const inView = r.top >= 70 && r.bottom <= window.innerHeight - 90;
      if (!inView) el.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
    measure();
    const onMove = () => measure();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    const settle = window.setTimeout(measure, 120);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
      window.clearTimeout(settle);
    };
  }, [step, measure]);

  useLayoutEffect(() => {
    if (bubbleRef.current) setBubbleH(bubbleRef.current.offsetHeight);
    nextRef.current?.focus({ preventScroll: true });
  }, [step, rect]);

  const finish = useCallback(() => {
    markTourSeen(id);
    setActive(null);
    setRect(null);
  }, [id]);

  const next = useCallback(() => {
    if (!active) return;
    if (index >= active.length - 1) finish();
    else setIndex(i => i + 1);
  }, [active, index, finish]);
  const back = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);

  useEffect(() => {
    if (!active) return undefined;
    const rtl = isRtlUi();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'Enter') next();
      else if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) next();
      else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, next, back, finish]);

  if (!active || !step) return null;

  // Bubble under the lit thing when there's room, otherwise above it; centered for intro steps.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(BUBBLE_MAX, vw - 32);
  let bubbleStyle: React.CSSProperties;
  let arrow: 'up' | 'down' | null = null;
  let arrowLeft = width / 2;
  if (rect) {
    const centerX = rect.left + rect.width / 2;
    const left = Math.min(Math.max(16, centerX - width / 2), vw - 16 - width);
    arrowLeft = Math.min(Math.max(20, centerX - left), width - 20);
    const below = rect.top + rect.height + GAP;
    const fitsBelow = below + bubbleH + 16 <= vh;
    if (fitsBelow || rect.top - GAP - bubbleH < 16) {
      bubbleStyle = { top: Math.min(below, vh - bubbleH - 16), left, width };
      arrow = fitsBelow ? 'up' : null;
    } else {
      bubbleStyle = { top: rect.top - GAP - bubbleH, left, width };
      arrow = 'down';
    }
  } else {
    bubbleStyle = { top: Math.max(16, vh / 2 - bubbleH / 2), left: (vw - width) / 2, width };
  }

  const last = index === active.length - 1;
  const rtl = isRtlUi();

  return createPortal(
    <div className="tour-layer" role="dialog" aria-modal="true" aria-label={step.title}>
      {/* The dim layer; the hole is a box with a huge shadow around the lit element. */}
      {rect ? (
        <div
          className="tour-hole"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          aria-hidden
        />
      ) : (
        <div className="tour-dim" aria-hidden />
      )}
      <div ref={bubbleRef} className="tour-bubble" style={bubbleStyle}>
        {arrow && <span className={`tour-arrow tour-arrow-${arrow}`} style={{ left: arrowLeft }} aria-hidden />}
        <div className="tour-head">
          <strong className="tour-title">{step.title}</strong>
          <span className="tour-count muted">
            {num(index + 1)}/{num(active.length)}
          </span>
        </div>
        <p className="tour-body">{step.body}</p>
        <div className="tour-actions">
          <button type="button" className="linklike tour-skip" onClick={finish}>
            {t('Skip guide')}
          </button>
          <span style={{ flex: 1 }} />
          {index > 0 && (
            <button type="button" className="chip tour-back" onClick={back}>
              {rtl ? '→' : '←'} {t('Back')}
            </button>
          )}
          <button ref={nextRef} type="button" className="chip chip-active tour-next" onClick={next}>
            {last ? t('Got it') : <>{t('Next')} {rtl ? '←' : '→'}</>}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
