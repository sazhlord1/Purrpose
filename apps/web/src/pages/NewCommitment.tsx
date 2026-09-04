import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CAT_SEED,
  CONSEQUENCE_TYPES,
  CREDIT_TYPE_LABELS,
  type CatId,
  type CommitmentDto,
  type ConsequenceType,
  type MeResponse,
} from '@purrpose/shared';
import { Cat } from '@purrpose/cats';
import { api, ApiError } from '../lib/api.js';
import { requestNotificationPermission } from '../lib/notifications.js';
import { AmountPicker, Chip, DoodleButton, Field, Input, SketchCard } from '../components/ui/index.js';
import { CanTin, KibbleBag, VetCare } from '../components/doodles/index.js';
import { PawShake } from '../components/PawShake.js';

interface CatsResponse {
  cats: Array<{ id: string; name: string; personality: string }>;
}

const CAT_QUIPS: Record<string, string> = Object.fromEntries(
  CAT_SEED.map(c => [c.id, c.config.quirks.chosenLine]),
);

const CAT_ARCHETYPES: Record<string, string> = {
  orange: 'Golden Tabby · Joyful Sunbather',
  tuxedo: 'The Aristocrat · Striped Cap Tuxedo',
  black: 'Midnight Velvet · Luminous Eyes',
  boba: 'Sweet Calico · Cheeky Side-Glance',
  mochi: 'Snow White · Soft Marshmallow',
  oreo: 'Masked Tuxedo · Mustache Gentleman',
  pepper: 'Polka-Dot · Bubbly Sweetheart',
  yuki: 'Expressive Sketch · Playful Spirit',
};

