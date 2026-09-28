/**
 * Shared face & pose kit for all 8 cats.
 *
 * Each cat is hand-drawn in Cat.tsx, but they share one coordinate system
 * (viewBox 0 0 240 280, head roughly x 60–180 / y 45–155). FACE_SPECS records
 * where each cat's eyes and nose sit, so expressions, mouths, paws and little
 * "emotion marks" can be drawn once and fit every cat.
 */
import type { CatId } from '@purrpose/shared';
import type { CatState, Expression } from './poses.js';

const INK = '#26201D';
const PAPER = '#FFFDF9';
const TONGUE = '#F28C9A';
const MOUTH = '#7A2E2E';
const WATER = '#8CC7EB';
const GOLD = '#F4B63F';
const HEART = '#E86A7A';

export interface FaceSpec {
  left: [number, number];
  right: [number, number];
  /** Pupil (or dot-eye) radius. */
  r: number;
  /** Eyes drawn as white sclera + pupil (Oreo, Boba, Nyx). */
  sclera?: number;
  pupil: string;
  noseY: number;
  body: string;
  dark?: boolean;
  /** Top of the cat's own right front leg — the lifted paw grows from here. */
  leg: [number, number];
  /** Under the chin, where a collar / bow tie sits: [centre x, y, half width]. */
  neck: [number, number, number];
}

export const FACE_SPECS: Record<CatId, FaceSpec> = {
  mochi: { left: [98, 112], right: [142, 112], r: 5.2, pupil: INK, noseY: 125, body: PAPER, leg: [134, 185], neck: [120, 147, 30] },
  orange: { left: [101, 111], right: [139, 111], r: 5.5, pupil: INK, noseY: 125, body: '#EEB038', leg: [133, 195], neck: [120, 152, 30] },
  oreo: { left: [92, 94], right: [148, 94], r: 4.5, sclera: 8.5, pupil: INK, noseY: 115, body: PAPER, leg: [144, 190], neck: [120, 147, 32] },
  pepper: { left: [102, 112], right: [138, 112], r: 5.5, pupil: INK, noseY: 124, body: PAPER, leg: [134, 195], neck: [120, 152, 29] },
  yuki: { left: [98, 114], right: [142, 114], r: 4.8, pupil: INK, noseY: 124, body: PAPER, leg: [128, 192], neck: [120, 150, 29] },
  black: { left: [98, 116], right: [142, 116], r: 5, sclera: 9, pupil: '#1E1B18', noseY: 128, body: '#1E1B18', dark: true, leg: [134, 200], neck: [120, 151, 25] },
  boba: { left: [94, 108], right: [146, 108], r: 4.5, sclera: 8.5, pupil: INK, noseY: 124, body: PAPER, leg: [134, 192], neck: [120, 152, 32] },
  tuxedo: { left: [102, 112], right: [138, 112], r: 5.5, pupil: INK, noseY: 124, body: PAPER, leg: [132, 200], neck: [120, 152, 29] },
};

/** Things a cat can be doing right now (driven by LivingCat's behavior engine). */
export type CatAction =
  | 'lickPaw'
  | 'tongue'
  | 'yawn'
  | 'scratch'
  | 'bat'
  | 'pawUp'
  | 'sniff'
  | 'curious'
  | 'alert'
  | 'freeze'
  | 'lookLeft'
  | 'lookRight'
  | 'lookUp'
  | 'nap'
  | 'stretch'
  | 'sigh'
  | 'feast'
  | 'knead'
  /** Turned toward a scratching post at its side, raking it with the paw. */
  | 'scratchPost'
  /** Looking down at something on the floor (the food bowl). */
  | 'lookDownRight'
  | 'lookDownLeft'
  /** Being petted (you tapped it): eyes shut, hearts. */
  | 'loved';

/** Expression an action forces while it runs (eyes follow what the body does). */
export const ACTION_EXPRESSION: Partial<Record<CatAction, Expression>> = {
  lickPaw: 'happyShut',
  yawn: 'sleep',
  nap: 'sleep',
  stretch: 'happyShut',
  sniff: 'hopeful',
  pawUp: 'stare',
  freeze: 'stare',
  sigh: 'sad',
  feast: 'happyShut',
  alert: 'neutral',
  knead: 'happyShut',
  loved: 'happyShut',
};

