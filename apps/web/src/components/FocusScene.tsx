import { useEffect, useRef, useState } from 'react';
import type { CatId } from '@purrpose/shared';
import { Cat, useGazeFollow, useTextWidth, type CatState, type CatWear } from '@purrpose/cats';

const SCENE_WIDTH = 380;
const SCENE_HEIGHT = 480;
const SILL_Y = 320;
const INK = '#26201D';
/**
 * A knitted blanket thrown over the cat's back, seen from the front: it hangs
 * over both shoulders and down the flanks, leaving the chest and paws free.
 * Drawn in the cat's own 240×280 coordinates so it moves (and curls) with it.
 */
const SHAWL_LEFT =
  'M72 146 C60 158 50 184 48 214 C47 230 48 244 50 254 L62 250 L72 256 L82 250 L92 254 C88 226 89 192 98 158 C90 152 81 148 72 146 Z';
const SHAWL_RIGHT =
  'M168 146 C180 158 190 184 192 214 C193 230 192 244 190 254 L178 250 L168 256 L158 250 L148 254 C152 226 151 192 142 158 C150 152 159 148 168 146 Z';
const WRAP_TAIL = 'M306 352 C326 366 312 382 272 384 C238 386 214 380 200 370';
/** Tail colour per cat, for the tail it wraps around itself when it curls up. */
const TAIL_COLOR: Record<CatId, string> = {
  orange: '#EEB038',
  tuxedo: '#26201D',
  black: '#1E1B18',
  boba: '#26201D',
  mochi: '#5B4033',
  oreo: '#2B2522',
  pepper: '#D8D2C8',
  yuki: '#FFFDF9',
};

interface FocusSceneProps {
  catId: CatId;
  isFocusing: boolean;
  isFinished: boolean;
  reduced?: boolean;
  /** Collar / bow tie from the shop. */
  wear?: CatWear;
}

interface RainLayerSpec {
  /** Horizontal gap between columns. */
  colGap: number;
  /** Vertical gap between drops in one column = the distance one animation loop travels. */
  rowGap: number;
  /** Sideways drift per rowGap — every drop falls along the same slant. */
  drift: number;
  length: number;
  width: number;
  opacity: number;
}

const NEAR_RAIN: RainLayerSpec = { colGap: 26, rowGap: 64, drift: 6, length: 22, width: 1.6, opacity: 0.7 };
const FAR_RAIN: RainLayerSpec = { colGap: 19, rowGap: 46, drift: 4, length: 12, width: 1, opacity: 0.35 };

/**
 * Evenly spaced rain on one slant. Each column gets a fixed stagger so it doesn't
 * look like a grid, and each row is shifted by `drift` so that sliding the whole
 * layer by (-drift, rowGap) lands every drop exactly on the next one — a seamless loop.
 */
function RainLayer({ spec }: { spec: RainLayerSpec }) {
  const lines: JSX.Element[] = [];
  const cols = Math.ceil((SCENE_WIDTH + 60) / spec.colGap);
  const rows = Math.ceil((SILL_Y + spec.rowGap * 2) / spec.rowGap) + 1;
  const dx = (spec.drift * spec.length) / spec.rowGap;
  for (let c = 0; c < cols; c++) {
    const stagger = ((c * 37) % 11) / 11; // deterministic 0..1 pattern, never random
    for (let r = -2; r < rows; r++) {
      const y = r * spec.rowGap + stagger * spec.rowGap;
      const x = c * spec.colGap + 8 - (y / spec.rowGap) * spec.drift;
      lines.push(<line key={`${c}:${r}`} x1={x} y1={y} x2={x - dx} y2={y + spec.length} />);
    }
  }
  return (
    <g stroke="#9CC9F5" strokeWidth={spec.width} strokeLinecap="round" opacity={spec.opacity}>
      {lines}
    </g>
  );
}

/** Fireflies: each wanders its own loop and blinks on its own beat. */
const FIREFLIES: Array<{ x: number; y: number; path: 'a' | 'b' | 'c'; dur: number; delay: number; blink: number; r: number; tint: string }> = [
  { x: 60, y: 238, path: 'a', dur: 9, delay: 0, blink: 2.6, r: 2.6, tint: '#E9FF8A' },
  { x: 118, y: 268, path: 'b', dur: 11, delay: -3, blink: 3.4, r: 2.2, tint: '#FFE27A' },
  { x: 152, y: 205, path: 'c', dur: 13, delay: -6, blink: 2.2, r: 1.9, tint: '#D4FF9A' },
  { x: 214, y: 252, path: 'a', dur: 10, delay: -2, blink: 3, r: 2.4, tint: '#FFE27A' },
  { x: 250, y: 184, path: 'b', dur: 12, delay: -7, blink: 2.8, r: 1.8, tint: '#E9FF8A' },
  { x: 304, y: 228, path: 'c', dur: 9.5, delay: -4, blink: 3.8, r: 2.5, tint: '#D4FF9A' },
  { x: 92, y: 172, path: 'c', dur: 14, delay: -9, blink: 2.4, r: 1.6, tint: '#FFF3A6' },
  { x: 336, y: 270, path: 'a', dur: 11.5, delay: -5, blink: 3.2, r: 2.1, tint: '#FFE27A' },
  { x: 182, y: 286, path: 'b', dur: 8.5, delay: -1, blink: 2.9, r: 2.3, tint: '#E9FF8A' },
];

