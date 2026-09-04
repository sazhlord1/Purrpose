import { useEffect, useState } from 'react';
import type { CatId } from '@purrpose/shared';
import { Cat, type CatState } from '@purrpose/cats';

const SCENE_WIDTH = 380;
const SCENE_HEIGHT = 480;
const SILL_Y = 320;
const INK = '#26201D';

interface FocusSceneProps {
  catId: CatId;
  isFocusing: boolean;
  isFinished: boolean;
  reduced?: boolean;
}

function RainStreakGroup() {
  return (
    <g stroke="#93C5FD" strokeWidth={1.4} strokeLinecap="round" opacity={0.65}>
      {/* Column 1 */}
      <line x1={30} y1={10} x2={20} y2={58} />
      <line x1={38} y1={120} x2={28} y2={168} />
      <line x1={25} y1={230} x2={15} y2={278} />

      {/* Column 2 */}
      <line x1={70} y1={40} x2={60} y2={88} />
      <line x1={78} y1={150} x2={68} y2={198} />
      <line x1={65} y1={260} x2={55} y2={305} />

      {/* Column 3 */}
      <line x1={115} y1={15} x2={105} y2={62} />
      <line x1={125} y1={130} x2={115} y2={178} />
      <line x1={110} y1={240} x2={100} y2={288} />

      {/* Column 4 */}
      <line x1={165} y1={45} x2={155} y2={92} />
      <line x1={172} y1={165} x2={162} y2={212} />
      <line x1={160} y1={270} x2={150} y2={310} />

      {/* Column 5 */}
      <line x1={215} y1={20} x2={205} y2={68} />
      <line x1={225} y1={135} x2={215} y2={182} />
      <line x1={210} y1={245} x2={200} y2={292} />

      {/* Column 6 */}
      <line x1={265} y1={50} x2={255} y2={98} />
      <line x1={272} y1={160} x2={262} y2={208} />
      <line x1={260} y1={270} x2={250} y2={310} />

      {/* Column 7 */}
      <line x1={310} y1={25} x2={300} y2={72} />
      <line x1={320} y1={140} x2={310} y2={188} />
      <line x1={305} y1={250} x2={295} y2={298} />

      {/* Column 8 */}
      <line x1={355} y1={55} x2={345} y2={102} />
      <line x1={362} y1={170} x2={352} y2={218} />
      <line x1={350} y1={275} x2={340} y2={315} />
    </g>
  );
}

export function FocusScene({ catId, isFocusing, isFinished, reduced = false }: FocusSceneProps) {
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
        <g className="lc-seamless-rain-1">
          <RainStreakGroup />
        </g>
        <g className="lc-seamless-rain-2">
          <RainStreakGroup />
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
