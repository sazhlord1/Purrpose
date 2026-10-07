import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppIcon, type Expression, type IconName } from '@purrpose/cats';
import {
  CAT_IDS,
  CONSEQUENCE_TYPES,
  CREDIT_TYPE_LABELS,
  FREE_CAT_IDS,
  GRACE_WINDOW_MS,
  HABIT_DEFAULT_SLIPS,
  HABIT_DURATIONS_DAYS,
  HABIT_MAX_SLIPS,
  HABIT_MIN_SLIPS,
  detectiveLine,
  fmtFood,
  habitLoss,
  now,
  type CatId,
  type ConsequenceType,
  type HabitDto,
} from '@purrpose/shared';
import { BackLink } from '../components/BackLink.js';
import { InterrogationRoom } from '../components/InterrogationRoom.js';
import { AmountPicker, Chip, DoodleButton, Field, Input, SketchCard } from '../components/ui/index.js';
import { api, ApiError } from '../lib/api.js';
import { catNameOf } from '../lib/labels.js';
import { useHabits, useMe } from '../lib/queries.js';

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
  const label = CREDIT_TYPE_LABELS[h.consequenceType].toLowerCase();
  const share = h.stakeAmount / h.maxSlips;
  return (
    <div className="locker">
      <div className="row" style={{ alignItems: 'baseline' }}>
        <strong>
          {fmtFood(h.locked)} of {h.stakeAmount} {label} locked
        </strong>
        <span className="muted" style={{ fontSize: 13 }}>
          {h.status === 'ACTIVE' ? `${daysLeft(h)} day${daysLeft(h) === 1 ? '' : 's'} left` : h.status === 'KEPT' ? 'case dismissed' : 'case closed'}
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
          {h.slipCount} of {h.maxSlips} slips · each slip locks {fmtFood(share)} {label}
          {h.status === 'ACTIVE' && h.slipCount > 0 && ` · if it ended today the cats would get ${habitLoss(h.stakeAmount, h.slipCount, h.maxSlips)}`}
        </span>
      </div>
    </div>
  );
}

