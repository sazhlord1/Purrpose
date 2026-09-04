import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import type { CatId } from '@purrpose/shared';
import { LivingCat, type LivingCatHandle } from './LivingCat.js';
import { Cat } from './Cat.js';
import { getLifeStage, SCENE_HEIGHT, SCENE_WIDTH } from './anchors.js';
import { injectLivingStyle } from './livingCss.js';
import type { CatState } from './poses.js';

const INK = '#26201D';

// ============================================================================
// 1. REBUILT 5 JOURNEY LOCATION ENVIRONMENTS (Matching Reference Artwork)
// ============================================================================

/** Stage 1: SIDEWALK (BOX) */
function SceneSidewalk() {
  return (
    <g data-part="scene-sidewalk" pointerEvents="none">
      {/* Brick Wall Background */}
      <rect x={0} y={0} width={SCENE_WIDTH} height={310} fill="#D7C2AD" />
      <g stroke="#C2AC96" strokeWidth={1.8}>
        <line x1={0} y1={65} x2={SCENE_WIDTH} y2={65} />
        <line x1={0} y1={140} x2={SCENE_WIDTH} y2={140} />
        <line x1={0} y1={215} x2={SCENE_WIDTH} y2={215} />
        <line x1={0} y1={290} x2={SCENE_WIDTH} y2={290} />
        <line x1={65} y1={0} x2={65} y2={65} /><line x1={190} y1={0} x2={190} y2={65} /><line x1={315} y1={0} x2={315} y2={65} />
        <line x1={125} y1={65} x2={125} y2={140} /><line x1={250} y1={65} x2={250} y2={140} />
        <line x1={65} y1={140} x2={65} y2={215} /><line x1={190} y1={140} x2={190} y2={215} /><line x1={315} y1={140} x2={315} y2={215} />
        <line x1={125} y1={215} x2={125} y2={290} /><line x1={250} y1={215} x2={250} y2={290} />
      </g>

      {/* Sidewalk Pavement */}
      <rect x={0} y={310} width={SCENE_WIDTH} height={SCENE_HEIGHT - 310} fill="#C5B9AA" stroke={INK} strokeWidth={2.8} />
      <line x1={0} y1={360} x2={SCENE_WIDTH} y2={360} stroke={INK} strokeWidth={2} />
      <line x1={100} y1={360} x2={75} y2={SCENE_HEIGHT} stroke={INK} strokeWidth={2} />
      <line x1={290} y1={360} x2={265} y2={SCENE_HEIGHT} stroke={INK} strokeWidth={2} />

      {/* Street Lamp on Left */}
      <g stroke={INK} strokeWidth={2.8} fill="#4A4542">
        <rect x={24} y={0} width={12} height={300} />
        <ellipse cx={30} cy={300} rx={16} ry={6} />
        <path d="M12 310 L48 310 L44 300 L16 300 Z" />
        <ellipse cx={30} cy={120} rx={9} ry={5} fill="#383431" />
      </g>

      {/* Green Bush on Right */}
      <g stroke={INK} strokeWidth={2.6} fill="#8D9F80">
        <path d="M285 310 C275 250 300 200 335 210 C355 185 380 205 380 250 L380 310 Z" />
      </g>

      {/* Fallen leaves on sidewalk */}
      <g stroke={INK} strokeWidth={1.5} fill="#758B65">
        <path d="M50 395 c6 -5 12 0 10 5 c-2 5 -10 2 -10 -5 z" />
        <path d="M295 410 c6 -4 11 2 8 6 c-4 4 -9 0 -8 -6 z" />
      </g>

      {/* Box Ground Shadow & Back Interior */}
      <ellipse cx={190} cy={355} rx={95} ry={12} fill="rgba(38,32,29,0.22)" />
      <polygon points="105,270 275,270 295,345 85,345" fill="#A47C4E" stroke={INK} strokeWidth={2.8} />
    </g>
  );
}

