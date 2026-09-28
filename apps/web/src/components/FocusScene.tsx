import { useEffect, useState } from 'react';
import type { CatId } from '@purrpose/shared';
import { Cat, type CatState, type CatWear } from '@purrpose/cats';

const SCENE_WIDTH = 380;
const SCENE_HEIGHT = 480;
const SILL_Y = 320;
const INK = '#26201D';

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

export function FocusScene({ catId, isFocusing, isFinished, reduced = false, wear }: FocusSceneProps) {
  const [headTilt, setHeadTilt] = useState<-1 | 0 | 1>(0);

  // During post-focus, cat occasionally looks around gently
  useEffect(() => {
    if (!isFinished || isFocusing) {
      setHeadTilt(0);
      return;
    }
    const interval = setInterval(() => {
      const tilts: Array<-1 | 0 | 1> = [-1, 0, 1, 0];
      const nextTilt = tilts[Math.floor(Math.random() * tilts.length)];
      setHeadTilt(nextTilt);
    }, 3600);
    return () => clearInterval(interval);
  }, [isFinished, isFocusing]);

  const catState: CatState = isFocusing
    ? 'SLEEPING'
    : isFinished
      ? 'SATISFIED'
      : 'WAITING';

  return (
    <svg
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      width="100%"
      className="purrpose-focus-scene"
      role="img"
      aria-label={`Focus mode window scene with ${catId} cat`}
      style={{
        borderRadius: 'var(--radius-sketch-a)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        border: '2.5px solid var(--ink)',
      }}
    >
      <defs>
        {/* Deep Night Sky Gradient */}
        <linearGradient id="focusNightSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#141C2B" />
          <stop offset="60%" stopColor="#1C273C" />
          <stop offset="100%" stopColor="#25344D" />
        </linearGradient>

        {/* Firefly Aura */}
        <filter id="fireflyAura" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Window Area Clip */}
        <clipPath id="focusWindowClip">
          <rect x={15} y={10} width={SCENE_WIDTH - 30} height={SILL_Y - 10} rx={4} />
        </clipPath>
      </defs>

      {/* =========================================================================
          1. NIGHT SKY & DISTANT RAINY NEIGHBORHOOD (OUTSIDE WINDOW)
          ========================================================================= */}
      <rect x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="url(#focusNightSky)" />

      {/* Distant House Silhouette & Warm Lit Window */}
      <polygon points="275,320 275,230 335,180 380,210 380,320" fill="#111824" />
      <rect x="295" y="235" width="20" height="20" rx="2" fill="#F6C445" stroke={INK} strokeWidth={2} />
      <line x1="305" y1="235" x2="305" y2="255" stroke={INK} strokeWidth={1.5} />
      <line x1="295" y1="245" x2="315" y2="245" stroke={INK} strokeWidth={1.5} />

      {/* Distant Bokeh Night Lights */}
      <g opacity={0.55} pointerEvents="none">
        <circle cx={60} cy={140} r={14} fill="#FDE047" opacity={0.4} />
        <circle cx={140} cy={200} r={12} fill="#60A5FA" opacity={0.35} />
        <circle cx={220} cy={160} r={15} fill="#F472B6" opacity={0.3} />
      </g>

      {/* POST-FOCUS CLEAR SKY: Crescent Moon */}
      {isFinished && !isFocusing && (
        <g className="focus-clear-sky" opacity={0.95} pointerEvents="none">
          <path
            d="M75 50 A16 16 0 0 0 88 79 A20 20 0 1 1 75 50 Z"
            fill="#FEF08A"
            stroke="#FDE047"
            strokeWidth={1.2}
          />
          <circle cx={165} cy={55} r={1.8} fill="#FFFFFF" opacity={0.9} />
          <circle cx={245} cy={45} r={2.2} fill="#FFFFFF" opacity={0.95} />
          <circle cx={325} cy={65} r={1.6} fill="#FFFFFF" opacity={0.85} />
        </g>
      )}

      {/* =========================================================================
          2. SEAMLESS RAINFALL (Active during focus)
          ========================================================================= */}
      <g
        clipPath="url(#focusWindowClip)"
        className={`focus-rain-layer ${isFinished && !isFocusing ? 'focus-rain-fading' : ''}`}
        pointerEvents="none"
      >
        <g className="lc-rain-far">
          <RainLayer spec={FAR_RAIN} />
        </g>
        <g className="lc-rain-near">
          <RainLayer spec={NEAR_RAIN} />
        </g>

        {/* Rain Droplets on Window Glass */}
        <g fill="#BFDBFE" opacity={0.65}>
          <circle cx={45} cy={80} r={1.6} />
          <circle cx={90} cy={130} r={2} />
          <circle cx={155} cy={75} r={1.5} />
          <circle cx={210} cy={110} r={2.2} />
          <circle cx={265} cy={65} r={1.6} />
          <circle cx={325} cy={125} r={1.8} />
          <circle cx={65} cy={210} r={1.8} />
          <circle cx={135} cy={195} r={1.5} />
          <circle cx={235} cy={220} r={2} />
        </g>
      </g>

      {/* =========================================================================
          3. GLOWING FIREFLIES (Post-Focus)
          ========================================================================= */}
      {isFinished && !isFocusing && (
        <g className="focus-fireflies-layer" filter="url(#fireflyAura)" pointerEvents="none">
          <g className="lc-firefly-1">
            <circle cx={80} cy={140} r={3.2} fill="#D9F99D" />
            <circle cx={80} cy={140} r={7} fill="#BEF264" opacity={0.5} />
          </g>
          <g className="lc-firefly-2">
            <circle cx={275} cy={120} r={3.6} fill="#FDE047" />
            <circle cx={275} cy={120} r={8} fill="#FACC15" opacity={0.5} />
          </g>
          <g className="lc-firefly-3">
            <circle cx={155} cy={185} r={3.0} fill="#A7F3D0" />
            <circle cx={155} cy={185} r={6.5} fill="#6EE7B7" opacity={0.5} />
          </g>
        </g>
      )}

      {/* =========================================================================
          4. WOODEN WINDOW FRAME & MULLIONS
          ========================================================================= */}
      <g stroke={INK} strokeWidth={3.5} fill="none" pointerEvents="none">
        <rect x={15} y={8} width={SCENE_WIDTH - 30} height={SILL_Y - 8} rx={4} />
        <line x1={SCENE_WIDTH / 2} y1={8} x2={SCENE_WIDTH / 2} y2={SILL_Y} strokeWidth={3.5} />
      </g>

      {/* =========================================================================
          5. DARK COZY ROOM SILL & WARM BEDSIDE LAMP ON TABLE
          ========================================================================= */}
      <g data-part="room-floor">
        {/* Dark Room Floor / Sill Base */}
        <rect x={0} y={SILL_Y} width={SCENE_WIDTH} height={SCENE_HEIGHT - SILL_Y} fill="#544136" stroke={INK} strokeWidth={2.8} />

        {/* Soft Warm Amber Lamp Glow */}
        <circle cx={86} cy={270} r={70} fill="#F59E0B" opacity={0.22} pointerEvents="none" />
        <circle cx={86} cy={270} r={42} fill="#FDE68A" opacity={0.48} pointerEvents="none" />

        {/* Small Wooden Side Table on Left */}
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          <rect x={58} y={320} width={56} height={12} rx="2" fill="#75553D" />
          <rect x={66} y={332} width={8} height={90} fill="#5C3E28" />
          <rect x={98} y={332} width={8} height={90} fill="#5C3E28" />
          {/* Lamp Base & Stand */}
          <path d="M76 320 C76 310 96 310 96 320 Z" fill="#8A6A4E" />
          <line x1={86} y1={310} x2={86} y2={280} strokeWidth={3.5} />
          {/* Lampshade (Normal Cozy Orientation: Wide at bottom, narrower at top) */}
          <polygon points="65,280 107,280 98,245 74,245" fill="#F0C056" />
        </g>

        {/* Deep Plum Round Floor Cushion Centered */}
        <g transform="translate(240, 360)">
          <ellipse cx={0} cy={22} rx={78} ry={16} fill="rgba(20,15,12,0.35)" stroke="none" />
          <ellipse cx={0} cy={10} rx={74} ry={24} fill="#5B435A" stroke={INK} strokeWidth={2.8} />
          <ellipse cx={0} cy={5} rx={58} ry={16} fill="#6C536B" stroke={INK} strokeWidth={2.2} />
        </g>
      </g>

      {/* =========================================================================
          6. THE CAT (FRONT-FACING SEATED ON CUSHION)
          ========================================================================= */}
      <g transform="translate(240, 360) scale(0.95) translate(-120, -254)">
        <Cat
          catId={catId}
          state={catState}
          expression={isFocusing ? 'sleep' : isFinished ? 'happyShut' : 'hopeful'}
          headTilt={headTilt}
          size={240}
          wear={wear}
        />
      </g>

      {/* =========================================================================
          7. PURRING NOTES (During Active Focus)
          ========================================================================= */}
      {isFocusing && !reduced && (
        <g opacity={0.95} pointerEvents="none">
          <text x={130} y={230} fontSize={22} fill="#F59E0B" style={{ fontFamily: 'Gochi Hand, cursive', fontWeight: 'bold' }} className="lc-zzz">
            ♪
          </text>
          <text x={330} y={220} fontSize={20} fill="#E07A5F" style={{ fontFamily: 'Gochi Hand, cursive', fontWeight: 'bold' }} className="lc-zzz">
            ♫
          </text>
          <text x={285} y={185} fontSize={18} fill="#F59E0B" style={{ fontFamily: 'Gochi Hand, cursive', fontWeight: 'bold' }} className="lc-zzz">
            purr…
          </text>
        </g>
      )}

      {/* =========================================================================
          8. FOCUS STATUS BADGE
          ========================================================================= */}
      <g transform="translate(20, 20)" pointerEvents="none">
        <rect
          x={0}
          y={0}
          rx={12}
          ry={12}
          width={isFocusing ? 130 : isFinished ? 140 : 120}
          height={26}
          fill="#FFFDF8"
          stroke={INK}
          strokeWidth={1.8}
        />
        <text
          x={12}
          y={17}
          fontSize={12}
          fontWeight="bold"
          fill={isFocusing ? '#D97706' : isFinished ? '#16A34A' : INK}
          style={{ fontFamily: 'Gochi Hand, cursive', letterSpacing: '0.3px' }}
        >
          {isFocusing ? '🌧 FOCUSING…' : isFinished ? '✨ SESSION DONE' : '🌙 READY TO FOCUS'}
        </text>
      </g>
    </svg>
  );
}