function NewCaseForm({ onDone }: { onDone: (h: HabitDto) => void }) {
  const me = useMe();
  const qc = useQueryClient();
  const unlocked: readonly string[] = me.data?.unlockedCatIds ?? FREE_CAT_IDS;
  const [title, setTitle] = useState('');
  const [catId, setCatId] = useState<CatId>('tuxedo');
  const [type, setType] = useState<ConsequenceType>('MEALS');
  const [stake, setStake] = useState(2);
  const [slips, setSlips] = useState(HABIT_DEFAULT_SLIPS);
  const [days, setDays] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);
  const available = me.data?.balances.find(b => b.creditType === type)?.available ?? 0;
  const label = CREDIT_TYPE_LABELS[type].toLowerCase();

  const create = useMutation({
    mutationFn: () =>
      api<{ habit: HabitDto }>('/habits', {
        method: 'POST',
        body: { title, catId, consequenceType: type, stakeAmount: stake, maxSlips: slips, durationDays: days },
      }),
    onSuccess: r => {
      void qc.invalidateQueries({ queryKey: ['habits'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      onDone(r.habit);
    },
    onError: e => setError(e instanceof ApiError ? e.message : 'Could not reach the station.'),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    create.mutate();
  };

  return (
    <SketchCard variant="b">
      <h2 style={{ marginTop: 0 }}>Open a case</h2>
      <form className="auth-form" onSubmit={submit}>
        <Field label="What are you quitting or sticking to?">
          <Input
            required
            maxLength={80}
            placeholder="No cigarettes · Stick to my diet · No doom-scrolling"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Detective on the case">
          <div className="chip-row" style={{ margin: 0 }}>
            {CAT_IDS.filter(id => unlocked.includes(id)).map(id => (
              <Chip key={id} active={catId === id} onClick={() => setCatId(id)}>
                {catNameOf(id)}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="Food on the table" hint={`${available} ${label} available`} error={stake > available ? 'Not enough food in the pantry.' : undefined}>
          <div className="chip-row" style={{ margin: '0 0 8px' }}>
            {CONSEQUENCE_TYPES.map(t => (
              <Chip key={t} active={type === t} onClick={() => setType(t)}>
                <AppIcon name={FOOD_ICON[t]} size={16} /> {CREDIT_TYPE_LABELS[t]}
              </Chip>
            ))}
          </div>
          <AmountPicker value={stake} onChange={setStake} />
        </Field>
        <Field label={`Slips allowed before the case closes: ${slips}`} hint={`Each slip locks ${fmtFood(stake / slips)} ${label}.`}>
          <input
            type="range"
            min={HABIT_MIN_SLIPS}
            max={HABIT_MAX_SLIPS}
            value={slips}
            onChange={e => setSlips(Number(e.target.value))}
            aria-label="Slips allowed"
            style={{ width: '100%' }}
          />
        </Field>
        <Field label="For how long?">
          <div className="chip-row" style={{ margin: 0 }}>
            {HABIT_DURATIONS_DAYS.map(d => (
              <Chip key={d} active={days === d} onClick={() => setDays(d)}>
                {d} days
              </Chip>
            ))}
          </div>
        </Field>
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
          Confess every slip. At the end, whatever is locked goes to the cats and the rest comes back to your pantry.
          Slip {slips} times and the whole {stake} {label} is gone.
        </p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <DoodleButton type="submit" variant="primary" size="big" disabled={create.isPending || stake > available || !title.trim()}>
          {create.isPending ? '…' : 'Open the case'}
        </DoodleButton>
      </form>
    </SketchCard>
  );
}

/** Detective Cheat: confess your slips in the interrogation room. */
export function Detective() {
  const qc = useQueryClient();
  const habits = useHabits();
  const reduced = isReduced();
  const all = useMemo(() => habits.data?.habits ?? [], [habits.data]);
  const open = all.filter(h => h.status === 'ACTIVE');
  const closed = all.filter(h => h.status !== 'ACTIVE');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
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
    onError: e => setError(e instanceof ApiError ? e.message : 'Could not reach the station.'),
  });

  const withdraw = useMutation({
    mutationFn: (id: string) => api<void>(`/habits/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['habits'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: e => setError(e instanceof ApiError ? e.message : 'Could not reach the station.'),
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
        : 'Sit. Tell me about your day.');
  const canWithdraw = current && current.slipCount === 0 && now() - Date.parse(current.startedAtISO) < GRACE_WINDOW_MS;

  return (
    <main>
      <header style={{ marginBottom: 12 }}>
        <BackLink />
        <h1 style={{ margin: 0 }}>Detective Cheat</h1>
        <p className="muted" style={{ margin: '4px 0 0' }}>
          Quitting something? Stake food, then confess every slip. Each confession locks a share of it.
        </p>
      </header>

      {open.length > 1 && (
        <div className="chip-row" role="tablist" aria-label="Open cases">
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
              {confess.isPending ? '…' : confirming ? 'Yes. I confess.' : 'I cheated'}
            </button>
            <span className="room-cta-hint">{confirming ? 'Tap again to confess' : current.title}</span>
          </div>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}

      {current && (
        <SketchCard variant="a">
          <h2 style={{ marginTop: 0 }}>Evidence locker</h2>
          <EvidenceLocker h={current} />
          {canWithdraw && (
            <p style={{ margin: '10px 0 0', fontSize: 13 }}>
              Opened this by mistake?{' '}
              <button type="button" className="linklike" onClick={() => withdraw.mutate(current.id)} disabled={withdraw.isPending}>
                Withdraw the case
              </button>{' '}
              <span className="muted">(only in the first few minutes, before any slip)</span>
            </p>
          )}
        </SketchCard>
      )}

      {habits.isLoading ? (
        <p className="muted">pulling the files…</p>
      ) : !current || showForm ? (
        <NewCaseForm
          onDone={h => {
            setSelectedId(h.id);
            setShowForm(false);
            setLine("Then it's settled. I'll be watching.");
          }}
        />
      ) : (
        <div style={{ marginTop: 14 }}>
          <DoodleButton onClick={() => setShowForm(true)}>+ Open another case</DoodleButton>
        </div>
      )}

      {closed.length > 0 && (
        <section style={{ marginTop: 20 }}>
          <h2>Case files</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {closed.map(h => (
              <SketchCard key={h.id} variant="c">
                <div className="row" style={{ alignItems: 'baseline' }}>
                  <strong>{h.title}</strong>
                  <span className={`stamp ${h.status === 'KEPT' ? 'stamp-kept' : 'stamp-fed'}`}>
                    {h.status === 'KEPT' ? 'dismissed' : 'closed'}
                  </span>
                </div>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 13.5 }}>
                  {h.slipCount} of {h.maxSlips} slips · the cats got {h.lostAmount ?? 0} of {h.stakeAmount}{' '}
                  {CREDIT_TYPE_LABELS[h.consequenceType].toLowerCase()} · detective {catNameOf(h.catId)}
                </p>
              </SketchCard>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
