import { forwardRef, useId, type ReactNode } from 'react';
import { Cat, FACE_SPECS } from '@purrpose/cats';
import type { CatWear } from '@purrpose/cats';
import type { Expression } from '@purrpose/cats';
import { getLocale, num, t } from '../i18n/index.js';
import { IS_IR_EDITION } from '../lib/edition.js';
import { nextRank, RANKS, type Rank } from '../lib/ranks.js';

/**
 * The rank card on the report card: a collectible, 4:5, drawn as one SVG (400×500).
 * Plain for the first ranks, then trimmed, metallic and finally holographic, like
 * trading cards. The same layout is drawn on a canvas for sharing (lib/rankShare.ts):
 * the art comes from this SVG (with `textless`), the words from `rankCardTexts`.
 */
export const CARD_W = 400;
export const CARD_H = 500;
const INK = '#26201D';
const PAPER = '#FAF6EE';
const GOLD = '#F4C430';

/** The art window. */
const ART = { x: 24, y: 80, w: 352, h: 236 };
/** The cat inside it (cat drawings are 240×280; feet at y≈247). */
const CAT_SIZE = 186;
const CAT_SCALE = CAT_SIZE / 240;
const CAT_X = (ART.w - CAT_SIZE) / 2;
const CAT_Y = ART.h - 16 - 247 * CAT_SCALE;

const EXPRESSION: Record<number, Expression> = { 1: 'bored', 2: 'neutral', 3: 'stare', 4: 'hopeful', 5: 'neutral', 6: 'happyShut', 7: 'neutral', 8: 'happyShut' };
const WEAR: Record<number, CatWear | undefined> = { 4: { bow: true } };

export interface RankCardText {
  x: number;
  y: number;
  size: number;
  weight: number;
  text: string;
  fill: string;
  /** The big rank name: outlined, shadowed, filled with the gradient. */
  title?: boolean;
}

/** Every word on the card, with where it goes (shared by the SVG and the canvas). */
export function rankCardTexts(rank: Rank, wins: number, catName: string): RankCardText[] {
  const next = nextRank(rank);
  const name = t(rank.name);
  return [
    { x: 186, y: 60, size: name.length > 11 ? 32 : 40, weight: 900, text: name, fill: rank.light, title: true },
    { x: 350, y: 51, size: 20, weight: 900, text: num(rank.level), fill: PAPER },
    { x: 200, y: 347, size: 17, weight: 700, text: catName, fill: PAPER },
    { x: 200, y: 404, size: 44, weight: 900, text: num(wins), fill: rank.dark },
    { x: 200, y: 427, size: 15, weight: 600, text: t('pacts kept'), fill: INK },
    {
      x: 200,
      y: 467,
      size: 13,
      weight: 600,
      text: next ? t('{n} more to {rank}', { n: num(next.minWins - wins), rank: t(next.name) }) : t('The top rank!'),
      fill: INK,
    },
    { x: 200, y: 483, size: 11, weight: 700, text: `${t('purrpose')} · ${IS_IR_EDITION ? 'purrpose.ir' : 'purrpose.space'}`, fill: rank.dark },
  ];
}

function progress(rank: Rank, wins: number): number {
  const next = nextRank(rank);
  if (!next) return 1;
  return Math.max(0, Math.min(1, (wins - rank.minWins) / (next.minWins - rank.minWins)));
}

export interface RankCardProps {
  rank: Rank;
  wins: number;
  catName: string;
  /** Leave the words out (and keep the frame still). */
  textless?: boolean;
  className?: string;
}

