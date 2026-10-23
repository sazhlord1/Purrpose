import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { AppIcon } from '@purrpose/cats';
import { HONOR_STARTER_BONUS, HONOR_STARTER_COUNT, HONOR_STARTER_STAKE, type CommitmentMode } from '@purrpose/shared';
import { CanTin } from '../doodles/index.js';
import { t } from '../../i18n/index.js';
import { useBlockTours } from '../../lib/tour.js';

interface Props {
  open: boolean;
  /** How many starter honor pacts (fixed stake + bonus) the user still has. */
  startersLeft: number;
  /** True when the pantry has no free food at all. */
  pantryEmpty: boolean;
  current: CommitmentMode | null;
  onPick: (mode: CommitmentMode) => void;
  /** Closing without picking (only offered once a mode was picked before). */
  onClose?: () => void;
}

/**
 * The first step of a new pact: strict (real food, a proof, a reviewer) or on your
 * word (PURR). Each option says in a few plain lines what it means.
 */
export function PactModeChooser({ open, startersLeft, pantryEmpty, current, onPick, onClose }: Props) {
  const first = useRef<HTMLButtonElement>(null);
  useBlockTours('mode-chooser', open);
  useEffect(() => {
    if (!open) return undefined;
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const honorLines = [
    t('You put PURR on the line. No money involved.'),
    t('Your word is enough: tap “I did it” and it’s done.'),
    startersLeft > 0
      ? t('Your first {n} pacts: {stake} PURR each, and +{bonus} for every one you keep. Keep all three and a new cat is yours.', {
          n: HONOR_STARTER_COUNT,
          stake: HONOR_STARTER_STAKE,
          bonus: HONOR_STARTER_BONUS,
        })
      : t('You pick how much PURR. Miss it and the PURR is gone.'),
  ];
  const strictLines = [
    t('You stake real cat food from your pantry.'),
    t('When you’re done, you send a proof: a short note, a photo if you like.'),
    t('A friend you pick checks it (or we do). Miss it and the food really goes to a shelter.'),
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-card card card-a"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mode-title"
            onClick={e => e.stopPropagation()}
            initial={{ y: 16, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <h2 id="mode-title" className="modal-title">
              {t('Do you want this pact strict, or on your word?')}
            </h2>
            <div className="mode-options">
              <button
                ref={first}
                type="button"
                className={`mode-option ${current === 'HONOR' ? 'is-current' : ''}`}
                onClick={() => onPick('HONOR')}
              >
                <span className="mode-option-head">
                  <AppIcon name="purr" size={30} />
                  <span>
                    <strong>{t('On my word')}</strong>
                    <span className="mode-option-tag">{t('with PURR')}</span>
                  </span>
                </span>
                <ul className="mode-option-lines">
                  {honorLines.map(line => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </button>
              <button
                type="button"
                className={`mode-option mode-option-strict ${current === 'STRICT' ? 'is-current' : ''}`}
                onClick={() => onPick('STRICT')}
              >
                <span className="mode-option-head">
                  <CanTin size={30} strokeWidth={2.2} />
                  <span>
                    <strong>{t('Strict')}</strong>
                    <span className="mode-option-tag">{t('with real food')}</span>
                  </span>
                </span>
                <ul className="mode-option-lines">
                  {strictLines.map(line => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                {pantryEmpty && <span className="mode-option-note">{t('Your pantry is empty right now.')}</span>}
              </button>
            </div>
            {onClose && (
              <button type="button" className="linklike modal-close" onClick={onClose}>
                {t('Keep it as it is')}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
