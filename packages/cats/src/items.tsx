/**
 * Shop items, drawn in the same ink-and-paper style as the cats.
 *
 * Every piece is drawn around (0, 0) = the middle of where it touches the
 * floor, so the scene can drop it anywhere. To use a hand-made image instead,
 * replace the body of one component with an <image href="/items/<id>.png" …/>
 * of the same footprint (ITEM_FOOTPRINT).
 */
import type { ItemId } from '@purrpose/shared';

const INK = '#26201D';
const PAPER = '#FFFDF9';

/** Width × height of each drawing, for icons and image replacements. */
export const ITEM_FOOTPRINT: Record<ItemId, { w: number; h: number }> = {
  ball: { w: 26, h: 24 },
  yarn: { w: 36, h: 26 },
  mouse: { w: 44, h: 22 },
  'bed-donut': { w: 96, h: 40 },
  'scratch-post': { w: 60, h: 124 },
  'blanket-knit': { w: 160, h: 32 },
  'bowl-kitty': { w: 52, h: 34 },
  'bowl-tuxedo': { w: 52, h: 34 },
  'bowl-ginger': { w: 52, h: 34 },
  'bowl-calico': { w: 52, h: 34 },
  'collar-bell': { w: 64, h: 30 },
  'bow-tie': { w: 40, h: 24 },
  'plant-monstera': { w: 90, h: 150 },
  aquarium: { w: 86, h: 106 },
  'art-fish': { w: 58, h: 72 },
  'art-sunset': { w: 58, h: 72 },
  'art-paw': { w: 58, h: 72 },
  'clock-cat': { w: 54, h: 78 },
};

// ─── Toys ────────────────────────────────────────────────────────────────────

export function BallArt() {
  return (
    <g data-item="ball">
      <circle cx={0} cy={-11} r={11} fill="#6FA8DC" stroke={INK} strokeWidth={2.2} />
      <circle cx={0} cy={-11} r={4} fill="#F4B63F" stroke={INK} strokeWidth={1.4} />
      <g fill="#3D6E99" stroke={INK} strokeWidth={1}>
        <ellipse cx={-6} cy={-16} rx={2.6} ry={2} />
        <ellipse cx={6} cy={-16} rx={2.6} ry={2} />
        <ellipse cx={-7} cy={-6} rx={2.4} ry={1.8} />
        <ellipse cx={7} cy={-6} rx={2.4} ry={1.8} />
      </g>
      <path d="M-5 -19 q3 -2 6 -1" stroke={PAPER} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </g>
  );
}

export function YarnArt() {
  return (
    <g data-item="yarn">
      <path d="M8 -4 q10 2 16 -2" fill="none" stroke="#9B7BC4" strokeWidth={2} strokeLinecap="round" />
      <circle cx={0} cy={-12} r={12} fill="#9B7BC4" stroke={INK} strokeWidth={2.2} />
      <g fill="none" stroke="#E6DAF3" strokeWidth={1.5} strokeLinecap="round">
        <path d="M-10 -16 q10 6 20 0" />
        <path d="M-11 -9 q11 6 22 0" />
        <path d="M-4 -23 q-3 11 3 22" />
      </g>
    </g>
  );
}

export function MouseArt() {
  return (
    <g data-item="mouse">
      <path d="M13 -6 q12 2 10 -8 q-2 -6 6 -8" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M-16 -4 C-14 -16 4 -18 14 -8 C16 -3 12 0 6 0 L-12 0 C-15 0 -16 -2 -16 -4 Z" fill="#B7AFA6" stroke={INK} strokeWidth={2} />
      <circle cx={-8} cy={-15} r={4.5} fill="#B7AFA6" stroke={INK} strokeWidth={1.8} />
      <circle cx={-8} cy={-15} r={2.2} fill="#F4A3AE" />
      <circle cx={-12} cy={-7} r={1.3} fill={INK} />
      <circle cx={-16.5} cy={-4.5} r={1.5} fill="#F28C9A" stroke={INK} strokeWidth={0.8} />
      <path d="M2 -12 v8 M-2 -8 h8" stroke="#8C837A" strokeWidth={1.2} strokeLinecap="round" />
    </g>
  );
}