export const RankCard = forwardRef<SVGSVGElement, RankCardProps>(function RankCard({ rank, wins, catName, textless, className }, ref) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (s: string) => `${s}-${uid}`;
  const fa = getLocale() === 'fa';
  const font = fa ? 'Anjoman, Inter, system-ui, sans-serif' : 'Inter, system-ui, sans-serif';
  const titleFont = fa ? 'Anjoman, Inter, system-ui, sans-serif' : '"Gochi Hand", "Comic Sans MS", cursive';
  const p = progress(rank, wins);
  const { tier } = rank;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${CARD_W} ${CARD_H}`}
      className={className}
      role="img"
      aria-label={t('Rank {n}: {name}', { n: num(rank.level), name: t(rank.name) })}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={id('frame')} x1="0" y1="0" x2="1" y2="1">
          {tier >= 2 ? (
            <>
              <stop offset="0" stopColor={rank.dark} />
              <stop offset="0.28" stopColor={rank.main} />
              <stop offset="0.5" stopColor={rank.light} />
              <stop offset="0.72" stopColor={rank.main} />
              <stop offset="1" stopColor={rank.dark} />
            </>
          ) : (
            <>
              <stop offset="0" stopColor={rank.main} />
              <stop offset="1" stopColor={tier === 1 ? rank.dark : rank.main} />
            </>
          )}
        </linearGradient>
        <linearGradient id={id('holo')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF7AA8" />
          <stop offset="0.2" stopColor="#FFD86B" />
          <stop offset="0.4" stopColor="#8BF0B0" />
          <stop offset="0.6" stopColor="#7FD3FF" />
          <stop offset="0.8" stopColor="#B69CFF" />
          <stop offset="1" stopColor="#FF7AA8" />
          {!textless && (
            <animateTransform attributeName="gradientTransform" type="translate" values="-0.6 -0.6; 0.6 0.6; -0.6 -0.6" dur="7s" repeatCount="indefinite" />
          )}
        </linearGradient>
        <linearGradient id={id('title')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tier === 3 ? '#FFF4C2' : PAPER} />
          <stop offset="1" stopColor={tier === 3 ? GOLD : rank.light} />
        </linearGradient>
        <clipPath id={id('art')}>
          <rect x={ART.x} y={ART.y} width={ART.w} height={ART.h} rx={16} />
        </clipPath>
        <clipPath id={id('bar')}>
          <rect x={60} y={440} width={280} height={12} rx={6} />
        </clipPath>
        <radialGradient id={id('glow')}>
          <stop offset="0" stopColor="#FFF6C8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFF6C8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Frame */}
      <rect x={2} y={2} width={396} height={496} rx={24} fill={`url(#${id('frame')})`} stroke={INK} strokeWidth={3} />
      {tier === 3 && <rect x={2} y={2} width={396} height={496} rx={24} fill={`url(#${id('holo')})`} opacity={0.42} />}
      {tier >= 1 && (
        <rect
          x={10}
          y={10}
          width={380}
          height={480}
          rx={18}
          fill="none"
          stroke={tier === 3 ? GOLD : rank.light}
          strokeWidth={tier === 3 ? 3 : 2}
          strokeDasharray={tier === 1 ? '6 5' : undefined}
        />
      )}
      {tier >= 2 && <Corners color={tier === 3 ? GOLD : rank.light} />}

      {/* Paper panel for the lower half */}
      <rect x={24} y={322} width={352} height={166} rx={14} fill={PAPER} stroke={INK} strokeWidth={2.5} opacity={0.97} />

      {/* Art */}
      <g clipPath={`url(#${id('art')})`}>
        <g transform={`translate(${ART.x} ${ART.y})`}>
          <Scene scene={rank.scene} glow={`url(#${id('glow')})`} />
          {rank.level === 6 && <Cape />}
          {(rank.level === 7 || rank.level === 8) && <ellipse cx={ART.w / 2} cy={130} rx={120} ry={110} fill={`url(#${id('glow')})`} />}
          <g transform={`translate(${CAT_X} ${CAT_Y})`}>
            <Cat catId={rank.cat} size={CAT_SIZE} showGround={false} talking expression={EXPRESSION[rank.level]} wear={WEAR[rank.level]} />
            <g transform={`scale(${CAT_SCALE})`}>
              <Accessory rank={rank} />
            </g>
          </g>
          <SceneFront scene={rank.scene} />
        </g>
      </g>
      <rect x={ART.x} y={ART.y} width={ART.w} height={ART.h} rx={16} fill="none" stroke={INK} strokeWidth={3} />
      {tier >= 2 && <rect x={ART.x + 4} y={ART.y + 4} width={ART.w - 8} height={ART.h - 8} rx={13} fill="none" stroke={tier === 3 ? GOLD : rank.light} strokeWidth={1.5} opacity={0.9} />}
      {tier >= 2 && <Sparkles color={tier === 3 ? '#FFFFFF' : rank.light} />}

      {/* Level badge */}
      <circle cx={350} cy={44} r={22} fill={rank.dark} stroke={INK} strokeWidth={2.5} />
      {tier >= 2 && <circle cx={350} cy={44} r={17} fill="none" stroke={tier === 3 ? GOLD : rank.light} strokeWidth={1.5} />}

      {/* Cat-name ribbon */}
      <path d="M70 326 h260 l-12 14 l12 14 h-260 l12 -14 Z" fill={rank.dark} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />

      {/* Progress to the next rank */}
      <rect x={60} y={440} width={280} height={12} rx={6} fill={rank.light} stroke={INK} strokeWidth={1.8} />
      <g clipPath={`url(#${id('bar')})`}>
        <rect x={fa ? 60 + 280 * (1 - p) : 60} y={440} width={280 * p} height={12} fill={tier === 3 ? `url(#${id('holo')})` : rank.main} />
      </g>
      <rect x={60} y={440} width={280} height={12} rx={6} fill="none" stroke={INK} strokeWidth={1.8} />

      {!textless &&
        rankCardTexts(rank, wins, catName).map((x, i) =>
          x.title ? (
            <g key={i} data-card-text="" fontFamily={titleFont} fontSize={x.size} fontWeight={x.weight} textAnchor="middle" direction={fa ? 'rtl' : 'ltr'}>
              <text x={x.x + 3} y={x.y + 4} fill={INK} stroke={INK} strokeWidth={8} strokeLinejoin="round">
                {x.text}
              </text>
              <text x={x.x} y={x.y} fill={`url(#${id('title')})`} stroke={INK} strokeWidth={7} strokeLinejoin="round" paintOrder="stroke">
                {x.text}
              </text>
            </g>
          ) : (
            <text
              key={i}
              data-card-text=""
              x={x.x}
              y={x.y}
              fill={x.fill}
              fontFamily={font}
              fontSize={x.size}
              fontWeight={x.weight}
              textAnchor="middle"
              direction={fa ? 'rtl' : 'ltr'}
            >
              {x.text}
            </text>
          ),
        )}
    </svg>
  );
});