export function FocusScene({ catId, isFocusing, isFinished, reduced = false, wear }: FocusSceneProps) {
  const [headTilt, setHeadTilt] = useState<-1 | 0 | 1>(0);
  const svgRef = useRef<SVGSVGElement | null>(null);
  // Awake → the eyes follow your mouse / finger. Asleep → they stay shut and still.
  useGazeFollow(svgRef, !reduced && !isFocusing);

  // After a session the cat looks around, content.
  useEffect(() => {
    if (!isFinished || isFocusing) {
      setHeadTilt(isFocusing ? 1 : 0);
      return;
    }
    const interval = setInterval(() => {
      const tilts: Array<-1 | 0 | 1> = [-1, 0, 1, 0];
      setHeadTilt(tilts[Math.floor(Math.random() * tilts.length)]);
    }, 3600);
    return () => clearInterval(interval);
  }, [isFinished, isFocusing]);

  const catState: CatState = isFocusing ? 'SLEEPING' : isFinished ? 'SATISFIED' : 'WAITING';
  const badge = isFocusing ? 'FOCUSING…' : isFinished ? 'SESSION DONE' : 'READY TO FOCUS';
  const badgeRef = useRef<SVGTextElement | null>(null);
  const badgeW = useTextWidth(badgeRef, badge, badge.length * 6.6);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      width="100%"
      className={`purrpose-focus-scene ${isFocusing ? 'is-focusing' : ''} ${reduced ? 'is-reduced' : ''}`}
      role="img"
      aria-label={`Focus room at night with ${catId} cat ${isFocusing ? 'asleep under a blanket' : 'watching you'}`}
      style={{
        borderRadius: 'var(--radius-sketch-a)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        border: '2.5px solid var(--ink)',
      }}
    >
      <defs>
        <linearGradient id="focusNightSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#141C2B" />
          <stop offset="60%" stopColor="#1C273C" />
          <stop offset="100%" stopColor="#25344D" />
        </linearGradient>
        <radialGradient id="focusLamp" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE3A3" stopOpacity={0.75} />
          <stop offset="45%" stopColor="#F5B04B" stopOpacity={0.32} />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="focusCatGlow" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="#FFCF8A" stopOpacity={0.42} />
          <stop offset="70%" stopColor="#E89A5A" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#E89A5A" stopOpacity={0} />
        </radialGradient>
        {/* Warm lamp rim-light around the cat, so dark cats still read against the night. */}
        <filter id="focusRim" x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="grown" />
          <feGaussianBlur in="grown" stdDeviation="2.6" result="soft" />
          <feFlood floodColor="#FFC983" floodOpacity="0.75" />
          <feComposite in2="soft" operator="in" result="rim" />
          <feMerge>
            <feMergeNode in="rim" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="fireflyAura" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <clipPath id="focusWindowClip">
          <rect x={15} y={10} width={SCENE_WIDTH - 30} height={SILL_Y - 10} rx={4} />
        </clipPath>
        {/* Knit pattern stays inside the shawl (cat coordinates) */}
        <clipPath id="focusShawlClip">
          <path d={SHAWL_LEFT} />
          <path d={SHAWL_RIGHT} />
        </clipPath>
      </defs>

      {/* 1. NIGHT OUTSIDE THE WINDOW */}
      <rect x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="url(#focusNightSky)" />
      <g pointerEvents="none">
        {[[42, 40, 1.4], [120, 70, 1.1], [190, 34, 1.6], [262, 58, 1.2], [330, 30, 1.5], [300, 104, 1]].map(([x, y, r]) => (
          <circle key={`${x}-${y}`} className="focus-star" cx={x} cy={y} r={r} fill="#FFF7D6" style={{ animationDelay: `${(x % 7) * 0.4}s` }} />
        ))}
      </g>
      {/* A neighbour's house far away on the left, its window glowing (clear of the cat) */}
      <polygon points="15,320 15,214 44,186 74,212 74,320" fill="#111824" />
      <rect x="32" y="222" width="20" height="20" rx="2" fill="#F6C445" stroke={INK} strokeWidth={2} className="focus-far-window" />
      <line x1="42" y1="222" x2="42" y2="242" stroke={INK} strokeWidth={1.5} />
      <line x1="32" y1="232" x2="52" y2="232" stroke={INK} strokeWidth={1.5} />
      {/* Dark garden bushes the fireflies hover over */}
      <path d="M15 320 C20 280 60 270 84 292 C100 262 150 262 168 292 C186 270 226 270 240 296 C262 276 300 282 310 300 L310 320 Z" fill="#0F1A1E" />

      {isFinished && !isFocusing && (
        <g className="focus-clear-sky" opacity={0.95} pointerEvents="none">
          <path d="M75 50 A16 16 0 0 0 88 79 A20 20 0 1 1 75 50 Z" fill="#FEF08A" stroke="#FDE047" strokeWidth={1.2} />
        </g>
      )}

      {/* 2. RAIN while you focus */}
      <g
        clipPath="url(#focusWindowClip)"
        className={`focus-rain-layer ${isFocusing ? '' : 'focus-rain-fading'}`}
        pointerEvents="none"
      >
        <g className="lc-rain-far">
          <RainLayer spec={FAR_RAIN} />
        </g>
        <g className="lc-rain-near">
          <RainLayer spec={NEAR_RAIN} />
        </g>
        <g fill="#BFDBFE" opacity={0.65}>
          <circle cx={45} cy={80} r={1.6} />
          <circle cx={90} cy={130} r={2} />
          <circle cx={155} cy={75} r={1.5} />
          <circle cx={210} cy={110} r={2.2} />
          <circle cx={265} cy={65} r={1.6} />
          <circle cx={325} cy={125} r={1.8} />
        </g>
      </g>

      {/* 3. FIREFLIES — alive whenever it isn't raining: drifting, blinking */}
      <g clipPath="url(#focusWindowClip)" className={`focus-fireflies ${isFocusing ? 'is-hidden' : ''}`} pointerEvents="none">
        {FIREFLIES.map((f, i) => (
          <g key={i} transform={`translate(${f.x} ${f.y})`}>
            <g className={`ff-wander ff-${f.path}`} style={{ animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }}>
              <g className="ff-blink" style={{ animationDuration: `${f.blink}s`, animationDelay: `${f.delay / 2}s` }}>
                <circle r={f.r * 3.2} fill={f.tint} opacity={0.55} filter="url(#fireflyAura)" />
                <circle r={f.r} fill="#FFFDE8" />
              </g>
            </g>
          </g>
        ))}
      </g>

      {/* 4. WINDOW FRAME */}
      <g stroke={INK} strokeWidth={3.5} fill="none" pointerEvents="none">
        <rect x={15} y={8} width={SCENE_WIDTH - 30} height={SILL_Y - 8} rx={4} />
        <line x1={SCENE_WIDTH / 2} y1={8} x2={SCENE_WIDTH / 2} y2={SILL_Y} strokeWidth={3.5} />
      </g>

      {/* 5. ROOM: floor, breathing bedside lamp */}
      <g data-part="room-floor">
        <rect x={0} y={SILL_Y} width={SCENE_WIDTH} height={SCENE_HEIGHT - SILL_Y} fill="#4A382E" stroke={INK} strokeWidth={2.8} />
        <ellipse cx={240} cy={300} rx={150} ry={150} fill="url(#focusCatGlow)" pointerEvents="none" />
        <g className="focus-lamp-glow" pointerEvents="none">
          <circle cx={86} cy={266} r={120} fill="url(#focusLamp)" />
        </g>
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          <rect x={58} y={320} width={56} height={12} rx="2" fill="#75553D" />
          <rect x={66} y={332} width={8} height={90} fill="#5C3E28" />
          <rect x={98} y={332} width={8} height={90} fill="#5C3E28" />
          <path d="M76 320 C76 310 96 310 96 320 Z" fill="#8A6A4E" />
          <line x1={86} y1={310} x2={86} y2={280} strokeWidth={3.5} />
          <polygon className="focus-lampshade" points="65,280 107,280 98,245 74,245" fill="#F7C860" />
          <path d="M70 280 L102 280" stroke="#FFE7A8" strokeWidth={2} />
        </g>

        {/* Warm plush bed: back half (the front rim is drawn over the cat) */}
        <g transform="translate(240, 372)">
          <ellipse cx={0} cy={18} rx={98} ry={18} fill="rgba(10,6,4,0.4)" />
          <path d="M-94 0 C-98 -26 -60 -36 0 -36 C60 -36 98 -26 94 0 C90 18 50 26 0 26 C-50 26 -90 18 -94 0 Z" fill="#C9673F" stroke={INK} strokeWidth={2.8} />
          <ellipse cx={0} cy={-10} rx={70} ry={17} fill="#F3D9B5" stroke={INK} strokeWidth={2.2} />
          <path d="M-52 -14 q8 -4 16 0 M-14 -20 q8 -4 16 0 M26 -14 q8 -4 16 0" fill="none" stroke="#DDBB92" strokeWidth={1.6} strokeLinecap="round" />
        </g>
      </g>

      {/* 6. THE CAT — awake and watching you; on Start it settles, curls and sleeps */}
      <g transform="translate(240, 372) scale(0.92)">
        <g className={`focus-cat ${isFocusing ? 'is-asleep' : ''}`}>
          <g transform="translate(-120, -254)" filter="url(#focusRim)">
            <Cat
              catId={catId}
              state={catState}
              expression={isFocusing ? 'sleep' : isFinished ? 'happyShut' : 'hopeful'}
              headTilt={headTilt}
              size={240}
              wear={wear}
            />
          </g>
          {/* The blanket over its back — always there, curls up with it */}
          <g transform="translate(-120, -254)" pointerEvents="none">
            <g fill="#E8A87C" stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
              <path d={SHAWL_LEFT} />
              <path d={SHAWL_RIGHT} />
            </g>
            <g clipPath="url(#focusShawlClip)" fill="none" stroke="#C97B4F" strokeWidth={1.6} strokeLinecap="round">
              {[176, 194, 212, 230, 246].map(y => (
                <path key={y} d={Array.from({ length: 16 }, (_, i) => `M${44 + i * 10} ${y} l4 4 l4 -4`).join(' ')} />
              ))}
            </g>
            {/* turned-over edge along the inside of each drape */}
            <g fill="none" stroke="#F6D2B4" strokeWidth={3} strokeLinecap="round">
              <path d="M93 162 C87 190 86 222 89 248" />
              <path d="M147 162 C153 190 154 222 151 248" />
            </g>
          </g>
        </g>
      </g>

      {/* Front rim of the bed, over the cat's paws (the "loaf" look) */}
      <g transform="translate(240, 372)" pointerEvents="none">
        <path d="M-94 0 C-90 18 -50 26 0 26 C50 26 90 18 94 0 C92 -6 84 -12 70 -16 C58 -10 30 -8 0 -8 C-30 -8 -58 -10 -70 -16 C-84 -10 -92 -6 -94 0 Z" fill="#D9774C" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
        <path d="M-66 8 q10 5 20 0 M-10 12 q10 5 20 0 M46 8 q10 5 20 0" fill="none" stroke="#B4572F" strokeWidth={1.8} strokeLinecap="round" />
      </g>

      {/* Curled up: the tail wraps around the front, over the rim of the bed */}
      <g className={`focus-wrap-tail ${isFocusing ? 'is-on' : ''}`} pointerEvents="none">
        <path d={WRAP_TAIL} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" pathLength={1} />
        <path d={WRAP_TAIL} fill="none" stroke={TAIL_COLOR[catId] ?? '#EEB038'} strokeWidth={9} strokeLinecap="round" pathLength={1} />
      </g>

      {/* 7b. Purr notes while asleep */}
      {isFocusing && !reduced && (
        <g opacity={0.95} pointerEvents="none">
          <text x={150} y={230} fontSize={20} fill="#F59E0B" style={{ fontFamily: 'Gochi Hand, cursive', fontWeight: 'bold' }} className="lc-zzz">
            z
          </text>
          <text x={286} y={214} fontSize={18} fill="#F5C08B" style={{ fontFamily: 'Gochi Hand, cursive', fontWeight: 'bold' }} className="lc-zzz">
            purr…
          </text>
        </g>
      )}

      {/* 8. STATUS BADGE (sized to its text) */}
      <g transform="translate(20, 20)" pointerEvents="none">
        <rect x={0} y={0} rx={13} ry={13} width={Math.round(badgeW + 24)} height={26} fill="#FFFDF8" stroke={INK} strokeWidth={1.8} />
        <text
          ref={badgeRef}
          x={12}
          y={17}
          fontSize={12}
          fontWeight="bold"
          fill={isFocusing ? '#D97706' : isFinished ? '#16A34A' : INK}
          style={{ fontFamily: 'Gochi Hand, cursive', letterSpacing: '0.3px' }}
        >
          {badge}
        </text>
      </g>
    </svg>
  );
}
