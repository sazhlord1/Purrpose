import { useEffect, useRef, useState, type Ref } from 'react';
import { num, t } from '../i18n/index.js';
import { RANKS, type Rank } from '../lib/ranks.js';
import { RankCard } from './RankCard.js';

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
              onClick={() => go(r.level)}
            >
              <RankCard
                ref={current ? cardRef : undefined}
                rank={r}
                wins={wins}
                catName={catName(r)}
                className="rank-card"
              />
              {locked && (
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
              )}
            </div>
          );
        })}
      </div>
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
