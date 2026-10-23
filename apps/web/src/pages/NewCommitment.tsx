import { useQueryClient } from '@tanstack/react-query';
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CAT_IDS,
  CAT_SEED,
  CONSEQUENCE_TYPES,
  FREE_CAT_IDS,
  HONOR_MIN_STAKE,
  HONOR_STARTER_BONUS,
  HONOR_STARTER_COUNT,
  HONOR_STARTER_STAKE,
  catOverstake,
  catSubtitle,
  now,
  type CatId,
  type CommitmentDto,
  type CommitmentMode,
  type ConsequenceType,
} from '@purrpose/shared';
import { AppIcon, Cat } from '@purrpose/cats';
import { api, ApiError } from '../lib/api.js';
import { requestNotificationPermission } from '../lib/notifications.js';
import { AmountPicker, Chip, DoodleButton, Field, Input, SketchCard, Stepper } from '../components/ui/index.js';
import { CanTin, KibbleBag, VetCare } from '../components/doodles/index.js';
import { BackLink } from '../components/BackLink.js';
import { PawShake } from '../components/PawShake.js';
import { PactModeChooser } from '../components/pact/PactModeChooser.js';
import { useCommitments, useMe } from '../lib/queries.js';
import { foodName, getLocale, t } from '../i18n/index.js';
import { Tour } from '../components/Tour.js';
import { newPactTour } from '../lib/tours.js';

/** The cat's "you picked me" line, read at render time (CAT_SEED is localized at startup). */
function catQuip(id: string): string | undefined {
  return CAT_SEED.find(c => c.id === id)?.config.quirks.chosenLine;
}

/** Fills "{key}" slots in a translated sentence with React nodes (e.g. bold parts). */
function richText(template: string, parts: Record<string, ReactNode>): ReactNode[] {
  return template.split(/\{(\w+)\}/g).map((seg, i) =>
    i % 2 === 1 ? <Fragment key={i}>{parts[seg] ?? `{${seg}}`}</Fragment> : seg,
  );
}

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

/** Turns the server's validation details into one readable sentence. */
function firstFieldError(details: unknown): string | null {
  const fields = (details as { fieldErrors?: Record<string, string[] | undefined> } | undefined)?.fieldErrors;
  if (!fields) return null;
  for (const [field, messages] of Object.entries(fields)) {
    const msg = messages?.[0];
    if (!msg) continue;
    if (field === 'deadlineISO') return t('Deadline: {msg}.', { msg });
    if (field === 'title') return t('Give your pact a title (up to 80 characters).');
    return msg;
  }
  return null;
}

