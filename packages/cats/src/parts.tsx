import type { CatSeedConfig, Expression } from './types.js';
import type { TailHint } from './poses.js';

export const INK = '#2B231F';
export const PAPER = '#FAF6EE';

const TAIL_UP: Record<string, { d: string; width: number }> = {
  bigCurl: {
    d: 'M0 0 C-4 -14 2 -28 16 -30 C27 -31 33 -21 27 -15 C22 -10 15 -14 17 -19',
    width: 8.5,
  },
  longPlume: {
    d: 'M0 0 C-8 -12 -6 -30 6 -40 C14 -46 25 -43 26 -34',
    width: 9.5,
  },
  lowHook: {
    d: 'M0 0 C3 -10 -1 -18 -10 -19 C-17 -19 -21 -13 -18 -8',
    width: 7.5,
  },
  fluffyPuff: {
    d: 'M0 0 C-6 -10 0 -22 12 -24 C22 -26 28 -16 24 -8 C20 -1 10 3 0 0',
    width: 12,
  },
  zigzag: {
    d: 'M0 0 L-7 -11 L5 -20 L-8 -31 L6 -39',
    width: 7,
  },
};

const TAIL_LIMP: Record<string, { d: string; width: number }> = {
  bigCurl: { d: 'M0 0 C-10 3 -20 2 -29 -1', width: 8.5 },
  longPlume: { d: 'M0 0 C-11 4 -23 3 -33 -1 C-36 -2 -38 -1 -39 1', width: 9.5 },
  lowHook: { d: 'M0 0 C-8 3 -16 3 -24 0', width: 7.5 },
  fluffyPuff: { d: 'M0 0 C-9 4 -18 3 -26 0', width: 12 },
  zigzag: { d: 'M0 0 L-9 4 L-17 -1 L-27 2', width: 7 },
};

const TAIL_BRACE: Record<string, { d: string; width: number }> = {
  bigCurl: { d: 'M0 0 C3 6 2 11 -2 13', width: 8.5 },
  longPlume: { d: 'M0 0 C3 6 2 12 -2 14', width: 9.5 },
  lowHook: { d: 'M0 0 C3 5 2 10 -2 12', width: 7.5 },
  fluffyPuff: { d: 'M0 0 C3 7 3 13 -2 15', width: 12 },
  zigzag: { d: 'M0 0 L5 6 L-2 11 L4 15', width: 7 },
};

export function tailFor(variant: string, hint: TailHint) {
  const table = hint === 'limp' ? TAIL_LIMP : hint === 'brace' ? TAIL_BRACE : TAIL_UP;
  return table[variant] ?? TAIL_UP.bigCurl;
}