/** Stage 2: YARD (GRASS) */
function SceneYard() {
  return (
    <g data-part="scene-yard" pointerEvents="none">
      {/* Sky */}
      <rect x={0} y={0} width={SCENE_WIDTH} height={200} fill="#DEE5D4" />
      {/* Cloud */}
      <path d="M245 80 C252 62 276 62 285 78 C294 72 308 80 306 90 C314 95 311 108 301 110 L248 110 C238 110 235 98 245 90 Z" fill="#FFFDF9" opacity="0.95" />

      {/* Wooden Picket Fence */}
      <g stroke={INK} strokeWidth={2.4} fill="#E7D7C1">
        <rect x={0} y={130} width={SCENE_WIDTH} height={18} fill="#D9C5AD" />
        {Array.from({ length: 19 }).map((_, i) => (
          <path key={i} d={`M${i * 20 + 2} 150 L${i * 20 + 2} 90 L${i * 20 + 11} 78 L${i * 20 + 20} 90 L${i * 20 + 20} 150 Z`} />
        ))}
      </g>

      {/* Natural Tree on Left with Lush Canopy cropped at top */}
      <g stroke={INK} strokeWidth={2.8} strokeLinejoin="round">
        <path d="M15 260 L38 260 L38 95 C52 90 92 88 115 98 C115 108 88 112 44 118 L44 260 L15 260 Z" fill="#8A6642" />
        <path d="M-10 -30 L195 -30 C208 15 190 60 162 78 C138 95 95 95 62 80 C28 88 -10 65 -10 10 Z" fill="#758B65" />
      </g>

      {/* Green Grass Lawn */}
      <rect x={0} y={160} width={SCENE_WIDTH} height={SCENE_HEIGHT - 160} fill="#8FA37E" stroke={INK} strokeWidth={2.8} />

      {/* Background Shrubs */}
      <path d="M0 175 C20 145 55 158 75 175 Z" fill="#6F825F" stroke={INK} strokeWidth={2.4} />
      <path d="M285 190 C305 155 355 155 380 190 Z" fill="#6F825F" stroke={INK} strokeWidth={2.4} />

      {/* Daisies & Grass Tufts */}
      <g stroke={INK} strokeWidth={2} strokeLinecap="round">
        <path d="M55 270 l-4 -10 M55 270 l0 -12 M55 270 l4 -10" />
        <path d="M125 240 l-4 -10 M125 240 l0 -12 M125 240 l4 -10" />
        <path d="M255 240 l-4 -10 M255 240 l0 -12 M255 240 l4 -10" />
        <path d="M325 280 l-4 -10 M325 280 l0 -12 M325 280 l4 -10" />
        <path d="M60 410 l-4 -10 M60 410 l0 -12 M60 410 l4 -10" />
        <path d="M305 415 l-4 -10 M305 415 l0 -12 M305 415 l4 -10" />
      </g>
      <g>
        <circle cx={95} cy={270} r={5} fill="#FFFDF9" stroke={INK} strokeWidth={1.8} />
        <circle cx={95} cy={270} r={2} fill="#F59E0B" />
        <circle cx={285} cy={270} r={5} fill="#FFFDF9" stroke={INK} strokeWidth={1.8} />
        <circle cx={285} cy={270} r={2} fill="#F59E0B" />
        <circle cx={275} cy={395} r={5} fill="#FFFDF9" stroke={INK} strokeWidth={1.8} />
        <circle cx={275} cy={395} r={2} fill="#F59E0B" />
      </g>
    </g>
  );
}

