import { useEffect } from 'react';
import type { CatId } from '@purrpose/shared';
import { Cat } from './Cat.js';
import { LivingCat } from './LivingCat.js';
import { GROUND_Y, SCENE_WIDTH, homeXForProgress } from './anchors.js';
import { injectLivingStyle } from './livingCss.js';
import { INK } from './parts.js';
import type { CatState } from './poses.js';

export interface WorldCat {
  id: string;
  catId: CatId;
  state: CatState;
  phaseRatio: number;
  seed: number;
  title?: string;
}

export interface CatWorldProps {
  items: WorldCat[];
  reduced?: boolean;
  onOpen?: (id: string) => void;
  className?: string;
}

const MAX_CATS = 5;
const LANES = [0, 10, -8, 16, -4];

const PROPS_INK = '#2B231F';

function MiniProps() {
  return (
    <g>
      {/* Mini cozy bed */}
      <path d="M40 148 h50 M48 148 v-16 a6 6 0 0 1 6-6 h16 a6 6 0 0 1 6 6 v16" fill="#E07A5F" stroke={PROPS_INK} strokeWidth={1.8} strokeLinecap="round" />
      {/* Mini yarn ball */}
      <circle cx={170} cy={138} r={9} fill="#E76F51" stroke={PROPS_INK} strokeWidth={1.8} />
      {/* Mini scratcher */}
      <path d="M250 148 h36 M260 148 v-20 c0-3 2-5 5-5 h6 c3 0 5 2 5 5 v20" fill="#EAD8C0" stroke={PROPS_INK} strokeWidth={1.8} strokeLinecap="round" />
      {/* Mini bowl */}
      <path d="M555 148 h30 c-.8 6-6 11-15 11.5 c-9-.5-14.2-5.5-15-11.5 z" fill="#5C93C4" stroke={PROPS_INK} strokeWidth={1.8} strokeLinejoin="round" />
      {/* Mini cabinet */}
      <path d="M664 148 v-48 h40 v48 M684 100 v48" fill="#EAD8C0" stroke={PROPS_INK} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}

export function CatWorld({ items, reduced = false, onOpen, className }: CatWorldProps) {
  const shown = items.slice(0, MAX_CATS);
  useEffect(injectLivingStyle, []);

  return (
    <svg
      viewBox={`0 0 ${SCENE_WIDTH} 170`}
      width="100%"
      className={className}
      role="group"
      aria-label={`${items.length} active commitment ${items.length === 1 ? 'cat' : 'cats'}`}
      style={{ borderRadius: 'var(--radius-sketch-a)', background: '#FDFBF7' }}
    >
      {/* Soft warm floor */}
      <rect x={0} y={130} width={SCENE_WIDTH} height={40} fill="#F5EFE0" />
      <path
        d="M20 148 C200 144 560 144 740 148"
        stroke={PROPS_INK}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeDasharray="3 9"
        opacity={0.3}
        fill="none"
      />
      <MiniProps />
      {shown.map((item, i) => {
        const spread = ((i % 3) - 1) * 34;
        const x = homeXForProgress(item.phaseRatio) + spread;
        const laneY = GROUND_Y - 38 - LANES[i % LANES.length];
        return (
          <g
            key={item.id}
            transform={`translate(${x} ${laneY}) scale(0.52)`}
            onClick={onOpen ? () => onOpen(item.id) : undefined}
            onKeyDown={
              onOpen
                ? e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpen(item.id);
                    }
                  }
                : undefined
            }
            role={onOpen ? 'button' : undefined}
            tabIndex={onOpen ? 0 : undefined}
            style={onOpen ? { cursor: 'pointer' } : undefined}
            data-world-cat={item.id}
            aria-label={onOpen ? `Open commitment: ${item.title ?? item.catId}` : undefined}
          >
            {reduced ? (
              <Cat catId={item.catId} state={item.state} size={220} />
            ) : (
              <LivingCat catId={item.catId} state={item.state} seed={item.seed} homeX={x} speed={1} />
            )}
          </g>
        );
      })}
      {items.length > MAX_CATS && (
        <text x={740} y={30} textAnchor="end" fontSize={15} fill={PROPS_INK} opacity={0.7} style={{ fontFamily: 'Gochi Hand, cursive' }}>
          +{items.length - MAX_CATS} more waiting…
        </text>
      )}
    </svg>
  );
}
