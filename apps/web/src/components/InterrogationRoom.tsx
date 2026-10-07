import type { CatId } from '@purrpose/shared';
import { Cat, type Expression } from '@purrpose/cats';

const INK = '#26201D';

/** A lamp hanging from (cx, 0) that swings slowly left ↔ right; its cone lights what's beneath. */
export function LampSwing({
  cx,
  cord,
  floorY,
  spread,
  idPrefix,
}: {
  cx: number;
  cord: number;
  floorY: number;
  spread: number;
  idPrefix: string;
}) {
  const shadeTop = cord;
  const shadeBottom = cord + 24;
  return (
    <g className="ir-swing" style={{ transformOrigin: `${cx}px 0px` }} pointerEvents="none">
      <polygon
        points={`${cx - 26},${shadeBottom} ${cx + 26},${shadeBottom} ${cx + spread},${floorY} ${cx - spread},${floorY}`}
        fill={`url(#${idPrefix}-cone)`}
        style={{ mixBlendMode: 'screen' }}
      />
      <line x1={cx} y1={-4} x2={cx} y2={shadeTop} stroke="#1A1C20" strokeWidth={2.4} />
      <path
        d={`M${cx - 16} ${shadeTop} L${cx + 16} ${shadeTop} L${cx + 30} ${shadeBottom} L${cx - 30} ${shadeBottom} Z`}
        fill="#4C5A52"
        stroke={INK}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <ellipse cx={cx} cy={shadeBottom + 2} rx={11} ry={5} fill="#FFF3C9" className="ir-bulb" />
    </g>
  );
}

/** Same cone, as a hole in the darkness (used inside a <mask>). */
export function LampHole({ cx, cord, floorY, spread }: { cx: number; cord: number; floorY: number; spread: number }) {
  const shadeBottom = cord + 24;
  return (
    <g className="ir-swing" style={{ transformOrigin: `${cx}px 0px` }}>
      <polygon
        points={`${cx - 22},${shadeBottom} ${cx + 22},${shadeBottom} ${cx + spread},${floorY} ${cx - spread},${floorY}`}
        fill="#000"
        filter="url(#ir-soft)"
      />
      <circle cx={cx} cy={shadeBottom + 4} r={26} fill="#000" filter="url(#ir-soft)" />
    </g>
  );
}

export function WaterGlass({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} pointerEvents="none">
      <ellipse cx={0} cy={0} rx={17} ry={4} fill="rgba(0,0,0,0.28)" />
      <path d="M-15 -44 L15 -44 L11 -1 Q0 2 -11 -1 Z" fill="rgba(210,235,255,0.22)" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M-13.6 -30 Q0 -27 13.6 -30 L11 -1 Q0 2 -11 -1 Z" fill="rgba(110,175,230,0.55)" />
      <ellipse cx={0} cy={-30} rx={13.6} ry={2.6} fill="rgba(190,225,250,0.9)" stroke={INK} strokeWidth={1} />
      <ellipse cx={0} cy={-44} rx={15} ry={3} fill="none" stroke={INK} strokeWidth={2} />
      <path d="M-9 -38 L-7 -8" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" opacity={0.75} />
    </g>
  );
}

export function RoomDefs({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3A424E" />
        <stop offset="1" stopColor="#2A3038" />
      </linearGradient>
      <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE6A0" stopOpacity="0.6" />
        <stop offset="1" stopColor="#FFE6A0" stopOpacity="0.06" />
      </linearGradient>
      <filter id="ir-soft" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
    </>
  );
}

const W = 380;
const H = 420;
const FLOOR = 300;
const TABLE = 318;
const CAT_X = 190;

/**
 * The interrogation room: the detective cat (fedora, round glasses) on a tall
 * wooden chair behind the table, a glass of water for the suspect, and one lamp
 * slowly swinging overhead — the room is dim, the cone lights whatever is under it.
 */
