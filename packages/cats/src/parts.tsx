import type { CatSeedConfig, Expression } from './types.js';
import type { TailHint } from './poses.js';

export const INK = '#26201D';
export const PAPER = '#FAF6EE';

// ============================================================================
// 1. TAIL GEOMETRY TABLE
// All tails designed with an integrated root that attaches directly to the body
// ============================================================================

const TAIL_UP: Record<string, { d: string; width: number; fill?: string; stroke?: string }> = {
  // 1. Winston: Striped curl tail on left
  rootedStripedCurl: {
    d: 'M0,0 C-18,-6 -34,-24 -36,-50 C-38,-80 -20,-110 6,-110 C20,-110 30,-99 28,-85 C26,-74 12,-66 0,-74 C-10,-82 -10,-94 -6,-99',
    width: 14,
  },
  // 2. Miso: Upward spiral question-mark curl on right
  spiralCurl: {
    d: 'M0,0 C22,-2 36,-20 36,-48 C36,-78 22,-94 8,-90 C-2,-87 -6,-76 -2,-68 C2,-60 14,-64 13,-72',
    width: 13,
  },
  // 3. Mochi: Short hook tail on left
  hookLeft: {
    d: 'M0,0 C-16,-5 -22,-21 -18,-40 C-16,-52 -4,-54 0,-47 C4,-40 -4,-28 8,-20',
    width: 12,
  },
  // 4. Oreo: Upright tail on right
  uprightLedge: {
    d: 'M0,0 C14,-10 18,-35 16,-65 C14,-78 8,-76 4,-70 C0,-60 4,-35 -4,-5',
    width: 10,
  },
  // 5. Pepper: Ring-loop tail on right
  ringLoop: {
    d: 'M0,0 C16,0 30,-10 30,-30 C30,-48 14,-54 4,-44 C-2,-38 2,-26 14,-28 C22,-30 24,-40 18,-46',
    width: 11,
  },
  // 6. Yuki: Upward hook tail on right
  hookRight: {
    d: 'M0,0 C18,-2 30,-20 26,-46 C22,-62 12,-64 8,-56 C4,-48 14,-28 0,-10',
    width: 11,
  },
  // 7. Nyx: Sleek upright tail on right
  sleekUpright: {
    d: 'M0,0 C14,-8 18,-32 16,-55 C15,-66 10,-68 6,-62 C3,-55 5,-38 -3,-10',
    width: 8.5,
  },
  // 8. Boba: Ground tail on right
  groundTail: {
    d: 'M0,0 C24,0 44,-6 50,0 C52,4 46,8 25,6 L0,6',
    width: 8,
  },

  // Fallbacks / Legacy keys
  bigCurl: {
    d: 'M0 0 C-4 -14 2 -28 16 -30 C27 -31 33 -21 27 -15 C22 -10 15 -14 17 -19',
    width: 9,
  },
  longPlume: {
    d: 'M0 0 C-8 -12 -6 -30 6 -40 C14 -46 25 -43 26 -34',
    width: 10,
  },
  lowHook: {
    d: 'M0 0 C3 -10 -1 -18 -10 -19 C-17 -19 -21 -13 -18 -8',
    width: 8,
  },
  fluffyPuff: {
    d: 'M0 0 C-6 -10 0 -22 12 -24 C22 -26 28 -16 24 -8 C20 -1 10 3 0 0',
    width: 12,
  },
  zigzag: {
    d: 'M0 0 L-7 -11 L5 -20 L-8 -31 L6 -39',
    width: 7.5,
  },
};

const TAIL_LIMP: Record<string, { d: string; width: number }> = {
  ...TAIL_UP,
  rootedStripedCurl: {
    d: 'M0,0 C-16,4 -28,8 -42,6 C-50,4 -56,0 -58,-4',
    width: 14,
  },
  spiralCurl: {
    d: 'M0,0 C16,4 28,6 40,2 C46,0 50,-4 52,-8',
    width: 13,
  },
  bigCurl: { d: 'M0 0 C-10 3 -20 2 -29 -1', width: 9 },
  longPlume: { d: 'M0 0 C-11 4 -23 3 -33 -1 C-36 -2 -38 -1 -39 1', width: 10 },
  lowHook: { d: 'M0 0 C-8 3 -16 3 -24 0', width: 8 },
  fluffyPuff: { d: 'M0 0 C-9 4 -18 3 -26 0', width: 12 },
  zigzag: { d: 'M0 0 L-9 4 L-17 -1 L-27 2', width: 7.5 },
};

