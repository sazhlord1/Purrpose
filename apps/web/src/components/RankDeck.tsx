import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type Ref } from 'react';
import { useScrollLock } from '../lib/scrollLock.js';
import { num, t } from '../i18n/index.js';
import { RANKS, type Rank } from '../lib/ranks.js';
import { RankCard } from './RankCard.js';

/** The chains and padlock over a rank you haven't reached yet. */
function RankLock({ rank: r }: { rank: Rank }) {
  return (
    <div className="rank-lock" aria-label={t('Locked: {n} kept pacts open it', { n: num(r.minWins) })}>
      <svg className="rank-chains" viewBox="0 0 400 500" aria-hidden="true" preserveAspectRatio="none">
        {[
          [-20, 120, 420, 380],
          [420, 120, -20, 380],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5A5550" strokeWidth={14} strokeDasharray="22 8" strokeLinecap="round" />
        ))}
        {[
          [-20, 120, 420, 380],
          [420, 120, -20, 380],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={`h${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#B9B2AA" strokeWidth={6} strokeDasharray="22 8" strokeLinecap="round" />
        ))}
      </svg>
      <div className="rank-lock-badge">
        <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
          <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="#F4C430" stroke="#26201D" strokeWidth="1.8" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#26201D" strokeWidth="1.8" />
          <circle cx="12" cy="15.5" r="1.6" fill="#26201D" />
        </svg>
        <span>{t('{n} kept pacts to unlock', { n: num(r.minWins) })}</span>
      </div>
    </div>
  );
}

/**
 * Every rank card in a row you can swipe through, like a hand of cards. Your current rank
 * is in front (and is the one shared); the ones you've passed are shown as earned; the
 * ones ahead are greyed out and chained shut, with how many kept pacts open them.
 */
export function RankDeck({
  rank,
  wins,
  catName,
  cardRef,
}: {
  rank: Rank;
  wins: number;
  catName: (r: Rank) => string;
  cardRef: Ref<SVGSVGElement>;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(rank.level);
  /** The card opened up close (tap the card in front). */
  const [zoomed, setZoomed] = useState<Rank | null>(null);
  useScrollLock(Boolean(zoomed));
  useEffect(() => {
    if (!zoomed) return undefined;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoomed(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed]);

  // Start on the current rank.
  useEffect(() => {
    const el = rowRef.current?.querySelector<HTMLElement>(`[data-level="${rank.level}"]`);
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
  }, [rank.level]);

  // Which card is in the middle (for the dots).
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return undefined;
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) setShown(Number((e.target as HTMLElement).dataset.level));
        }
      },
      { root: row, threshold: [0.6] },
    );
    row.querySelectorAll('[data-level]').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = (level: number) =>
    rowRef.current
      ?.querySelector<HTMLElement>(`[data-level="${level}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });

  return (
    <div className="rank-deck">
      <div className="rank-deck-row" ref={rowRef} role="list" aria-label={t('All ranks')}>
        {RANKS.map(r => {
          const locked = r.level > rank.level;
          const current = r.level === rank.level;
          return (
            <div
              key={r.level}
              role="listitem"
              data-level={r.level}
              className={`rank-deck-card${locked ? ' is-locked' : ''}${current ? ' is-current' : ''}`}
              onClick={() => (shown === r.level ? setZoomed(r) : go(r.level))}
              aria-label={shown === r.level ? t('See it up close') : undefined}
            >
              <RankCard
                ref={current ? cardRef : undefined}
                rank={r}
                wins={wins}
                catName={catName(r)}
                className="rank-card"
              />
              {locked && <RankLock rank={r} />}
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {zoomed && (
          <motion.div
            className="rank-zoom"
            role="dialog"
            aria-modal="true"
            aria-label={t('Rank {n}: {name}', { n: num(zoomed.level), name: t(zoomed.name) })}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setZoomed(null)}
          >
            <motion.div
              className={`rank-zoom-card${zoomed.level > rank.level ? ' is-locked' : ''}`}
              initial={{ scale: 0.82, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              <RankCard rank={zoomed} wins={wins} catName={catName(zoomed)} className="rank-card" />
              {zoomed.level > rank.level && <RankLock rank={zoomed} />}
            </motion.div>
            <span className="rank-zoom-hint">{t('Tap anywhere to close')}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="rank-dots" role="tablist" aria-label={t('All ranks')}>
        {RANKS.map(r => (
          <button
            key={r.level}
            type="button"
            role="tab"
            aria-selected={shown === r.level}
            aria-label={t('Rank {n}: {name}', { n: num(r.level), name: t(r.name) })}
            className={`rank-dot${shown === r.level ? ' is-on' : ''}${r.level > rank.level ? ' is-locked' : ''}`}
            onClick={() => go(r.level)}
          />
        ))}
      </div>
    </div>
  );
}
