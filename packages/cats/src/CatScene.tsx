import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CatId, ItemId, Loadout } from '@purrpose/shared';
import { LivingCat, quirkFor, type LivingCatHandle, type LivingItems } from './LivingCat.js';
import { IconGlyph } from './icons.js';
import { useTextWidth } from './textFit.js';
import { useGazeFollow } from './gaze.js';
import {
  AquariumArt,
  BallArt,
  BedBack,
  BedFront,
  BlanketArt,
  BowlArt,
  ClockArt,
  ITEM_CSS,
  ItemArt,
  MouseArt,
  PaintingArt,
  PlantArt,
  ScratchPostArt,
  YarnArt,
} from './items.js';
import { Cat } from './Cat.js';
import { dayPeriod, getLifeStage, stageInfo, SCENE_HEIGHT, SCENE_WIDTH, type DayPeriod } from './stages.js';
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
function SceneIndoor({ hidePlant = false, hideArt = false }: { hidePlant?: boolean; hideArt?: boolean }) {
  return (
    <g data-part="scene-indoor" pointerEvents="none">
      {/* Light Beige Wall */}
      <rect x={0} y={0} width={SCENE_WIDTH} height={310} fill="#EFEAE0" />

      {/* Hardwood Floorboards */}
      <rect x={0} y={310} width={SCENE_WIDTH} height={SCENE_HEIGHT - 310} fill="#CDB393" stroke={INK} strokeWidth={2.8} />
      <line x1={0} y1={385} x2={SCENE_WIDTH} y2={385} stroke={INK} strokeWidth={2.2} />
      <line x1={115} y1={310} x2={85} y2={SCENE_HEIGHT} stroke={INK} strokeWidth={1.8} />
      <line x1={275} y1={310} x2={245} y2={SCENE_HEIGHT} stroke={INK} strokeWidth={1.8} />

      {/* Framed Wall Art on Right (replaced by a bought painting) */}
      {!hideArt && (
        <g stroke={INK} strokeWidth={2.4}>
          <rect x={300} y={75} width={55} height={70} fill="#FDFBF7" rx="3" />
          <path d="M300 120 Q325 108 355 116 L355 145 L300 145 Z" fill="#C5B59D" />
          <circle cx="325" cy="96" r="6.5" fill="#D97706" />
        </g>
      )}

      {/* Potted Ficus Plant on Left (replaced by a bought plant) */}
      {!hidePlant && <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
        <line x1={54} y1={80} x2={54} y2={235} strokeWidth={3.5} />
        <path d="M54 80 C44 45 64 45 54 80 Z" fill="#5E7A5E" />
        <path d="M54 125 C26 95 32 130 54 140 Z" fill="#6F8D6F" />
        <path d="M54 125 C82 95 76 130 54 140 Z" fill="#6F8D6F" />
        <path d="M54 175 C20 150 25 190 54 200 Z" fill="#5E7A5E" />
        <path d="M54 175 C88 150 83 190 54 200 Z" fill="#5E7A5E" />
        {/* Pot */}
        <polygon points="38,235 70,235 64,300 44,300" fill="#A67C52" />
        <rect x="34" y="228" width="40" height="9" rx="2" fill="#BA8D60" />
      </g>}
    </g>
  );
}

/** Stage 4: SCRATCHER (PLAY). The cat sits on the floor right of the tree and scratches its trunk. */
function SceneScratcher({ hideTree = false }: { hideTree?: boolean }) {
  return (
    <g data-part="scene-scratcher" pointerEvents="none">
      {/* Wall & Floor */}
      <rect x={0} y={0} width={SCENE_WIDTH} height={310} fill="#EFE9DF" />
      <rect x={0} y={310} width={SCENE_WIDTH} height={SCENE_HEIGHT - 310} fill="#CEB79B" stroke={INK} strokeWidth={2.8} />

      {/* Cat Tree Scratching Post (a bought post takes its place — one scratcher per room) */}
      {!hideTree && <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
        <rect x={60} y={380} width={105} height="20" rx="3" fill="#B38E65" />
        <rect x={98} y={260} width={30} height="120" fill="#C2AA7D" />
        <g stroke="#A89065" strokeWidth={2}>
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={i} x1={98} y1={268 + i * 7.5} x2={128} y2={268 + i * 7.5} />
          ))}
        </g>
        <rect x={50} y={248} width={125} height="14" rx="3" fill="#A8835B" />
      </g>}
    </g>
  );
}

