import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cat } from '@purrpose/cats';
import { DoodleButton } from './ui/index.js';
import { BowlEmpty, BowlFull } from './doodles/index.js';
import { useReducedMotion } from '../lib/useReducedMotion.js';
import { isRtlUi, t } from '../i18n/index.js';
import { useBlockTours } from '../lib/tour.js';

interface Panel {
  headline: string;
  sub: string;
  chip?: string;
}

const PANELS: Panel[] = [
  { headline: 'Meet Purrpose.', sub: 'Get things done.' },
  { headline: 'If you don\u2019t\u2026', sub: '(it happens to everyone)' },
  {
    headline: '\u2026your cat wins.',
    sub: 'Miss your deadline, your stake feeds a cat.',
    chip: '\u{1F96B} 5 Cat Meals',
  },
  { headline: 'Make your first commitment.', sub: 'Your cat is ready. Are you?' },
];

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
      <path
        d={dir === 'right' ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const reduced = useReducedMotion();
  useBlockTours('onboarding', true);
  const navigate = useNavigate();
  const panel = PANELS[step];
  // Panels slide in from the reading direction (right → left in English, mirrored in Persian).
  const slide = isRtlUi() ? -40 : 40;

  const finish = useCallback(
    (proceed: boolean) => {
      localStorage.setItem('purrpose.onboarded', '1');
      onDone();
      if (proceed) navigate('/new');
    },
    [navigate, onDone],
  );

  const advance = useCallback(() => setStep(s => Math.min(3, s + 1)), []);
  const goBack = useCallback(() => setStep(s => Math.max(0, s - 1)), []);
  const rtl = isRtlUi();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(false);
      else if (e.key === 'Enter' || e.key === ' ' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) advance();
      else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, goBack, finish, rtl]);

  return (
    <div
      className="onboarding-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t('Welcome to Purrpose')}
      onClick={advance}
    >
      <button
        className="chip onboarding-skip"
        onClick={e => {
          e.stopPropagation();
          finish(false);
        }}
      >
        {t('skip')}
      </button>
      <div className="onboarding-progress" role="group" aria-label={t('Panel {n} of {total}', { n: step + 1, total: 4 })}>
        {PANELS.map((_, i) => (
          <span
            key={i}
            className={`onboarding-dot${i === step ? ' onboarding-dot-active' : ''}`}
            aria-hidden
          />
        ))}
      </div>

      {/* Arrows on both sides, so it's obvious how to move on (and back). Forward follows the reading direction. */}
      {step > 0 && (
        <button
          type="button"
          className={`onboarding-arrow ${rtl ? 'onboarding-arrow-right' : 'onboarding-arrow-left'}`}
          aria-label={t('Previous')}
          onClick={e => {
            e.stopPropagation();
            goBack();
          }}
        >
          <Chevron dir={rtl ? 'right' : 'left'} />
        </button>
      )}
      {step < 3 && (
        <button
          type="button"
          className={`onboarding-arrow ${rtl ? 'onboarding-arrow-left' : 'onboarding-arrow-right'} onboarding-arrow-next`}
          aria-label={t('Next')}
          onClick={e => {
            e.stopPropagation();
            advance();
          }}
        >
          <Chevron dir={rtl ? 'left' : 'right'} />
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="onboarding-panel"
          initial={reduced ? false : { opacity: 0, x: slide }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? undefined : { opacity: 0, x: -slide }}
          transition={{ duration: 0.24 }}
        >
          <div className="onboarding-art" aria-hidden>
            {step === 0 && <Cat catId="orange" state="FAILURE" expression="neutral" size={190} showGround />}
            {step === 1 && (
              <>
                <Cat catId="tuxedo" state="ANTICIPATING" size={190} />
                <BowlEmpty size={54} />
              </>
            )}
            {step === 2 && (
              <>
                <Cat catId="orange" state="SATISFIED" size={190} />
                <BowlFull size={54} />
              </>
            )}
            {step === 3 && <Cat catId="black" state="WAITING" size={190} showGround />}
          </div>
          <h1>{t(panel.headline)}</h1>
          <p className="muted">{t(panel.sub)}</p>
          {panel.chip && (
            <p>
              <span className="chip">{t(panel.chip)}</span>
            </p>
          )}
          {step === 3 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <DoodleButton variant="primary" size="big" onClick={() => finish(true)}>
                {t('Make It Official')}
              </DoodleButton>
              <DoodleButton onClick={() => finish(false)}>{t('Look around first')}</DoodleButton>
            </div>
          )}
          {step < 3 && (
            <p className="muted" style={{ marginTop: 20, fontSize: 12 }}>
              {t('tap the arrow or anywhere to continue')}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
