import { useEffect, useState } from 'react';
import type { CatId } from '@purrpose/shared';
import { Cat, type CatState } from '@purrpose/cats';

const SCENE_WIDTH = 380;
const SCENE_HEIGHT = 480;
const SILL_Y = 345;
const INK = '#2B231F';

interface FocusSceneProps {
  catId: CatId;
  isFocusing: boolean;
  isFinished: boolean;
  reduced?: boolean;
}

function RainStreakGroup() {
  return (
    <g stroke="#93C5FD" strokeWidth={1.25} strokeLinecap="round" opacity={0.45}>
      {/* Column 1 */}
      <line x1={25} y1={10} x2={16} y2={48} />
      <line x1={32} y1={120} x2={23} y2={162} />
      <line x1={20} y1={230} x2={11} y2={270} />

      {/* Column 2 */}
      <line x1={60} y1={40} x2={51} y2={82} />
      <line x1={68} y1={160} x2={59} y2={202} />
      <line x1={55} y1={270} x2={46} y2={310} />

      {/* Column 3 */}
      <line x1={95} y1={15} x2={86} y2={56} />
      <line x1={105} y1={130} x2={96} y2={172} />
      <line x1={90} y1={240} x2={81} y2={282} />

      {/* Column 4 */}
      <line x1={135} y1={50} x2={126} y2={92} />
      <line x1={142} y1={175} x2={133} y2={218} />
      <line x1={130} y1={290} x2={121} y2={330} />

      {/* Column 5 */}
      <line x1={170} y1={20} x2={161} y2={62} />
      <line x1={180} y1={140} x2={171} y2={182} />
      <line x1={165} y1={250} x2={156} y2={292} />

      {/* Column 6 */}
      <line x1={210} y1={60} x2={201} y2={102} />
      <line x1={218} y1={180} x2={209} y2={222} />
      <line x1={205} y1={285} x2={196} y2={326} />

      {/* Column 7 */}
      <line x1={245} y1={15} x2={236} y2={58} />
      <line x1={255} y1={125} x2={246} y2={168} />
      <line x1={240} y1={235} x2={231} y2={276} />

      {/* Column 8 */}
      <line x1={285} y1={45} x2={276} y2={88} />
      <line x1={292} y1={165} x2={283} y2={208} />
      <line x1={280} y1={275} x2={271} y2={318} />

      {/* Column 9 */}
      <line x1={320} y1={25} x2={311} y2={66} />
      <line x1={330} y1={135} x2={321} y2={176} />
      <line x1={315} y1={245} x2={306} y2={288} />

      {/* Column 10 */}
      <line x1={355} y1={55} x2={346} y2={96} />
      <line x1={362} y1={170} x2={353} y2={212} />
      <line x1={350} y1={280} x2={341} y2={322} />
    </g>
  );
}