const OVERSTAKE_QUIPS: Record<string, string> = {
  orange: 'Bold of you. You don’t have that many!',
  tuxedo: 'One cannot stake what one does not have.',
  black: 'you don’t have that many. i counted.',
  boba: 'even in my sleep, i know you lack the snacks for that.',
  mochi: 'i checked the pantry... not enough snacks, friend.',
  oreo: 'my mustache senses an overdraft! check your balance.',
  pepper: 'more snacks needed for that! check your pantry!',
  yuki: 'energy overload! you need more snacks to stake that!',
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

  const [title, setTitle] = useState('');
  const [when, setWhen] = useState(() => localInputValue(Date.now() + 24 * 3_600_000));
  const [selectedQuick, setSelectedQuick] = useState<'Tonight' | 'Tomorrow' | 'Next week' | null>('Tomorrow');
  const [creditType, setCreditType] = useState<ConsequenceType>('MEALS');
  const [amount, setAmount] = useState(5);
  const [catId, setCatId] = useState<CatId>('orange');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sealedCommitmentId, setSealedCommitmentId] = useState<string | null>(null);
  const [showPawShake, setShowPawShake] = useState(false);

  const minWhen = localInputValue(Date.now() + 6 * 60_000);
  const available = me.data?.balances.find(b => b.creditType === creditType)?.available ?? 0;
  const overstaked = amount > available;
  const isValid = title.trim().length > 0 && !overstaked;

  const currentCat = CAT_SEED.find(c => c.id === catId) ?? CAT_SEED[0];

  const handleQuickDeadline = (label: 'Tonight' | 'Tomorrow' | 'Next week', ms: number) => {
    setSelectedQuick(label);
    setWhen(localInputValue(Date.now() + ms));
  };

  async function handleConfirmSubmit() {
    if (!isValid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ commitment: CommitmentDto }>('/commitments', {
        method: 'POST',
        body: {
          title: title.trim(),
          deadlineISO: new Date(when).toISOString(),
          catId,
          consequenceType: creditType,
          consequenceAmount: amount,
        },
      });
      void requestNotificationPermission();
      setSealedCommitmentId(res.commitment.id);
      setShowPawShake(true);
    } catch (e) {
      setConfirming(false);
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

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 96 }}>
      {/* Handshake Overlay Animation on Success */}
      <PawShake
        open={showPawShake}
        catId={catId}
        catName={currentCat.name}
        onComplete={() => {
          if (sealedCommitmentId) {
            navigate(`/commitment/${sealedCommitmentId}`);
          }
        }}
      />

      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 32 }}>The Feline Pact</h1>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          Make a promise your cat can hold you to.
        </p>
      </div>

      {/* The Unified All-in-One Task Card */}
      <SketchCard variant="a" style={{ padding: '18px 20px', position: 'relative' }}>
        {/* Top Decorative Stamp */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
          <span
            style={{
              fontFamily: 'var(--font-hand)',
              fontSize: 13.5,
              letterSpacing: '1.8px',
              color: 'var(--stamp-red)',
              fontWeight: 'bold',
              border: '1.5px dashed var(--stamp-red)',
              padding: '3px 12px',
              borderRadius: 6,
              background: 'var(--paper)',
            }}
          >
            ★ FELINE COMMITMENT PACT ★
          </span>
        </div>

        {/* 1. CAT SHOWCASE & COMPANION PICKER */}
        <div
          style={{
            background: 'var(--paper)',
            border: '2px solid var(--ink)',
            borderRadius: 'var(--radius-sketch-b)',
            padding: '12px 14px',
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Chosen Cat SVG Portrait */}
          <div style={{ height: 125, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cat catId={catId} state="ANTICIPATING" size={135} />
          </div>

          <div style={{ textAlign: 'center', width: '100%', marginTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <strong style={{ fontSize: 18 }}>{currentCat.name}</strong>
              <span
                style={{
                  fontSize: 11,
                  background: 'var(--ink)',
                  color: 'var(--paper)',
                  padding: '1px 8px',
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                CHOSEN OPPONENT
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--stamp-red)', margin: '2px 0 6px', fontWeight: 600 }}>
              {CAT_ARCHETYPES[catId] ?? currentCat.personality}
            </p>

            {/* Reactive Cat Quip Speech */}
            <div
              style={{
                fontFamily: 'var(--font-hand)',
                fontSize: 14,
                color: 'var(--ink)',
                background: 'var(--paper-raised)',
                border: '1.5px solid var(--ink)',
                borderRadius: 12,
                padding: '6px 12px',
                display: 'inline-block',
                maxWidth: '90%',
              }}
            >
              "{overstaked ? (OVERSTAKE_QUIPS[catId] ?? 'Not enough treats!') : (CAT_QUIPS[catId] ?? 'Deal!!')}"
            </div>
          </div>

          {/* Quick Cat Switcher Avatars */}
          <div style={{ width: '100%', marginTop: 12, borderTop: '1px dashed rgba(43,35,31,0.25)', paddingTop: 10 }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 600, display: 'block', marginBottom: 6, textAlign: 'center' }}>
              Choose your feline opponent:
            </span>
            <div
              style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}
              role="radiogroup"
              aria-label="Choose your opponent"
            >
              {CAT_SEED.map(cat => {
                const isSelected = catId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setCatId(cat.id as CatId)}
                    className={`chip ${isSelected ? 'chip-active' : ''}`}
                    style={{
                      fontSize: 12,
                      padding: '3px 10px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. THE TASK INPUT */}
        <div style={{ marginBottom: 16 }}>
          <Field label="I promise to get done:" hint="Clear, actionable goal">
            <Input
              autoFocus
              maxLength={80}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Finish YouTube video"
              style={{ fontSize: 16, fontWeight: 500 }}
            />
          </Field>
        </div>

        {/* 3. DEADLINE SECTION */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 6 }}>
            Deadline:
          </span>
          <div className="chip-row" style={{ marginBottom: 8 }}>
            {[
              ['Tonight', 6 * 3_600_000],
              ['Tomorrow', 24 * 3_600_000],
              ['Next week', 7 * 24 * 3_600_000],
            ].map(([label, ms]) => (
              <Chip
                key={label as string}
                active={selectedQuick === label}
                onClick={() => handleQuickDeadline(label as 'Tonight' | 'Tomorrow' | 'Next week', ms as number)}
              >
                {label as string}
              </Chip>
            ))}
          </div>
          <Input
            type="datetime-local"
            min={minWhen}
            value={when}
            aria-label="Deadline date and time"
            onChange={e => {
              setSelectedQuick(null);
              setWhen(e.target.value);
            }}
            style={{ fontSize: 14 }}
          />
        </div>

        {/* 4. THE STAKE (WHAT'S ON THE LINE) */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-soft)' }}>
              What's at stake if you procrastinate?
            </span>
            <span style={{ fontSize: 12, color: '#2E6930', fontWeight: 600 }}>
              {available} {CREDIT_TYPE_LABELS[creditType]} available
            </span>
          </div>

          <div className="chip-row" style={{ marginBottom: 10 }}>
            {CONSEQUENCE_TYPES.map(t => {
              const Icon = DOODLE_BY_TYPE[t];
              return (
                <Chip
                  key={t}
                  active={creditType === t}
                  onClick={() => setCreditType(t)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon size={18} strokeWidth={2.2} /> {CREDIT_TYPE_LABELS[t]}
                  </span>
                </Chip>
              );
            })}
          </div>

          <Field
            label="Stake Amount:"
            error={overstaked ? (OVERSTAKE_QUIPS[catId] ?? 'Not enough available credits.') : undefined}
          >
            <AmountPicker value={amount} onChange={setAmount} max={9999} />
          </Field>
        </div>

        {/* Error Alert Box */}
        {error && (
          <p className="card error-box card-c" role="alert" style={{ margin: '8px 0 14px' }}>
            {error}
          </p>
        )}

        {/* 5. CONFIRMATION PROMPT / SUBMISSION */}
        {!confirming ? (
          <div style={{ marginTop: 20 }}>
            <DoodleButton
              variant="primary"
              size="big"
              disabled={!isValid || busy}
              onClick={() => setConfirming(true)}
              style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
            >
              🐾 Seal the Pact
            </DoodleButton>
          </div>
        ) : (
          <div
            className="card card-b"
            style={{
              marginTop: 18,
              padding: '14px 16px',
              background: 'var(--paper)',
              borderColor: 'var(--accent-coral)',
              borderWidth: 2,
              textAlign: 'center',
            }}
          >
            <h3 style={{ margin: '0 0 6px', fontSize: 19 }}>Are you sure about this commitment?</h3>
            <p className="muted" style={{ margin: '0 0 14px', fontSize: 13.5 }}>
              You are staking <strong>{amount} {CREDIT_TYPE_LABELS[creditType]}</strong> with{' '}
              <strong>{currentCat.name}</strong>. If you finish in time, your food stays yours. If you fail,{' '}
              {currentCat.name} feasts!
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <DoodleButton
                variant="primary"
                size="big"
                disabled={busy}
                onClick={handleConfirmSubmit}
              >
                Yes, I promise!
              </DoodleButton>
              <DoodleButton onClick={() => setConfirming(false)}>
                Wait, not yet
              </DoodleButton>
            </div>
          </div>
        )}
      </SketchCard>
    </main>
  );
}