/** Stage 5: COUCH (MEAL) */
function SceneCouch({ hideFrame = false }: { hideFrame?: boolean }) {
  return (
    <g data-part="scene-couch" pointerEvents="none">
      {/* Wall & Floor */}
      <rect x={0} y={0} width={SCENE_WIDTH} height={310} fill="#EAE3D5" />
      <rect x={0} y={310} width={SCENE_WIDTH} height={SCENE_HEIGHT - 310} fill="#C9B190" stroke={INK} strokeWidth={2.8} />

      {/* Picture Frames High on Wall */}
      <g stroke={INK} strokeWidth={2.4} fill="#FDFBF7">
        <rect x={125} y={35} width={42} height="50" rx="2" />
        <path d="M146 50 c-5 8 0 18 0 24 M146 58 c-4 -4 -8 0 -4 4 M146 64 c4 -4 8 0 4 4" stroke="#748C6B" strokeWidth={2} fill="none" />
        {!hideFrame && <rect x={265} y={42} width={48} height="40" rx="2" />}
        {!hideFrame && <line x1="272" y1="65" x2="302" y2="56" stroke="#B89F82" strokeWidth={2} />}
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
        {/* (The food bowl on the table is drawn with the items layer.) */}
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
// 3. SHOP ITEMS IN THE SCENE
// ============================================================================

interface Pt {
  x: number;
  y: number;
}

/** Where the cat sits in each stage (scene units, floor contact) and how big it is drawn. */
const CAT_AT: Record<number, Pt & { s: number }> = {
  1: { x: 190, y: 340, s: 0.95 },
  2: { x: 190, y: 345, s: 0.98 },
  3: { x: 190, y: 345, s: 0.98 },
  4: { x: 187, y: 425, s: 0.9 },
  5: { x: 190, y: 235, s: 0.88 },
};

/**
 * Where each item stands in each stage (scene units, the point where it
 * touches the floor or hangs on the wall). The cat never walks anywhere, so
 * everything it uses sits within reach of where it already is:
 *  - toys lie by its right paw when it sits at floor level (stages 2–4);
 *    in the box (1) and on the sofa (5) they just lie on the floor;
 *  - the scratcher stands at its left, close enough to rake with a paw (3–4);
 *  - the bowl is on the floor to its right (on the table in stage 5), and the
 *    cat looks down at it;
 *  - bed and blanket go under the cat; plant, fish tank, painting and clock
 *    are background, from stage 3 (before that the cat lives outside).
 */
interface StageLayout {
  bowl: Pt;
  /** Fixed spot for a toy the cat can't reach from where it sits. */
  toyRest?: Pt;
  bed?: Pt & { s: number };
  post?: Pt;
  /** The post is right at the cat's side (it can scratch it without moving). */
  postInReach?: boolean;
  blanket?: Pt & { w: number };
  plant?: Pt & { s: number };
  aquarium?: Pt;
  painting?: Pt;
  clock?: Pt;
}

const ITEM_LAYOUT: Record<number, StageLayout> = {
  1: { bowl: { x: 296, y: 448 }, toyRest: { x: 258, y: 456 } },
  2: { bowl: { x: 318, y: 430 } },
  3: {
    bowl: { x: 320, y: 440 },
    bed: { x: 190, y: 362, s: 1.5 },
    post: { x: 116, y: 372 },
    postInReach: true,
    blanket: { x: 190, y: 390, w: 1.3 },
    plant: { x: 40, y: 304, s: 0.7 },
    aquarium: { x: 322, y: 316 },
    painting: { x: 327, y: 146 },
    clock: { x: 250, y: 108 },
  },
  4: {
    bowl: { x: 322, y: 454 },
    bed: { x: 187, y: 442, s: 1.3 },
    post: { x: 113, y: 412 },
    postInReach: true,
    blanket: { x: 187, y: 458, w: 1.1 },
    plant: { x: 32, y: 312, s: 0.6 },
    aquarium: { x: 300, y: 308 },
    painting: { x: 236, y: 150 },
    clock: { x: 336, y: 118 },
  },
  5: {
    bowl: { x: 135, y: 334 },
    toyRest: { x: 238, y: 448 },
    bed: { x: 190, y: 262, s: 1.2 },
    post: { x: 36, y: 458 },
    blanket: { x: 190, y: 258, w: 1 },
    plant: { x: 330, y: 314, s: 0.6 },
    aquarium: { x: 328, y: 458 },
    painting: { x: 289, y: 112 },
    clock: { x: 46, y: 140 },
  },
};

/** Where a reachable toy rests, relative to the cat: on the floor just past its right side, where the bat swing lands. */
const TOY_AT: Pt = { x: 81, y: 10 };

function ToyArt({ id }: { id: ItemId }) {
  if (id === 'ball') return <BallArt />;
  if (id === 'yarn') return <YarnArt />;
  if (id === 'mouse') return <MouseArt />;
  return <ItemArt id={id} />;
}

interface SceneFx {
  toy: number;
  post: number;
  bowl: number;
  /** The cat just swatted the toy you dropped. */
  swat: number;
}

const NO_FX: SceneFx = { toy: 0, post: 0, bowl: 0, swat: 0 };

function reduceFx(fx: SceneFx, event: string): SceneFx {
  if (event === 'toy:shake') return { ...fx, toy: fx.toy + 1 };
  if (event === 'toy:swat') return { ...fx, swat: fx.swat + 1 };
  if (event === 'scratcher:shake') return { ...fx, post: fx.post + 1 };
  if (event === 'bowl:drag') return { ...fx, bowl: fx.bowl + 1 };
  return fx;
}

// ── Moving things around ─────────────────────────────────────────────────────

/** Things you can pick up and put somewhere else (wearables and furniture stay put). */
type Movable = 'toy' | 'bowl' | 'plant' | 'aquarium' | 'painting' | 'clock';
const ON_WALL: ReadonlySet<Movable> = new Set<Movable>(['painting', 'clock']);

/** Top of the floor per stage (things on the floor can't float above it). */
const FLOOR_TOP: Record<number, number> = { 1: 318, 2: 200, 3: 318, 4: 318, 5: 318 };

function clampPlace(kind: Movable, stage: number, p: Pt): Pt {
  const x = Math.min(356, Math.max(24, p.x));
  const y = ON_WALL.has(kind) ? Math.min(300, Math.max(92, p.y)) : Math.min(468, Math.max(FLOOR_TOP[stage] ?? 318, p.y));
  return { x: Math.round(x), y: Math.round(y) };
}

const PLACE_KEY = 'purrpose.placement.v1';
type Placement = Record<string, Pt>;

function loadPlacement(): Placement {
  try {
    const raw = localStorage.getItem(PLACE_KEY);
    return raw ? (JSON.parse(raw) as Placement) : {};
  } catch {
    return {};
  }
}

function savePlacement(p: Placement): void {
  try {
    localStorage.setItem(PLACE_KEY, JSON.stringify(p));
  } catch {
    /* private mode: positions just won't be remembered */
  }
}

function useMinuteClock(enabled: boolean): { hour: number; minute: number } {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!enabled) return undefined;
    const t = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, [enabled]);
  return { hour: now.getHours(), minute: now.getMinutes() };
}

