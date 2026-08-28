import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import type { CatId } from '@purrpose/shared';
import { LivingCat, type LivingCatHandle } from './LivingCat.js';
import { Cat } from './Cat.js';
import { getLifeStage, GROUND_Y, SCENE_HEIGHT, SCENE_WIDTH } from './anchors.js';
import { injectLivingStyle } from './livingCss.js';
import { INK } from './parts.js';
import type { CatState } from './poses.js';

const PROPS_INK = '#2B231F';

// ==========================================
// 1. WATERCOLOR BACKGROUND ENVIRONMENTS
// Soft, artistic watercolor style
// ==========================================

function WatercolorStreet() {
  return (
    <g data-part="watercolor-street" pointerEvents="none">
      <defs>
        <linearGradient id="wcSky1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#DDD6E5" />
          <stop offset="50%" stopColor="#EBE5F2" />
          <stop offset="100%" stopColor="#F5EFF9" />
        </linearGradient>
        <linearGradient id="wcStreetGround" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D5CFDD" />
          <stop offset="100%" stopColor="#C4BCCF" />
        </linearGradient>
        <radialGradient id="lampGlow" cx="80%" cy="30%" r="45%">
          <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="url(#wcSky1)" />

      {/* Streetlamp soft amber glow */}
      <circle cx={310} cy={120} r={110} fill="url(#lampGlow)" className="lc-sunbeam" />

      {/* Distant watercolor town silhouettes */}
      <path
        d="M0 240 L30 220 L60 225 L90 200 L120 205 L150 185 L180 195 L220 180 L260 210 L300 195 L340 215 L380 205 L380 320 L0 320 Z"
        fill="#C9BED3"
        opacity={0.65}
      />
      <path
        d="M0 260 L40 245 L80 250 L140 230 L200 240 L280 225 L340 245 L380 235 L380 340 L0 340 Z"
        fill="#B8ACC3"
        opacity={0.8}
      />

      {/* Watercolor Streetlamp */}
      <g opacity={0.85}>
        <path d="M310 70 L310 340" stroke={PROPS_INK} strokeWidth={2.4} strokeLinecap="round" />
        <path d="M300 70 C300 55 320 55 320 70 Z" fill="#FDE68A" stroke={PROPS_INK} strokeWidth={1.8} />
        <path d="M295 70 h30" stroke={PROPS_INK} strokeWidth={2.2} />
      </g>

      {/* Sidewalk & stone curb */}
      <rect x={0} y={320} width={SCENE_WIDTH} height={SCENE_HEIGHT - 320} fill="url(#wcStreetGround)" />
      <path d="M0 320 h380" stroke={PROPS_INK} strokeWidth={2} opacity={0.4} />

      {/* Watercolor cobblestone texture patches */}
      <ellipse cx={80} cy={350} rx={22} ry={9} fill="#B8ADC2" opacity={0.5} />
      <ellipse cx={280} cy={360} rx={28} ry={11} fill="#B8ADC2" opacity={0.5} />
      <ellipse cx={180} cy={430} rx={34} ry={12} fill="#B8ADC2" opacity={0.4} />
      <ellipse cx={70} cy={440} rx={24} ry={10} fill="#B8ADC2" opacity={0.4} />
      <ellipse cx={310} cy={435} rx={26} ry={10} fill="#B8ADC2" opacity={0.4} />
    </g>
  );
}

