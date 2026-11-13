import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { AppIcon } from '@purrpose/cats';
import { api } from '../lib/api.js';
import { useMe } from '../lib/queries.js';
import { useReducedMotion } from '../lib/useReducedMotion.js';
import { t } from '../i18n/index.js';

const SHOW_MS = 6000;

/**
 * "You got 120 free PURR" — once, the first time someone opens the app. A small note at
 * the top that leaves on its own (or on a tap), not a window to dismiss: nothing stands
 * between a new user and their first pact.
 */
export function WelcomeGift() {
  const me = useMe();
  const qc = useQueryClient();
  const reduced = useReducedMotion();
  const [closed, setClosed] = useState(false);
  const amount = me.data?.welcomePurr ?? null;
  const open = amount !== null && !closed;
  const marked = useRef(false);

  useEffect(() => {
    if (!open) return undefined;
    // Seen as soon as it shows, so it never comes back.
    if (!marked.current) {
      marked.current = true;
      void api('/me/welcome-seen', { method: 'POST' })
        .catch(() => undefined)
        .finally(() => void qc.invalidateQueries({ queryKey: ['me'] }));
    }
    const timer = setTimeout(() => setClosed(true), SHOW_MS);
    return () => clearTimeout(timer);
  }, [open, qc]);

  return (
    <AnimatePresence>
      {open && (
        <motion.button
          type="button"
          className="welcome-toast"
          role="status"
          onClick={() => setClosed(true)}
          initial={reduced ? false : { y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        >
          <AppIcon name="purr" size={30} />
          <span>
            <strong>{t('You got {n} free PURR!', { n: amount ?? 0 })}</strong>
            <span className="welcome-toast-sub">{t('Stake them in “on my word” pacts.')}</span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