const TAIL_BRACE: Record<string, { d: string; width: number }> = {
  ...TAIL_UP,
  bigCurl: { d: 'M0 0 C3 6 2 11 -2 13', width: 9 },
  longPlume: { d: 'M0 0 C3 6 2 12 -2 14', width: 10 },
  lowHook: { d: 'M0 0 C3 5 2 10 -2 12', width: 8 },
  fluffyPuff: { d: 'M0 0 C3 7 3 13 -2 15', width: 12 },
  zigzag: { d: 'M0 0 L5 6 L-2 11 L4 15', width: 7.5 },
};

export function tailFor(variant: string, hint: TailHint) {
  const table = hint === 'limp' ? TAIL_LIMP : hint === 'brace' ? TAIL_BRACE : TAIL_UP;
  return table[variant] ?? TAIL_UP.bigCurl;
}

// ============================================================================
// 2. EARS ANATOMY
// ============================================================================

export function Ears({ config }: { config: CatSeedConfig }) {
  const fill = config.palette.body;
  const ink = config.palette.ink ?? INK;
  const earType = config.structure.ears;

  // Winston: Black ears with inner white hatch line
  if (earType === 'tallStriped') {
    return (
      <g data-part="ears" data-ears="tallStriped">
        <path d="M-18 -6 C-20 -20 -18 -36 -12 -42 C-7.5 -38 -4.5 -25 -4 -12 Z" fill="#26201D" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M18 -6 C20 -20 18 -36 12 -42 C7.5 -38 4.5 -25 4 -12 Z" fill="#26201D" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M-12 -34 L-12 -14" stroke="#FFFDF9" strokeWidth={2.4} strokeLinecap="round" />
        <path d="M12 -34 L12 -14" stroke="#FFFDF9" strokeWidth={2.4} strokeLinecap="round" />
      </g>
    );
  }

  // Nyx: Midnight black ears with hot pink inner fold
  if (earType === 'pinkInner') {
    return (
      <g data-part="ears" data-ears="pinkInner">
        <path d="M-17 -6 C-19 -18 -16 -30 -11 -35 C-6.5 -30 -4 -18 -3 -12 Z" fill="#1E1B18" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M17 -6 C19 -18 16 -30 11 -35 C6.5 -30 4 -18 3 -12 Z" fill="#1E1B18" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M-12 -28 C-14 -18 -12 -10 -9 -8 Z" fill="#E05368" />
        <path d="M12 -28 C14 -18 12 -10 9 -8 Z" fill="#E05368" />
      </g>
    );
  }

  // Boba: Split calico ears (Left terracotta, Right black)
  if (earType === 'splitCalico') {
    return (
      <g data-part="ears" data-ears="splitCalico">
        <path d="M-17 -6 C-19 -18 -16 -30 -11 -35 C-6.5 -30 -4 -18 -3 -12 Z" fill="#E07A5F" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M17 -6 C19 -18 16 -30 11 -35 C6.5 -30 4 -18 3 -12 Z" fill="#26201D" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
      </g>
    );
  }

  // Mochi: Left ear black with white comb lines, Right ear black
  if (earType === 'blackLeftComb') {
    return (
      <g data-part="ears" data-ears="blackLeftComb">
        <path d="M-17 -6 C-19 -18 -16 -32 -11 -36 C-6.5 -30 -4 -18 -3 -12 Z" fill="#26201D" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M17 -6 C19 -18 16 -32 11 -36 C6.5 -30 4 -18 3 -12 Z" fill="#26201D" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M-13 -26 L-13 -12 M-9 -22 L-9 -10" stroke="#FFFDF9" strokeWidth={2} strokeLinecap="round" />
      </g>
    );
  }

  // Pepper / Oreo: Dark cap ears
  if (earType === 'combForehead' || earType === 'blackMaskEars') {
    return (
      <g data-part="ears" data-ears={earType}>
        <path d="M-17 -6 C-19 -18 -16 -32 -11 -36 C-6.5 -30 -4 -18 -3 -12 Z" fill="#26201D" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M17 -6 C19 -18 16 -32 11 -36 C6.5 -30 4 -18 3 -12 Z" fill="#26201D" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
      </g>
    );
  }

  // Default Pointy (Miso, Yuki)
  return (
    <g data-part="ears" data-ears="pointy">
      <path d="M-16.5 -7 C-19.5 -18 -17 -28 -12 -34 C-7.5 -28 -4 -18 -3 -12 Z" fill={fill} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M16.5 -7 C19.5 -18 17 -28 12 -34 C7.5 -28 4 -18 3 -12 Z" fill={fill} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
}

// ============================================================================
// 3. HEAD MARKINGS & CHEEKS
// ============================================================================

export function HeadMarkings({ config }: { config: CatSeedConfig; hs?: number }) {
  const catId = config.structure.ears;
  const ink = config.palette.ink ?? INK;

  // Winston: Black forehead cap with 2 horizontal white stripes + Rosy Blush Cheeks
  if (catId === 'tallStriped') {
    return (
      <g data-part="markings">
        <path d="M-20,-6 C-21,-22 21,-22 20,-6 C12,-11 0,-13 -20,-6 Z" fill="#26201D" stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />
        <line x1="-12" y1="-14" x2="12" y2="-14" stroke="#FFFDF9" strokeWidth={2.4} strokeLinecap="round" />
        <line x1="-8" y1="-9" x2="8" y2="-9" stroke="#FFFDF9" strokeWidth={2.4} strokeLinecap="round" />
        {/* Rosy blush cheeks */}
        <circle cx="-14" cy="5" r="4.5" fill="#F4978E" opacity={0.88} />
        <circle cx="14" cy="5" r="4.5" fill="#F4978E" opacity={0.88} />
      </g>
    );
  }

  // Pepper: Black side patches with white comb lines in center + Rosy Blush Cheeks
  if (catId === 'combForehead') {
    return (
      <g data-part="markings">
        <path d="M-20,-6 C-22,-18 -10,-22 -4,-22 L-4,-10 C-10,-8 -16,-6 -20,-6 Z" fill="#26201D" />
        <path d="M20,-6 C22,-18 10,-22 4,-22 L4,-10 C10,-8 16,-6 20,-6 Z" fill="#26201D" />
        <g stroke="#26201D" strokeWidth={1.8} strokeLinecap="round">
          <line x1="-2.5" y1="-21" x2="-2.5" y2="-14" />
          <line x1="0" y1="-22" x2="0" y2="-14" />
          <line x1="2.5" y1="-21" x2="2.5" y2="-14" />
        </g>
        <circle cx="-14" cy="5" r="4.5" fill="#F4978E" opacity={0.88} />
        <circle cx="14" cy="5" r="4.5" fill="#F4978E" opacity={0.88} />
      </g>
    );
  }

  // Oreo: Black mask covering top half of head
  if (catId === 'blackMaskEars') {
    return (
      <g data-part="mask">
        <path d="M-20,-4 C-22,-22 22,-22 20,-4 C12,-8 0,-9 -20,-4 Z" fill="#26201D" stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />
        {/* Mustache dots under eyes */}
        <circle cx="-8" cy="7" r="1" fill="#26201D" /><circle cx="-5" cy="6" r="1" fill="#26201D" /><circle cx="-5" cy="8.5" r="1" fill="#26201D" />
        <circle cx="8" cy="7" r="1" fill="#26201D" /><circle cx="5" cy="6" r="1" fill="#26201D" /><circle cx="5" cy="8.5" r="1" fill="#26201D" />
      </g>
    );
  }

  // Boba: Terracotta calico patch on left face
  if (catId === 'splitCalico') {
    return (
      <g data-part="patch">
        <path d="M-20,-4 C-22,-20 -6,-22 -2,-22 L-2,0 C-10,2 -16,1 -20,-4 Z" fill="#E07A5F" opacity={0.95} />
      </g>
    );
  }

  // Yuki: Alert motion lines on top-left of head
  if (catId === 'alertPointy') {
    return (
      <g stroke="#26201D" strokeWidth={2} strokeLinecap="round" opacity={0.85}>
        <line x1="-28" y1="-18" x2="-22" y2="-12" />
        <line x1="-31" y1="-10" x2="-23" y2="-6" />
        <line x1="-30" y1="-2" x2="-23" y2="0" />
      </g>
    );
  }

  // Miso: Forehead hatch dashes
  if (config.structure.eyeShape === 'joyfulArch') {
    return (
      <g stroke="#26201D" strokeWidth={1.8} strokeLinecap="round" opacity={0.75}>
        <line x1="-4" y1="-16" x2="-4" y2="-10" />
        <line x1="0" y1="-17" x2="0" y2="-11" />
        <line x1="4" y1="-16" x2="4" y2="-10" />
      </g>
    );
  }

  return null;
}

// ============================================================================
// 4. BODY MARKINGS & PATTERNS
// ============================================================================

export function BodyMarkings({ config }: { config: CatSeedConfig; poseName?: string }) {
  const posture = config.structure.postureDefault;

  // Winston: Striped flanks on left and right
  if (posture === 'aristocratSeated') {
    return (
      <g data-part="flanks" pointerEvents="none">
        {/* Left flank stripes */}
        <g stroke="#FFFDF9" strokeWidth={2.4} strokeLinecap="round">
          <line x1="84" y1="126" x2="100" y2="128" />
          <line x1="83" y1="135" x2="100" y2="137" />
          <line x1="84" y1="144" x2="100" y2="146" />
          <line x1="86" y1="153" x2="99" y2="154" />
        </g>
        {/* Right flank stripes */}
        <g stroke="#FFFDF9" strokeWidth={2.4} strokeLinecap="round">
          <line x1="120" y1="128" x2="136" y2="126" />
          <line x1="120" y1="137" x2="137" y2="135" />
          <line x1="120" y1="146" x2="136" y2="144" />
          <line x1="121" y1="154" x2="134" y2="153" />
        </g>
      </g>
    );
  }

  // Pepper: Polka dots pattern across white body
  if (posture === 'polkaDots') {
    return (
      <g data-part="polka-dots" fill="#26201D" pointerEvents="none">
        <circle cx="95" cy="116" r="2.2" /><circle cx="110" cy="112" r="2.6" /><circle cx="125" cy="118" r="2.4" /><circle cx="138" cy="112" r="2.2" />
        <circle cx="88" cy="128" r="2.6" /><circle cx="104" cy="126" r="2.8" /><circle cx="118" cy="132" r="2.4" /><circle cx="132" cy="126" r="2.8" /><circle cx="144" cy="130" r="2.4" />
        <circle cx="94" cy="142" r="2.8" /><circle cx="108" cy="146" r="2.4" /><circle cx="124" cy="146" r="2.4" /><circle cx="138" cy="142" r="2.8" />
        <circle cx="90" cy="155" r="2.5" /><circle cx="102" cy="160" r="2.2" /><circle cx="132" cy="160" r="2.2" /><circle cx="142" cy="155" r="2.5" />
      </g>
    );
  }

  // Boba: Terracotta calico patches on shoulder and flank
  if (posture === 'calicoSeated') {
    return (
      <g data-part="calico-patches" pointerEvents="none">
        <path d="M86,118 C78,122 74,130 76,138 C78,144 86,146 94,142 C100,138 100,128 96,122 Z" fill="#E07A5F" opacity={0.95} />
        <path d="M74,148 C70,158 78,168 90,168 C98,168 100,160 98,154 C96,146 86,144 76,146 Z" fill="#E07A5F" opacity={0.95} />
        <path d="M142,144 C146,152 144,162 138,166 C134,164 134,156 136,150 Z" fill="#E07A5F" opacity={0.95} />
        {/* speckles */}
        <circle cx="82" cy="130" r="1.1" fill="#26201D" /><circle cx="88" cy="136" r="1.1" fill="#26201D" />
        <circle cx="80" cy="158" r="1.1" fill="#26201D" /><circle cx="88" cy="162" r="1.1" fill="#26201D" />
      </g>
    );
  }

  // Oreo: Vertical fur hatch dashes across chest
  if (posture === 'ledgePaws') {
    return (
      <g stroke="#26201D" strokeWidth={1.5} strokeLinecap="round" opacity={0.7} pointerEvents="none">
        <line x1="82" y1="118" x2="82" y2="126" /><line x1="102" y1="122" x2="102" y2="130" /><line x1="126" y1="122" x2="126" y2="130" /><line x1="146" y1="118" x2="146" y2="126" />
        <line x1="88" y1="136" x2="88" y2="144" /><line x1="138" y1="136" x2="138" y2="144" />
        <line x1="82" y1="152" x2="82" y2="160" /><line x1="98" y1="156" x2="98" y2="164" /><line x1="130" y1="156" x2="130" y2="164" /><line x1="144" y1="152" x2="144" y2="160" />
      </g>
    );
  }

  // Mochi & Yuki: Soft chest fur dashes
  if (posture === 'jjLegs' || posture === 'wLegs') {
    return (
      <g stroke="#26201D" strokeWidth={1.5} strokeLinecap="round" opacity={0.7} pointerEvents="none">
        <line x1="88" y1="124" x2="86" y2="132" /><line x1="95" y1="120" x2="93" y2="128" />
        <line x1="132" y1="120" x2="134" y2="128" /><line x1="140" y1="124" x2="142" y2="132" />
      </g>
    );
  }

  // Miso: Flank motion curves
  if (posture === 'seatedPaws') {
    return (
      <g stroke="#26201D" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.7} pointerEvents="none">
        <path d="M68,130 C66,138 66,146 69,154" />
        <path d="M65,138 C63,144 63,148 65,153" />
        <path d="M152,130 C154,138 154,146 151,154" />
      </g>
    );
  }

  // Nyx: White leg contour lines
  if (posture === 'slenderSeated') {
    return (
      <g stroke="#FFFDF9" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.8} pointerEvents="none">
        <path d="M102,135 L102,168 C102,171 98,171 98,168" />
        <path d="M118,135 L118,168 C118,171 122,171 122,168" />
        <line x1="106" y1="166" x2="106" y2="171" /><line x1="114" y1="166" x2="114" y2="171" />
      </g>
    );
  }

  return null;
}