/** Stage 3: INDOOR (CUSHION) */
function SceneIndoor() {
  return (
    <g data-part="scene-indoor" pointerEvents="none">
      {/* Light Beige Wall */}
      <rect x={0} y={0} width={SCENE_WIDTH} height={310} fill="#EFEAE0" />

      {/* Hardwood Floorboards */}
      <rect x={0} y={310} width={SCENE_WIDTH} height={SCENE_HEIGHT - 310} fill="#CDB393" stroke={INK} strokeWidth={2.8} />
      <line x1={0} y1={385} x2={SCENE_WIDTH} y2={385} stroke={INK} strokeWidth={2.2} />
      <line x1={115} y1={310} x2={85} y2={SCENE_HEIGHT} stroke={INK} strokeWidth={1.8} />
      <line x1={275} y1={310} x2={245} y2={SCENE_HEIGHT} stroke={INK} strokeWidth={1.8} />

      {/* Framed Wall Art on Right */}
      <g stroke={INK} strokeWidth={2.4}>
        <rect x={300} y={75} width={55} height={70} fill="#FDFBF7" rx="3" />
        <path d="M300 120 Q325 108 355 116 L355 145 L300 145 Z" fill="#C5B59D" />
        <circle cx="325" cy="96" r="6.5" fill="#D97706" />
      </g>

      {/* Potted Ficus Plant on Left */}
      <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
        <line x1={54} y1={80} x2={54} y2={235} strokeWidth={3.5} />
        <path d="M54 80 C44 45 64 45 54 80 Z" fill="#5E7A5E" />
        <path d="M54 125 C26 95 32 130 54 140 Z" fill="#6F8D6F" />
        <path d="M54 125 C82 95 76 130 54 140 Z" fill="#6F8D6F" />
        <path d="M54 175 C20 150 25 190 54 200 Z" fill="#5E7A5E" />
        <path d="M54 175 C88 150 83 190 54 200 Z" fill="#5E7A5E" />
        {/* Pot */}
        <polygon points="38,235 70,235 64,300 44,300" fill="#A67C52" />
        <rect x="34" y="228" width="40" height="9" rx="2" fill="#BA8D60" />
      </g>
    </g>
  );
}

/** Stage 4: SCRATCHER (PLAY) */
function SceneScratcher() {
  return (
    <g data-part="scene-scratcher" pointerEvents="none">
      {/* Wall & Floor */}
      <rect x={0} y={0} width={SCENE_WIDTH} height={310} fill="#EFE9DF" />
      <rect x={0} y={310} width={SCENE_WIDTH} height={SCENE_HEIGHT - 310} fill="#CEB79B" stroke={INK} strokeWidth={2.8} />

      {/* Cat Tree Scratching Post */}
      <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
        <rect x={60} y={380} width={105} height="20" rx="3" fill="#B38E65" />
        <rect x={98} y={260} width={30} height="120" fill="#C2AA7D" />
        <g stroke="#A89065" strokeWidth={2}>
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={i} x1={98} y1={268 + i * 7.5} x2={128} y2={268 + i * 7.5} />
          ))}
        </g>
        <rect x={50} y={248} width={125} height="14" rx="3" fill="#A8835B" />
        {/* Hanging Jingle Ball */}
        <line x1={155} y1={262} x2={155} y2={295} strokeWidth={2} />
        <circle cx={155} cy={302} r={8} fill="#E89D8E" />
      </g>

      {/* Floor Toys on Right */}
      <g stroke={INK} strokeWidth={2.2} strokeLinejoin="round">
        <circle cx={220} cy={400} r={12} fill="#C2714F" />
        <path d="M211 396 C220 393 226 407 229 400" fill="none" stroke="#E29578" strokeWidth={1.8} />
        <g transform="translate(260, 402)">
          <path d="M0 0 C10 -8 26 -5 32 0 C26 5 10 8 0 0 Z" fill="#7E9671" />
          <polygon points="32,0 40,-6 40,6" fill="#7E9671" />
          <circle cx="7" cy="-1" r="1.5" fill="#26201D" />
        </g>
      </g>
    </g>
  );
}