// ─── Comfort ────────────────────────────────────────────────────────────────

const BED_OUTER = '#8FC1B5';
const BED_INNER = '#F6EBDD';

/** Back half of the donut bed (drawn behind the cat). */
export function BedBack() {
  return (
    <g data-item="bed-donut">
      <ellipse cx={0} cy={-18} rx={47} ry={18} fill={BED_OUTER} stroke={INK} strokeWidth={2.6} />
      <ellipse cx={0} cy={-20} rx={33} ry={10} fill={BED_INNER} stroke={INK} strokeWidth={2} />
    </g>
  );
}

/** Front rim of the donut bed (drawn over the cat, so it sits *in* the bed). */
export function BedFront() {
  return (
    <g data-item="bed-donut-front" pointerEvents="none">
      <path
        d="M-47 -18 A47 18 0 0 0 47 -18 L33 -19 A33 10 0 0 1 -33 -19 Z"
        fill={BED_OUTER}
        stroke={INK}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <g stroke="#6FA396" strokeWidth={1.6} strokeLinecap="round">
        <path d="M-30 -6 q4 -3 8 0" fill="none" />
        <path d="M22 -6 q4 -3 8 0" fill="none" />
      </g>
    </g>
  );
}

export function BedArt() {
  return (
    <g>
      <BedBack />
      <BedFront />
    </g>
  );
}

export function ScratchPostArt({ shake = 0 }: { shake?: number }) {
  return (
    <g data-item="scratch-post">
      <rect x={-28} y={-9} width={56} height={9} rx={2} fill="#A8835B" stroke={INK} strokeWidth={2.4} />
      <g key={shake} className={shake ? 'it-wobble' : undefined} style={{ transformOrigin: '0px -9px' }}>
        <rect x={-11} y={-110} width={22} height={101} fill="#D8C39A" stroke={INK} strokeWidth={2.4} />
        <g stroke="#B79E6E" strokeWidth={1.8}>
          {Array.from({ length: 13 }).map((_, i) => (
            <path key={i} d={`M-11 ${-104 + i * 7.5} l22 3`} />
          ))}
        </g>
        <rect x={-22} y={-120} width={44} height={11} rx={4} fill={BED_OUTER} stroke={INK} strokeWidth={2.4} />
        <path d="M16 -109 v20" stroke={INK} strokeWidth={1.4} />
        <circle cx={16} cy={-86} r={4.5} fill="#E86A7A" stroke={INK} strokeWidth={1.6} />
      </g>
    </g>
  );
}

/** A knitted throw lying flat; `w` stretches it to fit where it's placed. */
export function BlanketArt({ w = 1 }: { w?: number }) {
  return (
    <g data-item="blanket-knit" transform={w === 1 ? undefined : `scale(${w} 1)`}>
      <path
        d="M-74 -6 Q-78 -24 -56 -26 L56 -26 Q78 -24 74 -6 Q70 4 52 3 L-52 3 Q-70 4 -74 -6 Z"
        fill="#E8A87C"
        stroke={INK}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <g fill="none" stroke="#C97B4F" strokeWidth={1.6} strokeLinecap="round">
        {[-18, -9].map(y => (
          <path
            key={y}
            d={Array.from({ length: 14 }, (_, i) => `M${-62 + i * 9.5} ${y} l4 4 l4 -4`).join(' ')}
          />
        ))}
      </g>
      <g stroke={INK} strokeWidth={1.6} strokeLinecap="round">
        {[-20, -12, -4].map(y => (
          <g key={y}>
            <path d={`M-75 ${y} l-6 2`} />
            <path d={`M75 ${y} l6 2`} />
          </g>
        ))}
      </g>
    </g>
  );
}

// ─── Bowls ──────────────────────────────────────────────────────────────────