function Corners({ color }: { color: string }) {
  const c = (x: number, y: number, sx: number, sy: number) => (
    <path d={`M${x} ${y + 26 * sy} q0 ${-26 * sy} ${26 * sx} ${-26 * sy}`} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
  );
  return (
    <g>
      {c(18, 18, 1, 1)}
      {c(382, 18, -1, 1)}
      {c(18, 482, 1, -1)}
      {c(382, 482, -1, -1)}
    </g>
  );
}

function Sparkles({ color }: { color: string }) {
  const star = (x: number, y: number, r: number) =>
    `M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`;
  return (
    <g fill={color} stroke={INK} strokeWidth={1}>
      <path d={star(44, 100, 9)} />
      <path d={star(356, 296, 8)} />
      <path d={star(340, 104, 5)} />
      <path d={star(60, 296, 5)} />
    </g>
  );
}

/** What the rank's cat wears or carries (drawn in the cat's own 240×280 space). */
function Accessory({ rank }: { rank: Rank }) {
  const spec = FACE_SPECS[rank.cat];
  if (!spec) return null;
  const [lx, ly] = spec.left;
  const [rx, ry] = spec.right;
  const [nx, ny, nw] = spec.neck;
  if (rank.level === 1) {
    // Sunglasses, too cool for this box.
    return (
      <g stroke={INK} strokeWidth={3} strokeLinejoin="round">
        <path d={`M${lx - 15} ${ly - 7} h30 v8 q-2 10 -15 10 q-13 0 -15 -10 Z`} fill="#1B1714" />
        <path d={`M${rx - 15} ${ry - 7} h30 v8 q-2 10 -15 10 q-13 0 -15 -10 Z`} fill="#1B1714" />
        <path d={`M${lx + 15} ${ly - 4} L${rx - 15} ${ry - 4}`} fill="none" />
        <path d={`M${lx - 9} ${ly - 3} l6 0 M${rx - 9} ${ry - 3} l6 0`} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" opacity={0.8} />
      </g>
    );
  }
  if (rank.level === 3) {
    // A gold chain.
    return (
      <g>
        <path d={`M${nx - nw} ${ny} q${nw} ${nw * 0.75} ${nw * 2} 0`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
        <path d={`M${nx - nw} ${ny} q${nw} ${nw * 0.75} ${nw * 2} 0`} fill="none" stroke={GOLD} strokeWidth={4} strokeDasharray="5 3" strokeLinecap="round" />
        <circle cx={nx} cy={ny + nw * 0.42} r={8} fill={GOLD} stroke={INK} strokeWidth={2.5} />
      </g>
    );
  }
  if (rank.level === 6) {
    // The cape's clasp (the cape itself is drawn behind the cat).
    return (
      <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round">
        <path d={`M${nx - nw + 4} ${ny - 2} l${nw - 4} 12 l${nw - 4} -12`} fill="#C8323C" />
        <circle cx={nx} cy={ny + 10} r={7} fill={GOLD} />
      </g>
    );
  }
  if (rank.level === 5 || rank.level === 7) {
    // A medal on a ribbon.
    return (
      <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round">
        <path d={`M${nx - 12} ${ny - 4} l8 18 h8 l8 -18`} fill={rank.level === 7 ? '#3A6FD8' : '#7A2E8C'} />
        <circle cx={nx} cy={ny + 22} r={11} fill={GOLD} />
        <path d={`M${nx} ${ny + 16} l2 4 h4 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 h4 Z`} fill="#FFF4C2" strokeWidth={1} />
      </g>
    );
  }
  if (rank.level === 8) {
    // A crown, and a trophy at its feet.
    const cy = Math.min(ly, ry) - 66;
    return (
      <g stroke={INK} strokeWidth={3} strokeLinejoin="round">
        <path d={`M${nx - 30} ${cy + 26} l-4 -28 l17 14 l17 -22 l17 22 l17 -14 l-4 28 Z`} fill={GOLD} />
        <rect x={nx - 31} y={cy + 24} width={62} height={9} rx={3} fill="#E5A51F" />
        <circle cx={nx} cy={cy - 9} r={4} fill="#E8455A" strokeWidth={2} />
        <circle cx={nx - 34} cy={cy - 1} r={3} fill="#4FB3E8" strokeWidth={1.8} />
        <circle cx={nx + 34} cy={cy - 1} r={3} fill="#4FB3E8" strokeWidth={1.8} />
      </g>
    );
  }
  return null;
}

/** A cape, behind the cat (rank 6). Drawn in art space, around where the cat sits. */
function Cape() {
  const cx = ART.w / 2;
  const top = CAT_Y + 150 * CAT_SCALE;
  return (
    <g stroke={INK} strokeWidth={3} strokeLinejoin="round">
      <path d={`M${cx - 30} ${top} C${cx - 90} ${top + 40} ${cx - 130} ${top + 70} ${cx - 140} ${top + 112} q30 -14 52 4 q24 -18 50 -2 L${cx} ${top + 10} Z`} fill="#C8323C" />
      <path d={`M${cx + 30} ${top} C${cx + 90} ${top + 40} ${cx + 130} ${top + 70} ${cx + 140} ${top + 112} q-30 -14 -52 4 q-24 -18 -50 -2 L${cx} ${top + 10} Z`} fill="#A82530" />
    </g>
  );
}

/** Where each rank's cat lives: the road map, from the street to the stage. */
function Scene({ scene, glow }: { scene: Rank['scene']; glow: string }) {
  const W = ART.w;
  const H = ART.h;
  const floor = H - 30;
  let art: ReactNode = null;
  switch (scene) {
    case 'box':
      art = (
        <>
          <rect width={W} height={H} fill="#CFE6F2" />
          {[0, 1, 2, 3, 4].map(r =>
            [0, 1, 2, 3, 4, 5, 6].map(c => (
              <rect key={`${r}-${c}`} x={c * 56 - (r % 2) * 28} y={20 + r * 30} width={52} height={26} rx={3} fill="#D9C4A8" stroke="#BCA483" strokeWidth={1.5} />
            )),
          )}
          <rect y={floor} width={W} height={30} fill="#BDB6AA" stroke={INK} strokeWidth={2} />
          <path d={`M60 ${floor + 6} v24 M160 ${floor + 6} v24 M260 ${floor + 6} v24`} stroke="#9C9488" strokeWidth={2} />
          {/* back flap of the box */}
          <path d={`M108 ${floor - 62} l-22 -26 h70 l14 26 Z`} fill="#B98848" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <path d={`M244 ${floor - 62} l22 -26 h-70 l-14 26 Z`} fill="#B98848" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        </>
      );
      break;
    case 'yard':
      art = (
        <>
          <rect width={W} height={H} fill="#BFE3F7" />
          <circle cx={60} cy={44} r={22} fill="#FFD95A" stroke={INK} strokeWidth={2} />
          <path d="M240 40 q10 -14 26 -6 q14 -10 26 4 q14 2 10 14 h-66 q-8 -8 4 -12 Z" fill={PAPER} stroke={INK} strokeWidth={2} />
          {Array.from({ length: 13 }, (_, i) => (
            <path key={i} d={`M${i * 28 + 2} ${floor - 4} v-74 l12 -12 l12 12 v74 Z`} fill="#E9D3AE" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          ))}
          <rect y={floor - 60} width={W} height={8} fill="#D2B98E" stroke={INK} strokeWidth={1.5} />
          <rect y={floor - 6} width={W} height={36} fill="#8CC56A" stroke={INK} strokeWidth={2} />
          <path d={`M30 ${floor + 4} l4 -8 l4 8 M120 ${floor + 10} l4 -8 l4 8 M300 ${floor + 6} l4 -8 l4 8`} stroke="#4E8A3A" strokeWidth={2} fill="none" />
        </>
      );
      break;
    case 'alley':
      art = (
        <>
          <rect width={W} height={H} fill="#2B2340" />
          {[0, 1, 2, 3, 4, 5].map(r =>
            [0, 1, 2, 3, 4, 5, 6].map(c => (
              <rect key={`${r}-${c}`} x={c * 56 - (r % 2) * 28} y={r * 32} width={52} height={28} rx={2} fill="#3D3159" stroke="#211A33" strokeWidth={2} />
            )),
          )}
          <path d="M40 70 l14 -30 l14 30 l-30 -18 h32 Z" fill="none" stroke="#F2D23C" strokeWidth={4} strokeLinejoin="round" />
          <path d="M262 52 q20 -20 40 0 t40 0" fill="none" stroke="#5EE6C2" strokeWidth={5} strokeLinecap="round" />
          <text x={292} y={96} fontSize={22} fontWeight={900} fill="#FF6FA8" textAnchor="middle" fontFamily="Inter, sans-serif">
            PURR
          </text>
          <circle cx={312} cy={150} r={46} fill={glow} opacity={0.5} />
          <rect y={floor} width={W} height={30} fill="#1C162A" stroke={INK} strokeWidth={2} />
        </>
      );
      break;
    case 'room':
      art = (
        <>
          <rect width={W} height={H} fill="#F3E2C7" />
          <rect x={232} y={26} width={92} height={96} rx={6} fill="#BFE3F7" stroke={INK} strokeWidth={3} />
          <path d="M278 26 v96 M232 74 h92" stroke={INK} strokeWidth={3} />
          <rect x={24} y={34} width={64} height={48} rx={3} fill="#F7C873" stroke={INK} strokeWidth={2.5} />
          <circle cx={56} cy={58} r={12} fill="#E86A3A" stroke={INK} strokeWidth={2} />
          <rect y={floor - 10} width={W} height={40} fill="#C98A55" stroke={INK} strokeWidth={2} />
          <ellipse cx={W / 2} cy={floor + 6} rx={120} ry={16} fill="#D85C5C" stroke={INK} strokeWidth={2.5} />
          <path d={`M44 ${floor - 10} q-6 -40 10 -60 q10 18 4 60 Z`} fill="#6BAF5B" stroke={INK} strokeWidth={2} />
          <rect x={34} y={floor - 14} width={34} height={22} rx={4} fill="#B66A3C" stroke={INK} strokeWidth={2} />
        </>
      );
      break;
    case 'rooftop':
      art = (
        <>
          <defs>
            <linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFB36B" />
              <stop offset="1" stopColor="#F27FA0" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill="url(#sunset)" />
          <circle cx={W / 2} cy={floor - 40} r={52} fill="#FFE08A" opacity={0.9} />
          {[
            [0, 110, 50],
            [46, 80, 40],
            [92, 130, 44],
            [250, 96, 46],
            [292, 120, 60],
          ].map(([x, h, w], i) => (
            <rect key={i} x={x} y={floor - h!} width={w} height={h} fill="#7A3F5E" stroke={INK} strokeWidth={2} />
          ))}
          <path d={`M0 ${floor} L${W} ${floor - 8} V${H} H0 Z`} fill="#B5574B" stroke={INK} strokeWidth={2.5} />
          <path d={`M0 ${floor + 12} L${W} ${floor + 4} M0 ${floor + 24} L${W} ${floor + 16}`} stroke="#8E3E35" strokeWidth={2} />
        </>
      );
      break;
    case 'palace':
      art = (
        <>
          <rect width={W} height={H} fill="#1E5A56" />
          {[60, 120, 180, 240, 300].map(x => (
            <path key={x} d={`M${x} 0 v${H}`} stroke="#256B66" strokeWidth={10} />
          ))}
          <path d={`M0 0 h70 q-14 70 0 ${H} h-70 Z`} fill="#B0263A" stroke={INK} strokeWidth={2.5} />
          <path d={`M${W} 0 h-70 q14 70 0 ${H} h70 Z`} fill="#B0263A" stroke={INK} strokeWidth={2.5} />
          <path d="M20 0 q-6 100 6 236 M44 0 q-8 100 4 236 M332 0 q6 100 -6 236 M308 0 q8 100 -4 236" stroke="#86182A" strokeWidth={2} fill="none" />
          <path d="M0 0 h352 v18 q-22 14 -44 0 q-22 14 -44 0 q-22 14 -44 0 q-22 14 -44 0 q-22 14 -44 0 q-22 14 -44 0 q-22 14 -44 0 q-22 14 -44 0 Z" fill={GOLD} stroke={INK} strokeWidth={2} />
          <ellipse cx={W / 2} cy={floor + 4} rx={92} ry={20} fill="#7A2E8C" stroke={INK} strokeWidth={2.5} />
          <rect y={floor + 10} width={W} height={20} fill="#163F3C" stroke={INK} strokeWidth={2} />
        </>
      );
      break;
    case 'night':
      art = (
        <>
          <defs>
            <linearGradient id="nightsky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#141A3C" />
              <stop offset="1" stopColor="#4B2B66" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill="url(#nightsky)" />
          <circle cx={292} cy={58} r={30} fill="#FFF3C4" stroke={INK} strokeWidth={2} />
          <circle cx={304} cy={50} r={26} fill="#2A2350" />
          {[
            [30, 30],
            [80, 60],
            [140, 24],
            [200, 46],
            [60, 110],
            [240, 92],
            [330, 120],
            [110, 150],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.6 : 1.6} fill="#FFFFFF" />
          ))}
          <path d={`M0 ${floor - 30} l60 -50 l50 34 l70 -60 l80 70 l50 -30 l42 36 V${H} H0 Z`} fill="#2A1C40" stroke={INK} strokeWidth={2} />
          <rect y={floor} width={W} height={30} fill="#1A1230" stroke={INK} strokeWidth={2} />
        </>
      );
      break;
    case 'stage':
      art = (
        <>
          <rect width={W} height={H} fill="#1B1F3A" />
          <path d={`M60 0 L140 ${floor} H40 Z`} fill="#FFF6C8" opacity={0.18} />
          <path d={`M292 0 L312 ${floor} H212 Z`} fill="#FFF6C8" opacity={0.18} />
          <path d={`M176 0 L236 ${floor} H116 Z`} fill="#FFF6C8" opacity={0.22} />
          {[
            [40, 40, '#FF7AA8'],
            [90, 90, '#FFD86B'],
            [300, 50, '#7FD3FF'],
            [260, 120, '#8BF0B0'],
            [70, 160, '#B69CFF'],
            [320, 170, '#FF7AA8'],
            [150, 30, '#7FD3FF'],
          ].map(([x, y, c], i) => (
            <rect key={i} x={x as number} y={y as number} width={7} height={11} rx={1.5} fill={c as string} transform={`rotate(${i * 37} ${x} ${y})`} />
          ))}
          <rect x={W / 2 - 78} y={floor - 14} width={156} height={44} fill={GOLD} stroke={INK} strokeWidth={2.5} />
          <text x={W / 2} y={floor + 20} fontSize={26} fontWeight={900} textAnchor="middle" fill={INK} fontFamily="Inter, sans-serif">
            1
          </text>
          <rect y={floor + 16} width={W} height={14} fill="#11142A" />
        </>
      );
      break;
  }
  return <g>{art}</g>;
}

/** Things in front of the cat (the box's front panel). */
function SceneFront({ scene }: { scene: Rank['scene'] }) {
  if (scene !== 'box') return null;
  const floor = ART.h - 30;
  return (
    <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round">
      <path d={`M96 ${floor - 64} l-18 18 v62 l18 -2 Z M256 ${floor - 64} l18 18 v62 l-18 -2 Z`} fill="#BF8D4C" />
      <rect x={96} y={floor - 64} width={160} height={82} fill="#D7A563" />
      <rect x={160} y={floor - 64} width={32} height={82} fill="#E9C68C" strokeWidth={1.5} />
      <text x={176} y={floor - 22} fontSize={12} fontWeight={800} textAnchor="middle" fill="#8F6128" stroke="none" fontFamily="Inter, sans-serif">
        FRAGILE
      </text>
    </g>
  );
}

/** All ranks, for the "every rank" list. */
export { RANKS };
