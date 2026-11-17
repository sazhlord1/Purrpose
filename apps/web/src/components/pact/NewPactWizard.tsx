import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@purrpose/cats';
import {
  CAT_IDS,
  CAT_SEED,
  FREE_CAT_IDS,
  HONOR_MIN_STAKE,
  HONOR_STARTER_COUNT,
  HONOR_STARTER_STAKE,
  MAX_DEADLINE_OFFSET_MS,
  catOverstake,
  normalizeDigits,
  now,
  PHONE_RE,
  type CatId,
  type CommitmentDto,
  type CommitmentMode,
  type ConsequenceType,
} from '@purrpose/shared';
import { api, ApiError } from '../../lib/api.js';
import { requestNotificationPermission } from '../../lib/notifications.js';
import { IS_IR_EDITION } from '../../lib/edition.js';
import { closeModal } from '../../lib/modals.js';
import { useCommitments, useMe } from '../../lib/queries.js';
import { foodAmount, getLocale, t } from '../../i18n/index.js';
import { DoodleButton } from '../ui/index.js';
import { CanTin } from '../doodles/index.js';
import { DeadlinePicker, ceilToStep } from '../DeadlinePicker.js';
import { PawShake } from '../PawShake.js';
import { Popup } from '../popup/Popup.js';
import { CatInBox } from './CatInBox.js';
import { DEFAULT_STAKE, FoodStake } from './FoodStake.js';

const STEPS = 4;

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

/** On my word ↔ strict, at the top of every step. */
function ModeSwitch({ mode, onMode }: { mode: CommitmentMode | null; onMode: (m: CommitmentMode) => void }) {
  return (
    <div className="mode-switch" role="radiogroup" aria-label={t('Pact type')}>
      <button type="button" role="radio" aria-checked={mode === 'HONOR'} className={mode === 'HONOR' ? 'on' : ''} onClick={() => onMode('HONOR')}>
        {t('On my word')}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'STRICT'}
        className={`strict ${mode === 'STRICT' ? 'on' : ''}`}
        onClick={() => onMode('STRICT')}
      >
        {t('Strict')}
      </button>
    </div>
  );
}

/**
 * A new pact, one card at a time: (1) on my word or strict, (2) the opponent and the
 * task, (3) the deadline, (4) what goes on the line. Swipe or use the buttons; the
 * switch on top changes the pact type at any step.
 */
