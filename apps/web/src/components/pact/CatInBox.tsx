import { Cat } from '@purrpose/cats';
import { AnimatePresence, motion } from 'framer-motion';
import type { CatId } from '@purrpose/shared';

/** The chosen opponent, sitting in its cardboard box (its lower half hidden inside); a new pick hops in. */
export function CatInBox({ catId, size = 150 }: { catId: CatId; size?: number }) {
  return (
    <div className="cat-box" style={{ width: size * 1.3, height: size * 0.92 }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={catId}
          className="cat-box-cat"
          style={{ top: size * 0.04 }}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        >
          <Cat catId={catId} state="ANTICIPATING" size={size} />
        </motion.div>
      </AnimatePresence>
      <svg className="cat-box-front" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden>
        <path d="M6 10 L40 0 L40 14 Z" fill="#B98A57" stroke="#26201D" strokeWidth="3" strokeLinejoin="round" />
        <path d="M194 10 L160 0 L160 14 Z" fill="#B98A57" stroke="#26201D" strokeWidth="3" strokeLinejoin="round" />
        <path d="M20 12 H180 L170 76 H30 Z" fill="#D2A26C" stroke="#26201D" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M60 30 h80" stroke="#A97B48" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