/** Stage 5: COUCH (MEAL) */
function SceneCouch() {
  return (
    <g data-part="scene-couch" pointerEvents="none">
      {/* Wall & Floor */}
      <rect x={0} y={0} width={SCENE_WIDTH} height={310} fill="#EAE3D5" />
      <rect x={0} y={310} width={SCENE_WIDTH} height={SCENE_HEIGHT - 310} fill="#C9B190" stroke={INK} strokeWidth={2.8} />

      {/* Picture Frames High on Wall */}
      <g stroke={INK} strokeWidth={2.4} fill="#FDFBF7">
        <rect x={125} y={35} width={42} height="50" rx="2" />
        <path d="M146 50 c-5 8 0 18 0 24 M146 58 c-4 -4 -8 0 -4 4 M146 64 c4 -4 8 0 4 4" stroke="#748C6B" strokeWidth={2} fill="none" />
        <rect x={265} y={42} width={48} height="40" rx="2" />
        <line x1="272" y1="65" x2="302" y2="56" stroke="#B89F82" strokeWidth={2} />
      </g>

      {/* Sage Green Sofa */}
      <g stroke={INK} strokeWidth={3} strokeLinejoin="round">
        <rect x={75} y={140} width={230} height="135" rx="22" fill="#849674" />
        <line x1={190} y1={140} x2={190} y2={275} stroke={INK} strokeWidth={2.4} />
        <rect x={50} y={195} width={38} height="85" rx="14" fill="#758765" />
        <rect x={292} y={195} width={38} height="85" rx="14" fill="#758765" />
        <rect x={64} y={235} width={252} height="50" rx="12" fill="#7D906D" />
        <polygon points="85,285 92,285 88,310 81,310" fill="#5C3E24" />
        <polygon points="288,285 295,285 299,310 292,310" fill="#5C3E24" />
        <rect x={86} y={205} width={45} height="45" rx="10" transform="rotate(-8 108 227)" fill="#E8BA64" stroke={INK} strokeWidth={2.5} />
      </g>

      {/* Coffee Table in Foreground */}
      <g stroke={INK} strokeWidth={2.8} strokeLinejoin="round">
        <ellipse cx={190} cy={425} rx={105} ry={9} fill="rgba(38,32,29,0.2)" stroke="none" />
        <rect x={95} y={345} width={11} height="50" fill="#6E4A28" />
        <rect x={274} y={345} width={11} height="50" fill="#6E4A28" />
        <rect x={80} y={332} width={220} height="22" rx="4" fill="#8F6843" />
        {/* Food Bowl with Kibble */}
        <path d="M115 332 C115 315 155 315 155 332 Z" fill="#F4EEE4" />
        <ellipse cx={135} cy={318} rx={14} ry={6} fill="#5E4228" />
        {/* Cat Food Can */}
        <rect x={225} y={306} width={30} height="26" rx="3" fill="#9C7CA5" />
        <ellipse cx={240} cy={306} rx={15} ry={4} fill="#C5ADC9" />
        <rect x={229} y={315} width={22} height="14" fill="#FFFDF9" />
        <path d="M236 321 l3 -4 l3 4 l3 -4 l3 4 v4 h-12 z" fill="#9C7CA5" stroke="none" />
      </g>
    </g>
  );
}

// ============================================================================
// 2. STAGE PLATFORMS (Front Cardboard Box Layer & Cushions)
// ============================================================================

function CardboardBoxFront() {
  return (
    <g data-part="cardboard-box-front" transform="translate(190, 310)">
      {/* Front Panel & Flaps overlapping cat paws */}
      <g stroke={INK} strokeWidth={2.8} strokeLinejoin="round">
        <polygon points="-110,-20 110,-20 95,45 -95,45" fill="#C89F6E" />
        <polygon points="-145,-15 -110,-20 -95,45 -130,50" fill="#B58D5D" />
        <polygon points="-145,-15 -110,-20 -130,-55 -168,-45" fill="#DDB483" />
        <polygon points="110,-20 95,45 145,15 155,-50" fill="#C89F6E" />
        <polygon points="-110,-20 110,-20 120,0 -120,0" fill="#DDB483" />
      </g>
    </g>
  );
}

function CushionPlatform({ stage }: { stage: number }) {
  if (stage === 3) {
    return (
      <g data-part="cushion-stage3" transform="translate(190, 345)">
        <ellipse cx={0} cy={22} rx={78} ry={16} fill="rgba(38,32,29,0.22)" stroke="none" />
        <ellipse cx={0} cy={10} rx={74} ry={24} fill="#E89D8E" stroke={INK} strokeWidth={2.8} />
        <ellipse cx={0} cy={5} rx={58} ry={16} fill="#F4B5A8" stroke={INK} strokeWidth={2.2} />
        <g stroke="#D07C6D" strokeWidth={2} strokeLinecap="round" fill="none">
          <path d="M-40 5 C-25 10 -10 12 0 12" /><path d="M40 5 C25 10 10 12 0 12" />
        </g>
      </g>
    );
  }
  return null;
}

