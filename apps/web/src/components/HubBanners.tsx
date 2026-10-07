import { useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cat } from '@purrpose/cats';
import { LampHole, LampSwing, RoomDefs, WaterGlass } from './InterrogationRoom.js';

const INK = '#26201D';
const BW = 360;
const BH = 140;

/** A cat drawn at (x, feetY) and scale s inside a banner. */
function BannerCat({ x, y, s, children }: { x: number; y: number; s: number; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g transform="translate(-120 -254)">{children}</g>
    </g>
  );
}

/**
 * A door into one room: a short looping scene, darkened on the left so the title
 * reads. Hover (mouse) or press-and-hold (touch) shows what the room is for;
 * a tap/click goes in.
 */
export function HubBanner({
  to,
  title,
  blurb,
  badge,
  children,
}: {
  to: string;
  title: string;
  blurb: string;
  badge?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const [info, setInfo] = useState(false);
  const held = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const startHold = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    held.current = false;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      held.current = true;
      setInfo(true);
    }, 420);
  };
  const endHold = () => {
    window.clearTimeout(timer.current);
    if (held.current) window.setTimeout(() => setInfo(false), 2200);
  };

  return (
    <a
      href={to}
      className={`hub-banner ${info ? 'show-info' : ''}`}
      aria-label={`${title}. ${blurb}`}
      onClick={e => {
        e.preventDefault();
        if (held.current) {
          held.current = false;
          return; // that was a long press: just show the description
        }
        navigate(to);
      }}
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerCancel={endHold}
      onPointerLeave={endHold}
      onContextMenu={e => e.preventDefault()}
    >
      <div className="hub-banner-scene" aria-hidden>
        {children}
      </div>
      <div className="hub-banner-shade" aria-hidden />
      <div className="hub-banner-text">
        <span className="hub-banner-title">{title}</span>
        {badge && <span className="hub-banner-badge">{badge}</span>}
      </div>
      <div className="hub-banner-info" aria-hidden>
        <p>{blurb}</p>
      </div>
    </a>
  );
}

/** A stray in its box on the street, a clock ticking down on the wall. */
export function PactsBanner({ reduced }: { reduced: boolean }) {
  return (
    <svg viewBox={`0 0 ${BW} ${BH}`} preserveAspectRatio="xMidYMid slice" className={reduced ? 'is-reduced' : ''}>
      <rect width={BW} height={BH} fill="#D8C2A7" />
      <g stroke="#C4AA8C" strokeWidth={2}>
        {[22, 50, 78].map(y => (
          <line key={y} x1={0} y1={y} x2={BW} y2={y} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <line key={i} x1={i * 46 + (i % 2) * 23} y1={0} x2={i * 46 + (i % 2) * 23} y2={22} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <line key={`b${i}`} x1={i * 46 + ((i + 1) % 2) * 23} y1={22} x2={i * 46 + ((i + 1) % 2) * 23} y2={50} />
        ))}
      </g>
      <rect y={100} width={BW} height={40} fill="#B9AE9F" />
      <line x1={0} y1={100} x2={BW} y2={100} stroke={INK} strokeWidth={2} />
      {/* wall clock counting down */}
      <g transform="translate(300 42)">
        <circle r={20} fill="#FFFDF9" stroke={INK} strokeWidth={2.4} />
        <line y2={-13} stroke={INK} strokeWidth={2.4} strokeLinecap="round" className="hb-clock-hand" />
        <line x2={9} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        <circle r={2.4} fill={INK} />
      </g>
      {/* the box */}
      <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
        <path d="M168 86 L282 86 L276 124 L174 124 Z" fill="#C8955C" />
      </g>
      <BannerCat x={226} y={120} s={0.42}>
        <Cat catId="orange" state="WAITING" size={240} showGround={false} />
      </BannerCat>
      <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
        <path d="M164 96 L286 96 L280 132 L170 132 Z" fill="#D6A56B" />
        <path d="M164 96 L150 82 L176 86 Z M286 96 L300 82 L274 86 Z" fill="#B88350" />
      </g>
      <g className="hb-float" fill="#E7894E" stroke={INK} strokeWidth={1.4}>
        <path d="M120 60 q8 -8 16 0 q-8 8 -16 0 Z M136 60 l6 -5 v10 Z" />
      </g>
    </svg>
  );
}