function WatercolorGarden() {
  return (
    <g data-part="watercolor-garden" pointerEvents="none">
      <defs>
        <linearGradient id="wcSky2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D2EBF9" />
          <stop offset="60%" stopColor="#EBF6FC" />
          <stop offset="100%" stopColor="#FFF7ED" />
        </linearGradient>
        <linearGradient id="wcGrass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A7D7B5" />
          <stop offset="50%" stopColor="#86C898" />
          <stop offset="100%" stopColor="#6BAF7E" />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="url(#wcSky2)" />

      {/* Distant watercolor cottage */}
      <g opacity={0.85}>
        <path d="M220 160 L290 110 L360 160 L360 260 L220 260 Z" fill="#FDF3E3" stroke="#CBB99F" strokeWidth={1.5} />
        <path d="M210 160 L290 100 L370 160 Z" fill="#E07A5F" opacity={0.9} />
        <rect x={315} y={80} width={16} height={35} fill="#C86A50" />
        <rect x={265} y={170} width={36} height={40} rx={3} fill="#FEF3C7" stroke="#CBB99F" strokeWidth={1.5} />
        <path d="M283 170 v40 M265 190 h36" stroke="#CBB99F" strokeWidth={1.2} />
      </g>

      {/* Fluffy watercolor garden bushes & trees */}
      <path
        d="M-20 260 C10 200 60 210 90 240 C130 190 190 200 230 250 C260 220 320 210 350 250 C380 230 410 240 420 280 L-20 280 Z"
        fill="#95CDA5"
        opacity={0.8}
      />

      {/* Lush watercolor grass ground */}
      <rect x={0} y={270} width={SCENE_WIDTH} height={SCENE_HEIGHT - 270} fill="url(#wcGrass)" />
      <path
        d="M0 270 C60 265 140 275 220 268 C300 262 350 272 380 268"
        stroke="#5A9E6E"
        strokeWidth={2}
        fill="none"
        opacity={0.5}
      />

      {/* Watercolor garden flowers */}
      <g opacity={0.9}>
        <circle cx={45} cy={310} r={4} fill="#FFFDF8" />
        <circle cx={45} cy={310} r={1.5} fill="#F4A261" />
        <circle cx={70} cy={340} r={5} fill="#FDE68A" />
        <circle cx={320} cy={315} r={4.5} fill="#FFFDF8" />
        <circle cx={320} cy={315} r={1.8} fill="#F4A261" />
        <circle cx={345} cy={350} r={5} fill="#FDE68A" />
        <circle cx={50} cy={420} r={4.5} fill="#FFFDF8" />
        <circle cx={330} cy={425} r={5} fill="#FDE68A" />
      </g>
    </g>
  );
}

function WatercolorCozyRoom() {
  return (
    <g data-part="watercolor-room" pointerEvents="none">
      <defs>
        <linearGradient id="wcWall1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F9F4EB" />
          <stop offset="100%" stopColor="#EFE5D3" />
        </linearGradient>
        <linearGradient id="wcWoodFloor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E6CBA8" />
          <stop offset="100%" stopColor="#D4B48A" />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="url(#wcWall1)" />

      {/* Warm sunbeam stream */}
      <polygon points="60,0 180,0 260,340 40,340" fill="#FFF3D6" className="lc-sunbeam" />

      {/* Sunny watercolor window with curtains */}
      <g transform="translate(195 40)" opacity={0.9}>
        <rect width={130} height={140} rx={4} fill="#DDF0F8" stroke="#D3BFA6" strokeWidth={2} />
        <path d="M65 0 v140 M0 70 h130" stroke="#D3BFA6" strokeWidth={2} />
        <path d="M0 0 C15 40 25 90 10 140 L0 140 Z" fill="#FCE7D6" opacity={0.85} />
        <path d="M130 0 C115 40 105 90 120 140 L130 140 Z" fill="#FCE7D6" opacity={0.85} />
        <path d="M-10 0 h150" stroke="#B89F82" strokeWidth={3} strokeLinecap="round" />
      </g>

      {/* Trailing plant on wall */}
      <g transform="translate(45 50)">
        <path d="M15 15 h24 l-3 16 h-18 z" fill="#D96B43" stroke="#B85D38" strokeWidth={1.5} />
        <g className="lc-plant-leaf">
          <path d="M18 31 c-4 12 3 24 -2 36" stroke="#609966" strokeWidth={2} fill="none" strokeLinecap="round" />
          <circle cx={14} cy={42} r={4} fill="#609966" />
          <circle cx={22} cy={54} r={4.5} fill="#609966" />
          <circle cx={16} cy={66} r={4} fill="#609966" />
        </g>
      </g>

      {/* Baseboard molding & Wood floor */}
      <rect x={0} y={300} width={SCENE_WIDTH} height={8} fill="#D4BFA6" stroke="#B89F82" strokeWidth={1} />
      <rect x={0} y={308} width={SCENE_WIDTH} height={SCENE_HEIGHT - 308} fill="url(#wcWoodFloor)" />

      {/* Parquet plank lines */}
      <path
        d="M30 340 h100 M220 340 h120 M80 390 h140 M280 390 h80 M30 440 h120 M200 440 h150"
        stroke="#B8976C"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.4}
      />
    </g>
  );
}

