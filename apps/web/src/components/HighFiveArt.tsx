/**
 * The picture on the "pact sealed" card: the real cat (same drawing as everywhere
 * else in the app, legs and all) lifts a paw, and your hand comes in from the right
 * for a high-five. `clasped` is the moment they meet.
 */
import { Cat, FACE_SPECS } from '@purrpose/cats';
import type { CatId } from '@purrpose/shared';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const INK = '#26201D';
const SKIN = '#F6D9BC';
const SKIN_SHADE = '#E9BF98';

/** Where the cat sits in the card's 280×220 box, and how big. */
const CAT_X = -4;
const CAT_Y = -14;
const CAT_SIZE = 200;

/** Where this cat's lifted paw ends up in the card (FaceKit raises it to leg + (52, -62)). */
function pawAt(catId: CatId): { x: number; y: number } {
  const [lx, ly] = (FACE_SPECS[catId] ?? FACE_SPECS.orange).leg;
  const k = CAT_SIZE / 240;
  return { x: CAT_X + (lx + 52) * k, y: CAT_Y + (ly - 62) * k };
}

/**
 * An open right hand, palm toward you, fingers up. Drawn as one silhouette: every
 * shape is stroked thick in ink first, then filled on top, so overlaps merge into a
 * single clean outline. Origin = the middle of the palm's left edge (where it meets the paw).
 */
function Hand() {
  const fingers: Array<[number, number, number, number]> = [
    // x (centre), top, bottom, half-width
    [16, -50, -6, 6.2], // index
    [29, -56, -6, 6.4], // middle
    [42, -51, -4, 6.1], // ring
    [53, -40, 0, 5.4], // little
  ];
  const finger = ([x, top, bottom, r]: [number, number, number, number]) =>
    `M${x - r} ${bottom} V${top + r} A${r} ${r} 0 0 1 ${x + r} ${top + r} V${bottom} Z`;
  const palm = 'M6 -10 C6 -16 58 -16 59 -6 C61 8 58 26 50 34 C42 42 22 42 14 34 C8 28 6 14 6 -10 Z';
  // Thumb: from the lower-left of the palm, out to the left and up.
  const thumb = 'M14 22 C4 18 -6 8 -10 -2 C-13 -9 -5 -14 0 -8 C5 -2 10 2 16 4 Z';
  const shapes = [...fingers.map(finger), palm, thumb];
  return (
    <g>
      {/* Sleeve and cuff going off to the lower right. */}
      <g transform="rotate(-28 34 44)">
        <rect x={14} y={40} width={42} height={70} rx={6} fill="#7FA7CF" stroke={INK} strokeWidth={2.6} />
        <rect x={11} y={38} width={48} height={12} rx={4} fill="#EEF3F8" stroke={INK} strokeWidth={2.4} />
      </g>
      <g stroke={INK} strokeWidth={5.2} strokeLinejoin="round" fill={INK}>
        {shapes.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill={SKIN}>
        {shapes.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {/* Palm lines, finger gaps and knuckle creases. */}
      <g fill="none" stroke={INK} strokeLinecap="round">
        <path d="M22.5 -10 V-24 M35.5 -9 V-22 M47.5 -7 V-18" strokeWidth={1.8} />
        <path d="M16 14 C24 8 38 6 50 8" strokeWidth={1.5} opacity={0.55} />
        <path d="M18 24 C26 18 36 20 42 28" strokeWidth={1.5} opacity={0.45} />
        <path d="M13.5 -34 h5 M26.5 -40 h5 M39.5 -35 h5 M51 -26 h4" strokeWidth={1.4} opacity={0.5} />
      </g>
      <path d="M4 -4 C1 -6 -2 -6 -4 -3" fill="none" stroke={SKIN_SHADE} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

/** The cat (or its paw-only copy) sliding in from the left and bouncing on the clap. */
function CatSlide({ clasped, children }: { clasped: boolean; children: ReactNode }) {
  return (
    <motion.g
      initial={{ x: -140, opacity: 0 }}
      animate={{ x: 0, opacity: 1, y: clasped ? [0, -5, 2, -3, 0] : 0 }}
      transition={{ x: { duration: 0.42, ease: [0.16, 1, 0.3, 1] }, y: { duration: 0.65, ease: 'easeInOut' } }}
    >
      <g transform={`translate(${CAT_X} ${CAT_Y})`}>{children}</g>
    </motion.g>
  );
}

export function HighFiveArt({ catId, clasped }: { catId: CatId; clasped: boolean }) {
  const PAW = pawAt(catId);
  const clipId = `hf-paw-${catId}`;
  const cat = <Cat catId={catId} state="INITIAL" action="highFive" mood={2} size={CAT_SIZE} showGround />;
  return (
    <>
      {/* The cat slides in from the left, already reaching up. */}
      <CatSlide clasped={clasped}>{cat}</CatSlide>

      {/* Your hand comes in from the right, over the cat's tail… */}
      <motion.g
        initial={{ x: 140, opacity: 0 }}
        animate={{ x: clasped ? [0, -4, 0] : 0, opacity: 1, y: clasped ? [0, -5, 2, -3, 0] : 0 }}
        transition={{ x: { duration: 0.42, ease: [0.16, 1, 0.3, 1] }, y: { duration: 0.65, ease: 'easeInOut' } }}
      >
        <g transform={`translate(${PAW.x + 13} ${PAW.y - 2}) rotate(12)`}>
          <Hand />
        </g>
      </motion.g>

      {/* …and the paw presses against its palm: the same cat again, cut down to just the paw. */}
      <defs>
        <clipPath id={clipId}>
          <circle cx={PAW.x} cy={PAW.y} r={13} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <CatSlide clasped={clasped}>{cat}</CatSlide>
      </g>

      {/* The "pap!" at the moment they meet. */}
      {clasped && (
        <motion.g
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: [0, 1, 1, 0.9] }}
          transition={{ duration: 0.4, ease: 'backOut' }}
          style={{ transformOrigin: `${PAW.x + 4}px ${PAW.y - 4}px` }}
          stroke={INK}
          strokeWidth={2.6}
          strokeLinecap="round"
        >
          <path d={`M${PAW.x - 4} ${PAW.y - 34} l-3 -12`} />
          <path d={`M${PAW.x + 10} ${PAW.y - 36} l3 -12`} />
          <path d={`M${PAW.x - 20} ${PAW.y - 24} l-9 -8`} />
        </motion.g>
      )}
    </>
  );
}
