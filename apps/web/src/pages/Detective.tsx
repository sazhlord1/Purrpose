import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppIcon, type Expression, type IconName } from '@purrpose/cats';
import {
  GRACE_WINDOW_MS,
  detectiveLine,
  habitLoss,
  now,
  type CatId,
  type ConsequenceType,
  type HabitDto,
} from '@purrpose/shared';
import { BackLink } from '../components/BackLink.js';
import { InterrogationRoom } from '../components/InterrogationRoom.js';
import { Chip, SketchCard } from '../components/ui/index.js';
import { api, ApiError } from '../lib/api.js';
import { catNameOf } from '../lib/labels.js';
import { useHabits, useMe } from '../lib/queries.js';
import { foodAmount, foodQty, t } from '../i18n/index.js';
import { startNewCase } from '../lib/startFlows.js';
import { Tour } from '../components/Tour.js';
import { detectiveTour } from '../lib/tours.js';

const FOOD_ICON: Record<ConsequenceType, IconName> = { MEALS: 'meals', DRY_FOOD: 'dryFood', VET_CARE: 'vetCare' };
const DAY_MS = 24 * 3_600_000;

function isReduced(): boolean {
  try {
    return localStorage.getItem('purrpose.reducedMotion') === '1';
  } catch {
    return false;
  }
}

function daysLeft(h: HabitDto): number {
  return Math.max(0, Math.ceil((Date.parse(h.endsAtISO) - now()) / DAY_MS));
}