function WatercolorPlayfulHome() {
  return (
    <g data-part="watercolor-play-home" pointerEvents="none">
      <defs>
        <linearGradient id="wcWallSage" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EBF4EE" />
          <stop offset="100%" stopColor="#D9EADA" />
        </linearGradient>
        <linearGradient id="wcWoodWarm" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EBD3B0" />
          <stop offset="100%" stopColor="#DBBA8B" />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="url(#wcWallSage)" />

      {/* Floral wallpaper sprigs */}
      <g opacity={0.35} stroke="#609966" strokeWidth={1} fill="none">
        <path d="M40 50 c4 -4 8 0 8 4 c0 4 -4 6 -8 4 M40 50 v10" />
        <path d="M120 70 c4 -4 8 0 8 4 c0 4 -4 6 -8 4 M120 70 v10" />
        <path d="M260 50 c4 -4 8 0 8 4 c0 4 -4 6 -8 4 M260 50 v10" />
        <path d="M340 75 c4 -4 8 0 8 4 c0 4 -4 6 -8 4 M340 75 v10" />
        <path d="M60 140 c4 -4 8 0 8 4 c0 4 -4 6 -8 4 M60 140 v10" />
        <path d="M310 150 c4 -4 8 0 8 4 c0 4 -4 6 -8 4 M310 150 v10" />
      </g>

      {/* Wall bookshelf in soft watercolor */}
      <g transform="translate(190 50)" opacity={0.85}>
        <rect width={140} height={10} rx={2} fill="#C89D7C" />
        <rect x={15} y={-32} width={12} height={32} rx={1} fill="#E07A5F" />
        <rect x={30} y={-28} width={14} height={28} rx={1} fill="#5C93C4" />
        <rect x={47} y={-35} width={10} height={35} rx={1} fill="#F4A261" />
        <rect x={60} y={-30} width={13} height={30} rx={1} fill="#609966" />
        <path d="M95 -12 h16 l-2 12 h-12 z" fill="#D96B43" />
        <circle cx={103} cy={-16} r={6} fill="#609966" />
      </g>

      {/* Baseboard & Wood Floor */}
      <rect x={0} y={295} width={SCENE_WIDTH} height={8} fill="#D4BFA6" stroke="#B89F82" strokeWidth={1} />
      <rect x={0} y={303} width={SCENE_WIDTH} height={SCENE_HEIGHT - 303} fill="url(#wcWoodWarm)" />

      {/* Cozy woven area rug under cat cushion */}
      <ellipse cx={190} cy={375} rx={145} ry={55} fill="#FBEFE3" stroke="#E2CDB5" strokeWidth={2} opacity={0.9} />
      <ellipse cx={190} cy={375} rx={135} ry={48} fill="none" stroke="#E07A5F" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.6} />
    </g>
  );
}