export function Ears({ config }: { config: CatSeedConfig }) {
  const fill = config.palette.body;
  const ink = config.palette.ink;
  const inner = config.palette.innerEar ?? '#F9B4A0';

  if (config.structure.ears === 'roundTall') {
    return (
      <g data-part="ears" data-ears="roundTall">
        {/* outer ears */}
        <path d="M-17 -6 C-19 -16 -17 -24 -12 -27 C-7.5 -24.5 -4.5 -19 -4 -12 Z" fill={fill} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M17 -6 C19 -16 17 -24 12 -27 C7.5 -24.5 4.5 -19 4 -12 Z" fill={fill} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        {/* inner ear shading */}
        <path d="M-15 -9 C-16 -16 -15 -21 -12 -23 C-9 -21 -7 -17 -6 -13 Z" fill={inner} stroke="none" opacity={0.85} />
        <path d="M15 -9 C16 -16 15 -21 12 -23 C9 -21 7 -17 6 -13 Z" fill={inner} stroke="none" opacity={0.85} />
      </g>
    );
  }
  if (config.structure.ears === 'roundSoft') {
    return (
      <g data-part="ears" data-ears="roundSoft">
        <path d="M-17 -5 C-22 -14 -16 -23 -9 -21 C-4 -19 -3 -12 -3 -6 Z" fill={fill} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M17 -5 C22 -14 16 -23 9 -21 C4 -19 3 -12 3 -6 Z" fill={fill} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M-15 -8 C-18 -13 -14 -19 -10 -18 C-6 -17 -5 -12 -5 -8 Z" fill={inner} stroke="none" opacity={0.9} />
        <path d="M15 -8 C18 -13 14 -19 10 -18 C6 -17 5 -12 5 -8 Z" fill={inner} stroke="none" opacity={0.9} />
      </g>
    );
  }
  if (config.structure.ears === 'batEars') {
    return (
      <g data-part="ears" data-ears="batEars">
        <path d="M-15 -7 C-26 -20 -25 -33 -15 -35 C-7 -28 -4 -18 -2 -11 Z" fill={config.palette.mask ?? fill} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M15 -7 C26 -20 25 -33 15 -35 C7 -28 4 -18 2 -11 Z" fill={config.palette.mask ?? fill} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M-13 -10 C-20 -19 -19 -28 -14 -29 C-8 -24 -6 -16 -4 -12 Z" fill={inner} stroke="none" opacity={0.85} />
        <path d="M13 -10 C20 -19 19 -28 14 -29 C8 -24 6 -16 4 -12 Z" fill={inner} stroke="none" opacity={0.85} />
      </g>
    );
  }
  return (
    <g data-part="ears" data-ears="pointy">
      <path d="M-16.5 -7 C-19.5 -17 -17 -26 -12.5 -29.5 C-7.5 -25.5 -4 -19 -3 -13 Z" fill={fill} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M16.5 -7 C19.5 -17 17 -26 12.5 -29.5 C7.5 -25.5 4 -19 3 -13 Z" fill={fill} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M-14 -10 C-16 -16 -15 -22 -12.5 -24 C-9 -21 -6 -16 -5 -12 Z" fill={inner} stroke="none" opacity={0.85} />
      <path d="M14 -10 C16 -16 15 -22 12.5 -24 C9 -21 6 -16 5 -12 Z" fill={inner} stroke="none" opacity={0.85} />
    </g>
  );
}

export function HeadMarkings({ config, hs = 1 }: { config: CatSeedConfig; hs?: number }) {
  const pal = config.palette;

  // Siamese mask (Ziggy)
  if (pal.mask) {
    return (
      <g data-part="markings" opacity={0.92}>
        <path
          d="M-14 -2 C-15 -10 0 -13 0 -13 C0 -13 15 -10 14 -2 C12 8 0 12 0 12 C0 12 -12 8 -14 -2 Z"
          fill={pal.mask}
          stroke="none"
        />
      </g>
    );
  }

  // Calico eye patch & head spots (Boba)
  if (pal.patch) {
    return (
      <g data-part="markings">
        {/* terracotta eye/ear patch */}
        <path
          d="M-18 -10 C-22 -18 -8 -22 -4 -15 C-2 -10 -8 2 -14 0 C-18 -1 -17 -6 -18 -10 Z"
          fill={pal.patch}
          stroke="none"
          opacity={0.95}
        />
        {/* chocolate ear spot */}
        <path
          d="M10 -18 C16 -24 22 -14 18 -8 C14 -4 8 -12 10 -18 Z"
          fill={pal.markings ?? '#4A3E3D'}
          stroke="none"
          opacity={0.95}
        />
      </g>
    );
  }

  // Orange Tabby forehead stripes & cheek blush (Miso)
  if (pal.markings && pal.body === '#E28743') {
    return (
      <g data-part="markings" stroke={pal.markings} strokeWidth={1.8} strokeLinecap="round" fill="none">
        <path d="M-5 -14 L-3 -8 M0 -16 L0 -9 M5 -14 L3 -8" opacity={0.85} />
        <path d="M-15 -1 L-18 -2 M15 -1 L18 -2" opacity={0.65} />
      </g>
    );
  }

  // Tuxedo white muzzle blaze (Winston)
  if (pal.bib && pal.body === '#2B2A29') {
    return (
      <g data-part="muzzle">
        <path
          d="M-8 3 C-8 10 8 10 8 3 C4 0 -4 0 -8 3 Z"
          fill={pal.bib}
          stroke="none"
        />
      </g>
    );
  }

  return null;
}

