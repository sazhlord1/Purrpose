import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { CatId } from '@purrpose/shared';
import { ambient } from '../lib/ambient.js';
import { PACT_FIGURES } from './pact/figures.js';

interface PawShakeProps {
  open: boolean;
  catId: CatId;
  catName?: string;
  onComplete: () => void;
}

const INK = '#26201D';

function CatHighFiveFigure({ catId }: { catId: CatId }) {
  const Figure = PACT_FIGURES[catId] ?? PACT_FIGURES.orange;
  return (
    <g id={`pact-cat-${catId}`}>
      <Figure />
    </g>
  );
}

export function PawShake({ open, catId, catName = 'Your Cat', onComplete }: PawShakeProps) {
  const [clasped, setClasped] = useState(false);

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
        aria-label="Commitment sealed"
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
            aria-label={`Pact high-five between you and ${catName}`}
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
              >
                <text x="176" y="26" fontSize="20" letterSpacing="0.5px">Pact</text>
                <text x="176" y="45" fontSize="20" letterSpacing="0.5px">Sealed</text>
              </motion.g>
            )}

            {/* 3. Left Cat (Slides in smoothly from Left) */}
            <motion.g
              initial={{ x: -140, opacity: 0 }}
              animate={{
                x: 0,
                opacity: 1,
                y: clasped ? [0, -6, 3, -4, 0] : 0,
              }}
              transition={{
                x: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
                y: { duration: 0.65, ease: 'easeInOut' },
              }}
            >
              <CatHighFiveFigure catId={catId} />
            </motion.g>

            {/* 4. Right Human Hand (Slides in smoothly from Right) */}
            <motion.g
              initial={{ x: 140, opacity: 0 }}
              animate={{
                x: 0,
                opacity: 1,
                y: clasped ? [0, -6, 3, -4, 0] : 0,
              }}
              transition={{
                x: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
                y: { duration: 0.65, ease: 'easeInOut' },
              }}
            >
              <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
                <path d="M216,134 L258,156 L244,190 L202,168 Z" fill="#EAE2D2" />
                <line x1="210" y1="141" x2="198" y2="169" strokeWidth={2.2} />
                <path d="M198,145 L182,125 C176,120 168,118 164,124 C160,130 170,138 184,148 L196,162 Z" fill="#FBE9D2" />
                <path d="M198,145 
                         L194,115 L192,86 C192,80 186,80 186,86 L186,108 
                         L184,76 C184,70 178,70 178,76 L178,102 
                         L176,68 C176,62 170,62 170,68 L170,98 
                         L168,75 C168,69 162,69 162,75 L162,112 
                         C156,110 148,114 150,121 C152,126 160,130 170,135 
                         L182,148 Z" fill="#FBE9D2" />
                <line x1="168" y1="84" x2="168" y2="108" strokeWidth={1.6} />
                <line x1="176" y1="78" x2="176" y2="105" strokeWidth={1.6} />
                <line x1="184" y1="84" x2="184" y2="108" strokeWidth={1.6} />
              </g>
            </motion.g>
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
              {catName} accepts your promise.
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#6C5E53' }}>
              Don't let your cat down!
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