export function NewCommitment() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const me = useMe();
  const commitments = useCommitments();
  const unlocked: readonly string[] = me.data?.unlockedCatIds ?? FREE_CAT_IDS;

  // Step one: strict (food + proof) or on your word (PURR).
  const [mode, setMode] = useState<CommitmentMode | null>(null);
  const [choosing, setChoosing] = useState(true);
  const honorSoFar = (commitments.data?.commitments ?? []).filter(c => c.mode === 'HONOR').length;
  const startersLeft = Math.max(0, HONOR_STARTER_COUNT - honorSoFar);
  const purrFree = Math.max(0, (me.data?.purr ?? 0) - (me.data?.purrStaked ?? 0));
  const pantryEmpty = (me.data?.balances ?? []).every(b => b.available <= 0);
  const [purrStake, setPurrStake] = useState(20);
  const [witness, setWitness] = useState('');
  const ownEmail = me.data?.user.email?.toLowerCase() ?? null;

  const [title, setTitle] = useState('');
  const [when, setWhen] = useState(() => localInputValue(now() + 24 * 3_600_000));
  const [selectedQuick, setSelectedQuick] = useState<'Tonight' | 'Tomorrow' | 'Next week' | null>('Tomorrow');
  // The first server reply tells us its clock; re-anchor the default deadline to it.
  useEffect(() => {
    if (selectedQuick === 'Tomorrow') setWhen(localInputValue(now() + 24 * 3_600_000));
  }, [me.data?.serverTime]);
  const [creditType, setCreditType] = useState<ConsequenceType>('MEALS');
  const [amount, setAmount] = useState(5);
  const requestedCat = params.get('cat');
  const [catId, setCatId] = useState<CatId>(() =>
    requestedCat && (FREE_CAT_IDS as readonly string[]).includes(requestedCat) ? (requestedCat as CatId) : 'orange',
  );

  // "New pact with Mochi" from a result screen: select the requested cat once we know it's unlocked.
  useEffect(() => {
    if (requestedCat && (CAT_IDS as readonly string[]).includes(requestedCat) && unlocked.includes(requestedCat)) {
      setCatId(requestedCat as CatId);
    }
  }, [requestedCat, me.data]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sealedCommitmentId, setSealedCommitmentId] = useState<string | null>(null);
  const [showPawShake, setShowPawShake] = useState(false);

  const minWhen = localInputValue(now() + 6 * 60_000);
  const available = me.data?.balances.find(b => b.creditType === creditType)?.available ?? 0;
  const honorStake = startersLeft > 0 ? HONOR_STARTER_STAKE : purrStake;
  const overstaked = mode === 'HONOR' ? honorStake > purrFree : amount > available;
  const witnessEmail = witness.trim().toLowerCase();
  const witnessError =
    witnessEmail === ''
      ? null
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(witnessEmail)
        ? t('That email doesn’t look right.')
        : ownEmail && witnessEmail === ownEmail
          ? t('Your witness needs an email that isn’t yours.')
          : null;
  const catUnlocked = unlocked.includes(catId);
  const isValid = mode !== null && title.trim().length > 0 && !overstaked && catUnlocked && !(mode === 'STRICT' && witnessError);
  const stakeText = mode === 'HONOR' ? t('{n} PURR', { n: honorStake }) : `${amount} ${foodName(creditType)}`;

  const currentCat = CAT_SEED.find(c => c.id === catId) ?? CAT_SEED[0];

  const handleQuickDeadline = (label: 'Tonight' | 'Tomorrow' | 'Next week', ms: number) => {
    setSelectedQuick(label);
    setWhen(localInputValue(now() + ms));
  };

  async function handleConfirmSubmit() {
    if (!isValid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ commitment: CommitmentDto }>('/commitments', {
        method: 'POST',
        body:
          mode === 'HONOR'
            ? { title: title.trim(), deadlineISO: new Date(when).toISOString(), catId, mode, purrStake: honorStake }
            : {
                title: title.trim(),
                deadlineISO: new Date(when).toISOString(),
                catId,
                mode: 'STRICT',
                consequenceType: creditType,
                consequenceAmount: amount,
                ...(witnessEmail ? { witnessEmail } : {}),
              },
      });
      void requestNotificationPermission();
      void qc.invalidateQueries({ queryKey: ['commitments'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      setSealedCommitmentId(res.commitment.id);
      setShowPawShake(true);
    } catch (e) {
      setConfirming(false);
      setError(
        e instanceof ApiError
          ? e.code === 'INSUFFICIENT_AVAILABLE'
            ? catOverstake(catId) ?? t('Not enough available credits.')
            : e.code === 'INSUFFICIENT_PURR'
              ? t('Not enough free PURR for that.')
            : e.code === 'WITNESS_IS_YOU'
              ? t('Your witness needs an email that isn’t yours.')
            : e.code === 'CAT_LOCKED'
              ? t('{name} is locked. Unlock them in the Cat Shop first.', { name: currentCat.name })
              : e.code === 'INVALID_INPUT'
                ? firstFieldError(e.details) ?? e.message
                : e.message
          : t('Something went wrong.'),
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

      <PactModeChooser
        open={choosing}
        startersLeft={startersLeft}
        pantryEmpty={pantryEmpty}
        current={mode}
        onPick={m => {
          setMode(m);
          setChoosing(false);
        }}
        onClose={mode ? () => setChoosing(false) : undefined}
      />

      {mode && !choosing && <Tour id="new" steps={newPactTour(mode)} />}
      <BackLink to="/pacts" label="Commitments" />
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 32 }}>{t('The Feline Pact')}</h1>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          {t('Make a promise your cat can hold you to.')}
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
              letterSpacing: getLocale() === 'fa' ? undefined : '1.8px',
              color: 'var(--stamp-red)',
              fontWeight: 'bold',
              border: '1.5px dashed var(--stamp-red)',
              padding: '3px 12px',
              borderRadius: 6,
              background: 'var(--paper)',
            }}
          >
            {t('FELINE COMMITMENT PACT')}
          </span>
        </div>
        {mode && (
          <div className="mode-pill-row" data-tour="pact-mode">
            <span className={`mode-pill ${mode === 'STRICT' ? 'mode-pill-strict' : ''}`}>
              {mode === 'STRICT' ? t('Strict · real food') : t('On my word · PURR')}
            </span>
            <button type="button" className="linklike" onClick={() => setChoosing(true)}>
              {t('change')}
            </button>
          </div>
        )}

        {/* 1. CAT SHOWCASE & COMPANION PICKER */}
        <div
          data-tour="pact-cat"
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
                {t('CHOSEN OPPONENT')}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--stamp-red)', margin: '2px 0 6px', fontWeight: 600 }}>
              {catSubtitle(catId) || currentCat.personality}
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
              {t('"{line}"', { line: overstaked ? (catOverstake(catId) ?? t('Not enough treats!')) : (catQuip(catId) ?? t('Deal!!')) })}
            </div>
          </div>

          {/* Quick Cat Switcher Avatars */}
          <div style={{ width: '100%', marginTop: 12, borderTop: '1px dashed rgba(43,35,31,0.25)', paddingTop: 10 }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 600, display: 'block', marginBottom: 6, textAlign: 'center' }}>
              {t('Choose your feline opponent:')}
            </span>
            <div
              style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}
              role="radiogroup"
              aria-label={t('Choose your opponent')}
            >
              {CAT_SEED.map(cat => {
                const isSelected = catId === cat.id;
                const locked = !unlocked.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={locked ? t('{name} — locked, {n} PURR in the shop', { name: cat.name, n: cat.pricePurr }) : cat.name}
                    onClick={() => (locked ? navigate(`/shop?cat=${cat.id}`) : setCatId(cat.id))}
                    className={`chip ${isSelected ? 'chip-active' : ''} ${locked ? 'lock-chip' : ''}`}
                    style={{
                      fontSize: 12,
                      padding: '3px 10px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {locked ? <><AppIcon name="lock" size={14} /> {cat.name} · {cat.pricePurr}</> : cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. THE TASK INPUT */}
        <div style={{ marginBottom: 16 }} data-tour="pact-task">
          <Field label={t('I promise to get done:')} hint={t('Clear, actionable goal')}>
            <Input
              autoFocus
              maxLength={80}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('Finish YouTube video')}
              style={{ fontSize: 16, fontWeight: 500 }}
            />
          </Field>
        </div>

        {/* 3. DEADLINE SECTION */}
        <div style={{ marginBottom: 16 }} data-tour="pact-deadline">
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 6 }}>
            {t('Deadline:')}
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
                {t(label as string)}
              </Chip>
            ))}
          </div>
          <Input
            type="datetime-local"
            min={minWhen}
            value={when}
            aria-label={t('Deadline date and time')}
            onChange={e => {
              setSelectedQuick(null);
              setWhen(e.target.value);
            }}
            style={{ fontSize: 14 }}
          />
        </div>

        {/* 4. THE STAKE — honor pacts put PURR on the line */}
        {mode === 'HONOR' && (
          <div style={{ marginBottom: 16 }} data-tour="pact-stake">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-soft)' }}>{t('PURR on the line:')}</span>
              <span style={{ fontSize: 12, color: '#2E6930', fontWeight: 600 }}>{t('{n} PURR free', { n: purrFree })}</span>
            </div>
            {startersLeft > 0 ? (
              <div className="starter-stake">
                <strong>
                  <AppIcon name="purr" size={18} /> {t('{n} PURR', { n: HONOR_STARTER_STAKE })}
                </strong>
                <span className="muted">
                  {t('Starter pact {k} of {n}: keep it and get +{bonus} PURR.', {
                    k: HONOR_STARTER_COUNT - startersLeft + 1,
                    n: HONOR_STARTER_COUNT,
                    bonus: HONOR_STARTER_BONUS,
                  })}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Stepper value={purrStake} onChange={setPurrStake} min={HONOR_MIN_STAKE} max={Math.max(HONOR_MIN_STAKE, purrFree)} step={5} ariaLabel={t('PURR on the line:')} />
                {[10, 20, 40, 80].filter(n => n <= Math.max(purrFree, HONOR_MIN_STAKE)).map(n => (
                  <Chip key={n} active={purrStake === n} onClick={() => setPurrStake(n)}>
                    {n}
                  </Chip>
                ))}
              </div>
            )}
            {overstaked && (
              <p role="alert" style={{ color: 'var(--stamp-red)', fontSize: 13, margin: '6px 0 0' }}>
                {t('Not enough free PURR for that.')}{' '}
                <a href="/shop">{t('Get PURR in the shop')}</a>
              </p>
            )}
          </div>
        )}

        {/* 4. THE STAKE — strict pacts put real food on the line, plus an optional witness */}
        {mode === 'STRICT' && (
        <div style={{ marginBottom: 16 }} data-tour="pact-stake">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-soft)' }}>
              {t("What's at stake if you procrastinate?")}
            </span>
            <span style={{ fontSize: 12, color: '#2E6930', fontWeight: 600 }}>
              {t('{n} {food} available', { n: available, food: foodName(creditType) })}
            </span>
          </div>

          <div className="chip-row" style={{ marginBottom: 10 }}>
            {CONSEQUENCE_TYPES.map(type => {
              const Icon = DOODLE_BY_TYPE[type];
              return (
                <Chip
                  key={type}
                  active={creditType === type}
                  onClick={() => setCreditType(type)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon size={18} strokeWidth={2.2} /> {foodName(type)}
                  </span>
                </Chip>
              );
            })}
          </div>

          <Field
            label={t('Stake Amount:')}
            error={overstaked ? (catOverstake(catId) ?? t('Not enough available credits.')) : undefined}
          >
            <AmountPicker value={amount} onChange={setAmount} max={9999} />
          </Field>

          {pantryEmpty && (
            <p className="card card-c" style={{ margin: '10px 0 0', padding: '10px 12px', fontSize: 13.5 }} role="status">
              {t('Strict pacts stake real food, and your pantry is empty. Buying food opens soon — meanwhile, an honor pact works with PURR.')}{' '}
              <button type="button" className="linklike" onClick={() => setMode('HONOR')}>
                {t('Switch to on my word')}
              </button>
            </p>
          )}

          <div style={{ marginTop: 14 }} data-tour="pact-witness">
            <Field
              label={t('Witness (optional):')}
              hint={t('their email')}
              error={witnessError ?? undefined}
            >
              <Input
                type="email"
                inputMode="email"
                className="ltr"
                autoComplete="off"
                maxLength={254}
                value={witness}
                onChange={e => setWitness(e.target.value)}
                placeholder="friend@email.com"
              />
            </Field>
            <p className="muted field-note">
              {t('You send them a link. When you’re done, they look at your proof and say yes or no. No witness? The Purrpose team checks it. Nobody answers in 48 hours? It counts.')}
            </p>
          </div>
        </div>
        )}

        {/* Error Alert Box */}
        {error && (
          <p className="card error-box card-c" role="alert" style={{ margin: '8px 0 14px' }}>
            {error}
          </p>
        )}

        {/* 5. CONFIRMATION PROMPT / SUBMISSION */}
        {!confirming ? (
          <div style={{ marginTop: 20 }} data-tour="pact-seal">
            <DoodleButton
              variant="primary"
              size="big"
              disabled={!isValid || busy}
              onClick={() => setConfirming(true)}
              style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
            >
              <AppIcon name="paw" size={18} /> {t('Seal the Pact')}
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
            <h3 style={{ margin: '0 0 6px', fontSize: 19 }}>{t('Are you sure about this commitment?')}</h3>
            <p className="muted" style={{ margin: '0 0 14px', fontSize: 13.5 }}>
              {richText(
                mode === 'HONOR'
                  ? t('You are staking {stake} with {cat}. Keep your word and the PURR stays yours. Miss it, and {name} takes it!', {
                      name: currentCat.name,
                    })
                  : t('You are staking {stake} with {cat}. When you’re done, send a proof. If it holds, your food stays yours. If not, it feeds real cats at a shelter.', {
                      name: currentCat.name,
                    }),
                {
                  stake: <strong>{stakeText}</strong>,
                  cat: <strong>{currentCat.name}</strong>,
                },
              )}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <DoodleButton
                variant="primary"
                size="big"
                disabled={busy}
                onClick={handleConfirmSubmit}
              >
                {t('Yes, I promise!')}
              </DoodleButton>
              <DoodleButton onClick={() => setConfirming(false)}>
                {t('Wait, not yet')}
              </DoodleButton>
            </div>
          </div>
        )}
      </SketchCard>
    </main>
  );
}
