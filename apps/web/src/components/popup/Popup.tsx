import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
import { t } from '../../i18n/index.js';
import { useScrollLock } from '../../lib/scrollLock.js';
import { useBlockTours } from '../../lib/tour.js';

/**
 * A card that floats over the app: the page behind goes soft and grey (like the rank
 * cards up close), the card keeps a safe margin on every side and scrolls inside if it
 * must. Tap outside, ✕ or Escape closes it.
 */
export function Popup({
  open,
  onClose,
  label,
  className = '',
  children,
  header,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  className?: string;
  children: ReactNode;
  /** Sits above the content, next to the close button (e.g. the pact-mode switch). */
  header?: ReactNode;
}) {
  useScrollLock(open);
  useBlockTours('popup', open);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="popup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className={`popup-card ${className}`}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onClick={e => e.stopPropagation()}
            initial={{ y: 24, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          >
            <div className="popup-top">
              <div className="popup-header">{header}</div>
              <button type="button" className="popup-close" onClick={onClose} aria-label={t('Close')}>
                ✕
              </button>
            </div>
            <div className="popup-body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
