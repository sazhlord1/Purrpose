import type { CatState } from './poses.js';

export type ActivePhase = 'INITIAL' | 'WAITING' | 'ANTICIPATING' | 'VERY_CLOSE';

export type MacroName =
  | 'perkUp'
  | 'lickLips'
  | 'sit'
  | 'shiftWeight'
  | 'lookAround'
  | 'lookAtUser'
  | 'lookAtClock'
  | 'scratch'
  | 'batToy'
  | 'playWithYarn'
  | 'playPounce'
  | 'napOnBed'
  | 'bigStretch'
  | 'yawn'
  | 'stretch'
  | 'groom'
  | 'sniffBowl'
  | 'inspectBowl'
  | 'inspectCabinet'
  | 'pawCabinet'
  | 'attemptOpenCabinet'
  | 'dragBowl'
  | 'excitedHop'
  | 'stareAtUser'
  | 'freeze'
  | 'lickPaw'
  // Shop-item behaviors — only picked when the item is equipped (see itemMacros).
  | 'tossMouse'
  | 'napInBed'
  | 'kneadBlanket'
  | 'watchFish';

export type MicroName =
  | 'blink'
  | 'blinkDouble'
  | 'earFlick'
  | 'tailFlick'
  | 'doubleTailFlick'
  | 'whiskerForward';

export interface WeightedMacro {
  name: MacroName;
  w: number;
  minMs: number;
  maxMs: number;
}

const M = (name: MacroName, w: number, minMs: number, maxMs: number): WeightedMacro => ({
  name,
  w,
  minMs,
  maxMs,
});

export const MACRO_TABLE: Record<ActivePhase, WeightedMacro[]> = {
  INITIAL: [
    M('lookAtUser', 3, 1400, 2000),
    M('shiftWeight', 2, 700, 1000),
    M('lickLips', 2, 600, 900),
    M('perkUp', 2, 800, 1100),
    M('stretch', 1, 1400, 1800),
  ],
  WAITING: [
    M('sit', 3, 1800, 2600),
    M('shiftWeight', 2, 700, 1000),
    M('lookAround', 3, 1400, 2000),
    M('lookAtClock', 2, 1200, 1800),
    M('scratch', 3, 2200, 3000),
    M('batToy', 2, 1200, 1800),
    M('playWithYarn', 2, 1800, 2600),
    M('playPounce', 2, 1200, 1800),
    M('napOnBed', 2, 2400, 3200),
    M('bigStretch', 2, 1800, 2400),
    M('yawn', 2, 1500, 2000),
    M('groom', 2, 2000, 2600),
    M('lickPaw', 2, 1400, 1900),
    M('sniffBowl', 2, 1200, 1800),
  ],
  ANTICIPATING: [
    M('inspectBowl', 3, 1600, 2200),
    M('sniffBowl', 3, 1000, 1500),
    M('inspectCabinet', 2, 1600, 2200),
    M('groom', 1, 2000, 2600),
    M('lookAtUser', 2, 1200, 1800),
    M('bigStretch', 2, 1600, 2200),
    M('lickLips', 2, 800, 1200),
  ],
  VERY_CLOSE: [
    M('pawCabinet', 3, 1400, 2000),
    M('attemptOpenCabinet', 2, 1800, 2400),
    M('dragBowl', 2, 1600, 2200),
    M('excitedHop', 3, 900, 1400),
    M('stareAtUser', 3, 2200, 3000),
    M('freeze', 1, 500, 800),
  ],
};

export const MICRO_WEIGHTS: Record<ActivePhase, Array<{ name: MicroName; w: number }>> = {
  INITIAL: [
    { name: 'blink', w: 4 },
    { name: 'earFlick', w: 2 },
    { name: 'tailFlick', w: 2 },
  ],
  WAITING: [
    { name: 'blink', w: 5 },
    { name: 'blinkDouble', w: 1 },
    { name: 'earFlick', w: 2 },
    { name: 'tailFlick', w: 3 },
  ],
  ANTICIPATING: [
    { name: 'blink', w: 4 },
    { name: 'tailFlick', w: 4 },
    { name: 'whiskerForward', w: 2 },
    { name: 'doubleTailFlick', w: 1 },
  ],
  VERY_CLOSE: [
    { name: 'blink', w: 3 },
    { name: 'doubleTailFlick', w: 4 },
    { name: 'whiskerForward', w: 3 },
    { name: 'earFlick', w: 1 },
  ],
};

export function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFor(
  commitmentId: string,
  createdAtMs: number,
  nowMs: number,
  windowMs = 15_000,
): number {
  return fnv1a(`${commitmentId}:${Math.floor((nowMs - createdAtMs) / windowMs)}`);
}

export interface PickContext {
  last?: MacroName;
  cooldownUntil?: Partial<Record<MacroName, number>>;
  nowMs: number;
  /** Extra behaviors unlocked by equipped items. */
  extra?: WeightedMacro[];
  /** Behaviors that make no physical sense right now (e.g. batting a toy from inside the box). */
  exclude?: ReadonlySet<MacroName>;
}