function WatercolorFeastHome() {
  return (
    <g data-part="watercolor-feast-home" pointerEvents="none">
      <defs>
        <linearGradient id="wcGoldSun" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF9EB" />
          <stop offset="60%" stopColor="#FEF0D0" />
          <stop offset="100%" stopColor="#FCE4AE" />
        </linearGradient>
        <radialGradient id="feastGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="url(#wcGoldSun)" />

      {/* Radiant celebration glow */}
      <circle cx={190} cy={240} r={180} fill="url(#feastGlow)" className="lc-sunbeam" />

      {/* Celebratory floating sparkles */}
      <g opacity={0.85}>
        <path d="M60 70 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#F59E0B" />
        <path d="M320 60 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" fill="#F59E0B" />
        <path d="M80 160 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z" fill="#E07A5F" />
        <path d="M310 170 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#E07A5F" />
      </g>

      {/* Floor & Luxury Rug */}
      <rect x={0} y={300} width={SCENE_WIDTH} height={SCENE_HEIGHT - 300} fill="#F3DEB8" />
      <ellipse cx={190} cy={375} rx={155} ry={60} fill="#FFFDF8" stroke="#F4A261" strokeWidth={2.4} />
      <ellipse cx={190} cy={375} rx={142} ry={52} fill="#FEF3C7" opacity={0.6} />
    </g>
  );
}

// ==========================================
// 2. HAND-DRAWN CARTOON PLATFORMS & OBJECTS
// ==========================================

function CardboardBox({ isGarden = false }: { isGarden?: boolean }) {
  return (
    <g data-part="cardboard-box" transform="translate(190, 365)">
      <ellipse cx={0} cy={36} rx={105} ry={22} fill="rgba(43,35,31,0.18)" stroke="none" />

      {/* Box back wall */}
      <path
        d="M-82 12 L-68 -48 L68 -48 L82 12 Z"
        fill="#C89D6B"
        stroke={PROPS_INK}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />

      {/* Box front body */}
      <path
        d="M-92 28 L-82 -18 L82 -18 L92 28 C92 34 80 38 0 38 C-80 38 -92 34 -92 28 Z"
        fill="#DDB683"
        stroke={PROPS_INK}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />

      {/* Flaps */}
      <path d="M-82 -18 L-115 -28 L-105 4 L-88 12 Z" fill="#E8C394" stroke={PROPS_INK} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M82 -18 L115 -28 L105 4 L88 12 Z" fill="#E8C394" stroke={PROPS_INK} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M-72 -18 L-60 -3 L0 -3 L0 -18 Z" fill="#F0CE9F" stroke={PROPS_INK} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M72 -18 L60 -3 L0 -3 L0 -18 Z" fill="#E8C394" stroke={PROPS_INK} strokeWidth={2.2} strokeLinejoin="round" />

      {/* Tape */}
      <path d="M-86 10 L86 10" stroke="#FDE68A" strokeWidth={7} strokeLinecap="round" opacity={0.7} />

      {/* Stamp doodle */}
      <g transform="translate(-40, 14)" opacity={0.85}>
        <rect width={36} height={18} rx={2} fill="none" stroke="#B83B32" strokeWidth={1.4} strokeDasharray="3 2" />
        <text x={18} y={13} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#B83B32" style={{ fontFamily: 'Gochi Hand, cursive' }}>
          CAT ♡
        </text>
      </g>

      {isGarden && (
        <g stroke="#609966" strokeWidth={2} strokeLinecap="round" fill="none">
          <path d="M-102 32 c-4 -8 2 -14 0 -20 M-98 33 c2 -6 8 -10 6 -16" />
          <path d="M98 32 c4 -8 -2 -14 0 -20 M94 33 c-2 -6 -8 -10 -6 -16" />
        </g>
      )}
    </g>
  );
}

function PlushCushion() {
  return (
    <g data-part="plush-cushion" transform="translate(190, 368)">
      <ellipse cx={0} cy={34} rx={115} ry={24} fill="rgba(43,35,31,0.18)" stroke="none" />
      <path d="M-75 28 v8 M75 28 v8 M-35 32 v7 M35 32 v7" stroke={PROPS_INK} strokeWidth={3.5} strokeLinecap="round" />
      <ellipse cx={0} cy={16} rx={110} ry={32} fill="#E07A5F" stroke={PROPS_INK} strokeWidth={2.6} />
      <ellipse cx={0} cy={10} rx={92} ry={24} fill="#FFFDF8" stroke={PROPS_INK} strokeWidth={2.2} />
      <g stroke="#D96B43" strokeWidth={1.8} opacity={0.65} fill="none">
        <path d="M-55 8 l14 10 M-20 6 l14 12 M15 6 l14 12 M50 8 l14 10" />
      </g>
    </g>
  );
}

function HandDrawnToy() {
  return (
    <g data-part="hand-drawn-toy" transform="translate(115, 385)">
      <circle r={12} fill="#E76F51" stroke={PROPS_INK} strokeWidth={2.2} />
      <path d="M-7 -4 c4-3 11-3 15 1 M-8 2 c6-3 12-2 16 2" stroke="#FFFDF8" strokeWidth={1.6} fill="none" />
      <path d="M8 7 c6 5 4 12 -2 15" stroke="#E76F51" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <circle cx={-10} cy={12} r={3.5} fill="#F7D060" stroke={PROPS_INK} strokeWidth={1.2} />
    </g>
  );
}

function HandDrawnFoodBowl() {
  return (
    <g data-part="hand-drawn-food-bowl" transform="translate(255, 385)">
      <ellipse cx={0} cy={16} rx={28} ry={7} fill="rgba(43,35,31,0.2)" stroke="none" />
      <path d="M-26 -6 h52 c-1 14 -8 24 -26 25 c-18 -1 -25 -11 -26 -25 z" fill="#5C93C4" stroke={PROPS_INK} strokeWidth={2.4} strokeLinejoin="round" />
      <ellipse cx={0} cy={-6} rx={26} ry={7} fill="#FFFDF8" stroke={PROPS_INK} strokeWidth={2.2} />
      <path d="M-18 -8 l4 -5 4 5 4 -5 4 5 4 -5 4 5 4 -5 4 5" fill="#F4A261" stroke={PROPS_INK} strokeWidth={1.6} />
      <path d="M-4 6 l5 -3 v6 l-5 -3 z M1 6 h4" stroke="#FFFDF8" strokeWidth={1.4} strokeLinecap="round" fill="none" />
    </g>
  );
}

// ==========================================
// 3. MAIN STORY-DRIVEN VERTICAL CAT SCENE
// ==========================================

export interface CatSceneProps {
  catId: CatId;
  state: CatState;
  phaseRatio: number;
  createdAtISO?: string;
  deadlineISO?: string;
  seed: number;
  speed?: number;
  paused?: boolean;
  reduced?: boolean;
  showMarkers?: boolean;
  className?: string;
  livingRef?: React.Ref<LivingCatHandle>;
  onSceneEvent?: (event: string) => void;
}

export function CatScene({
  catId,
  state,
  phaseRatio,
  createdAtISO,
  deadlineISO,
  seed,
  speed = 1,
  paused = false,
  reduced = false,
  showMarkers = true,
  className,
  livingRef,
  onSceneEvent,
}: CatSceneProps) {
  const [catDisplay, setCatDisplay] = useState<CatState>(state);

  useEffect(() => setCatDisplay(state), [state]);
  useEffect(() => injectLivingStyle(), []);

  const onEvent = useCallback(
    (event: string) => {
      if (event.startsWith('display:')) {
        setCatDisplay(event.slice(8) as CatState);
      }
      onSceneEvent?.(event);
    },
    [onSceneEvent],
  );

  const stage = getLifeStage(phaseRatio);
  const isFinished = state === 'SUCCESS' || state === 'SATISFIED';
  const effectiveStage = isFinished ? 5 : stage;

  return (
    <svg
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      width="100%"
      className={`purrpurpose-scene ${className ?? ''}`.trim()}
      role="img"
      aria-label={`Cat story scene: ${catId} cat, stage ${effectiveStage}, state ${catDisplay.toLowerCase()}`}
      data-scene-state={catDisplay}
      data-life-stage={effectiveStage}
      style={{
        borderRadius: 'var(--radius-sketch-a)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        border: '2.5px solid var(--ink)',
      }}
    >
      {/* 1. WATERCOLOR BACKGROUND */}
      <g className="watercolor-layer">
        {effectiveStage === 1 && <WatercolorStreet />}
        {effectiveStage === 2 && <WatercolorGarden />}
        {effectiveStage === 3 && <WatercolorCozyRoom />}
        {effectiveStage === 4 && <WatercolorPlayfulHome />}
        {effectiveStage === 5 && <WatercolorFeastHome />}
      </g>

      {/* 2. HAND-DRAWN LIFE PLATFORM */}
      <g className="platform-layer">
        {effectiveStage <= 2 ? (
          <CardboardBox isGarden={effectiveStage === 2} />
        ) : (
          <PlushCushion />
        )}
      </g>

      {/* 3. CAT (Large, front-facing visual hero in center) */}
      <g transform="translate(190, 345) scale(1.15)">
        {reduced ? (
          <>
            <Cat catId={catId} state={state} size={250} />
            {catDisplay === 'SLEEPING' && (
              <text x={20} y={-110} fontSize={22} fill="#5C93C4" style={{ fontFamily: 'Gochi Hand, cursive', fontWeight: 'bold' }}>
                zzz
              </text>
            )}
          </>
        ) : (
          <LivingCat
            catId={catId}
            state={state}
            seed={seed}
            homeX={190}
            speed={speed}
            paused={paused}
            reduced={reduced}
            onEvent={onEvent}
            ref={livingRef}
          />
        )}
      </g>

      {/* 4. FOREGROUND HAND-DRAWN OBJECTS */}
      <g className="objects-layer">
        {effectiveStage >= 4 && <HandDrawnToy />}
        {effectiveStage >= 5 && <HandDrawnFoodBowl />}
      </g>

      {/* 5. EMOTIONAL STATUS OVERLAYS */}
      {!reduced && catDisplay === 'SLEEPING' && (
        <g transform="translate(230, 210)">
          <text x={0} y={0} fontSize={20} fill="#5C93C4" style={{ fontFamily: 'Gochi Hand, cursive', fontWeight: 'bold' }} className="lc-zzz">
            z
          </text>
          <text x={12} y={-10} fontSize={24} fill="#5C93C4" style={{ fontFamily: 'Gochi Hand, cursive', fontWeight: 'bold' }} className="lc-zzz">
            z
          </text>
          <text x={24} y={-22} fontSize={28} fill="#5C93C4" style={{ fontFamily: 'Gochi Hand, cursive', fontWeight: 'bold' }} className="lc-zzz">
            z
          </text>
        </g>
      )}

      {!reduced && (catDisplay === 'SATISFIED' || isFinished) && (
        <g opacity={0.95}>
          <text x={80} y={230} fontSize={26} fill="#E76F51" style={{ fontFamily: 'Gochi Hand, cursive' }} className="lc-zzz">
            ♪
          </text>
          <text x={290} y={220} fontSize={24} fill="#F4A261" style={{ fontFamily: 'Gochi Hand, cursive' }} className="lc-zzz">
            ♫
          </text>
        </g>
      )}

      {/* 6. LIFE PROGRESSION BADGE PILL */}
      <g transform="translate(24, 24)" pointerEvents="none">
        <rect
          x={0}
          y={0}
          rx={12}
          ry={12}
          width={effectiveStage === 1 ? 140 : effectiveStage === 2 ? 150 : effectiveStage === 3 ? 155 : effectiveStage === 4 ? 160 : 170}
          height={26}
          fill="#FFFDF8"
          stroke={PROPS_INK}
          strokeWidth={1.8}
        />
        <text
          x={12}
          y={17}
          fontSize={12}
          fontWeight="bold"
          fill={PROPS_INK}
          style={{ fontFamily: 'Gochi Hand, cursive', letterSpacing: '0.4px' }}
        >
          {effectiveStage === 1 && 'STAGE 1: STREET BOX'}
          {effectiveStage === 2 && 'STAGE 2: GARDEN BOX'}
          {effectiveStage === 3 && 'STAGE 3: COZY CUSHION'}
          {effectiveStage === 4 && 'STAGE 4: PLAYFUL HOME'}
          {effectiveStage === 5 && 'STAGE 5: FEAST UNLOCKED!'}
        </text>
      </g>
    </svg>
  );
}