// ============================================================================
// 3. MAIN CAT SCENE COMPONENT
// ============================================================================

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
  useEffect(() => {
    injectLivingStyle();
  }, []);

  const [catDisplay, setCatDisplay] = useState<CatState>(state);
  const [effectiveStage, setEffectiveStage] = useState<number>(() =>
    state === 'SUCCESS' || state === 'FAILURE' ? 5 : getLifeStage(phaseRatio)
  );

  useEffect(() => {
    setCatDisplay(state);
    setEffectiveStage(state === 'SUCCESS' || state === 'FAILURE' ? 5 : getLifeStage(phaseRatio));
  }, [state, phaseRatio]);

  const onEvent = useCallback(
    (event: string) => {
      onSceneEvent?.(event);
    },
    [onSceneEvent]
  );

  const isFinished = state === 'SUCCESS' || state === 'FAILURE';

  // Y anchor and scale per stage
  const catScale = effectiveStage === 1 ? 0.95 : effectiveStage === 4 ? 0.85 : effectiveStage === 5 ? 0.88 : 0.98;
  const catY = effectiveStage === 1 ? 340 : effectiveStage === 3 ? 345 : effectiveStage === 4 ? 248 : effectiveStage === 5 ? 235 : 345;
  const catX = effectiveStage === 4 ? 112 : 190;

  return (
    <svg
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      width="100%"
      className={`purrpose-scene ${className ?? ''}`.trim()}
      role="img"
      aria-label={`Cat life scene for ${catId} — stage ${effectiveStage} of 5`}
      data-scene-stage={effectiveStage}
      data-scene-state={catDisplay}
      data-state={catDisplay}
      style={{
        borderRadius: 'var(--radius-sketch-a)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        border: '2.5px solid var(--ink)',
      }}
    >
      {/* 1. REBUILT BACKGROUND ENVIRONMENT */}
      <g className="background-layer">
        {effectiveStage === 1 && <SceneSidewalk />}
        {effectiveStage === 2 && <SceneYard />}
        {effectiveStage === 3 && <SceneIndoor />}
        {effectiveStage === 4 && <SceneScratcher />}
        {effectiveStage === 5 && <SceneCouch />}
      </g>

      {/* 2. PLATFORMS UNDER CAT (Stage 3 Cushion) */}
      <CushionPlatform stage={effectiveStage} />

      {/* 3. HERO CAT */}
      <g transform={`translate(${catX}, ${catY}) scale(${catScale})`}>
        {reduced ? (
          <g transform="translate(-120, -254)">
            <Cat catId={catId} state={state} size={240} showGround={effectiveStage !== 1 && effectiveStage !== 3} />
          </g>
        ) : (
          <LivingCat
            catId={catId}
            state={state}
            seed={seed}
            homeX={0}
            speed={speed}
            paused={paused}
            reduced={reduced}
            onEvent={onEvent}
            ref={livingRef}
          />
        )}
      </g>

      {/* 4. FOREGROUND PLATFORM OVERLAYS (Stage 1 Box Front Flaps) */}
      {effectiveStage === 1 && <CardboardBoxFront />}

      {/* 5. EMOTIONAL STATUS OVERLAYS */}
      {!reduced && catDisplay === 'SLEEPING' && (
        <g transform="translate(240, 190)">
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
          <text x={80} y={200} fontSize={26} fill="#E76F51" style={{ fontFamily: 'Gochi Hand, cursive' }} className="lc-zzz">
            ♪
          </text>
          <text x={290} y={190} fontSize={24} fill="#F4A261" style={{ fontFamily: 'Gochi Hand, cursive' }} className="lc-zzz">
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
          stroke={INK}
          strokeWidth={1.8}
        />
        <text
          x={12}
          y={17}
          fontSize={12}
          fontWeight="bold"
          fill={effectiveStage === 5 ? '#16A34A' : INK}
          style={{ fontFamily: 'Gochi Hand, cursive', letterSpacing: '0.3px' }}
        >
          {effectiveStage === 1 && '📦 STAGE 1: THE BOX'}
          {effectiveStage === 2 && '🌿 STAGE 2: THE YARD'}
          {effectiveStage === 3 && '🛋️ STAGE 3: COZY ROOM'}
          {effectiveStage === 4 && '🏰 STAGE 4: CAT TREE'}
          {effectiveStage === 5 && '👑 STAGE 5: GRAND FEAST'}
        </text>
      </g>
    </svg>
  );
}