// ============================================================================
// 5. EYES & EXPRESSIONS (ALL STATES SUPPORTED)
// ============================================================================

export interface FaceProps {
  config: CatSeedConfig;
  expression: Expression;
}

export function faceInk(config: CatSeedConfig): string {
  return config.palette.body === '#1E1B18' ? PAPER : config.palette.ink ?? INK;
}

export function Eyes({ config, expression }: FaceProps) {
  const ink = config.palette.ink ?? INK;
  const eyeShape = config.structure.eyeShape;
  const isDarkFace = config.palette.body === '#1E1B18';

  // SLEEPING STATE: Closed smiling eyelid curves (for all cats)
  if (expression === 'sleep' || eyeShape === 'joyfulArch') {
    const strokeCol = isDarkFace ? '#FFFDF9' : ink;
    return (
      <g data-part="eyes" data-expression="sleep" stroke={strokeCol} strokeWidth={2.4} fill="none" strokeLinecap="round">
        <path d="M-11 -1.5 C-8.5 -4.5 -5.5 -4.5 -3 -1.5" />
        <path d="M11 -1.5 C8.5 -4.5 5.5 -4.5 3 -1.5" />
      </g>
    );
  }

  // SATISFIED / HAPPY STATE: Happy curved smiling arches
  if (expression === 'happyShut') {
    const strokeCol = isDarkFace ? '#FFFDF9' : ink;
    return (
      <g data-part="eyes" data-expression="happyShut" stroke={strokeCol} strokeWidth={2.4} fill="none" strokeLinecap="round">
        <path d="M-11 -2.5 C-9.5 -6.5 -5 -6.5 -3 -2.5" />
        <path d="M11 -2.5 C9.5 -6.5 5 -6.5 3 -2.5" />
      </g>
    );
  }

  // Boba: Cheeky Side-Glance Eyes (👀)
  if (eyeShape === 'sideGlance') {
    return (
      <g data-part="eyes" data-eyes="sideGlance" data-expression={expression}>
        <circle cx={-7} cy={-3} r={5.5} fill="#FFFDF9" stroke={ink} strokeWidth={1.8} />
        <circle cx={-5} cy={-4.5} r={3} fill={ink} />
        <circle cx={-4.2} cy={-5.2} r={1} fill="#FFFDF9" />

        <circle cx={7} cy={-3} r={5.5} fill="#FFFDF9" stroke={ink} strokeWidth={1.8} />
        <circle cx={9} cy={-4.5} r={3} fill={ink} />
        <circle cx={9.8} cy={-5.2} r={1} fill="#FFFDF9" />
      </g>
    );
  }

  // Oreo: Big Round Curious Eyes
  if (eyeShape === 'bigRoundStare') {
    const r = expression === 'stare' ? 6 : 5.2;
    return (
      <g data-part="eyes" data-eyes="bigRoundStare" data-expression={expression}>
        <circle cx={-7.5} cy={-3} r={r} fill="#FFFDF9" stroke={ink} strokeWidth={1.8} />
        <circle cx={-7.5} cy={-3} r={r * 0.52} fill={ink} />
        <circle cx={-6.2} cy={-4.2} r={1.2} fill="#FFFDF9" />

        <circle cx={7.5} cy={-3} r={r} fill="#FFFDF9" stroke={ink} strokeWidth={1.8} />
        <circle cx={7.5} cy={-3} r={r * 0.52} fill={ink} />
        <circle cx={8.8} cy={-4.2} r={1.2} fill="#FFFDF9" />
      </g>
    );
  }

  // Nyx: Luminous Glowing Oval Eyes
  if (eyeShape === 'luminousOval') {
    return (
      <g data-part="eyes" data-eyes="luminousOval" data-expression={expression}>
        <ellipse cx={-7.5} cy={-3} rx={5.2} ry={4.6} fill="#FFFDF9" />
        <circle cx={-6.5} cy={-3.5} r={3} fill="#1E1B18" />
        <circle cx={-5.5} cy={-4.5} r={1.1} fill="#FFFDF9" />

        <ellipse cx={7.5} cy={-3} rx={5.2} ry={4.6} fill="#FFFDF9" />
        <circle cx={8.5} cy={-3.5} r={3} fill="#1E1B18" />
        <circle cx={9.5} cy={-4.5} r={1.1} fill="#FFFDF9" />
      </g>
    );
  }

  // Standard Folk Dot Eyes (Mochi, Pepper, Yuki, Winston)
  const r = expression === 'stare' ? 4.5 : 3.6;
  return (
    <g data-part="eyes" data-eyes="dotWide" data-expression={expression}>
      <circle cx={-7.5} cy={-3} r={r} fill={ink} />
      <circle cx={-6.4} cy={-4.2} r={1.2} fill="#FFFDF9" />

      <circle cx={7.5} cy={-3} r={r} fill={ink} />
      <circle cx={8.6} cy={-4.2} r={1.2} fill="#FFFDF9" />
    </g>
  );
}