export function BodyMarkings({ config, poseName }: { config: CatSeedConfig; poseName?: string }) {
  const pal = config.palette;

  // Calico body patches (Boba)
  if (pal.patch) {
    return (
      <g data-part="body-markings" pointerEvents="none">
        <ellipse cx={110} cy={122} rx={22} ry={14} fill={pal.patch} opacity={0.92} transform="rotate(-8 110 122)" />
        <ellipse cx={82} cy={134} rx={14} ry={9} fill={pal.markings ?? '#4A3E3D'} opacity={0.92} />
        {/* creamy tummy */}
        {pal.belly && <ellipse cx={124} cy={132} rx={16} ry={11} fill={pal.belly} opacity={0.95} />}
      </g>
    );
  }

  // Tuxedo white chest bib (Winston)
  if (pal.bib && pal.body === '#2B2A29') {
    return (
      <g data-part="body-markings" pointerEvents="none">
        <path
          d="M136 102 C120 108 126 138 140 144 C148 136 150 114 136 102 Z"
          fill={pal.bib}
          stroke="none"
          opacity={0.98}
        />
      </g>
    );
  }

  // Orange tabby belly patch & stripes (Miso)
  if (pal.belly && pal.body === '#E28743') {
    return (
      <g data-part="body-markings" pointerEvents="none">
        <ellipse cx={124} cy={132} rx={18} ry={12} fill={pal.belly} opacity={0.95} />
        {pal.markings && (
          <g stroke={pal.markings} strokeWidth={1.8} strokeLinecap="round" opacity={0.7} fill="none">
            <path d="M102 116 C96 122 96 130 99 136" />
            <path d="M88 124 C84 130 85 138 88 142" />
          </g>
        )}
      </g>
    );
  }

  // Siamese dark paws & cream belly (Ziggy)
  if (pal.mask) {
    return (
      <g data-part="body-markings" pointerEvents="none">
        {pal.belly && <ellipse cx={120} cy={130} rx={20} ry={13} fill={pal.belly} opacity={0.95} />}
      </g>
    );
  }

  return null;
}

export interface FaceProps {
  config: CatSeedConfig;
  expression: Expression;
}

export function faceInk(config: CatSeedConfig): string {
  const body = config.palette.body.toUpperCase();
  return body === '#24202C' || body === '#141219' || body === '#1A1A1A' || body === '#000000' || body === 'BLACK' ? PAPER : config.palette.ink ?? INK;
}

