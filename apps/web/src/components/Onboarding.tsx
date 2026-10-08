import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cat } from '@purrpose/cats';
import { DoodleButton } from './ui/index.js';
import { BowlEmpty, BowlFull } from './doodles/index.js';
import { useReducedMotion } from '../lib/useReducedMotion.js';
import { isRtlUi, t } from '../i18n/index.js';

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

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const reduced = useReducedMotion();
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(false);
      else if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === ' ') advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, finish]);

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
              {t('tap anywhere or press enter')}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
