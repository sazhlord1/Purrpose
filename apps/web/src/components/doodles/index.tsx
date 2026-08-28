import type { FC } from 'react';

export interface DoodleProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

function base({ size = 24, className, strokeWidth = 2 }: DoodleProps) {
  return {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
    focusable: false as const,
    className,
  };
}

export const Paw: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M12 13.2c-2.9.1-5.2 1.8-5.1 4.3 0 1.9 1.7 3.2 5.1 3.2s5.1-1.3 5.1-3.2c.1-2.5-2.2-4.4-5.1-4.3Z" />
    <circle cx="6.4" cy="10.2" r="1.8" />
    <circle cx="12" cy="8.6" r="1.9" />
    <circle cx="17.6" cy="10.2" r="1.8" />
  </svg>
);

export const BowlEmpty: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M5 14h14c-.2 3.6-2.6 5.9-7 6-4.4-.1-6.8-2.4-7-6Z" />
    <path d="M4.6 13c4.9-1.2 9.9-1.2 14.8 0" />
  </svg>
);

export const BowlFull: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M7.4 12.6l1.5-2.1 1.5 2 1.6-2.1 1.5 2 1.5-2.1 1.6 2.1" />
    <path d="M5 14h14c-.2 3.6-2.6 5.9-7 6-4.4-.1-6.8-2.4-7-6Z" />
    <path d="M4.6 13c4.9-1.2 9.9-1.2 14.8 0" />
  </svg>
);

export const CanTin: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="6.8" rx="6" ry="2.1" />
    <path d="M6 6.8v9.4c0 1.5 2.7 2.7 6 2.7s6-1.2 6-2.7V6.8" />
    <path d="M6 11c1.8.9 3.9 1.4 6 1.4S16.2 11.9 18 11" />
  </svg>
);

export const KibbleBag: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M7.2 5.2h9.6L18.2 18c-4.1 1.5-8.3 1.5-12.4 0L7.2 5.2Z" />
    <path d="M7.2 5.2 8 3.4h8l.8 1.8" />
    <path d="M10 11.5c1.3-.9 2.7-.9 4 0M10 14.5c1.3-.9 2.7-.9 4 0" />
  </svg>
);

export const VetCare: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M5.6 9.4h12.8c.6 0 1 .4 1 1v7.2c0 .6-.4 1-1 1H5.6c-.6 0-1-.4-1-1v-7.2c0-.6.4-1 1-1Z" />
    <path d="M9.4 9.2V7.6c0-.7.6-1.3 1.3-1.3h2.6c.7 0 1.3.6 1.3 1.3v1.6" />
    <path d="M12 11.6v4.8M9.6 14h4.8" />
  </svg>
);

export const Clock: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="7.4" />
    <path d="M12 7.8V12l3 2.1" />
  </svg>
);

export const Zzz: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M6.6 8.2h4l-4 4.2h4" />
    <path d="M13.2 4h3.2L13.2 7.4h3.2" />
    <path d="M16.8 10.6h2.8l-2.8 2.8h2.8" />
  </svg>
);

export const ArrowScribble: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M4 16.5c4.5 1.2 9.5-1 12.4-5.6" />
    <path d="M14.8 8.2l2.4-.9-.6 2.7" />
  </svg>
);

export const StarScribble: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M12 4l1.7 4.5 4.9.3-3.8 3.1 1.3 4.7L12 14l-4.1 2.6 1.3-4.7L5.4 8.8l4.9-.3L12 4Z" />
  </svg>
);

export const Cabinet: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M5 4.8h14v14.4H5z" />
    <path d="M12 4.8v14.4" />
    <circle cx="10" cy="12.6" r=".9" />
    <circle cx="14" cy="12.6" r=".9" />
    <path d="M7.4 19.2v1.6M16.6 19.2v1.6" />
  </svg>
);