const BOWL_BODY = 'M-25 -20 L25 -20 Q23 0 0 0 Q-23 0 -25 -20 Z';

function Kibble() {
  return (
    <g>
      <ellipse cx={0} cy={-21} rx={20} ry={5} fill="#8A5A2B" stroke={INK} strokeWidth={1.8} />
      <g fill="#6B4320">
        <circle cx={-8} cy={-23} r={1.6} />
        <circle cx={0} cy={-24} r={1.6} />
        <circle cx={8} cy={-22.5} r={1.6} />
        <circle cx={-3} cy={-20} r={1.4} />
      </g>
    </g>
  );
}

function BowlEars({ left, right }: { left: string; right: string }) {
  return (
    <g stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
      <path d="M-22 -21 L-17 -32 L-10 -21 Z" fill={left} />
      <path d="M10 -21 L17 -32 L22 -21 Z" fill={right} />
    </g>
  );
}

function BowlFace({ eye = INK, nose = '#F28C9A' }: { eye?: string; nose?: string }) {
  return (
    <g>
      <circle cx={-7} cy={-11} r={1.7} fill={eye} />
      <circle cx={7} cy={-11} r={1.7} fill={eye} />
      <path d="M-2 -8 L2 -8 L0 -6 Z" fill={nose} />
      <g stroke={eye} strokeWidth={1} strokeLinecap="round">
        <path d="M-9 -7 l-7 -1 M-9 -5 l-7 1 M9 -7 l7 -1 M9 -5 l7 1" />
      </g>
    </g>
  );
}

