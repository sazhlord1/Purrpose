import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { AppIcon, Cat } from '@purrpose/cats';
import { DoodleButton } from './ui/index.js';
import { api } from '../lib/api.js';
import { useMe } from '../lib/queries.js';
import { useBlockTours } from '../lib/tour.js';
import { useReducedMotion } from '../lib/useReducedMotion.js';
import { t } from '../i18n/index.js';

/** "You got 120 free PURR" — once, the first time someone opens the app. */
export function WelcomeGift() {
  const me = useMe();
  const qc = useQueryClient();
  const reduced = useReducedMotion();
  const [closed, setClosed] = useState(false);
  const amount = me.data?.welcomePurr ?? null;
  const open = amount !== null && !closed;
  useBlockTours('welcome-gift', open);

  const close = () => {
    setClosed(true);
    void api('/me/welcome-seen', { method: 'POST' })
      .catch(() => undefined)
      .finally(() => void qc.invalidateQueries({ queryKey: ['me'] }));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-overlay" style={{ zIndex: 85 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div
            className="modal-card card card-b welcome-gift"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gift-title"
            onClick={e => e.stopPropagation()}
            initial={reduced ? false : { scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <div className="welcome-gift-art" aria-hidden>
              <Cat catId="orange" state="SATISFIED" size={120} />
              <motion.span
                className="welcome-gift-coin"
                initial={reduced ? false : { y: -40, rotate: -30, opacity: 0 }}
                animate={{ y: 0, rotate: 0, opacity: 1 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 14 }}
              >
                <AppIcon name="purr" size={44} />
              </motion.span>
            </div>
            <h2 id="gift-title" className="modal-title">
              {t('You got {n} free PURR!', { n: amount ?? 0 })}
            </h2>
            <p className="muted" style={{ margin: '0 0 16px' }}>
              {t('Put them on the line in “on my word” pacts. Keep your first three and you’ll have enough for a new cat.')}
            </p>
            <DoodleButton variant="primary" size="big" onClick={close}>
              {t('Nice!')}
            </DoodleButton>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