export function InterrogationRoom({
  catId,
  expression = 'bored',
  headTilt = 0,
  reduced = false,
}: {
  catId: CatId;
  expression?: Expression;
  headTilt?: -1 | 0 | 1;
  reduced?: boolean;
}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`interrogation-room ${reduced ? 'is-reduced' : ''}`}
      role="img"
      aria-label="An interrogation room. The detective cat sits behind the table, watching you."
    >
      <defs>
        <RoomDefs id="ir" />
        <mask id="ir-dark">
          <rect x={0} y={0} width={W} height={H} fill="#fff" />
          <LampHole cx={CAT_X} cord={58} floorY={H} spread={120} />
        </mask>
      </defs>

      {/* Back wall with panels, a one-way mirror and the case board */}
      <rect x={0} y={0} width={W} height={FLOOR} fill="url(#ir-wall)" />
      <g stroke="#232830" strokeWidth={2}>
        {[64, 128, 252, 316].map(x => (
          <line key={x} x1={x} y1={0} x2={x} y2={FLOOR} />
        ))}
      </g>
      <g>
        <rect x={18} y={70} width={100} height={92} rx={3} fill="#151A21" stroke="#0E1116" strokeWidth={5} />
        <path d="M30 150 L70 80 M48 154 L92 78" stroke="#3A4656" strokeWidth={5} strokeLinecap="round" opacity={0.6} />
      </g>
      <g>
        <rect x={266} y={62} width={96} height={82} rx={3} fill="#A47B52" stroke={INK} strokeWidth={2.2} />
        <rect x={276} y={72} width={26} height={30} fill="#F3EEE4" stroke={INK} strokeWidth={1.4} transform="rotate(-6 289 87)" />
        <path d="M282 86 q6 -6 12 0 q-6 6 -12 0 Z M294 86 l5 -4 v8 Z" fill="#E7894E" stroke={INK} strokeWidth={1} transform="rotate(-6 289 87)" />
        <rect x={318} y={78} width={30} height={22} fill="#F7E7A6" stroke={INK} strokeWidth={1.4} transform="rotate(5 333 89)" />
        <rect x={300} y={110} width={34} height={24} fill="#F3EEE4" stroke={INK} strokeWidth={1.4} transform="rotate(-3 317 122)" />
        <path d="M289 76 L333 82 L317 114 Z" fill="none" stroke="#C0392B" strokeWidth={1.6} />
        {[[289, 76], [333, 82], [317, 114]].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r={3} fill="#C0392B" stroke={INK} strokeWidth={1} />
        ))}
      </g>
      <rect x={0} y={FLOOR - 8} width={W} height={8} fill="#1D2127" />
      <rect x={0} y={FLOOR} width={W} height={H - FLOOR} fill="#26211E" />

      {/* Tall wooden chair */}
      <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
        <rect x={CAT_X - 54} y={120} width={11} height={206} rx={3} fill="#8B5E3C" />
        <rect x={CAT_X + 43} y={120} width={11} height={206} rx={3} fill="#8B5E3C" />
        <path d={`M${CAT_X - 60} 128 Q${CAT_X} 104 ${CAT_X + 60} 128 L${CAT_X + 60} 146 Q${CAT_X} 124 ${CAT_X - 60} 146 Z`} fill="#9C6B45" />
        {[-24, 0, 24].map(dx => (
          <rect key={dx} x={CAT_X + dx - 5} y={140} width={10} height={130} fill="#7A5236" />
        ))}
      </g>

      {/* The detective */}
      <g transform={`translate(${CAT_X} 340) scale(0.84)`}>
        <g transform="translate(-120 -254)">
          <Cat catId={catId} state="INITIAL" expression={expression} headTilt={headTilt} size={240} wear={{ detective: true }} showGround={false} />
        </g>
      </g>

      {/* Table, case file, water for the suspect */}
      <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
        <path d={`M20 ${TABLE} L${W - 20} ${TABLE} L${W - 6} ${TABLE + 22} L6 ${TABLE + 22} Z`} fill="#6B4A33" />
        <rect x={10} y={TABLE + 22} width={W - 20} height={H - TABLE - 22} fill="#4E3626" />
      </g>
      <g stroke="#3D2A1D" strokeWidth={1.6} strokeLinecap="round" opacity={0.8}>
        <path d={`M40 ${TABLE + 50} q60 -6 120 0 M210 ${TABLE + 70} q70 6 140 -2 M60 ${TABLE + 86} q50 4 100 0`} fill="none" />
      </g>
      <g transform={`translate(58 ${TABLE + 2}) rotate(-4)`} stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
        <path d="M0 0 L74 0 L80 14 L-6 14 Z" fill="#D9B26F" />
        <path d="M8 -4 L28 -4 L30 0 L6 0 Z" fill="#C99E57" />
        <text x={37} y={10.5} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK} stroke="none" style={{ letterSpacing: 1 }}>
          CASE
        </text>
      </g>
      <WaterGlass x={300} y={TABLE + 8} />

      {/* Dim room; the swinging lamp lights what's beneath it */}
      <rect x={0} y={0} width={W} height={H} fill="#06080B" opacity={0.6} mask="url(#ir-dark)" pointerEvents="none" />
      <LampSwing cx={CAT_X} cord={58} floorY={H} spread={120} idPrefix="ir" />
    </svg>
  );
}