export function FocusScene({ catId, isFocusing, isFinished, reduced = false }: FocusSceneProps) {
  const [headTilt, setHeadTilt] = useState<-1 | 0 | 1>(0);

  // During post-focus, cat occasionally looks at drifting fireflies
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
        <linearGradient id="nightSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#090D16" />
          <stop offset="50%" stopColor="#141C2E" />
          <stop offset="100%" stopColor="#1C273C" />
        </linearGradient>

        {/* Warm Window Sill Wood Gradient */}
        <linearGradient id="sillWoodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#DFBF95" />
          <stop offset="100%" stopColor="#BF9B72" />
        </linearGradient>

        {/* Warm Desk Lamp Radial Glow */}
        <radialGradient id="lampWarmGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#F59E0B" stopOpacity="0.38" />
          <stop offset="70%" stopColor="#D97706" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
        </radialGradient>

        {/* Firefly Glow Filter */}
        <filter id="fireflyAura" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3.2" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Bokeh Blur Filter */}
        <filter id="bokehSoft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>

        {/* Window Area Clip to prevent rain spilling outside window frame */}
        <clipPath id="windowClipArea">
          <rect x={10} y={10} width={SCENE_WIDTH - 20} height={SILL_Y - 10} rx={4} />
        </clipPath>
      </defs>

      {/* =========================================================================
          1. NIGHT SKY & DISTANT RAINY CITY LIGHTS (OUTSIDE WINDOW)
          ========================================================================= */}
      <rect x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="url(#nightSkyGrad)" />

      {/* Distant Bokeh Night Lights */}
      <g opacity={0.65} filter="url(#bokehSoft)" pointerEvents="none">
        <circle cx={50} cy={100} r={18} fill="#FDE047" opacity={0.45} />
        <circle cx={290} cy={85} r={24} fill="#F59E0B" opacity={0.35} />
        <circle cx={120} cy={150} r={15} fill="#60A5FA" opacity={0.4} />
        <circle cx={210} cy={130} r={17} fill="#F472B6" opacity={0.35} />
        <circle cx={330} cy={180} r={14} fill="#34D399" opacity={0.4} />
        <circle cx={75} cy={200} r={12} fill="#A78BFA" opacity={0.35} />
      </g>

      {/* POST-FOCUS CLEAR SKY: Glowing Crescent Moon & Gentle Stars */}
      {isFinished && !isFocusing && (
        <g className="focus-clear-sky" opacity={0.95} pointerEvents="none">
          <path
            d="M65 40 A16 16 0 0 0 78 69 A20 20 0 1 1 65 40 Z"
            fill="#FEF08A"
            stroke="#FDE047"
            strokeWidth={1}
          />
          <circle cx={145} cy={45} r={1.6} fill="#FFFFFF" opacity={0.85} />
          <circle cx={225} cy={35} r={2.2} fill="#FFFFFF" opacity={0.9} />
          <circle cx={305} cy={55} r={1.5} fill="#FFFFFF" opacity={0.8} />
          <circle cx={180} cy={75} r={1.3} fill="#FFFFFF" opacity={0.7} />
          <circle cx={265} cy={100} r={1.4} fill="#FFFFFF" opacity={0.65} />
        </g>
      )}

      {/* =========================================================================
          2. SEAMLESS CONTINUOUS RAINFALL (Active during focus)
          Two stacked identical groups moving vertically for 100% seamless loop
          ========================================================================= */}
      <g
        clipPath="url(#windowClipArea)"
        className={`focus-rain-layer ${isFinished && !isFocusing ? 'focus-rain-fading' : ''}`}
        pointerEvents="none"
      >
        {/* Layer 1: Base continuous fall */}
        <g className="lc-seamless-rain-1">
          <RainStreakGroup />
        </g>

        {/* Layer 2: Offset seamless loop layer */}
        <g className="lc-seamless-rain-2">
          <RainStreakGroup />
        </g>

        {/* Glistening Micro Rain Droplets on Window Glass */}
        <g fill="#BFDBFE" opacity={0.55}>
          <circle cx={35} cy={60} r={1.4} />
          <circle cx={80} cy={110} r={1.8} />
          <circle cx={145} cy={55} r={1.3} />
          <circle cx={195} cy={90} r={1.9} />
          <circle cx={250} cy={45} r={1.4} />
          <circle cx={310} cy={105} r={1.7} />
          <circle cx={55} cy={175} r={1.6} />
          <circle cx={125} cy={165} r={1.3} />
          <circle cx={220} cy={200} r={1.8} />
          <circle cx={285} cy={185} r={1.5} />
          <circle cx={330} cy={220} r={1.4} />
        </g>
      </g>

      {/* =========================================================================
          3. MAGICAL GLOWING FIREFLIES (کرم شب‌تاب)
          ========================================================================= */}
      {isFinished && !isFocusing && (
        <g className="focus-fireflies-layer" filter="url(#fireflyAura)" pointerEvents="none">
          <g className="lc-firefly-1">
            <circle cx={70} cy={120} r={3.2} fill="#D9F99D" />
            <circle cx={70} cy={120} r={6.5} fill="#BEF264" opacity={0.55} />
          </g>
          <g className="lc-firefly-2">
            <circle cx={260} cy={100} r={3.6} fill="#FDE047" />
            <circle cx={260} cy={100} r={7.5} fill="#FACC15" opacity={0.5} />
          </g>
          <g className="lc-firefly-3">
            <circle cx={145} cy={165} r={3.0} fill="#A7F3D0" />
            <circle cx={145} cy={165} r={6.0} fill="#6EE7B7" opacity={0.55} />
          </g>
          <g className="lc-firefly-4">
            <circle cx={295} cy={185} r={3.5} fill="#FEF08A" />
            <circle cx={295} cy={185} r={7.0} fill="#FDE047" opacity={0.45} />
          </g>
        </g>
      )}

      {/* =========================================================================
          4. WOODEN WINDOW FRAME & MULLIONS
          ========================================================================= */}
      <g stroke={INK} strokeWidth={3} fill="none" pointerEvents="none">
        <rect x={8} y={8} width={SCENE_WIDTH - 16} height={SILL_Y - 8} rx={4} />
        <line x1={SCENE_WIDTH / 2} y1={8} x2={SCENE_WIDTH / 2} y2={SILL_Y} strokeWidth={3.5} />
        <line x1={8} y1={105} x2={SCENE_WIDTH - 8} y2={105} strokeWidth={2.6} />
      </g>

      {/* =========================================================================
          5. WOODEN SILL & WARM DESK LAMP
          ========================================================================= */}
      <g data-part="window-sill">
        {/* Wooden Window Sill Base */}
        <rect x={0} y={SILL_Y} width={SCENE_WIDTH} height={SCENE_HEIGHT - SILL_Y} fill="url(#sillWoodGrad)" />
        {/* Top lip of wooden sill */}
        <rect x={0} y={SILL_Y - 8} width={SCENE_WIDTH} height={10} rx={2} fill="#B8976C" stroke={INK} strokeWidth={2.4} />

        {/* Ambient Warm Golden Lamp Glow */}
        <circle cx={295} cy={300} r={140} fill="url(#lampWarmGlow)" className="lc-sunbeam" pointerEvents="none" />

        {/* Brass Table Lamp on Sill */}
        <g transform="translate(305, 275)" stroke={INK} strokeWidth={2.2} strokeLinejoin="round">
          <path d="M4 72 h28 l-3 -8 h-22 z" fill="#78716C" />
          <path d="M18 64 V25 c0 -8 -5 -12 -12 -12" fill="none" stroke="#D97706" strokeWidth={3} />
          <path d="M-8 13 L-22 42 h34 L0 13 Z" fill="#FEF08A" />
          <circle cx={-5} cy={44} r={6} fill="#F59E0B" opacity={0.95} />
          <path d="M0 42 v14" stroke={INK} strokeWidth={1.2} />
          <circle cx={0} cy={57} r={2.2} fill="#D97706" />
        </g>

        {/* Plush Quilted Window Cushion */}
        <g transform="translate(190, 400)">
          <ellipse cx={0} cy={30} rx={120} ry={22} fill="rgba(43,35,31,0.25)" stroke="none" />
          <ellipse cx={0} cy={14} rx={118} ry={30} fill="#E07A5F" stroke={INK} strokeWidth={2.6} />
          <ellipse cx={0} cy={7} rx={100} ry={22} fill="#FFFDF8" stroke={INK} strokeWidth={2.2} />
          <g stroke="#D96B43" strokeWidth={1.8} opacity={0.65} fill="none">
            <path d="M-60 7 l14 8 M-20 5 l14 10 M18 5 l14 10 M55 7 l14 8" />
          </g>
        </g>
      </g>

      {/* =========================================================================
          6. THE CAT (SEATED ON CUSHION)
          ========================================================================= */}
      <g transform="translate(60, 215) scale(1.18)">
        <Cat
          catId={catId}
          state={catState}
          expression={isFocusing ? 'sleep' : isFinished ? 'happyShut' : 'hopeful'}
          headTilt={headTilt}
          size={220}
        />
      </g>

      {/* =========================================================================
          7. PURRING NOTES (During Active Focus)
          ========================================================================= */}
      {isFocusing && !reduced && (
        <g opacity={0.95} pointerEvents="none">
          <text x={70} y={230} fontSize={22} fill="#F59E0B" style={{ fontFamily: 'Gochi Hand, cursive', fontWeight: 'bold' }} className="lc-zzz">
            ♪
          </text>
          <text x={280} y={220} fontSize={20} fill="#E07A5F" style={{ fontFamily: 'Gochi Hand, cursive', fontWeight: 'bold' }} className="lc-zzz">
            ♫
          </text>
          <text x={225} y={185} fontSize={18} fill="#F59E0B" style={{ fontFamily: 'Gochi Hand, cursive', fontWeight: 'bold' }} className="lc-zzz">
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
