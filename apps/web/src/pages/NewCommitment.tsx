import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CAT_SEED,
  CONSEQUENCE_TYPES,
  CREDIT_TYPE_LABELS,
  type CommitmentDto,
  type ConsequenceType,
  type MeResponse,
} from '@purrpose/shared';
import { Cat } from '@purrpose/cats';
import { api, ApiError } from '../lib/api.js';
import { requestNotificationPermission } from '../lib/notifications.js';
import { AmountPicker, Chip, DoodleButton, Field, Input, SketchCard } from '../components/ui/index.js';
import { CanTin, KibbleBag, VetCare } from '../components/doodles/index.js';

interface CatsResponse {
  cats: Array<{ id: string; name: string; personality: string }>;
}

const STEP_TITLES = ['The task', 'The deadline', 'The stake', 'The amount', 'Opponent', 'Make it official'];

const CAT_QUIPS: Record<string, string> = Object.fromEntries(
  CAT_SEED.map(c => [c.id, c.config.quirks.chosenLine]),
);

const CAT_ARCHETYPES: Record<string, string> = {
  orange: 'Chaos Agent · Orange Tabby',
  tuxedo: 'The Aristocrat · Classic Tuxedo',
  black: 'Shadow Void · Slinky Fiend',
  boba: 'Sleepy Chonk · Fluffy Calico',
  ziggy: 'Speedster · Siamese Gremlin',
};

const OVERSTAKE_QUIPS: Record<string, string> = {
  orange: 'Bold of you. You don’t have that many!',
  tuxedo: 'One cannot stake what one does not have.',
  black: 'you don’t have that many. i counted.',
  boba: 'even in my sleep, i know you lack the snacks for that.',
  ziggy: 'ZOOM ERROR 404: INSUFFICIENT TREATS DETECTED!!',
};

const DOODLE_BY_TYPE = {
  MEALS: CanTin,
  DRY_FOOD: KibbleBag,
  VET_CARE: VetCare,
};