// ============================================================================
// 4. MAIN CAT SCENE COMPONENT
// ============================================================================

const LIGHTING: Record<Exclude<DayPeriod, 'day'>, { color: string; opacity: number }> = {
  dawn: { color: '#FFC98B', opacity: 0.16 },
  dusk: { color: '#F08A4B', opacity: 0.2 },
  night: { color: '#1B2550', opacity: 0.4 },
};

/** Tints the whole scene to match the viewer's local time of day. */
function SceneLighting({ period, stage, uid }: { period: DayPeriod; stage: number; uid: string }) {
  if (period === 'day') return null;
  const light = LIGHTING[period];
  const outdoor = stage <= 2;
  return (
    <g pointerEvents="none" data-lighting={period}>
      <rect x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} fill={light.color} opacity={light.opacity} style={{ mixBlendMode: 'multiply' }} />
      {period === 'night' && outdoor && (
        <g>
          <circle cx={322} cy={62} r={17} fill="#FFF4C9" stroke={INK} strokeWidth={2} />
          <circle cx={330} cy={56} r={15} fill="#E9E3F2" opacity={0.9} />
          {[[60, 50], [120, 34], [250, 42], [205, 78], [30, 96]].map(([x, y]) => (
            <path key={`${x}-${y}`} className="lc-twinkle" d={`M${x} ${y - 5} L${x + 1.4} ${y - 1.4} L${x + 5} ${y} L${x + 1.4} ${y + 1.4} L${x} ${y + 5} L${x - 1.4} ${y + 1.4} L${x - 5} ${y} L${x - 1.4} ${y - 1.4} Z`} fill="#FFF4C9" />
          ))}
        </g>
      )}
      {period === 'night' && !outdoor && (
        <>
          <defs>
            <radialGradient id={`lamp-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFD58A" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#FFD58A" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={190} cy={290} rx={170} ry={150} fill={`url(#lamp-${uid})`} style={{ mixBlendMode: 'screen' }} />
        </>
      )}
    </g>
  );
}

export interface CatSceneProps {
  catId: CatId;
  state: CatState;
  phaseRatio: number;
  seed: number;
  speed?: number;
  paused?: boolean;
  reduced?: boolean;
  /** Viewer's local hour (0–23). Drives dawn/dusk/night lighting. Omit for daylight. */
  hour?: number;
  /** Play the "moving day" transition when the stage goes up. Off for finished pacts. */
  animateStages?: boolean;
  className?: string;
  livingRef?: React.Ref<LivingCatHandle>;
  onSceneEvent?: (event: string) => void;
  /** Items the user has equipped from the shop. */
  items?: Loadout;
  /** Tapping the cat pets it (off where the whole scene is a link). */
  interactive?: boolean;
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (!ref) return;
  if (typeof ref === 'function') ref(value);
  else (ref as React.MutableRefObject<T | null>).current = value;
}

export function CatScene({
  catId,
  state,
  phaseRatio,
  seed,
  speed = 1,
  paused = false,
  reduced = false,
  hour,
  animateStages = true,
  className,
  livingRef,
  onSceneEvent,
  items,
  interactive = false,
}: CatSceneProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const innerRef = useRef<LivingCatHandle | null>(null);
  const setLivingRef = useCallback(
    (h: LivingCatHandle | null) => {
      innerRef.current = h;
      assignRef(livingRef, h);
    },
    [livingRef],
  );
  useGazeFollow(svgRef, !reduced);
  useEffect(() => {
    injectLivingStyle();
  }, []);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const isFinished = state === 'SUCCESS' || state === 'FAILURE';
  const effectiveStage = isFinished ? 5 : getLifeStage(phaseRatio);
  const info = stageInfo(effectiveStage);

  // Moving day: when the cat climbs to a better stage while you're watching.
  const prevStageRef = useRef(effectiveStage);
  const [moving, setMoving] = useState<{ to: number; key: number } | null>(null);
  useEffect(() => {
    const prev = prevStageRef.current;
    prevStageRef.current = effectiveStage;
    if (reduced || isFinished || !animateStages || effectiveStage <= prev) return undefined;
    setMoving({ to: effectiveStage, key: Date.now() });
    onSceneEvent?.(`stage:${effectiveStage}`);
    const t = window.setTimeout(() => setMoving(null), 3000);
    return () => window.clearTimeout(t);
  }, [effectiveStage]);

  const [fx, setFx] = useState<SceneFx>(NO_FX);
  const onEvent = useCallback(
    (event: string) => {
      setFx(prev => reduceFx(prev, event));
      onSceneEvent?.(event);
    },
    [onSceneEvent]
  );

  const period: DayPeriod = hour === undefined ? 'day' : dayPeriod(hour);

  // Where the cat sits in this stage
  const { x: catX, y: catY, s: catScale } = CAT_AT[effectiveStage];

  // ── Shop items for this stage ──
  const layout = ITEM_LAYOUT[effectiveStage];
  const indoor = effectiveStage >= 3;
  const floorLevel = effectiveStage >= 2 && effectiveStage <= 4; // not in the box, not up on the sofa
  // A stray starts with nothing: in the box only a toy; a bowl from the yard on; everything else once indoors.
  const hasBowl = effectiveStage >= 2;
  const toy = items?.toy;
  const bed = indoor && items?.bed ? layout.bed : undefined;
  const post = indoor && items?.scratcher ? layout.post : undefined;
  const blanket = indoor && items?.blanket ? layout.blanket : undefined;
  const plantLayout = indoor && items?.plant ? layout.plant : undefined;
  const clockOn = indoor && Boolean(items?.clock);
  const clockTime = useMinuteClock(clockOn);
  const toyRest = layout.toyRest;
  const itemKey = JSON.stringify(items ?? {});

  // ── Where movable things are: your own placement (remembered per stage), else the default spot ──
  const [placed, setPlaced] = useState<Placement>(() => (typeof window === 'undefined' ? {} : loadPlacement()));
  const [drag, setDrag] = useState<{ kind: Movable; pos: Pt; grab: Pt; moved: boolean } | null>(null);
  const keyOf = (k: Movable) => `${effectiveStage}:${k}`;
  const defaults: Partial<Record<Movable, Pt>> = {
    toy: toy ? (toyRest ?? { x: catX + TOY_AT.x * catScale, y: catY + TOY_AT.y * catScale }) : undefined,
    bowl: hasBowl ? layout.bowl : undefined,
    plant: plantLayout,
    aquarium: indoor && items?.aquarium ? layout.aquarium : undefined,
    painting: indoor && items?.painting ? layout.painting : undefined,
    clock: clockOn ? layout.clock : undefined,
  };
  const settled = (k: Movable): Pt | undefined => (defaults[k] ? (placed[keyOf(k)] ?? defaults[k]) : undefined);
  const posOf = (k: Movable): Pt | undefined => (drag?.kind === k ? drag.pos : settled(k));

  /** Can the cat reach the toy from where it sits (floor level, by its side)? */
  const reach = (p: Pt | undefined): { inReach: boolean; side: 1 | -1 } => {
    if (!p) return { inReach: false, side: 1 };
    const dx = (p.x - catX) / catScale;
    const dy = (p.y - catY) / catScale;
    return { inReach: floorLevel && Math.abs(dx) >= 40 && Math.abs(dx) <= 125 && dy >= -30 && dy <= 45, side: dx >= 0 ? 1 : -1 };
  };

  const toyAt = settled('toy');
  const bowlAt = settled('bowl');
  const fishAt = settled('aquarium');
  const clockAt = settled('clock');
  const placeKey = JSON.stringify([toyAt, bowlAt, fishAt, clockAt]);

  const living: LivingItems = useMemo(() => {
    const side = (o: Pt | undefined): 1 | -1 | undefined => (o ? (o.x >= catX ? 1 : -1) : undefined);
    const toyReach = reach(toyAt);
    return {
      behaviors: {
        toy,
        canPlay: Boolean(toy) ? toyReach.inReach : floorLevel,
        // Stage 4 always has its cat tree; elsewhere only a bought post right at the cat's side counts.
        canScratch: effectiveStage === 4 || Boolean(post && layout.postInReach),
        hasBowl,
        bed: Boolean(bed),
        blanket: Boolean(blanket),
        aquarium: Boolean(fishAt),
      },
      bowlSide: side(bowlAt) ?? 1,
      toySide: toyReach.side,
      fishSide: side(fishAt),
      clockSide: side(clockAt),
      wear: indoor ? { collar: items?.neck === 'collar-bell', bow: items?.neck === 'bow-tie' } : undefined,
      noYarn: toy === 'ball' || toy === 'yarn' || toy === 'mouse',
    };
    // itemKey / placeKey capture every value read above.
  }, [itemKey, placeKey, effectiveStage, catX]);

  const savePlace = (k: Movable, p: Pt) => {
    setPlaced(prev => {
      const next = { ...prev, [keyOf(k)]: p };
      savePlacement(next);
      return next;
    });
  };

  // The cat swatted the toy you dropped by its paw: it skitters a little further away.
  useEffect(() => {
    if (!fx.swat || !toyAt) return;
    const side = toyAt.x >= catX ? 1 : -1;
    savePlace('toy', clampPlace('toy', effectiveStage, { x: toyAt.x + side * 26, y: toyAt.y + 3 }));
  }, [fx.swat]);

  const badgeTextRef = useRef<SVGTextElement | null>(null);
  const movingTextRef = useRef<SVGTextElement | null>(null);
  const movingText = moving ? `Moving day! ${stageInfo(moving.to).label}` : '';
  const movingW = useTextWidth(movingTextRef, movingText, movingText.length * 8.2);
  const badgeText = `STAGE ${info.stage} · ${info.label.toUpperCase()}`;
  const badgeW = useTextWidth(badgeTextRef, badgeText, badgeText.length * 6.6);
  const canMove = interactive && !reduced;

  const toSvg = (e: React.PointerEvent): Pt => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const r = pt.matrixTransform(m.inverse());
    return { x: r.x, y: r.y };
  };
  const startDrag = (kind: Movable) => (e: React.PointerEvent) => {
    const p = settled(kind);
    if (!canMove || !p) return;
    e.preventDefault();
    e.stopPropagation();
    const at = toSvg(e);
    try {
      svgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* not a real pointer (tests) — moves still reach the svg while over it */
    }
    setDrag({ kind, pos: p, grab: { x: at.x - p.x, y: at.y - p.y }, moved: false });
    if (kind === 'toy') innerRef.current?.watch(true);
  };
  const moveDrag = (e: React.PointerEvent) => {
    if (!drag) return;
    const at = toSvg(e);
    const pos = clampPlace(drag.kind, effectiveStage, { x: at.x - drag.grab.x, y: at.y - drag.grab.y });
    setDrag(d => (d ? { ...d, pos, moved: true } : d));
  };
  const endDrag = () => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    if (d.moved) savePlace(d.kind, d.pos);
    if (d.kind === 'toy') {
      innerRef.current?.watch(false);
      const r = reach(d.pos);
      innerRef.current?.toyDropped(r.inReach, r.side);
    }
  };

  /** One movable thing, drawn at its place. Floor things in front of the cat are drawn over it. */
  const movable = (kind: Movable, art: React.ReactNode, scale = 1) => {
    const p = posOf(kind);
    if (!p) return null;
    return (
      <g
        key={kind}
        data-movable={kind}
        onPointerDown={canMove ? startDrag(kind) : undefined}
        style={{
          transform: `translate(${p.x}px, ${p.y}px)`,
          transition: drag?.kind === kind ? 'none' : 'transform 0.45s cubic-bezier(0.2, 0.8, 0.3, 1)',
          cursor: canMove ? (drag?.kind === kind ? 'grabbing' : 'grab') : undefined,
          touchAction: canMove ? 'none' : undefined,
        }}
      >
        {scale === 1 ? art : <g transform={`scale(${scale})`}>{art}</g>}
      </g>
    );
  };
  const inFront = (kind: Movable) => {
    const p = posOf(kind);
    return Boolean(p) && !ON_WALL.has(kind) && (p as Pt).y > catY + 6;
  };
  const toyArt = toy && (
    <g key={`s${fx.swat}`} className={fx.swat && !reduced ? 'it-spin' : undefined}>
      <g
        key={`r${fx.toy}`}
        className={fx.toy && !reduced ? (toy === 'mouse' ? 'it-toss' : (toyAt?.x ?? catX) >= catX ? 'it-roll' : 'it-roll-l') : undefined}
      >
        <ToyArt id={toy} />
      </g>
    </g>
  );
  const bowlArt = (
    <g key={fx.bowl} className={fx.bowl && !reduced ? 'it-bowl-nudge' : undefined}>
      <BowlArt id={items?.bowl} />
    </g>
  );
  // Farther back (smaller y) is drawn first, so things overlap the way they stand in the room.
  const floorArt: Array<[Movable, React.ReactNode, number]> = (
    [
      ['aquarium', <AquariumArt key="aq" />, 1],
      ['plant', <PlantArt key="pl" />, plantLayout?.s ?? 1],
      ['bowl', bowlArt, 1],
      ['toy', toyArt, 1],
    ] as Array<[Movable, React.ReactNode, number]>
  ).sort((a, b) => (posOf(a[0])?.y ?? 0) - (posOf(b[0])?.y ?? 0));
  const movingLine = moving ? quirkFor(catId, 'WAITING', moving.to) : null;

  return (
    <svg
      ref={svgRef}
      onPointerMove={drag ? moveDrag : undefined}
      onPointerUp={drag ? endDrag : undefined}
      onPointerCancel={drag ? endDrag : undefined}
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      width="100%"
      className={`purrpose-scene ${className ?? ''}`.trim()}
      role="img"
      aria-label={`${info.label} — stage ${effectiveStage} of 5`}
      data-scene-stage={effectiveStage}
      data-scene-state={state}
      data-state={state}
      style={{
        borderRadius: 'var(--radius-sketch-a)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        border: '2.5px solid var(--ink)',
      }}
    >
      {/* 1. BACKGROUND ENVIRONMENT (re-keyed per stage so moving day fades it in) */}
      <g className={moving ? 'background-layer lc-scene-enter' : 'background-layer'} key={`bg-${effectiveStage}`}>
        {effectiveStage === 1 && <SceneSidewalk />}
        {effectiveStage === 2 && <SceneYard />}
        {effectiveStage === 3 && <SceneIndoor hidePlant={Boolean(plantLayout)} hideArt={Boolean(defaults.painting)} />}
        {effectiveStage === 4 && <SceneScratcher hideTree={Boolean(post)} />}
        {effectiveStage === 5 && <SceneCouch hideFrame={Boolean(defaults.painting)} />}
      </g>

      <style>{ITEM_CSS}</style>

      {/* 2a. WALL DECOR (drag to rehang) */}
      {items?.painting && movable('painting', <PaintingArt id={items.painting} />)}
      {movable('clock', <ClockArt hour={clockTime.hour} minute={clockTime.minute} />)}

      {/* 2b. FIXED FURNITURE */}
      {post && (
        <g transform={`translate(${post.x} ${post.y})`}>
          <ScratchPostArt shake={fx.post} />
        </g>
      )}
      {blanket && (
        <g transform={`translate(${blanket.x} ${blanket.y})`}>
          <BlanketArt w={blanket.w} />
        </g>
      )}

      {/* 2c. FLOOR THINGS BEHIND THE CAT (fish tank, plant, bowl, toy — all draggable) */}
      {floorArt.filter(([k]) => !inFront(k)).map(([k, art, sc]) => movable(k, art, sc))}

      {/* 2d. UNDER THE CAT: the donut bed, or the stage-3 cushion */}
      {bed ? (
        <g transform={`translate(${bed.x} ${bed.y}) scale(${bed.s})`}>
          <BedBack />
        </g>
      ) : (
        <CushionPlatform stage={effectiveStage} />
      )}

      {/* 3. HERO CAT (tap to pet it where the scene is interactive) */}
      <g
        transform={`translate(${catX}, ${catY}) scale(${catScale})`}
        onClick={interactive && !reduced ? () => innerRef.current?.pet() : undefined}
        style={interactive && !reduced ? { cursor: 'pointer' } : undefined}
      >
        {/* Adding the class (re)starts the hop — no remount, so a running script is never cut off. */}
        <g className={moving ? 'lc-move-hop' : undefined}>
          {reduced ? (
            <g transform="translate(-120, -254)">
              <Cat
                catId={catId}
                state={state}
                size={240}
                showGround={effectiveStage !== 1 && effectiveStage !== 3}
                wear={living.wear}
              />
            </g>
          ) : (
            <LivingCat
              catId={catId}
              state={state}
              seed={seed}
              speed={speed}
              paused={paused}
              reduced={reduced}
              onEvent={onEvent}
              speech={movingLine}
              items={living}
              ref={setLivingRef}
            />
          )}
        </g>
      </g>

      {/* 3b. The bed's front rim goes over the cat, so it sits *in* the bed. */}
      {bed && (
        <g transform={`translate(${bed.x} ${bed.y}) scale(${bed.s})`}>
          <BedFront />
        </g>
      )}

      {/* 4. FOREGROUND PLATFORM OVERLAYS (Stage 1 Box Front Flaps) */}
      {effectiveStage === 1 && <CardboardBoxFront />}

      {/* 4b. FLOOR THINGS IN FRONT OF THE CAT */}
      {floorArt.filter(([k]) => inFront(k)).map(([k, art, sc]) => movable(k, art, sc))}

      {/* 5. TIME-OF-DAY LIGHTING */}
      <SceneLighting period={period} stage={effectiveStage} uid={uid} />

      {/* 6. EMOTIONAL STATUS OVERLAYS */}
      {!reduced && state === 'SLEEPING' && (
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

      {!reduced && (state === 'SATISFIED' || isFinished) && (
        <g opacity={0.95}>
          <text x={80} y={200} fontSize={26} fill="#E76F51" style={{ fontFamily: 'Gochi Hand, cursive' }} className="lc-zzz">
            ♪
          </text>
          <text x={290} y={190} fontSize={24} fill="#F4A261" style={{ fontFamily: 'Gochi Hand, cursive' }} className="lc-zzz">
            ♫
          </text>
        </g>
      )}

      {/* 7. LIFE PROGRESSION BADGE PILL (sized to its text) */}
      <g transform="translate(20, 20)" pointerEvents="none">
        <rect x={0} y={0} rx={13} ry={13} width={Math.round(badgeW + 44)} height={28} fill="#FFFDF8" stroke={INK} strokeWidth={1.8} />
        <g transform="translate(8 4) scale(0.83)">
          <IconGlyph name={info.icon} />
        </g>
        <text
          ref={badgeTextRef}
          x={34}
          y={18.5}
          fontSize={12}
          fontWeight="bold"
          fill={effectiveStage === 5 ? '#16A34A' : INK}
          style={{ fontFamily: 'Gochi Hand, cursive', letterSpacing: '0.3px' }}
        >
          {badgeText}
        </text>
      </g>

      {/* 8. MOVING-DAY BANNER (sized to its text) */}
      {moving && (
        <g pointerEvents="none" transform={`translate(${SCENE_WIDTH / 2}, ${SCENE_HEIGHT - 34})`}>
          <g className="lc-moving-banner">
            <rect x={-(movingW / 2) - 34} y={-19} width={movingW + 68} height={38} rx={17} fill={INK} />
            <g transform={`translate(${-(movingW / 2) - 26} -12) scale(1)`}>
              <IconGlyph name={stageInfo(moving.to).icon} />
            </g>
            <text ref={movingTextRef} x={14} y={6} textAnchor="middle" fontSize={17} fill="#FFFDF8" style={{ fontFamily: 'Gochi Hand, cursive' }}>
              {movingText}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}