export function BowlArt({ id }: { id?: ItemId }) {
  if (id === 'bowl-tuxedo') {
    return (
      <g data-item={id}>
        <BowlEars left={INK} right={INK} />
        <Kibble />
        <path d={BOWL_BODY} fill="#2B2522" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        <path d="M-10 -20 L0 -8 L10 -20 Z M-9 -2 Q0 -12 9 -2" fill={PAPER} />
        <BowlFace eye={PAPER} />
      </g>
    );
  }
  if (id === 'bowl-ginger') {
    return (
      <g data-item={id}>
        <BowlEars left="#EEB038" right="#EEB038" />
        <Kibble />
        <path d={BOWL_BODY} fill="#EEB038" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        <g stroke="#C9851C" strokeWidth={2.2} strokeLinecap="round" fill="none">
          <path d="M-20 -16 q3 4 0 8" />
          <path d="M20 -16 q-3 4 0 8" />
          <path d="M-4 -19 v3 M0 -19 v4 M4 -19 v3" />
        </g>
        <BowlFace />
      </g>
    );
  }
  if (id === 'bowl-calico') {
    return (
      <g data-item={id}>
        <BowlEars left="#D9824B" right={INK} />
        <Kibble />
        <path d={BOWL_BODY} fill={PAPER} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        <path d="M-24 -19 L-10 -19 Q-9 -12 -16 -8 Q-22 -9 -24 -19 Z" fill="#D9824B" />
        <path d="M12 -19 L24 -19 Q22 -9 15 -10 Q10 -14 12 -19 Z" fill="#3A322E" />
        <path d="M-4 -3 q6 -5 12 -1 q-3 4 -12 1 Z" fill="#D9824B" />
        <path d={BOWL_BODY} fill="none" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        <BowlFace />
      </g>
    );
  }
  if (id !== 'bowl-kitty') {
    // The free starter bowl everyone has.
    return (
      <g data-item="bowl-plain">
        <Kibble />
        <path d={BOWL_BODY} fill="#D9DEE3" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        <path d="M-18 -8 Q0 -4 18 -8" fill="none" stroke="#AEB6BE" strokeWidth={1.6} strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g data-item={id}>
      <BowlEars left="#F6EBDD" right="#F6EBDD" />
      <Kibble />
      <path d={BOWL_BODY} fill="#F6EBDD" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <ellipse cx={-13} cy={-7} rx={3} ry={2} fill="#F4A3AE" opacity={0.8} />
      <ellipse cx={13} cy={-7} rx={3} ry={2} fill="#F4A3AE" opacity={0.8} />
      <BowlFace />
    </g>
  );
}

// ─── Decor ──────────────────────────────────────────────────────────────────

function MonsteraLeaf({ d, rot }: { d: string; rot: number }) {
  return (
    <g transform={`rotate(${rot})`}>
      <path d={d} fill="#5E8C5A" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}

export function PlantArt({ rustle = 0 }: { rustle?: number }) {
  const leaf = 'M0 0 C-22 -6 -30 -34 -12 -46 C-2 -52 10 -44 12 -30 L4 -28 L10 -20 L2 -16 L6 -8 Z';
  return (
    <g data-item="plant-monstera">
      <g key={rustle} className={rustle ? 'it-rustle' : 'it-sway-slow'} style={{ transformOrigin: '0px -36px' }}>
        <g stroke={INK} strokeWidth={2.4} strokeLinecap="round">
          <path d="M0 -36 C-3 -58 -10 -74 -16 -86" fill="none" />
          <path d="M0 -36 C2 -66 6 -86 6 -106" fill="none" />
          <path d="M0 -36 C6 -52 16 -64 24 -72" fill="none" />
          <path d="M0 -36 C-8 -44 -18 -52 -26 -56" fill="none" />
        </g>
        <g transform="translate(-16 -86)"><MonsteraLeaf d={leaf} rot={-20} /></g>
        <g transform="translate(6 -104)"><MonsteraLeaf d={leaf} rot={6} /></g>
        <g transform="translate(24 -72)"><MonsteraLeaf d={leaf} rot={38} /></g>
        <g transform="translate(-26 -56)"><MonsteraLeaf d={leaf} rot={-48} /></g>
      </g>
      <path d="M-20 -38 L20 -38 L15 0 L-15 0 Z" fill="#C8744E" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <rect x={-23} y={-44} width={46} height={9} rx={2} fill="#D98B62" stroke={INK} strokeWidth={2.4} />
    </g>
  );
}

export function AquariumArt({ tap = 0 }: { tap?: number }) {
  return (
    <g data-item="aquarium">
      {/* Stand */}
      <rect x={-34} y={-40} width={68} height={8} rx={2} fill="#A8835B" stroke={INK} strokeWidth={2.4} />
      <path d="M-28 -32 V0 M28 -32 V0" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d="M-28 -12 H28" stroke={INK} strokeWidth={2.4} />
      {/* Tank */}
      <rect x={-42} y={-100} width={84} height={60} rx={4} fill="#CFEAF4" stroke={INK} strokeWidth={2.6} />
      <path d="M-40 -88 H40" stroke="#8CC7EB" strokeWidth={2} />
      <path d="M-40 -46 q10 -6 20 0 q10 -6 20 0 q10 -6 20 0 q10 -6 20 0 V-42 H-40 Z" fill="#C9B48E" stroke={INK} strokeWidth={1.4} />
      <path d="M-26 -46 q-6 -14 2 -26 M-22 -46 q4 -12 -2 -20" fill="none" stroke="#5E8C5A" strokeWidth={2.4} strokeLinecap="round" />
      <g key={tap} className={tap ? 'it-fish-dart' : undefined}>
        <g className="it-fish-a">
          <path d="M0 0 c6 -6 14 -6 18 0 c-4 6 -12 6 -18 0 Z M18 0 l6 -5 v10 Z" transform="translate(-10 -70)" fill="#F08A4B" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        </g>
        <g className="it-fish-b">
          <path d="M0 0 c-5 -5 -11 -5 -14 0 c3 5 9 5 14 0 Z M-14 0 l-5 -4 v8 Z" transform="translate(18 -58)" fill="#F4B63F" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
        </g>
      </g>
      <g fill={PAPER} stroke="#8CC7EB" strokeWidth={1.2} className="it-bubbles">
        <circle cx={24} cy={-80} r={2.2} />
        <circle cx={28} cy={-90} r={1.6} />
      </g>
      <rect x={-44} y={-104} width={88} height={6} rx={2} fill="#4A4542" stroke={INK} strokeWidth={2} />
      <path d="M-36 -94 v10" stroke={PAPER} strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
    </g>
  );
}

// ─── Wall decor ─────────────────────────────────────────────────────────────
// Drawn from the bottom-centre of the frame, like everything else.

export function PaintingArt({ id }: { id: ItemId }) {
  return (
    <g data-item={id}>
      <path d="M-10 -72 L0 -80 L10 -72" fill="none" stroke={INK} strokeWidth={1.6} />
      <rect x={-29} y={-72} width={58} height={72} rx={3} fill="#A8835B" stroke={INK} strokeWidth={2.4} />
      <rect x={-23} y={-66} width={46} height={60} fill={PAPER} stroke={INK} strokeWidth={1.8} />
      {id === 'art-fish' && (
        <g>
          <rect x={-23} y={-66} width={46} height={60} fill="#CFE6F2" />
          <path d="M-14 -36 c8 -10 20 -10 26 0 c-6 10 -18 10 -26 0 Z M12 -36 l9 -7 v14 Z" fill="#F08A4B" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
          <circle cx={-6} cy={-37} r={1.6} fill={INK} />
          <g fill={PAPER} stroke="#8CC7EB" strokeWidth={1}>
            <circle cx={-12} cy={-52} r={2.4} />
            <circle cx={-7} cy={-58} r={1.6} />
          </g>
        </g>
      )}
      {id === 'art-sunset' && (
        <g>
          <rect x={-23} y={-66} width={46} height={60} fill="#F7D9A8" />
          <circle cx={0} cy={-30} r={11} fill="#F08A4B" />
          <path d="M-23 -24 Q-8 -36 6 -26 Q14 -32 23 -26 V-6 H-23 Z" fill="#8FA37E" stroke={INK} strokeWidth={1.4} />
          <path d="M-23 -14 Q0 -22 23 -14 V-6 H-23 Z" fill="#6F825F" />
        </g>
      )}
      {id === 'art-paw' && (
        <g fill="#E86A7A" stroke={INK} strokeWidth={1.4}>
          <ellipse cx={0} cy={-26} rx={10} ry={8} />
          <ellipse cx={-11} cy={-40} rx={4} ry={5} />
          <ellipse cx={-4} cy={-46} rx={4} ry={5} />
          <ellipse cx={4} cy={-46} rx={4} ry={5} />
          <ellipse cx={11} cy={-40} rx={4} ry={5} />
          <path d="M8 -12 q4 -3 8 0" fill="none" stroke={INK} strokeWidth={1.2} />
        </g>
      )}
    </g>
  );
}

/** Round clock with ears; the hands show the viewer's time and a tail swings below. */
export function ClockArt({ hour, minute }: { hour: number; minute: number }) {
  const cy = -46;
  const hAng = ((hour % 12) + minute / 60) * 30;
  const mAng = minute * 6;
  return (
    <g data-item="clock-cat">
      <g className="it-pendulum" style={{ transformOrigin: `0px ${cy + 18}px` }}>
        <path d={`M0 ${cy + 18} C4 ${cy + 34} -6 ${cy + 40} 0 ${cy + 44}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      </g>
      <g stroke={INK} strokeWidth={2.2} strokeLinejoin="round">
        <path d={`M-19 ${cy - 10} L-17 ${cy - 30} L-5 ${cy - 20} Z`} fill="#3A322E" />
        <path d={`M19 ${cy - 10} L17 ${cy - 30} L5 ${cy - 20} Z`} fill="#3A322E" />
        <circle cx={0} cy={cy} r={22} fill="#3A322E" />
        <circle cx={0} cy={cy} r={17} fill={PAPER} />
      </g>
      <g stroke={INK} strokeWidth={1.6} strokeLinecap="round">
        {[0, 90, 180, 270].map(a => (
          <path key={a} d={`M0 ${cy - 15} v3`} transform={`rotate(${a} 0 ${cy})`} />
        ))}
      </g>
      <path d={`M0 ${cy} v-8`} stroke={INK} strokeWidth={2.4} strokeLinecap="round" transform={`rotate(${hAng} 0 ${cy})`} />
      <path d={`M0 ${cy} v-12`} stroke="#D64545" strokeWidth={1.6} strokeLinecap="round" transform={`rotate(${mAng} 0 ${cy})`} />
      <circle cx={0} cy={cy} r={1.8} fill={INK} />
      <g stroke="#3A322E" strokeWidth={1.2} strokeLinecap="round">
        <path d={`M-22 ${cy + 4} l-8 -2 M-22 ${cy + 8} l-8 2 M22 ${cy + 4} l8 -2 M22 ${cy + 8} l8 2`} />
      </g>
    </g>
  );
}

// ─── Lookup ─────────────────────────────────────────────────────────────────

/** Static drawing of any item (shop cards, reduced-motion scenes). */
export function ItemArt({ id }: { id: ItemId }) {
  switch (id) {
    case 'ball':
      return <BallArt />;
    case 'yarn':
      return <YarnArt />;
    case 'mouse':
      return <MouseArt />;
    case 'bed-donut':
      return <BedArt />;
    case 'scratch-post':
      return <ScratchPostArt />;
    case 'blanket-knit':
      return <BlanketArt />;
    case 'plant-monstera':
      return <PlantArt />;
    case 'aquarium':
      return <AquariumArt />;
    case 'art-fish':
    case 'art-sunset':
    case 'art-paw':
      return <PaintingArt id={id} />;
    case 'clock-cat':
      return <ClockArt hour={10} minute={10} />;
    case 'collar-bell':
    case 'bow-tie':
      return null; // worn by the cat — see Wearables in FaceKit / ItemIcon
    default:
      return <BowlArt id={id} />;
  }
}

/** A square icon for the shop. */
export function ItemIcon({ id, size = 72 }: { id: ItemId; size?: number }) {
  const { w, h } = ITEM_FOOTPRINT[id];
  const pad = 8;
  const box = Math.max(w, h) + pad * 2;
  const wearable = id === 'collar-bell' || id === 'bow-tie';
  return (
    <svg viewBox={`${-box / 2} ${-h - (box - h) / 2} ${box} ${box}`} width={size} height={size} aria-hidden>
      <style>{ITEM_CSS}</style>
      {wearable ? <WearableIcon id={id} /> : <ItemArt id={id} />}
    </svg>
  );
}

function WearableIcon({ id }: { id: ItemId }) {
  if (id === 'bow-tie') {
    return (
      <g transform="translate(0 -12)" strokeLinejoin="round">
        <path d="M0 0 L-18 -10 L-18 10 Z" fill="#3E7CB1" stroke={INK} strokeWidth={2.2} />
        <path d="M0 0 L18 -10 L18 10 Z" fill="#3E7CB1" stroke={INK} strokeWidth={2.2} />
        <circle cx={-11} cy={-1} r={1.6} fill={PAPER} />
        <circle cx={11} cy={2} r={1.6} fill={PAPER} />
        <rect x={-5} y={-5} width={10} height={10} rx={3} fill="#2F5F8A" stroke={INK} strokeWidth={2.2} />
      </g>
    );
  }
  return (
    <g transform="translate(0 -18)">
      <path d="M-30 -6 Q0 12 30 -6" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d="M-30 -6 Q0 12 30 -6" stroke="#D64545" strokeWidth={5.5} fill="none" strokeLinecap="round" />
      <circle cx={0} cy={9} r={6} fill="#F4B63F" stroke={INK} strokeWidth={2} />
      <path d="M-3.5 10 h7" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  );
}

/** Item animations (toys getting hit, fish swimming, leaves rustling). */
export const ITEM_CSS = `
  .it-roll { animation: it-roll 1.1s cubic-bezier(0.25, 0.8, 0.3, 1); transform-box: fill-box; transform-origin: 50% 50%; }
  @keyframes it-roll { 0% { translate: 0 0; rotate: 0deg; } 35% { translate: 30px -6px; rotate: 220deg; } 55% { translate: 34px 0; rotate: 280deg; } 100% { translate: 0 0; rotate: 360deg; } }
  .it-roll-l { animation: it-roll-l 1.1s cubic-bezier(0.25, 0.8, 0.3, 1); transform-box: fill-box; transform-origin: 50% 50%; }
  @keyframes it-roll-l { 0% { translate: 0 0; rotate: 0deg; } 35% { translate: -30px -6px; rotate: -220deg; } 55% { translate: -34px 0; rotate: -280deg; } 100% { translate: 0 0; rotate: -360deg; } }
  .it-spin { animation: it-spin 0.5s ease-out; transform-box: fill-box; transform-origin: 50% 50%; }
  @keyframes it-spin { from { rotate: 0deg; } to { rotate: 300deg; } }
  .it-toss { animation: it-toss 0.9s cubic-bezier(0.3, 0.7, 0.4, 1); transform-box: fill-box; transform-origin: 50% 50%; }
  @keyframes it-toss { 0% { translate: 0 0; rotate: 0deg; } 45% { translate: 14px -44px; rotate: 200deg; } 80% { translate: 8px 0; rotate: 340deg; } 90% { translate: 8px -5px; } 100% { translate: 0 0; rotate: 360deg; } }
  .it-wobble { animation: it-wobble 0.8s ease-in-out; }
  @keyframes it-wobble { 0%, 100% { rotate: 0deg; } 25% { rotate: 2.5deg; } 55% { rotate: -2deg; } 80% { rotate: 1deg; } }
  .it-sway-slow { animation: it-leaf 5s ease-in-out infinite; }
  @keyframes it-leaf { 0%, 100% { rotate: -1.5deg; } 50% { rotate: 1.5deg; } }
  .it-rustle { animation: it-rustle 0.9s ease-in-out; }
  @keyframes it-rustle { 0%, 100% { rotate: 0deg; } 20% { rotate: 7deg; } 45% { rotate: -6deg; } 70% { rotate: 3deg; } }
  .it-fish-a { animation: it-fish-a 6s ease-in-out infinite; }
  .it-fish-b { animation: it-fish-b 7.5s ease-in-out infinite; }
  @keyframes it-fish-a { 0%, 100% { translate: 0 0; } 50% { translate: 26px 4px; } }
  @keyframes it-fish-b { 0%, 100% { translate: 0 0; } 50% { translate: -30px -6px; } }
  .it-fish-dart { animation: it-dart 0.6s ease-out; }
  @keyframes it-dart { 0% { translate: 0 0; } 30% { translate: -8px -6px; } 100% { translate: 0 0; } }
  .it-bubbles { animation: it-bubbles 2.4s ease-in infinite; }
  @keyframes it-bubbles { 0% { translate: 0 6px; opacity: 0; } 20% { opacity: 1; } 100% { translate: 0 -12px; opacity: 0; } }
  .it-bowl-nudge { animation: it-bowl-nudge 1.6s ease-in-out; }
  @keyframes it-bowl-nudge { 0%, 100% { translate: 0 0; } 30%, 70% { translate: -8px 0; } }
  .it-pendulum { animation: it-pendulum 1.6s ease-in-out infinite; }
  @keyframes it-pendulum { 0%, 100% { rotate: -14deg; } 50% { rotate: 14deg; } }
  @media (prefers-reduced-motion: reduce) {
    .it-roll, .it-roll-l, .it-spin, .it-toss, .it-wobble, .it-sway-slow, .it-rustle,
    .it-fish-a, .it-fish-b, .it-fish-dart, .it-bubbles, .it-pendulum, .it-bowl-nudge { animation: none !important; }
  }
`;