export function NewPactWizard({ open, initialCat }: { open: boolean; initialCat?: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useMe();
  const commitments = useCommitments();
  const fa = getLocale() === 'fa';
  const owned = useMemo(() => {
    const unlocked: readonly string[] = me.data?.unlockedCatIds ?? FREE_CAT_IDS;
    return CAT_IDS.filter(id => unlocked.includes(id));
  }, [me.data]);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [mode, setMode] = useState<CommitmentMode | null>(null);
  const [catId, setCatId] = useState<CatId>('orange');
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState(() => ceilToStep(now() + 24 * 3_600_000));
  const [type, setType] = useState<ConsequenceType>('MEALS');
  const [amount, setAmount] = useState(DEFAULT_STAKE.MEALS);
  const [purrStake, setPurrStake] = useState(20);
  const [witness, setWitness] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sealedId, setSealedId] = useState<string | null>(null);

  // A fresh pact every time the card opens.
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setMode(null);
    setTitle('');
    setWhen(ceilToStep(now() + 24 * 3_600_000));
    setWitness('');
    setConsent(false);
    setError(null);
    setBusy(false);
    setSealedId(null);
    const wanted = initialCat && owned.includes(initialCat as CatId) ? (initialCat as CatId) : owned[0] ?? 'orange';
    setCatId(wanted);
  }, [open]);

  const honorSoFar = (commitments.data?.commitments ?? []).filter(c => c.mode === 'HONOR').length;
  const starter = honorSoFar < HONOR_STARTER_COUNT;
  const purrFree = Math.max(0, (me.data?.purr ?? 0) - (me.data?.purrStaked ?? 0));
  const honorStake = starter ? HONOR_STARTER_STAKE : purrStake;
  const available = Object.fromEntries((me.data?.balances ?? []).map(b => [b.creditType, b.available])) as Record<ConsequenceType, number>;
  const currentCat = CAT_SEED.find(c => c.id === catId) ?? CAT_SEED[0]!;

  const witnessDigits = normalizeDigits(witness.trim());
  const witnessIsPhone = IS_IR_EDITION && PHONE_RE.test(witnessDigits);
  const witnessValue = witnessIsPhone ? witnessDigits : witness.trim().toLowerCase();
  const witnessError =
    witnessValue === ''
      ? null
      : witnessIsPhone
        ? me.data?.user.phone && witnessValue === me.data.user.phone
          ? t('Your witness needs a number that isn’t yours.')
          : null
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(witnessValue)
          ? IS_IR_EDITION
            ? t('Enter a mobile number (09…) or an email.')
            : t('That email doesn’t look right.')
          : me.data?.user.email && witnessValue === me.data.user.email.toLowerCase()
            ? t('Your witness needs an email that isn’t yours.')
            : null;

  const stakeOk = mode === 'HONOR' ? honorStake <= purrFree : amount >= 1 && amount <= (available[type] ?? 0);
  const canNext = [mode !== null, title.trim().length > 0, when > now() + 5 * 60_000, true][step] ?? true;
  const canSeal = mode !== null && title.trim().length > 0 && stakeOk && !(mode === 'STRICT' && (witnessError || !consent));
  const stakeText = mode === 'HONOR' ? t('{n} PURR', { n: honorStake }) : foodAmount(type, amount);

  const go = (to: number) => {
    if (to === step || to < 0 || to >= STEPS) return;
    if (to > step && !canNext) return;
    setDir(to > step ? 1 : -1);
    setStep(to);
    setError(null);
  };
  const onDragEnd = (_e: unknown, info: PanInfo) => {
    const forward = fa ? info.offset.x > 70 : info.offset.x < -70;
    const back = fa ? info.offset.x < -70 : info.offset.x > 70;
    if (forward) go(step + 1);
    else if (back) go(step - 1);
  };

  async function seal() {
    if (!canSeal || busy || !mode) return;
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
                consequenceType: type,
                consequenceAmount: amount,
                donationConsent: consent,
                ...(witnessValue ? { witnessEmail: witnessValue } : {}),
              },
      });
      void requestNotificationPermission();
      void qc.invalidateQueries({ queryKey: ['commitments'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      setSealedId(res.commitment.id);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.code === 'INSUFFICIENT_AVAILABLE'
            ? (catOverstake(catId) ?? t('Not enough available credits.'))
            : e.code === 'INSUFFICIENT_PURR'
              ? t('Not enough free PURR for that.')
              : e.code === 'WITNESS_IS_YOU'
                ? t('Your witness needs an email that isn’t yours.')
                : e.code === 'CAT_LOCKED'
                  ? t('{name} is locked. Unlock them in the Cat Shop first.', { name: currentCat.name })
                  : e.code === 'INVALID_INPUT'
                    ? (firstFieldError(e.details) ?? e.message)
                    : e.message
          : t('Something went wrong.'),
      );
      setBusy(false);
    }
  }

  const pickMode = (m: CommitmentMode) => {
    setMode(m);
    if (step === 0) {
      setDir(1);
      setStep(1);
    }
  };

  const honorLines = [
    t('You put PURR on the line. No money involved.'),
    t('Your word is enough: tap “I did it” and it’s done.'),
    t('Miss it and the PURR goes to your cat.'),
  ];
  const strictLines = [
    t('You stake real cat food from your pantry.'),
    t('When you’re done, you send a proof: a short note, a photo if you like.'),
    t('A friend you pick checks it (or we do). Miss it and the food really goes to a shelter.'),
  ];

  const body = [
    // 1 · the kind of pact
    <div key="mode" className="wiz-step">
      <h2>{t('What kind of pact are you making?')}</h2>
      <div className="mode-options">
        <button type="button" className={`mode-option ${mode === 'HONOR' ? 'is-current' : ''}`} onClick={() => pickMode('HONOR')}>
          <span className="mode-option-head">
            <AppIcon name="purr" size={30} />
            <span>
              <strong>{t('On my word')}</strong>
              <span className="mode-option-tag">{t('with PURR')}</span>
            </span>
          </span>
          <ul className="mode-option-lines">
            {honorLines.map(l => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </button>
        <button type="button" className={`mode-option mode-option-strict ${mode === 'STRICT' ? 'is-current' : ''}`} onClick={() => pickMode('STRICT')}>
          <span className="mode-option-head">
            <CanTin size={30} strokeWidth={2.2} />
            <span>
              <strong>{t('Strict')}</strong>
              <span className="mode-option-tag">{t('with real food')}</span>
            </span>
          </span>
          <ul className="mode-option-lines">
            {strictLines.map(l => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </button>
      </div>
    </div>,

    // 2 · opponent + task
    <div key="cat" className="wiz-step">
      <h2>{t('Pick your feline opponent')}</h2>
      <CatInBox catId={catId} size={128} />
      <p className="wiz-cat-name">
        <strong>{currentCat.name}</strong>
      </p>
      <div className="wiz-cats" role="radiogroup" aria-label={t('Choose your opponent')}>
        {owned.map(id => (
          <button key={id} type="button" role="radio" aria-checked={id === catId} className={`chip ${id === catId ? 'chip-active' : ''}`} onClick={() => setCatId(id)}>
            {CAT_SEED.find(c => c.id === id)?.name ?? id}
          </button>
        ))}
      </div>
      <label className="field" style={{ marginTop: 12 }}>
        <span>{t('What do you promise to do?')}</span>
        <input
          maxLength={80}
          value={title}
          placeholder={t('Finish YouTube video')}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (title.trim()) go(2);
            }
          }}
        />
      </label>
    </div>,

    // 3 · deadline
    <div key="when" className="wiz-step">
      <h2>{t('By when do you promise to do it?')}</h2>
      <DeadlinePicker
        value={when}
        min={now() + 6 * 60_000}
        max={now() + MAX_DEADLINE_OFFSET_MS - 24 * 3_600_000}
        now={now()}
        onChange={setWhen}
      />
    </div>,

    // 4 · the stake
    <div key="stake" className="wiz-step">
      <h2>{t('What do you put on the line?')}</h2>
      {mode === 'HONOR' ? (
        <div className="wiz-purr">
          <p className="muted" style={{ margin: '0 0 8px' }}>{t('{n} PURR free', { n: purrFree })}</p>
          {starter ? (
            <div className="wiz-purr-fixed">
              <AppIcon name="purr" size={24} /> <strong>{t('{n} PURR', { n: HONOR_STARTER_STAKE })}</strong>
            </div>
          ) : (
            <>
              <div className="food-stake-presets">
                {[10, 20, 40, 80].map(n => (
                  <button key={n} type="button" disabled={n > Math.max(purrFree, HONOR_MIN_STAKE)} className={`chip ${purrStake === n ? 'chip-active' : ''}`} onClick={() => setPurrStake(n)}>
                    {t('{n} PURR', { n })}
                  </button>
                ))}
              </div>
              <div className="food-stake-step">
                <button type="button" aria-label={t('Less')} disabled={purrStake <= HONOR_MIN_STAKE} onClick={() => setPurrStake(s => Math.max(HONOR_MIN_STAKE, s - 5))}>
                  −
                </button>
                <strong>{t('{n} PURR', { n: purrStake })}</strong>
                <button type="button" aria-label={t('More')} onClick={() => setPurrStake(s => s + 5)}>
                  +
                </button>
              </div>
            </>
          )}
          {honorStake > purrFree && (
            <p className="form-error" role="alert" style={{ textAlign: 'center' }}>
              {t('Not enough free PURR for that.')} <a href="/shop">{t('Get PURR in the shop')}</a>
            </p>
          )}
        </div>
      ) : (
        <>
          <FoodStake type={type} amount={amount} available={available} onType={setType} onAmount={setAmount} />
          <label className="field" style={{ marginTop: 14 }}>
            <span>{t('Witness (optional):')}</span>
            <input
              className="ltr"
              autoComplete="off"
              maxLength={254}
              inputMode={IS_IR_EDITION ? 'text' : 'email'}
              value={witness}
              onChange={e => setWitness(e.target.value)}
              placeholder={IS_IR_EDITION ? '09121234567' : 'friend@email.com'}
            />
          </label>
          {witnessError && <p className="form-error">{witnessError}</p>}
          <p className="muted field-note" style={{ marginTop: 4 }}>
            {t('A friend who looks at your proof when you’re done and says yes or no. No witness? The Purrpose team checks it.')}
          </p>
          <label className="consent-box">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
            <span>
              {t('If I don’t keep this pact, {stake} is donated to shelter cats and can’t be returned.', { stake: stakeText })}
            </span>
          </label>
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>,
  ];

  return (
    <>
      <Popup
        open={open && !sealedId}
        onClose={closeModal}
        label={t('New pact')}
        className={`wizard ${mode === 'STRICT' ? 'wizard-strict' : 'wizard-honor'}`}
        header={<ModeSwitch mode={mode} onMode={m => (step === 0 ? pickMode(m) : setMode(m))} />}
      >
        <div className="wiz-dots" aria-label={t('Step {n} of {total}', { n: step + 1, total: STEPS })}>
          {Array.from({ length: STEPS }, (_, i) => (
            <button key={i} type="button" className={i === step ? 'on' : i < step ? 'done' : ''} aria-label={t('Step {n}', { n: i + 1 })} onClick={() => go(i)} />
          ))}
        </div>
        <div className="wiz-stage">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ x: (fa ? -1 : 1) * dir * 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: (fa ? 1 : -1) * dir * 60, opacity: 0 }}
              transition={{ duration: 0.2 }}
              drag={step === 2 ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={onDragEnd}
            >
              {body[step]}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="wiz-nav">
          {step > 0 ? (
            <DoodleButton onClick={() => go(step - 1)}>{t('Back')}</DoodleButton>
          ) : (
            <span />
          )}
          {step < STEPS - 1 ? (
            <DoodleButton variant="primary" disabled={!canNext} onClick={() => go(step + 1)}>
              {t('Next')}
            </DoodleButton>
          ) : (
            <DoodleButton variant="primary" disabled={!canSeal || busy} onClick={() => void seal()}>
              <AppIcon name="paw" size={18} /> {busy ? '…' : t('I promise {name}!', { name: currentCat.name })}
            </DoodleButton>
          )}
        </div>
      </Popup>
      <PawShake
        open={Boolean(sealedId)}
        catId={catId}
        catName={currentCat.name}
        onComplete={() => {
          const id = sealedId;
          closeModal();
          setSealedId(null);
          if (id) navigate(`/commitment/${id}?new=1`);
        }}
      />
    </>
  );
}