// ─── Eyes ────────────────────────────────────────────────────────────────────

/** Extra eye expressions every cat supports on top of its own default/sleep/happy/sad eyes. */
export function ExprEyes({ kind, spec }: { kind: 'hopeful' | 'stare' | 'bored'; spec: FaceSpec }) {
  const eyes = [spec.left, spec.right];
  const r = spec.r;

  if (kind === 'hopeful') {
    // Big glossy "please feed me" eyes.
    return (
      <g data-expr="hopeful">
        {eyes.map(([x, y], i) => (
          <g key={i}>
            {spec.sclera && <circle cx={x} cy={y} r={spec.sclera + 1.5} fill={PAPER} stroke={INK} strokeWidth={2.4} />}
            <circle cx={x} cy={y + 0.5} r={spec.sclera ? spec.sclera * 0.72 : r * 1.55} fill={spec.pupil} />
            <circle cx={x + r * 0.55} cy={y - r * 0.55} r={Math.max(1.8, r * 0.5)} fill={PAPER} />
            <circle cx={x - r * 0.5} cy={y + r * 0.6} r={Math.max(0.9, r * 0.22)} fill={PAPER} />
          </g>
        ))}
      </g>
    );
  }

  if (kind === 'stare') {
    // Wide, intense eyes with tiny pupils (dark cats get cat-slit pupils).
    return (
      <g data-expr="stare">
        {eyes.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={(spec.sclera ?? r * 1.6) + 1.8} fill={PAPER} stroke={INK} strokeWidth={2.4} />
            {spec.dark ? (
              <ellipse cx={x} cy={y} rx={1.8} ry={r * 1.3} fill={spec.pupil} />
            ) : (
              <circle cx={x} cy={y} r={Math.max(2, r * 0.5)} fill={spec.pupil} />
            )}
          </g>
        ))}
      </g>
    );
  }

  // bored: flat upper lid over a half-moon pupil — "any minute now…"
  return (
    <g data-expr="bored">
      {eyes.map(([x, y], i) => {
        const w = (spec.sclera ?? r * 1.4) + 1;
        return (
          <g key={i}>
            {spec.sclera && (
              <path d={`M${x - w} ${y} A ${w} ${w} 0 0 0 ${x + w} ${y} Z`} fill={PAPER} stroke={INK} strokeWidth={2} />
            )}
            <path d={`M${x - r} ${y} A ${r} ${r} 0 0 0 ${x + r} ${y} Z`} fill={spec.pupil} />
            <path d={`M${x - w - 1.5} ${y - 0.5} L${x + w + 1.5} ${y - 0.5}`} stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
}

// ─── Face overlays (drawn inside the head so they tilt with it) ──────────────

const star = (x: number, y: number, s: number) =>
  `M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z`;

const heart = (x: number, y: number, s: number) =>
  `M${x} ${y + s * 0.9} C${x - s * 1.6} ${y - s * 0.1} ${x - s * 0.9} ${y - s * 1.3} ${x} ${y - s * 0.45} C${x + s * 0.9} ${y - s * 1.3} ${x + s * 1.6} ${y - s * 0.1} ${x} ${y + s * 0.9} Z`;

const drop = (x: number, y: number, s: number) =>
  `M${x} ${y - s} C${x + s * 0.8} ${y} ${x + s * 0.7} ${y + s * 0.9} ${x} ${y + s * 0.9} C${x - s * 0.7} ${y + s * 0.9} ${x - s * 0.8} ${y} ${x} ${y - s} Z`;

function Tongue({ spec, long = false }: { spec: FaceSpec; long?: boolean }) {
  const y = spec.noseY + 6;
  const h = long ? 12 : 7;
  return (
    <path
      className="fk-tongue"
      d={`M114 ${y} C114 ${y + h} 126 ${y + h} 126 ${y} Z`}
      fill={TONGUE}
      stroke={INK}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  );
}

function OpenMouth({ spec, big = false }: { spec: FaceSpec; big?: boolean }) {
  const y = spec.noseY + (big ? 11 : 9);
  const rx = big ? 8 : 6;
  const ry = big ? 10 : 6.5;
  return (
    <g className="fk-mouth">
      <ellipse cx={120} cy={y} rx={rx} ry={ry} fill={MOUTH} stroke={INK} strokeWidth={2.2} />
      <ellipse cx={120} cy={y + ry * 0.45} rx={rx * 0.6} ry={ry * 0.4} fill={TONGUE} />
    </g>
  );
}

function Mark({ kind }: { kind: '!' | '?' | '…' }) {
  return (
    <g className="fk-pop" transform="translate(178 58)">
      <circle r={13} fill={PAPER} stroke={INK} strokeWidth={2.2} />
      <text y={6} textAnchor="middle" fontSize={kind === '…' ? 16 : 18} fontWeight={700} fill={INK} style={{ fontFamily: 'Gochi Hand, cursive' }}>
        {kind}
      </text>
    </g>
  );
}

/**
 * `mood` (0–3) rotates every few seconds in LivingCat so a state never looks
 * frozen: the tongue comes and goes, the mouth opens and closes, marks appear
 * now and then. Static drawings (galleries) use mood 0, the full look.
 */
export function FaceOverlays({
  state,
  action,
  spec,
  mood = 0,
}: {
  state: CatState;
  action?: CatAction | null;
  spec: FaceSpec;
  mood?: number;
}) {
  const parts: JSX.Element[] = [];
  const m = ((mood % 4) + 4) % 4;
  const mouthBusy = action === 'yawn' || action === 'tongue' || action === 'lickPaw' || action === 'feast' || action === 'sniff';

  // Per-action details
  if (action === 'tongue' || action === 'lickPaw') parts.push(<Tongue key="t" spec={spec} long={action === 'lickPaw'} />);
  if (action === 'yawn') parts.push(<OpenMouth key="y" spec={spec} big />);
  if (action === 'feast') {
    parts.push(<OpenMouth key="f" spec={spec} />);
    parts.push(
      <g key="crumbs" className="fk-float" fill="#C98B4B" stroke={INK} strokeWidth={1.2}>
        <circle cx={96} cy={spec.noseY + 22} r={2.6} />
        <circle cx={146} cy={spec.noseY + 18} r={2.2} />
        <circle cx={138} cy={spec.noseY + 30} r={2} />
      </g>,
    );
  }
  if (action === 'sniff' || action === 'lookDownRight' || action === 'lookDownLeft') {
    parts.push(
      <g key="sniff" className="fk-sniff" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" opacity={0.75}>
        <path d={`M100 ${spec.noseY + 2} q-5 -3 -10 0 q-5 3 -10 0`} />
        <path d={`M140 ${spec.noseY + 2} q5 -3 10 0 q5 3 10 0`} />
      </g>,
    );
  }
  if (action === 'loved') {
    parts.push(
      <g key="loved" className="fk-float" fill={HEART} stroke={INK} strokeWidth={1.4}>
        <path d={heart(60, 70, 7)} />
        <path d={heart(184, 56, 9)} />
        <path d={heart(200, 30, 6)} />
      </g>,
    );
  }
  if (action === 'curious') parts.push(<Mark key="q" kind="?" />);
  if (action === 'alert' || action === 'pawUp') parts.push(<Mark key="x" kind="!" />);
  if (action === 'freeze') parts.push(<Mark key="d" kind="…" />);
  if (action === 'sigh') {
    parts.push(
      <g key="sigh" className="fk-float" fill={PAPER} stroke={INK} strokeWidth={1.8}>
        <circle cx={82} cy={spec.noseY + 8} r={5} />
        <circle cx={70} cy={spec.noseY + 2} r={7} />
      </g>,
    );
  }

  // Per-state details (what makes each emotional state readable at a glance)
  switch (state) {
    case 'INITIAL':
      if (m >= 2) break;
      parts.push(
        <g key="sp" className="fk-twinkle" fill={GOLD} stroke={INK} strokeWidth={1.2} strokeLinejoin="round">
          <path d={star(56, 60, 7)} />
          <path d={star(186, 50, 9)} />
          <path d={star(196, 86, 5)} />
        </g>,
      );
      break;
    case 'WAITING':
      // Daydreaming about dinner — only while idle, so it never covers an action mark.
      if (action || m === 2) break;
      parts.push(
        <g key="dream" className="fk-float" stroke={INK} strokeWidth={1.8}>
          <circle cx={170} cy={70} r={3} fill={PAPER} />
          <circle cx={180} cy={58} r={4.5} fill={PAPER} />
          <ellipse cx={198} cy={38} rx={20} ry={14} fill={PAPER} />
          <path d="M188 38 q8 -8 16 0 q-8 8 -16 0 Z M204 38 l6 -5 v10 Z" fill="#8EC1E8" strokeWidth={1.4} strokeLinejoin="round" />
        </g>,
      );
      break;
    case 'ANTICIPATING':
      // tongue + drool → drool → closed mouth → tongue
      if (!mouthBusy && (m === 0 || m === 3)) parts.push(<Tongue key="t" spec={spec} />);
      if (m <= 1) parts.push(<path key="drool" className="fk-drip" d={drop(129, spec.noseY + 20, 3.4)} fill={WATER} stroke={INK} strokeWidth={1.2} />);
      break;
    case 'VERY_CLOSE':
      // gasping → sweating → trembling with the mouth shut → gasping again
      if (!mouthBusy && (m === 0 || m === 3)) parts.push(<OpenMouth key="m" spec={spec} />);
      if (m <= 1) parts.push(<path key="sweat" className="fk-drip" d={drop(176, 78, 5)} fill={WATER} stroke={INK} strokeWidth={1.4} />);
      if (m === 0 || m === 2) parts.push(
        <g key="fx" className="fk-shake" stroke={INK} strokeWidth={2.4} strokeLinecap="round">
          <path d="M52 64 L42 56" />
          <path d="M48 78 L36 76" />
          <path d="M58 52 L54 40" />
        </g>,
      );
      break;
    case 'SUCCESS':
      if (action !== 'sigh' && m !== 1) {
        parts.push(
          <g key="sigh" fill={PAPER} stroke={INK} strokeWidth={1.8}>
            <circle cx={82} cy={spec.noseY + 8} r={5} />
            <circle cx={70} cy={spec.noseY + 2} r={7} />
          </g>,
        );
      }
      parts.push(<path key="tear" d={drop(spec.left[0] - 4, spec.left[1] + 12, 3)} fill={WATER} stroke={INK} strokeWidth={1.1} />);
      break;
    case 'FAILURE':
      if (!mouthBusy && m !== 1) parts.push(<OpenMouth key="m" spec={spec} />);
      if (m !== 2) parts.push(
        <g key="sp" className="fk-twinkle" fill={GOLD} stroke={INK} strokeWidth={1.2}>
          <path d={star(52, 70, 8)} />
          <path d={star(190, 60, 8)} />
        </g>,
      );
      break;
    case 'SATISFIED':
      if (!mouthBusy && (m === 0 || m === 2)) parts.push(<Tongue key="t" spec={spec} />);
      if (m !== 2) parts.push(
        <g key="hearts" className="fk-float" fill={HEART} stroke={INK} strokeWidth={1.4}>
          <path d={heart(182, 58, 8)} />
          <path d={heart(196, 34, 5.5)} />
        </g>,
      );
      break;
    default:
      break;
  }

  return <g data-part="face-overlays">{parts}</g>;
}

// ─── The cat's own right front paw, lifted ────────────────────────────────────

/** Actions performed with the paw. While one runs, the drawn right leg is hidden (.pcat-leg-r). */
export const PAW_ACTIONS: ReadonlySet<CatAction> = new Set<CatAction>(['lickPaw', 'scratch', 'bat', 'pawUp', 'knead', 'scratchPost']);

function pawTarget(action: CatAction, spec: FaceSpec): [number, number] {
  const [lx, ly] = spec.leg;
  if (action === 'lickPaw') return [130, spec.noseY + 13];
  if (action === 'bat') return [lx + 48, ly + 54]; // out to the side at floor level, where the toy lies (rotated back to wind up)
  if (action === 'knead') return [lx + 6, ly + 40]; // pressing down on the blanket in front
  if (action === 'scratchPost') return [lx + 62, ly - 20]; // reaching out sideways to the post
  return [lx + 30, ly - 58]; // scratch / pawUp: raised high beside the face
}

export function PawOverlay({ action, spec, noYarn = false }: { action?: CatAction | null; spec: FaceSpec; noYarn?: boolean }) {
  if (!action || !PAW_ACTIONS.has(action)) return null;
  const [lx, ly] = spec.leg;
  const [px, py] = pawTarget(action, spec);
  const outline = spec.dark ? '#FFFDF9' : INK;
  const limb = `M${lx} ${ly} Q${(lx + px) / 2 + 6} ${(ly + py) / 2} ${px} ${py}`;
  const origin = { transformOrigin: `${lx}px ${ly}px` };
  const loop =
    action === 'lickPaw'
      ? 'fk-paw-lick'
      : action === 'bat'
        ? 'fk-paw-bat'
        : action === 'pawUp'
          ? 'fk-paw-tap'
          : action === 'knead'
            ? 'fk-paw-knead'
            : 'fk-paw-scratch'; // scratch + scratchPost

  return (
    <g data-part="paw" className="fk-paw-in" style={origin}>
      <g className={loop} style={origin}>
        {/* Same line weight as the drawn legs, filled with the body colour. */}
        <path d={limb} stroke={outline} strokeWidth={10} strokeLinecap="round" fill="none" opacity={spec.dark ? 0.85 : 1} />
        <path d={limb} stroke={spec.body} strokeWidth={5.4} strokeLinecap="round" fill="none" />
        <ellipse cx={px} cy={py} rx={7.5} ry={6.8} fill={spec.body} stroke={outline} strokeWidth={2.2} opacity={spec.dark ? 0.95 : 1} />
        <g fill="#F4A3AE">
          <circle cx={px - 3} cy={py - 2.4} r={1.4} />
          <circle cx={px} cy={py - 3.6} r={1.4} />
          <circle cx={px + 3} cy={py - 2.4} r={1.4} />
          <ellipse cx={px} cy={py + 1.8} rx={2.6} ry={2} />
        </g>
      </g>
      {action === 'scratch' && (
        <g className="fk-scratch" stroke={INK} strokeWidth={2.2} strokeLinecap="round">
          <path d={`M${px + 16} ${py + 2} l9 -13`} />
          <path d={`M${px + 22} ${py + 8} l9 -13`} />
          <path d={`M${px + 28} ${py + 14} l9 -13`} />
        </g>
      )}
      {/* A real toy from the shop replaces the imaginary yarn. */}
      {action === 'bat' && !noYarn && (
        <g className="fk-yarn" style={{ transformOrigin: `${px + 20}px ${py + 4}px` }}>
          <circle cx={px + 20} cy={py + 4} r={11} fill="#E76F51" stroke={INK} strokeWidth={2.2} />
          <path
            d={`M${px + 11} ${py - 1} q9 5 18 0 M${px + 10} ${py + 7} q10 5 20 0 M${px + 16} ${py - 6} q-2 10 3 20`}
            fill="none"
            stroke="#FFFDF9"
            strokeWidth={1.5}
            opacity={0.9}
          />
          <path d={`M${px + 30} ${py + 8} q12 4 8 12`} fill="none" stroke="#E76F51" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

// ─── Wearables from the shop (collar with bell, bow tie) ─────────────────────

export interface CatWear {
  collar?: boolean;
  bow?: boolean;
}

/** Drawn as the last thing in the body group, so the head overlaps its top edge like a real chin. */
export function Wearables({ wear, spec }: { wear?: CatWear; spec: FaceSpec }) {
  if (!wear?.collar && !wear?.bow) return null;
  const [cx, y, hw] = spec.neck;
  const band = `M${cx - hw} ${y - 3} Q${cx} ${y + 9} ${cx + hw} ${y - 3}`;
  const bellY = y + (wear.bow ? 15 : 9);
  return (
    <g data-part="wearables">
      {wear.collar && (
        <g data-item="collar-bell">
          <path d={band} stroke={INK} strokeWidth={8.5} fill="none" strokeLinecap="round" />
          <path d={band} stroke="#D64545" strokeWidth={5} fill="none" strokeLinecap="round" />
          <g className="fk-bell">
            <circle cx={cx} cy={bellY} r={5.2} fill={GOLD} stroke={INK} strokeWidth={1.8} />
            <path d={`M${cx - 3} ${bellY + 1} h6`} stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
            <circle cx={cx} cy={bellY + 3.4} r={1.1} fill={INK} />
          </g>
        </g>
      )}
      {wear.bow && (
        <g data-item="bow-tie" strokeLinejoin="round">
          <path d={`M${cx} ${y + 4} L${cx - 15} ${y - 4} L${cx - 15} ${y + 13} Z`} fill="#3E7CB1" stroke={INK} strokeWidth={2} />
          <path d={`M${cx} ${y + 4} L${cx + 15} ${y - 4} L${cx + 15} ${y + 13} Z`} fill="#3E7CB1" stroke={INK} strokeWidth={2} />
          <circle cx={cx - 9} cy={y + 3} r={1.4} fill={PAPER} />
          <circle cx={cx + 9} cy={y + 6} r={1.4} fill={PAPER} />
          <rect x={cx - 4} y={y} width={8} height={8} rx={2.5} fill="#2F5F8A" stroke={INK} strokeWidth={2} />
        </g>
      )}
    </g>
  );
}

/** CSS for the face kit + state postures. Lives inside every <Cat> so static galleries get it too. */
export const FACE_KIT_CSS = `
  .pcat-head { transform-box: fill-box; transform-origin: 50% 92%; transition: rotate 0.45s cubic-bezier(0.34,1.56,0.64,1), translate 0.45s cubic-bezier(0.34,1.56,0.64,1); }
  .pcat-body { transition: scale 0.5s cubic-bezier(0.34,1.56,0.64,1), translate 0.5s ease; }
  /* Eyes follow your cursor / finger: CatScene sets --gx/--gy (action looks below still win). */
  .pcat-eyes { translate: var(--gx, 0px) var(--gy, 0px); transition: translate 0.25s ease; }

  /* State postures — individual transform properties stack on top of the breathing/tail animations. */
  .pcat-st-INITIAL .pcat-head { translate: 0 -3px; }
  .pcat-st-WAITING .pcat-head { rotate: 4deg; }
  .pcat-st-ANTICIPATING .pcat-head { rotate: -5deg; translate: 0 -2px; }
  .pcat-st-VERY_CLOSE .pcat-head { translate: 0 5px; }
  .pcat-st-VERY_CLOSE .pcat-body { scale: 1.04 0.95; }
  .pcat-st-SUCCESS .pcat-head { rotate: 9deg; translate: 0 6px; }
  .pcat-st-SUCCESS .pcat-body { scale: 1.03 0.94; }
  .pcat-st-SATISFIED .pcat-head { rotate: -6deg; }
  .pcat-st-SATISFIED .pcat-body { scale: 1.06 1; }
  .pcat-st-FAILURE .pcat-head { translate: 0 -4px; }

  /* Actions */
  .pcat-act-lookLeft .pcat-eyes { translate: -3.5px 0; }
  .pcat-act-lookRight .pcat-eyes { translate: 3.5px 0; }
  .pcat-act-lookUp .pcat-eyes { translate: 0 -3px; }
  .pcat-act-lookUp .pcat-head { rotate: -8deg; }
  .pcat-act-sniff .pcat-head { rotate: 6deg; translate: 0 8px; }
  .pcat-act-yawn .pcat-head { rotate: -10deg; translate: 0 -3px; }
  .pcat-act-lickPaw .pcat-head { rotate: 7deg; translate: 2px 3px; }
  .pcat-act-curious .pcat-head { rotate: -11deg; }
  .pcat-act-stretch .pcat-body { scale: 1.06 1.1; translate: 0 -3px; }
  .pcat-act-freeze .pcat-body { scale: 1.02 1.04; }
  .pcat-act-bat .pcat-head { rotate: 8deg; }
  .pcat-act-pawUp .pcat-head { rotate: -6deg; }
  .pcat-act-nap .pcat-head { rotate: 10deg; translate: 0 6px; }
  .pcat-act-knead .pcat-head { rotate: 4deg; translate: 0 2px; }
  .pcat-act-scratchPost .pcat-head { rotate: 5deg; }
  /* Looking down at the bowl: head dips toward it, eyes follow. */
  .pcat-act-lookDownRight .pcat-head { rotate: 9deg; translate: 3px 6px; }
  .pcat-act-lookDownRight .pcat-eyes { translate: 3px 3px; }
  .pcat-act-lookDownLeft .pcat-head { rotate: -9deg; translate: -3px 6px; }
  .pcat-act-lookDownLeft .pcat-eyes { translate: -3px 3px; }

  /* Wearables (collar bell swings gently; harder while the cat hops/plays) */
  .fk-bell { transform-box: fill-box; transform-origin: 50% 0%; animation: fk-bell 2.4s ease-in-out infinite; }
  .pcat-act-alert .fk-bell, .pcat-act-bat .fk-bell, .pcat-act-pawUp .fk-bell { animation-duration: 0.5s; }
  @keyframes fk-bell { 0%,100% { rotate: -8deg; } 50% { rotate: 8deg; } }

  .fk-twinkle { animation: fk-twinkle 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
  .fk-float { animation: fk-float 2.8s ease-in-out infinite; }
  .fk-drip { animation: fk-drip 1.8s ease-in infinite; }
  .fk-shake { animation: fk-shake 0.5s steps(2) infinite; }
  .fk-sniff { animation: fk-sniff 0.5s ease-in-out infinite alternate; }
  .fk-pop { animation: fk-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) both; transform-box: fill-box; transform-origin: 50% 50%; }
  /* The drawn right leg hides while the same leg is lifted. */
  .pcat-paw-on .pcat-leg-r { opacity: 0; }

  .fk-paw-in { animation: fk-paw-in 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }
  .fk-paw-lick { animation: fk-lick 0.6s ease-in-out infinite alternate; }
  .fk-paw-scratch { animation: fk-scratch-swipe 0.8s ease-in-out infinite; }
  .fk-paw-tap { animation: fk-tap 0.55s ease-in-out infinite; }
  .fk-paw-bat { animation: fk-bat 1.2s ease-in-out infinite; }
  .fk-paw-knead { animation: fk-knead 0.45s ease-in-out infinite alternate; }
  .fk-yarn { animation: fk-yarn-hit 1.2s ease-in-out infinite; }
  .fk-scratch { animation: fk-claw 0.8s ease-in-out infinite; }

  @keyframes fk-twinkle { 0%,100% { opacity: .5; scale: .8; } 50% { opacity: 1; scale: 1.1; } }
  @keyframes fk-float { 0%,100% { translate: 0 0; } 50% { translate: 0 -4px; } }
  @keyframes fk-drip { 0% { translate: 0 -4px; opacity: 0; } 20% { opacity: 1; } 100% { translate: 0 8px; opacity: 0; } }
  @keyframes fk-shake { 0% { translate: -1px 0; } 100% { translate: 1px 0; } }
  @keyframes fk-sniff { from { opacity: .35; } to { opacity: .9; } }
  @keyframes fk-pop { from { scale: .3; opacity: 0; } to { scale: 1; opacity: 1; } }
  @keyframes fk-paw-in { from { scale: 0.55; opacity: 0; } to { scale: 1; opacity: 1; } }
  @keyframes fk-lick { from { translate: 0 0; } to { translate: -2px -6px; } }
  /* Scratch: pull down along the post, lift, repeat. */
  @keyframes fk-scratch-swipe { 0% { rotate: -6deg; } 45% { rotate: 14deg; } 60% { rotate: 16deg; } 100% { rotate: -6deg; } }
  @keyframes fk-claw { 0%, 35% { opacity: 0; } 55%, 80% { opacity: 0.9; } 100% { opacity: 0; } }
  /* Tap-tap-tap on the cabinet door. */
  /* Knead: press, lift, press — slow and content. */
  @keyframes fk-knead { from { translate: 0 0; rotate: 0deg; } to { translate: 0 -6px; rotate: -8deg; } }
  @keyframes fk-tap { 0%, 100% { rotate: 0deg; } 50% { rotate: -12deg; } }
  /* Bat: wind up (paw back) → strike → follow through → reset. The yarn is hit at ~50%. */
  @keyframes fk-bat { 0% { rotate: -40deg; } 38% { rotate: -46deg; } 50% { rotate: 6deg; } 64% { rotate: 2deg; } 100% { rotate: -40deg; } }
  @keyframes fk-yarn-hit { 0%, 47% { translate: 0 0; rotate: 0deg; } 62% { translate: 22px -12px; rotate: 100deg; } 82% { translate: 12px 0; rotate: 160deg; } 100% { translate: 0 0; rotate: 200deg; } }

  @media (prefers-reduced-motion: reduce) {
    .fk-twinkle, .fk-float, .fk-drip, .fk-shake, .fk-sniff, .fk-pop, .fk-paw-in, .fk-paw-lick, .fk-paw-scratch, .fk-paw-tap, .fk-paw-bat, .fk-paw-knead, .fk-yarn, .fk-scratch, .fk-bell { animation: none !important; }
  }
`;