// ============================================================================
// 6. MOUTH & SENSES
// ============================================================================

export type MouthKind = 'smile' | 'frown' | 'open' | 'grin' | 'none';

export function mouthFor(expression: Expression): MouthKind {
  switch (expression) {
    case 'sad':
      return 'frown';
    case 'hopeful':
    case 'happyShut':
      return 'grin';
    case 'stare':
      return 'open';
    case 'sleep':
      return 'none';
    default:
      return 'smile';
  }
}

export function Mouth({ kind, ink }: { kind: MouthKind; ink: string }) {
  if (kind === 'none') return <g data-part="mouth" data-mouth="none" />;
  if (kind === 'open') {
    return (
      <g data-part="mouth" data-mouth="open">
        <ellipse cx={0} cy={6.5} rx={2.4} ry={2.8} fill="#E05368" stroke={ink} strokeWidth={1.2} />
      </g>
    );
  }
  const d =
    kind === 'grin'
      ? 'M-4 5 C-2 7.8 0 5 0 5 C0 5 2 7.8 4 5'
      : kind === 'frown'
        ? 'M-3.5 7.5 C-1.5 5.5 1.5 5.5 3.5 7.5'
        : 'M-3.5 5.2 C-1.5 7.2 0 5.4 0 5.4 C0 5.4 1.5 7.2 3.5 5.2';
  return (
    <g data-part="mouth" data-mouth={kind} stroke={ink} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </g>
  );
}

export function NoseAndWhiskers({ config }: { config: CatSeedConfig }) {
  const ink = config.palette.ink ?? INK;
  const noseColor = config.palette.nose ?? '#26201D';
  const isDarkFace = config.palette.body === '#1E1B18';
  const whiskerColor = isDarkFace ? '#FFFDF9' : ink;

  return (
    <g data-part="senses">
      {/* Nose */}
      <path d="M-1.8 2.5 L1.8 2.5 L0 4.6 Z" fill={noseColor} />
      {/* Whiskers */}
      <g stroke={whiskerColor} strokeWidth={1.4} strokeLinecap="round" opacity={isDarkFace ? 0.85 : 0.75}>
        <path d="M-12 3 L-19 1.5 M-12.5 5 L-20 5 M-12 7 L-18.5 8.5" />
        <path d="M12 3 L19 1.5 M12.5 5 L20 5 M12 7 L18.5 8.5" />
      </g>
    </g>
  );
}