export const Bed: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M4 15.4c0-1.2 1-2.2 2.2-2.2h11.6c1.2 0 2.2 1 2.2 2.2V19H4v-3.6Z" />
    <path d="M6.6 13c0-1.5 1.2-2.6 2.7-2.6h5.4c1.5 0 2.7 1.1 2.7 2.6" />
    <path d="M5.2 19v1.6M18.8 19v1.6" />
  </svg>
);

export const YarnBall: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <circle cx="11.4" cy="11.4" r="6.4" />
    <path d="M6 9.4c3-1.4 7.8-1.4 10.8 1M6.2 13.4c3.8-1.4 8.4-.8 11.2 1.4" />
    <path d="M17.4 15.2c1.6 1.4 1.2 3-.4 4.6" />
  </svg>
);

export const FishBone: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M4 12l3.4-2.9v5.8L4 12Z" />
    <path d="M7.4 12h9" />
    <path d="M10.2 12V9M13.2 12V8.8M10.2 12v3M13.2 12v3.2" />
    <path d="M16.4 12l3.2-2.4v4.8L16.4 12Z" />
    <circle cx="5.9" cy="11.4" r=".4" fill="currentColor" stroke="none" />
  </svg>
);

export const CatFace: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M6.2 5.8l1.6 3.3c1.3-.6 2.7-.9 4.2-.9s2.9.3 4.2.9l1.6-3.3.9 4.3c.6 1 .9 2 .9 3 0 3.4-3.3 5.8-7.6 5.8s-7.6-2.4-7.6-5.8c0-1 .3-2 .9-3l.9-4.3Z" />
    <circle cx="9.6" cy="13.2" r=".8" fill="currentColor" stroke="none" />
    <circle cx="14.4" cy="13.2" r=".8" fill="currentColor" stroke="none" />
    <path d="M11.6 15.4c.25-.35.55-.35.8 0" />
    <path d="M3 13.2h2.8M3.2 15.2l2.8-.5M21 13.2h-2.8M20.8 15.2l-2.8-.5" />
  </svg>
);

export const Scratcher: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M6 19.2h12" />
    <path d="M9.2 19V8.8c0-.9.7-1.6 1.6-1.6h2.4c.9 0 1.6.7 1.6 1.6V19" />
    <path d="M9.2 11.2h5.6M9.2 13.8h5.6M9.2 16.4h5.6" />
    <path d="M8.8 7.4c0-.8 1.4-1.4 3.2-1.4s3.2.6 3.2 1.4" />
  </svg>
);

export const ShelfCans: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M4.4 18.4h15.2" />
    <path d="M6.4 18.2v-5.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v5.2" />
    <path d="M13 18.2v-5.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v5.2" />
    <path d="M6.4 14.6h3.6M13 14.6h3.6" />
  </svg>
);

export const Sparkle: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M12 4c.6 3.8 2.2 5.4 6 6-3.8.6-5.4 2.2-6 6-.6-3.8-2.2-5.4-6-6 3.8-.6 5.4-2.2 6-6Z" />
  </svg>
);

export const CheckScribble: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M5 12.8l4.4 4.2L19 6.8" />
    <path d="M17.2 9.2 19 6.8" />
  </svg>
);

export const XScribble: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M6.2 6.2c3.9 4 7.8 7.9 11.6 11.6" />
    <path d="M17.8 6.2C13.9 10.1 10 14.1 6.2 17.8" />
  </svg>
);

export const HeartScribble: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M12 18.8C7.6 16 4.7 13.3 4.7 10.2 4.7 7.7 6.5 6 8.7 6c1.4 0 2.5.7 3.3 1.9C12.8 6.7 14 6 15.3 6c2.2 0 4 1.7 4 4.2 0 3.1-2.9 5.8-7.3 8.6Z" />
  </svg>
);

export const SpeechBubble: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M5.2 6.6C5.2 5.2 6.3 4 7.7 4h8.6c1.4 0 2.5 1.2 2.5 2.6v5.2c0 1.4-1.1 2.6-2.5 2.6h-5.9l-3.9 3.8v-4.1c-.8-.4-1.3-1.3-1.3-2.3V6.6Z" />
  </svg>
);

