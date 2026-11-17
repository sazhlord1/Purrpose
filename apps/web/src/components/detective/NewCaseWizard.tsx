import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CAT_IDS,
  CAT_SEED,
  FREE_CAT_IDS,
  HABIT_DEFAULT_SLIPS,
  HABIT_MAX_DAYS,
  HABIT_MAX_SLIPS,
  HABIT_MIN_DAYS,
  HABIT_MIN_SLIPS,
  now,
  type CatId,
  type ConsequenceType,
  type HabitDto,
} from '@purrpose/shared';
import { api, ApiError } from '../../lib/api.js';
import { closeModal } from '../../lib/modals.js';
import { useMe } from '../../lib/queries.js';
import { dateLocale, foodAmount, getLocale, num, t } from '../../i18n/index.js';
import { InterrogationRoom } from '../InterrogationRoom.js';
import { Popup } from '../popup/Popup.js';
import { DoodleButton } from '../ui/index.js';
import { DEFAULT_STAKE, FoodStake } from '../pact/FoodStake.js';

const DAY_PICKS: Array<[string, number]> = [
  ['1 week', 7],
  ['2 weeks', 14],
  ['1 month', 30],
  ['2 months', 60],
  ['3 months', 90],
  ['6 months', 180],
];

/**
 * A new Detective Cheat case in two cards: (1) what it is, the detective and the habit,
 * (2) the food on the table, the slips allowed and how long. Opens the case.
 */
export function NewCaseWizard({ open }: { open: boolean }) {
  const me = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fa = getLocale() === 'fa';
  const owned = useMemo(() => {
    const unlocked: readonly string[] = me.data?.unlockedCatIds ?? FREE_CAT_IDS;
    return CAT_IDS.filter(id => unlocked.includes(id));
  }, [me.data]);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [catId, setCatId] = useState<CatId>('tuxedo');
  const [type, setType] = useState<ConsequenceType>('MEALS');
  const [stake, setStake] = useState(DEFAULT_STAKE.MEALS);
  const [slips, setSlips] = useState(HABIT_DEFAULT_SLIPS);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setTitle('');
    setError(null);
    setCatId(owned.includes('tuxedo') ? 'tuxedo' : (owned[0] ?? 'orange'));
  }, [open]);

  const available = Object.fromEntries((me.data?.balances ?? []).map(b => [b.creditType, b.available])) as Record<ConsequenceType, number>;
  const ok = title.trim().length > 0 && stake >= 1 && stake <= (available[type] ?? 0);
  const endLabel = new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' }).format(now() + days * 86_400_000);

  const create = useMutation({
    mutationFn: () =>
      api<{ habit: HabitDto }>('/habits', {
        method: 'POST',
        body: { title: title.trim(), catId, consequenceType: type, stakeAmount: stake, maxSlips: slips, durationDays: days },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['habits'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      closeModal();
      navigate('/detective');
    },
    onError: e => setError(e instanceof ApiError ? e.message : t('Could not reach the station.')),
  });

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    const forward = fa ? info.offset.x > 70 : info.offset.x < -70;
    const back = fa ? info.offset.x < -70 : info.offset.x > 70;
    if (forward && step === 0 && title.trim()) setStep(1);
    else if (back && step === 1) setStep(0);
  };

  const steps = [
    <div key="who" className="wiz-step">
      <h2>{t('Open a new case')}</h2>
      <p className="muted" style={{ margin: '0 0 10px', textAlign: 'center', fontSize: 14 }}>
        {t('Quitting something? Put food on the table and confess every slip to the detective. Each slip locks a share of it.')}
      </p>
      <div className="case-room">
        <InterrogationRoom catId={catId} expression="stare" />
      </div>
      <div className="wiz-cats" role="radiogroup" aria-label={t('Detective on the case')} style={{ marginTop: 10 }}>
        {owned.map(id => (
          <button key={id} type="button" role="radio" aria-checked={id === catId} className={`chip ${id === catId ? 'chip-active' : ''}`} onClick={() => setCatId(id)}>
            {CAT_SEED.find(c => c.id === id)?.name ?? id}
          </button>
        ))}
      </div>
      <label className="field" style={{ marginTop: 12 }}>
        <span>{t('What are you quitting or sticking to?')}</span>
        <input
          maxLength={80}
          value={title}
          placeholder={t('No cigarettes · Stick to my diet · No doom-scrolling')}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (title.trim()) setStep(1);
            }
          }}
        />
      </label>
      <div className="wiz-nav">
        <span />
        <DoodleButton variant="primary" disabled={!title.trim()} onClick={() => setStep(1)}>
          {t('Next')}
        </DoodleButton>
      </div>
    </div>,

    <div key="terms" className="wiz-step">
      <h2>{t('The terms of the case')}</h2>
      <FoodStake type={type} amount={stake} available={available} onType={setType} onAmount={setStake} />

      <div className="case-row">
        <span>{t('Slips allowed')}</span>
        <div className="food-stake-step">
          <button type="button" aria-label={t('Less')} disabled={slips <= HABIT_MIN_SLIPS} onClick={() => setSlips(s => s - 1)}>
            −
          </button>
          <strong style={{ minWidth: 40 }}>{num(slips)}</strong>
          <button type="button" aria-label={t('More')} disabled={slips >= HABIT_MAX_SLIPS} onClick={() => setSlips(s => s + 1)}>
            +
          </button>
        </div>
      </div>
      <p className="muted case-hint">{t('Each slip locks {share}.', { share: foodAmount(type, stake / slips) })}</p>

      <div className="case-days">
        <div className="case-row">
          <span>{t('For how long?')}</span>
          <strong>{t('{n} days', { n: num(days) })}</strong>
        </div>
        <input
          type="range"
          min={HABIT_MIN_DAYS}
          max={HABIT_MAX_DAYS}
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          aria-label={t('For how long?')}
          className="case-range"
          style={{ '--p': `${((days - HABIT_MIN_DAYS) / (HABIT_MAX_DAYS - HABIT_MIN_DAYS)) * 100}%` } as React.CSSProperties}
        />
        <div className="food-stake-presets" style={{ margin: '6px 0 2px' }}>
          {DAY_PICKS.map(([label, n]) => (
            <button key={n} type="button" className={`chip ${days === n ? 'chip-active' : ''}`} onClick={() => setDays(n)}>
              {t(label)}
            </button>
          ))}
        </div>
        <p className="muted case-hint">{t('The case closes on {date}.', { date: endLabel })}</p>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="case-open" disabled={!ok || create.isPending} onClick={() => create.mutate()}>
        {create.isPending ? '…' : t('Open the case')}
      </button>
      <p className="muted case-hint" style={{ textAlign: 'center' }}>
        {t('Confess every slip. At the end, whatever is locked goes to the cats and the rest comes back to your pantry.')}
      </p>
      <div className="wiz-nav">
        <button type="button" className="linklike" onClick={() => setStep(0)}>
          {t('Back')}
        </button>
        <span />
      </div>
    </div>,
  ];

  return (
    <Popup open={open} onClose={closeModal} label={t('Open a new case')} className="wizard wizard-case">
      <div className="wiz-dots">
        {[0, 1].map(i => (
          <button key={i} type="button" className={i === step ? 'on' : i < step ? 'done' : ''} aria-label={t('Step {n}', { n: i + 1 })} onClick={() => (i === 0 || title.trim()) && setStep(i)} />
        ))}
      </div>
      <div className="wiz-stage">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ x: (fa ? -1 : 1) * (step === 1 ? 60 : -60), opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            drag={step === 0 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={onDragEnd}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </Popup>
  );
}
