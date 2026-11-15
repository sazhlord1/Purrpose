import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';
import { sheetSpring } from '../../lib/motion.js';
import { useScrollLock } from '../../lib/scrollLock.js';
import { t } from '../../i18n/index.js';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useScrollLock(open);
  const panelRef = useRef<HTMLDivElement>(null);
  // The parent usually passes a new onClose on every render (and pages like a pact re-render
  // every second for the countdown). Keep it in a ref, so the effect below runs only when the
  // sheet opens: re-running it moved focus back to the panel and closed the Android keyboard
  // while you were typing.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // When the on-screen keyboard opens over a field, bring the field into view.
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
    };
    const panel = panelRef.current;
    window.addEventListener('keydown', onKey);
    panel?.addEventListener('focusin', onFocusIn);
    return () => {
      window.removeEventListener('keydown', onKey);
      panel?.removeEventListener('focusin', onFocusIn);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="sheet-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            ref={panelRef}
            className="sheet-panel card card-c"
            role="dialog"
            aria-modal="true"
            aria-label={title ?? t('dialog')}
            tabIndex={-1}
            onClick={e => e.stopPropagation()}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={sheetSpring}
          >
            {title && <h3>{title}</h3>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