function localInputValue(ms: number): string {
  const d = new Date(ms);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function NewCommitment() {
  const navigate = useNavigate();
  const cats = useQuery({ queryKey: ['cats'], queryFn: () => api<CatsResponse>('/cats') });
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<MeResponse>('/me') });

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState(() => localInputValue(Date.now() + 2 * 3_600_000));
  const [creditType, setCreditType] = useState<ConsequenceType>('MEALS');
  const [amount, setAmount] = useState(5);
  const [catId, setCatId] = useState('orange');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const minWhen = localInputValue(Date.now() + 6 * 60_000);
  const available =
    me.data?.balances.find(b => b.creditType === creditType)?.available ?? 0;
  const overstaked = amount > available;

  const stepDone = [title.trim().length > 0, true, true, !overstaked, true, true];

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ commitment: CommitmentDto }>('/commitments', {
        method: 'POST',
        body: {
          title,
          deadlineISO: new Date(when).toISOString(),
          catId,
          consequenceType: creditType,
          consequenceAmount: amount,
        },
      });
      void requestNotificationPermission();
      navigate(`/commitment/${res.commitment.id}`);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.code === 'INSUFFICIENT_AVAILABLE'
            ? OVERSTAKE_QUIPS[catId] ?? 'Not enough available credits.'
            : e.message
          : 'Something went wrong.',
      );
      setBusy(false);
    }
  }

  const next = () => {
    if (!stepDone[step] || step === 5) return;
    setStep(s => s + 1);
  };
  const back = () => setStep(s => Math.max(0, s - 1));

  return (
    <main>
      <h1>New commitment</h1>
      <div className="chip-row" aria-label="Progress">
        {STEP_TITLES.map((t, i) => (
          <span
            key={t}
            className={`chip${i === step ? ' chip-active' : ''}`}
            style={{ color: i <= step ? undefined : 'var(--ink-soft)' }}
          >
            {i + 1}·{t}
          </span>
        ))}
      </div>

      {step === 0 && (
        <Field label="What do you want to get done?" hint="enter to continue">
          <Input
            autoFocus
            maxLength={80}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && next()}
            placeholder="Finish YouTube video"
          />
        </Field>
      )}

      {step === 1 && (
        <>
          <Field label="When will it be done?">
            <Input
              type="datetime-local"
              min={minWhen}
              value={when}
              onChange={e => setWhen(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && next()}
            />
          </Field>
          <div className="chip-row">
            {[
              ['Tonight', 6 * 3_600_000],
              ['Tomorrow', 24 * 3_600_000],
              ['Next week', 7 * 24 * 3_600_000],
            ].map(([label, ms]) => (
              <Chip key={label as string} onClick={() => setWhen(localInputValue(Date.now() + (ms as number)))}>
                {label as string}
              </Chip>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="muted">What's at stake?</p>
          <div className="chip-row">
            {CONSEQUENCE_TYPES.map(t => {
              const Icon = DOODLE_BY_TYPE[t];
              return (
                <Chip key={t} active={creditType === t} onClick={() => setCreditType(t)}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon size={18} strokeWidth={2.2} /> {CREDIT_TYPE_LABELS[t]}
                  </span>
                </Chip>
              );
            })}
          </div>
          <p className="muted">
            You have {available} {CREDIT_TYPE_LABELS[creditType]} available.
          </p>
        </>
      )}

      {step === 3 && (
        <>
          <Field label="How much?" error={overstaked ? OVERSTAKE_QUIPS[catId] : undefined}>
            <AmountPicker value={amount} onChange={setAmount} max={9999} />
          </Field>
          <p className="muted">
            {available} {CREDIT_TYPE_LABELS[creditType]} available ·{' '}
            {overstaked ? 'stake less to continue.' : 'the rest stays safe.'}
          </p>
        </>
      )}

      {step === 4 && (
        <>
          <div style={{ marginBottom: 16 }}>
            <h2>Choose your opponent</h2>
            <p className="muted" style={{ marginTop: -4 }}>
              Pick the feline who will feast if you procrastinate.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
            role="radiogroup"
            aria-label="Choose your opponent"
          >
            {(cats.data?.cats ?? CAT_SEED).map(cat => {
              const isSelected = catId === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setCatId(cat.id)}
                  onKeyDown={e => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setCatId(cat.id);
                    }
                  }}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  className={`card ${isSelected ? 'card-b' : 'card-a'}`}
                  style={{
                    margin: 0,
                    padding: 12,
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--ink)' : 'rgba(26, 26, 26, 0.35)',
                    borderWidth: isSelected ? 2.5 : 1.5,
                    boxShadow: isSelected ? 'var(--shadow)' : 'none',
                    background: isSelected ? 'var(--paper-raised)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    transition: 'all 120ms ease-out',
                  }}
                >
                  <input
                    type="radio"
                    name="cat"
                    value={cat.id}
                    checked={isSelected}
                    onChange={() => setCatId(cat.id)}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    aria-label={`Select ${cat.name}`}
                  />
                  <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cat
                      catId={cat.id as any}
                      state={isSelected ? 'ANTICIPATING' : 'WAITING'}
                      size={120}
                    />
                  </div>
                  <div style={{ width: '100%', marginTop: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <strong style={{ fontSize: 17 }}>{cat.name}</strong>
                      {isSelected && (
                        <span
                          style={{
                            fontSize: 11,
                            background: 'var(--ink)',
                            color: 'var(--paper)',
                            padding: '1px 7px',
                            borderRadius: 999,
                            fontWeight: 600,
                          }}
                        >
                          SELECTED
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--accent-coral)', margin: '2px 0', fontWeight: 600 }}>
                      {CAT_ARCHETYPES[cat.id] ?? 'Feline Challenger'}
                    </p>
                    <p className="muted" style={{ fontSize: 12, margin: '2px 0 6px', lineHeight: 1.3 }}>
                      {cat.personality}
                    </p>
                    <div
                      style={{
                        fontFamily: 'var(--font-hand)',
                        fontSize: 13,
                        color: isSelected ? 'var(--ink)' : 'var(--ink-soft)',
                        borderTop: '1px dashed rgba(26,26,26,0.25)',
                        paddingTop: 6,
                        minHeight: 28,
                      }}
                    >
                      "{CAT_QUIPS[cat.id] ?? 'deal!!'}"
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {step === 5 && (
        <SketchCard variant="b">
          <h3>Ready?</h3>
          <p>
            <strong>{title}</strong>
            <br />
            <span className="muted">
              {new Date(when).toLocaleString()} · {amount} {CREDIT_TYPE_LABELS[creditType]} ·{' '}
              {cats.data?.cats.find(c => c.id === catId)?.name}
            </span>
          </p>
          <p className="muted">Finish in time and the meals stay yours. Don't, and your cat eats.</p>
        </SketchCard>
      )}

      {error && (
        <p className="card error-box card-c" role="alert">
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        {step > 0 && step < 5 && <DoodleButton onClick={back}>Back</DoodleButton>}
        {step < 5 && (
          <DoodleButton variant="primary" disabled={!stepDone[step]} onClick={next}>
            {step === 4 ? 'Review' : 'Next'}
          </DoodleButton>
        )}
        {step === 5 && (
          <>
            <DoodleButton onClick={back}>Back</DoodleButton>
            <DoodleButton variant="primary" size="big" disabled={busy} onClick={submit}>
              Make It Official
            </DoodleButton>
          </>
        )}
      </div>
    </main>
  );
}