export function Eyes({ config, expression }: FaceProps) {
  const ink = config.palette.ink ?? INK;
  const irisColor = config.palette.eyes ?? '#E76F51';
  const glint = config.palette.eyeGlint ?? '#FFFFFF';
  const isDarkFace = config.palette.body === '#24202C' || config.palette.mask !== undefined;

  if (expression === 'sleep') {
    const strokeColor = isDarkFace ? '#FAF6EE' : ink;
    return (
      <g data-part="eyes" data-expression="sleep" stroke={strokeColor} strokeWidth={2.4} fill="none" strokeLinecap="round">
        <path d="M-11 -1.5 C-8.5 -4.5 -5.5 -4.5 -3 -1.5" />
        <path d="M11 -1.5 C8.5 -4.5 5.5 -4.5 3 -1.5" />
      </g>
    );
  }

  if (expression === 'happyShut') {
    const strokeColor = isDarkFace ? '#FAF6EE' : ink;
    return (
      <g data-part="eyes" data-expression="happyShut" stroke={strokeColor} strokeWidth={2.4} fill="none" strokeLinecap="round">
        <path d="M-11.5 -2 C-9.5 -6.5 -5 -6.5 -3 -2.5" />
        <path d="M11.5 -2 C9.5 -6.5 5 -6.5 3 -2.5" />
      </g>
    );
  }

  if (config.structure.eyeShape === 'narrowSly') {
    // Glowing golden eyes for Void cat (Nyx)
    return (
      <g data-part="eyes" data-eyes="narrowSly" data-expression={expression}>
        {/* Eye socket with glowing iris */}
        <ellipse cx={-7.5} cy={-3} rx={4.2} ry={expression === 'stare' ? 3.4 : 2.5} fill={irisColor} stroke={ink} strokeWidth={1.2} />
        <ellipse cx={7.5} cy={-3} rx={4.2} ry={expression === 'stare' ? 3.4 : 2.5} fill={irisColor} stroke={ink} strokeWidth={1.2} />
        {/* Dark feline slit pupil */}
        <ellipse cx={-7.5} cy={-3} rx={1.2} ry={expression === 'stare' ? 2.8 : 2.1} fill="#141219" />
        <ellipse cx={7.5} cy={-3} rx={1.2} ry={expression === 'stare' ? 2.8 : 2.1} fill="#141219" />
        {/* Starry glint */}
        <circle cx={-6.4} cy={-4.2} r={1.1} fill={glint} />
        <circle cx={8.6} cy={-4.2} r={1.1} fill={glint} />
      </g>
    );
  }

  if (config.structure.eyeShape === 'almond') {
    // Emerald almond eyes for Tuxedo (Winston)
    const ry = expression === 'stare' ? 3.2 : 2.4;
    return (
      <g data-part="eyes" data-eyes="almond" data-expression={expression}>
        <ellipse cx={-7.5} cy={-3} rx={4.4} ry={ry} fill={irisColor} stroke={ink} strokeWidth={1.4} transform="rotate(-6 -7.5 -3)" />
        <ellipse cx={7.5} cy={-3} rx={4.4} ry={ry} fill={irisColor} stroke={ink} strokeWidth={1.4} transform="rotate(6 7.5 -3)" />
        {/* pupil */}
        <ellipse cx={-7.5} cy={-3} rx={1.6} ry={ry * 0.8} fill="#141219" />
        <ellipse cx={7.5} cy={-3} rx={1.6} ry={ry * 0.8} fill="#141219" />
        {/* catchlight */}
        <circle cx={-6.3} cy={-4.3} r={1.2} fill={glint} />
        <circle cx={8.7} cy={-4.3} r={1.2} fill={glint} />
      </g>
    );
  }

  if (config.structure.eyeShape === 'bigGleam') {
    // Big sapphire boba eyes for Calico (Boba)
    const r = expression === 'stare' ? 5.2 : 4.4;
    return (
      <g data-part="eyes" data-eyes="bigGleam" data-expression={expression}>
        <circle cx={-7.5} cy={-3} r={r} fill={irisColor} stroke={ink} strokeWidth={1.4} />
        <circle cx={7.5} cy={-3} r={r} fill={irisColor} stroke={ink} strokeWidth={1.4} />
        {/* deep dark inner pupil */}
        <circle cx={-7.5} cy={-3} r={r * 0.65} fill="#182333" />
        <circle cx={7.5} cy={-3} r={r * 0.65} fill="#182333" />
        {/* main gleam */}
        <circle cx={-6.1} cy={-4.5} r={1.8} fill={glint} />
        <circle cx={8.9} cy={-4.5} r={1.8} fill={glint} />
        {/* secondary tiny sparkle */}
        <circle cx={-8.5} cy={-1.5} r={0.9} fill={glint} opacity={0.85} />
        <circle cx={6.5} cy={-1.5} r={0.9} fill={glint} opacity={0.85} />
      </g>
    );
  }

  if (config.structure.eyeShape === 'wideWild') {
    // Hypnotic electric blue zoomies eyes for Siamese (Ziggy)
    const r = expression === 'stare' ? 5.4 : 4.6;
    return (
      <g data-part="eyes" data-eyes="wideWild" data-expression={expression}>
        <circle cx={-7.5} cy={-3} r={r} fill={irisColor} stroke={ink} strokeWidth={1.4} />
        <circle cx={7.5} cy={-3} r={r} fill={irisColor} stroke={ink} strokeWidth={1.4} />
        {/* dilated pupil */}
        <circle cx={-7.5} cy={-3} r={r * 0.7} fill="#141219" />
        <circle cx={7.5} cy={-3} r={r * 0.7} fill="#141219" />
        {/* gleam */}
        <circle cx={-6.2} cy={-4.6} r={1.5} fill={glint} />
        <circle cx={8.8} cy={-4.6} r={1.5} fill={glint} />
      </g>
    );
  }

  // Classic dotWide with warm amber iris for Orange Tabby (Miso)
  const r = expression === 'stare' ? 4.6 : 3.8;
  return (
    <g data-part="eyes" data-eyes="dotWide" data-expression={expression}>
      <circle cx={-7.5} cy={-3} r={r} fill={irisColor} stroke={ink} strokeWidth={1.3} />
      <circle cx={7.5} cy={-3} r={r} fill={irisColor} stroke={ink} strokeWidth={1.3} />
      {/* pupil */}
      <circle cx={-7.5} cy={-3} r={r * 0.65} fill="#181310" />
      <circle cx={7.5} cy={-3} r={r * 0.65} fill="#181310" />
      {/* catchlight */}
      <circle cx={-6.2} cy={-4.3} r={1.4} fill={glint} />
      <circle cx={8.8} cy={-4.3} r={1.4} fill={glint} />
    </g>
  );
}

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
        <ellipse cx={0} cy={7.8} rx={2.8} ry={3.4} fill="#E07A5F" stroke={ink} strokeWidth={1.4} />
      </g>
    );
  }
  const d =
    kind === 'grin'
      ? 'M-5.5 5.5 C-2 9.5 0 6 0 6 C0 6 2 9.5 5.5 5.5'
      : kind === 'frown'
        ? 'M-4 8.5 C-1.6 6.5 1.6 6.5 4 8.5'
        : 'M-4 5.8 C-1.6 8.2 0 6.2 0 6.2 C0 6.2 1.6 8.2 4 5.8';
  return (
    <g data-part="mouth" data-mouth={kind} stroke={ink} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </g>
  );
}

export function NoseAndWhiskers({ config }: { config: CatSeedConfig }) {
  const ink = config.palette.ink ?? INK;
  const noseColor = config.palette.nose ?? '#E76F51';
  const isDarkFace = config.palette.body === '#24202C' || config.palette.mask !== undefined;
  const whiskerColor = isDarkFace ? '#FAF6EE' : ink;

  return (
    <g data-part="senses">
      {/* Cute button nose */}
      <path d="M-1.8 2.8 L1.8 2.8 L0 5.2 Z" fill={noseColor} stroke={ink} strokeWidth={0.8} strokeLinejoin="round" />
      {/* Whiskers */}
      <g stroke={whiskerColor} strokeWidth={1.5} strokeLinecap="round" opacity={isDarkFace ? 0.85 : 0.75}>
        <path d="M-13.5 3.6 L-21.5 2.2 M-13.8 5.8 L-22 6.2 M-13.4 8 L-20.6 9.8" />
        <path d="M13.5 3.6 L21.5 2.2 M13.8 5.8 L22 6.2 M13.4 8 L20.6 9.8" />
      </g>
    </g>
  );
}
