import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { CatId } from '@purrpose/shared';
import { getLocale, t } from '../i18n/index.js';
import { ambient } from '../lib/ambient.js';
import { HighFiveArt } from './HighFiveArt.js';
import { useScrollLock } from '../lib/scrollLock.js';

interface PawShakeProps {
  open: boolean;
  catId: CatId;
  catName?: string;
  onComplete: () => void;
}

const INK = '#26201D';

export function PawShake({ open, catId, catName = t('Your Cat'), onComplete }: PawShakeProps) {
  useScrollLock(open);
  const [clasped, setClasped] = useState(false);
  const fa = getLocale() === 'fa';

  useEffect(() => {
    if (!open) {
      setClasped(false);
      return;
    }

    const claspTimer = setTimeout(() => {
      setClasped(true);
      ambient.playRandomMeow(0.75);
    }, 450);

    const finishTimer = setTimeout(() => {
      onComplete();
    }, 2200);

    return () => {
      clearTimeout(claspTimer);
      clearTimeout(finishTimer);
    };
  }, [open, onComplete]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="pawshake-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={t('Commitment sealed')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(38, 30, 26, 0.82)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: 16,
          overflow: 'hidden',
        }}
      >
        {/* The High-Five Stage Card */}
        <div
          style={{
            background: '#FAF6EE',
            border: '3.5px solid var(--ink)',
            borderRadius: 24,
            padding: '20px 16px 18px',
            boxShadow: '7px 7px 0 var(--ink)',
            maxWidth: 440,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <svg
            viewBox="0 0 280 220"
            width="100%"
            height="230"
            role="img"
            aria-label={t('Pact high-five between you and {name}', { name: catName })}
            style={{ overflow: 'visible' }}
          >
            {/* 1. Impact Star Sparkles */}
            {clasped && (
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: 'backOut' }}
                fill="#F59E0B"
                stroke={INK}
                strokeWidth={1.2}
              >
                <path d="M125 22 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#FEF08A" />
                <path d="M238 38 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 z" fill="#F59E0B" />
                <path d="M30 68 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#FEF08A" />
                <path d="M208 85 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#F59E0B" />
              </motion.g>
            )}

            {/* 2. "Pact Sealed" Text High Above with clean breathing space */}
            {clasped && (
              <motion.g
                initial={{ scale: 1.8, opacity: 0, y: -10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                textAnchor="middle"
                fontFamily="var(--font-hand), 'Gochi Hand', -apple-system, sans-serif"
                fontWeight="800"
                fill={INK}
                direction={fa ? 'rtl' : undefined}
              >
                <text x="176" y="16" fontSize="20" letterSpacing={fa ? undefined : '0.5px'}>{t('Pact')}</text>
                <text x="176" y="35" fontSize="20" letterSpacing={fa ? undefined : '0.5px'}>{t('Sealed')}</text>
              </motion.g>
            )}

            {/* 3. The cat and your hand meet in a high-five. */}
            <HighFiveArt catId={catId} clasped={clasped} />
          </svg>

          {/* Caption */}
          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <p
              style={{
                fontFamily: 'var(--font-hand)',
                fontSize: 22,
                fontWeight: 'bold',
                margin: '0 0 2px',
                color: 'var(--ink)',
              }}
            >
              {t('{name} accepts your promise.', { name: catName })}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#6C5E53' }}>
              {t("Don't let your cat down!")}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