export const CatnipPouch: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M7 8h10l-1.5 11c-.2 1.2-1.2 2-2.4 2h-2.2c-1.2 0-2.2-.8-2.4-2L7 8Z" />
    <path d="M7 8c0-1.5 1.8-3 5-3s5 1.5 5 3" />
    <path d="M9 5.5l-2-2M15 5.5l2-2" />
    <path d="M12 12c-1.5 0-2.5 1-2 2.5s2.5 1.5 2 3c1.5 0 2.5-1 2-2.5s-2.5-1.5-2-3Z" />
  </svg>
);

export const ChuruTreat: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M5 19L17 7l2 2-12 12H5v-2Z" />
    <path d="M16 6l3-3 2 2-3 3" />
    <path d="M9 15l2 2" />
    <circle cx="19.5" cy="4.5" r="1.5" />
  </svg>
);

export const FeatherWand: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M3 21L14 10" />
    <path d="M14 10c2-5 6-7 7-7-1 3-1 7-4 9" />
    <path d="M14 10c0-3 3-5 5-5-1 2 0 4-2 6" />
    <circle cx="13.5" cy="10.5" r="1.5" />
  </svg>
);

export const CatGrass: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <path d="M6 13h12l-1.5 7.5c-.2 1-.9 1.5-1.9 1.5h-5.2c-1 0-1.7-.5-1.9-1.5L6 13Z" />
    <path d="M5 13h14v2H5z" />
    <path d="M8 13V6c0-1.5 1-3 3-4" />
    <path d="M12 13V4c0-1.2.8-2.5 2.5-3" />
    <path d="M16 13V7c0-1.5-1-3-2.5-4" />
    <path d="M10 13V8c0-1-.5-2-1.5-2.5" />
    <path d="M14 13V9c0-1 .5-2 1.5-2.5" />
  </svg>
);

export const PlushBed: FC<DoodleProps> = p => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="15" rx="9" ry="5" />
    <path d="M3 15c0-4 4-7 9-7s9 3 9 7" />
    <path d="M7 13c1.5-2 3-3 5-3s3.5 1 5 3" />
    <circle cx="12" cy="14" r="2.5" />
  </svg>
);

interface DoodleEntry {
  name: string;
  Comp: FC<DoodleProps>;
}

export const DOODLES: DoodleEntry[] = [
  { name: 'paw', Comp: Paw },
  { name: 'bowl-empty', Comp: BowlEmpty },
  { name: 'bowl-full', Comp: BowlFull },
  { name: 'can', Comp: CanTin },
  { name: 'kibble-bag', Comp: KibbleBag },
  { name: 'vet-care', Comp: VetCare },
  { name: 'catnip', Comp: CatnipPouch },
  { name: 'churu', Comp: ChuruTreat },
  { name: 'feather-wand', Comp: FeatherWand },
  { name: 'cat-grass', Comp: CatGrass },
  { name: 'plush-bed', Comp: PlushBed },
  { name: 'clock', Comp: Clock },
  { name: 'zzz', Comp: Zzz },
  { name: 'arrow-scribble', Comp: ArrowScribble },
  { name: 'star-scribble', Comp: StarScribble },
  { name: 'cabinet', Comp: Cabinet },
  { name: 'bed', Comp: Bed },
  { name: 'yarn-ball', Comp: YarnBall },
  { name: 'fish-bone', Comp: FishBone },
  { name: 'cat-face', Comp: CatFace },
  { name: 'scratcher', Comp: Scratcher },
  { name: 'shelf-cans', Comp: ShelfCans },
  { name: 'sparkle', Comp: Sparkle },
  { name: 'check-scribble', Comp: CheckScribble },
  { name: 'x-scribble', Comp: XScribble },
  { name: 'heart-scribble', Comp: HeartScribble },
  { name: 'speech-bubble', Comp: SpeechBubble },
];