/** The food on the table: one tile per unit, the locked part hatched over, plus the slip track. */
function EvidenceLocker({ h }: { h: HabitDto }) {
  const units = Math.min(h.stakeAmount, 12);
  const perUnit = h.stakeAmount / units; // >1 when the stake is too big to draw one tile each
  const type = h.consequenceType;
  const share = h.stakeAmount / h.maxSlips;
  return (
    <div className="locker">
      <div className="row" style={{ alignItems: 'baseline' }}>
        <strong>
          {t('{locked} of {stake} locked', { locked: foodQty(type, h.locked), stake: foodAmount(type, h.stakeAmount) })}
        </strong>
        <span className="muted" style={{ fontSize: 13 }}>
          {h.status === 'ACTIVE'
            ? t(daysLeft(h) === 1 ? '{n} day left' : '{n} days left', { n: daysLeft(h) })
            : h.status === 'KEPT'
              ? t('case dismissed')
              : t('case closed')}
        </span>
      </div>
      <div className="locker-food" aria-hidden>
        {Array.from({ length: units }, (_, i) => {
          const lockedHere = Math.max(0, Math.min(1, h.locked / perUnit - i));
          return (
            <div className="locker-unit" key={i}>
              <AppIcon name={FOOD_ICON[h.consequenceType]} size={26} />
              <div className="locker-unit-lock" style={{ width: `${lockedHere * 100}%` }} />
              {lockedHere >= 1 && (
                <span className="locker-unit-pad">
                  <AppIcon name="lock" size={12} />
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="locker-slips">
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${h.maxSlips}, 1fr)`, gap: 4 }}>
          {Array.from({ length: h.maxSlips }, (_, i) => (
            <div key={i} className={`locker-slip ${i < h.slipCount ? 'is-used' : ''}`} />
          ))}
        </div>
        <span className="muted" style={{ fontSize: 13 }}>
          {h.status === 'ACTIVE' && h.slipCount > 0
            ? t('{used} of {max} slips · each slip locks {share} · if it ended today the cats would get {n}', {
                used: h.slipCount,
                max: h.maxSlips,
                share: foodAmount(type, share),
                n: foodAmount(type, habitLoss(h.stakeAmount, h.slipCount, h.maxSlips)),
              })
            : t('{used} of {max} slips · each slip locks {share}', {
                used: h.slipCount,
                max: h.maxSlips,
                share: foodAmount(type, share),
              })}
        </span>
      </div>
    </div>
  );
}

/** Detective Cheat: confess your slips in the interrogation room. */
export function Detective() {
  const qc = useQueryClient();
  const habits = useHabits();
  const me = useMe();
  const reduced = isReduced();
  const all = useMemo(() => habits.data?.habits ?? [], [habits.data]);
  const open = all.filter(h => h.status === 'ACTIVE');
  const closed = all.filter(h => h.status !== 'ACTIVE');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [line, setLine] = useState<string | null>(null);
  const [glare, setGlare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmTimer = useRef<number | undefined>(undefined);

  const current = open.find(h => h.id === selectedId) ?? open[0] ?? null;
  const shown = current ?? closed[0] ?? null;

  useEffect(() => () => window.clearTimeout(confirmTimer.current), []);
  useEffect(() => {
    setLine(null);
    setConfirming(false);
  }, [current?.id]);

  const confess = useMutation({
    mutationFn: (id: string) => api<{ habit: HabitDto }>(`/habits/${id}/slip`, { method: 'POST' }),
    onSuccess: r => {
      const h = r.habit;
      setLine(detectiveLine(h.slipCount, h.maxSlips, h.status, Math.floor(Math.random() * 1000)));
      setGlare(true);
      window.setTimeout(() => setGlare(false), 2600);
      void qc.invalidateQueries({ queryKey: ['habits'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: e => setError(e instanceof ApiError ? e.message : t('Could not reach the station.')),
  });

  const withdraw = useMutation({
    mutationFn: (id: string) => api<void>(`/habits/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['habits'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: e => setError(e instanceof ApiError ? e.message : t('Could not reach the station.')),
  });

  const onCheat = () => {
    if (!current || confess.isPending) return;
    setError(null);
    if (!confirming) {
      setConfirming(true);
      window.clearTimeout(confirmTimer.current);
      confirmTimer.current = window.setTimeout(() => setConfirming(false), 3500);
      return;
    }
    window.clearTimeout(confirmTimer.current);
    setConfirming(false);
    confess.mutate(current.id);
  };

  const catId: CatId = (shown?.catId as CatId) ?? 'tuxedo';
  let expression: Expression = 'bored';
  if (glare) expression = 'stare';
  if (shown?.status === 'BROKEN' && !current) expression = 'happyShut';
  const bubble =
    line ??
    (current
      ? detectiveLine(current.slipCount, current.maxSlips, 'ACTIVE', current.slipCount === 0 ? 2 : 3)
      : shown
        ? detectiveLine(shown.slipCount, shown.maxSlips, shown.status, 0)
        : detectiveLine(0, 1, 'ACTIVE', 2));
  const canWithdraw = current && current.slipCount === 0 && now() - Date.parse(current.startedAtISO) < GRACE_WINDOW_MS;

  return (
    <main>
      <header style={{ marginBottom: 12 }}>
        <BackLink />
        <h1 style={{ margin: 0 }}>{t('Detective Cheat')}</h1>
        <p className="muted" style={{ margin: '4px 0 0' }}>
          {t('Quitting something? Stake food, then confess every slip. Each confession locks a share of it.')}
        </p>
      </header>

      {open.length > 1 && (
        <div className="chip-row" role="tablist" aria-label={t('Open cases')}>
          {open.map(h => (
            <Chip key={h.id} active={current?.id === h.id} onClick={() => setSelectedId(h.id)}>
              {h.title}
            </Chip>
          ))}
        </div>
      )}

      <div className="room-stage">
        <InterrogationRoom catId={catId} expression={expression} headTilt={glare ? 1 : 0} reduced={reduced} />
        <div className="room-bubble" key={bubble} role="status">
          {bubble}
        </div>
        {current && (
          <div className="room-cta">
            <button
              type="button"
              className={`btn-cheat ${confirming ? 'is-confirming' : ''}`}
              onClick={onCheat}
              disabled={confess.isPending}
            >
              {confess.isPending ? '…' : confirming ? t('Yes. I confess.') : t('I cheated')}
            </button>
            <span className="room-cta-hint">{confirming ? t('Tap again to confess') : current.title}</span>
          </div>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}

      {current && <Tour id="detective" steps={detectiveTour()} />}
      {current && (
        <div data-tour="detective-locker">
        <SketchCard variant="a">
          <h2 style={{ marginTop: 0 }}>{t('Evidence locker')}</h2>
          <EvidenceLocker h={current} />
          {canWithdraw && (
            <p style={{ margin: '10px 0 0', fontSize: 13 }}>
              {t('Opened this by mistake?')}{' '}
              <button type="button" className="linklike" onClick={() => withdraw.mutate(current.id)} disabled={withdraw.isPending}>
                {t('Withdraw the case')}
              </button>{' '}
              <span className="muted">{t('(only in the first few minutes, before any slip)')}</span>
            </p>
          )}
        </SketchCard>
        </div>
      )}

      {habits.isLoading ? (
        <p className="muted">{t('pulling the files…')}</p>
      ) : (
        <div style={{ marginTop: 14 }}>
          <button type="button" className="case-open" onClick={() => startNewCase(me.data)}>
            + {current ? t('Open another case') : t('Open a new case')}
          </button>
        </div>
      )}

      {closed.length > 0 && (
        <section style={{ marginTop: 20 }}>
          <h2>{t('Case files')}</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {closed.map(h => (
              <SketchCard key={h.id} variant="c">
                <div className="row" style={{ alignItems: 'baseline' }}>
                  <strong>{h.title}</strong>
                  <span className={`stamp ${h.status === 'KEPT' ? 'stamp-kept' : 'stamp-fed'}`}>
                    {h.status === 'KEPT' ? t('dismissed') : t('closed')}
                  </span>
                </div>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 13.5 }}>
                  {t('{used} of {max} slips · the cats got {lost} of {stake} · detective {name}', {
                    used: h.slipCount,
                    max: h.maxSlips,
                    lost: foodQty(h.consequenceType, h.lostAmount ?? 0),
                    stake: foodAmount(h.consequenceType, h.stakeAmount),
                    name: catNameOf(h.catId),
                  })}
                </p>
              </SketchCard>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