/** Night, rain on the window, a breathing lamp, a cat asleep on its cushion. */
export function FocusBanner({ reduced }: { reduced: boolean }) {
  return (
    <svg viewBox={`0 0 ${BW} ${BH}`} preserveAspectRatio="xMidYMid slice" className={reduced ? 'is-reduced' : ''}>
      <defs>
        <linearGradient id="hb-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141B33" />
          <stop offset="1" stopColor="#2A2F52" />
        </linearGradient>
        <radialGradient id="hb-lamp">
          <stop offset="0" stopColor="#FFD98A" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFD98A" stopOpacity="0" />
        </radialGradient>
        <clipPath id="hb-window">
          <rect x={150} y={8} width={196} height={84} />
        </clipPath>
      </defs>
      <rect width={BW} height={BH} fill="#3B2C2A" />
      <rect x={150} y={8} width={196} height={84} fill="url(#hb-night)" />
      <g clipPath="url(#hb-window)" className="hb-rain" stroke="#9CC3F0" strokeWidth={1.4} strokeLinecap="round" opacity={0.7}>
        {Array.from({ length: 28 }, (_, i) => (
          <line key={i} x1={150 + ((i * 37) % 200)} y1={((i * 23) % 90) - 10} x2={146 + ((i * 37) % 200)} y2={((i * 23) % 90) + 4} />
        ))}
      </g>
      <rect x={150} y={8} width={196} height={84} fill="none" stroke={INK} strokeWidth={3} />
      <line x1={248} y1={8} x2={248} y2={92} stroke={INK} strokeWidth={3} />
      <rect y={92} width={BW} height={48} fill="#5A4034" />
      <circle cx={60} cy={56} r={70} fill="url(#hb-lamp)" className="hb-breathe" />
      <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
        <line x1={60} y1={60} x2={60} y2={98} strokeWidth={3} />
        <path d="M44 60 L76 60 L68 36 L52 36 Z" fill="#F7C860" />
        <rect x={40} y={98} width={40} height={8} rx={2} fill="#75553D" />
      </g>
      <ellipse cx={186} cy={126} rx={66} ry={14} fill="#C9673F" stroke={INK} strokeWidth={2.4} />
      <BannerCat x={186} y={128} s={0.4}>
        <Cat catId="black" state="SLEEPING" size={240} showGround={false} />
      </BannerCat>
      <path d="M120 124 Q186 142 252 124 L252 130 Q186 148 120 130 Z" fill="#D9774C" stroke={INK} strokeWidth={2} />
      <g className="hb-zzz" fill="#F5C08B" fontWeight={700} style={{ fontFamily: 'Gochi Hand, cursive' }}>
        <text x={214} y={66} fontSize={16}>z</text>
        <text x={226} y={54} fontSize={12}>z</text>
      </g>
    </svg>
  );
}

/** The interrogation room: detective cat, water glass, the lamp sweeping across. */
export function DetectiveBanner({ reduced }: { reduced: boolean }) {
  const cx = 230;
  return (
    <svg viewBox={`0 0 ${BW} ${BH}`} preserveAspectRatio="xMidYMid slice" className={reduced ? 'is-reduced' : ''}>
      <defs>
        <RoomDefs id="hbd" />
        <mask id="hbd-dark">
          <rect width={BW} height={BH} fill="#fff" />
          <LampHole cx={cx} cord={6} floorY={BH + 20} spread={70} />
        </mask>
      </defs>
      <rect width={BW} height={BH} fill="url(#hbd-wall)" />
      <g stroke="#232830" strokeWidth={2}>
        {[60, 120, 300].map(x => (
          <line key={x} x1={x} y1={0} x2={x} y2={BH} />
        ))}
      </g>
      <rect x={70} y={18} width={58} height={44} fill="#151A21" stroke="#0E1116" strokeWidth={4} />
      <g stroke={INK} strokeWidth={2} strokeLinejoin="round">
        <rect x={cx - 34} y={34} width={8} height={100} fill="#8B5E3C" />
        <rect x={cx + 26} y={34} width={8} height={100} fill="#8B5E3C" />
        <path d={`M${cx - 38} 40 Q${cx} 26 ${cx + 38} 40 L${cx + 38} 50 Q${cx} 36 ${cx - 38} 50 Z`} fill="#9C6B45" />
      </g>
      <BannerCat x={cx} y={126} s={0.42}>
        <Cat catId="tuxedo" state="INITIAL" expression="bored" size={240} showGround={false} wear={{ detective: true }} />
      </BannerCat>
      <g stroke={INK} strokeWidth={2.2} strokeLinejoin="round">
        <path d={`M110 112 L${BW + 4} 112 L${BW + 4} 124 L104 124 Z`} fill="#6B4A33" />
        <rect x={104} y={124} width={BW} height={20} fill="#4E3626" />
      </g>
      <WaterGlass x={300} y={116} s={0.62} />
      <rect width={BW} height={BH} fill="#06080B" opacity={0.6} mask="url(#hbd-dark)" />
      <LampSwing cx={cx} cord={6} floorY={BH + 20} spread={70} idPrefix="hbd" />
    </svg>
  );
}