/**
 * What the cat has around it in the current stage (built by CatScene).
 * The cat never walks anywhere: every behavior happens where it sits, so
 * each one is only offered when the thing it needs is actually in reach.
 */
export interface ItemBehaviors {
  /** Equipped toy id, if any. */
  toy?: string;
  /** The cat sits on the floor (or a cushion on it), so a toy by its paw is reachable. */
  canPlay?: boolean;
  /** A scratcher stands right at the cat's side. */
  canScratch?: boolean;
  /** There is a food bowl in the scene (not yet out on the street). */
  hasBowl?: boolean;
  bed?: boolean;
  blanket?: boolean;
  aquarium?: boolean;
}

/** Behaviors to leave out because what they need isn't there. */
export function excludedMacros(items: ItemBehaviors | undefined): Set<MacroName> {
  const out = new Set<MacroName>();
  if (!items) return out;
  if (!items.canPlay) {
    out.add('batToy').add('playWithYarn').add('playPounce').add('tossMouse');
  }
  if (!items.canScratch) out.add('scratch');
  if (!items.hasBowl) out.add('sniffBowl').add('inspectBowl').add('dragBowl');
  return out;
}

/** Item behaviors per phase. The final countdown (VERY_CLOSE) stays about the food cabinet. */
export function itemMacros(phase: ActivePhase, items: ItemBehaviors | undefined): WeightedMacro[] {
  if (!items || phase === 'VERY_CLOSE') return [];
  const out: WeightedMacro[] = [];
  const idle = phase === 'WAITING';
  const light = phase === 'INITIAL';
  if (items.canPlay && (items.toy === 'ball' || items.toy === 'yarn')) {
    if (idle) out.push(M('batToy', 3, 1200, 1800), M('playPounce', 3, 1200, 1800));
    if (light) out.push(M('batToy', 1, 1000, 1400));
  }
  if (items.canPlay && items.toy === 'mouse' && (idle || light)) out.push(M('tossMouse', idle ? 4 : 1, 1400, 2000));
  if (items.bed && idle) out.push(M('napInBed', 3, 1200, 1800));
  if (items.canScratch && idle) out.push(M('scratch', 2, 2200, 3000));
  if (items.blanket && (idle || light)) out.push(M('kneadBlanket', idle ? 2 : 1, 1000, 1600));
  if (items.aquarium && (idle || phase === 'ANTICIPATING')) out.push(M('watchFish', 2, 1200, 1800));
  return out;
}

export function pickMacro(
  phase: ActivePhase,
  rng: () => number,
  ctx: PickContext,
): WeightedMacro | null {
  const table = ctx.extra?.length ? [...MACRO_TABLE[phase], ...ctx.extra] : MACRO_TABLE[phase];
  const eligible = table.filter(
    m =>
      m.name !== ctx.last &&
      !ctx.exclude?.has(m.name) &&
      (!(ctx.cooldownUntil?.[m.name]) || (ctx.cooldownUntil?.[m.name] as number) <= ctx.nowMs),
  );
  if (eligible.length === 0) return null;
  const total = eligible.reduce((s, m) => s + m.w, 0);
  let roll = rng() * total;
  for (const m of eligible) {
    roll -= m.w;
    if (roll <= 0) return m;
  }
  return eligible[eligible.length - 1];
}

export function pickMicro(phase: ActivePhase, rng: () => number, last?: MicroName): MicroName {
  const table = MICRO_WEIGHTS[phase].filter(m => m.name !== last);
  const total = table.reduce((s, m) => s + m.w, 0);
  let roll = rng() * total;
  for (const m of table) {
    roll -= m.w;
    if (roll <= 0) return m.name;
  }
  return 'blink';
}

export function macroCooldownMs(
  rng: () => number,
  minMs = IDLE_TIMING.cooldownMinMs,
  maxMs = IDLE_TIMING.cooldownMaxMs,
): number {
  return minMs + rng() * (maxMs - minMs);
}

export function durationFor(m: WeightedMacro, rng: () => number): number {
  return m.minMs + rng() * (m.maxMs - m.minMs);
}

export const IDLE_TIMING = {
  windowMs: 15_000,
  cooldownMinMs: 6_000,
  cooldownMaxMs: 12_000,
  blinkMinMs: 2_000,
  blinkMaxMs: 7_000,
  doubleBlinkChance: 0.2,
} as const;

export const SPEECH_CHANCE: Record<ActivePhase, number> = {
  INITIAL: 0.9,
  WAITING: 0.08,
  ANTICIPATING: 0.18,
  VERY_CLOSE: 0.3,
};

export function rollSpeech(phase: ActivePhase, rng: () => number, force = false): boolean {
  return force || rng() < SPEECH_CHANCE[phase];
}

export function isTerminal(state: CatState): boolean {
  return state === 'SUCCESS' || state === 'FAILURE' || state === 'SLEEPING' || state === 'SATISFIED';
}

export function stepped(steps: number) {
  return (t: number): number => Math.min(1, Math.floor(t * steps) / steps + (t >= 1 ? 1 : 0));
}
