import { describe, expect, it } from 'vitest';
import {
  MACRO_TABLE,
  MICRO_WEIGHTS,
  SPEECH_CHANCE,
  durationFor,
  fnv1a,
  macroCooldownMs,
  mulberry32,
  pickMacro,
  pickMicro,
  rollSpeech,
  seedFor,
  type PickContext,
} from '../src/engine.js';

function sequence(phase: keyof typeof MACRO_TABLE, seed: number, picks: number, ctx?: Partial<PickContext>) {
  const rng = mulberry32(seed);
  const out: string[] = [];
  let last: string | undefined;
  const cooldownUntil: Partial<Record<string, number>> = {};
  for (let i = 0; i < picks; i++) {
    const picked = pickMacro(phase, rng, {
      last: last as never,
      cooldownUntil: cooldownUntil as never,
      nowMs: i * 1000,
      ...ctx,
    });
    if (!picked) break;
    out.push(picked.name);
    last = picked.name;
    cooldownUntil[picked.name] = i * 1000 + 60_000;
  }
  return out;
}

describe('seeded rng', () => {
  it('is deterministic for the same seed and differs across seeds', () => {
    const a = mulberry32(1234);
    const b = mulberry32(1234);
    const c = mulberry32(1235);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    const seqC = [c(), c(), c()];
    expect(seqA).toEqual(seqB);
    expect(seqA).not.toEqual(seqC);
  });

  it('derives window-stable seeds from commitment id and time window', () => {
    const base = seedFor('cmt_1', 1_000_000, 1_000_000 + 5_000);
    const sameWindow = seedFor('cmt_1', 1_000_000, 1_000_000 + 14_999);
    const nextWindow = seedFor('cmt_1', 1_000_000, 1_000_000 + 15_001);
    const otherCat = seedFor('cmt_2', 1_000_000, 1_000_000 + 5_000);
    expect(base).toBe(sameWindow);
    expect(base).not.toBe(nextWindow);
    expect(base).not.toBe(otherCat);
  });

  it('hashes stably', () => {
    expect(fnv1a('abc')).toBe(fnv1a('abc'));
    expect(fnv1a('abc')).not.toBe(fnv1a('abd'));
  });
});

describe('pickMacro', () => {
  it('produces identical sequences for identical seeds', () => {
    expect(sequence('WAITING', 42, 12)).toEqual(sequence('WAITING', 42, 12));
  });

  it('never repeats the previous macro', () => {
    const seq = sequence('WAITING', 7, 60);
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i]).not.toBe(seq[i - 1]);
    }
  });

  it('respects cooldowns', () => {
    const rng = mulberry32(9);
    for (let i = 0; i < 50; i++) {
      const picked = pickMacro('VERY_CLOSE', rng, {
        last: 'stareAtUser',
        cooldownUntil: { stareAtUser: 10_000, pawCabinet: 10_000 },
        nowMs: 5_000,
      });
      expect(picked?.name).not.toBe('stareAtUser');
      expect(picked?.name).not.toBe('pawCabinet');
    }
  });

  it('returns null when everything is filtered out', () => {
    const blocked = Object.fromEntries(
      MACRO_TABLE.INITIAL.map(m => [m.name, Number.MAX_SAFE_INTEGER]),
    );
    expect(pickMacro('INITIAL', mulberry32(1), { cooldownUntil: blocked, nowMs: 0 })).toBeNull();
  });

  it('excludes zero-duration walk entries from idle picking', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 40; i++) {
      const picked = pickMacro('ANTICIPATING', rng, { nowMs: i * 1000 });
      expect(picked?.name).not.toBe('walkToBowl');
      expect(picked?.name).not.toBe('walkToCabinet');
    }
  });

  it('covers every phase with a non-empty table and valid weights', () => {
    for (const phase of Object.keys(MACRO_TABLE) as Array<keyof typeof MACRO_TABLE>) {
      expect(MACRO_TABLE[phase].length).toBeGreaterThan(0);
      for (const m of MACRO_TABLE[phase]) {
        expect(m.w).toBeGreaterThan(0);
        expect(m.maxMs).toBeGreaterThanOrEqual(m.minMs);
      }
    }
  });
});

describe('pickMicro', () => {
  it('is deterministic and avoids immediate repeats', () => {
    const rngA = mulberry32(77);
    const rngB = mulberry32(77);
    let last = undefined;
    for (let i = 0; i < 40; i++) {
      const a = pickMicro('WAITING', rngA, last);
      const b = pickMicro('WAITING', rngB, last);
      expect(a).toBe(b);
      if (i > 0) expect(a).not.toBe(last);
      last = a;
    }
  });

  it('only emits known micros for the phase', () => {
    const known = new Set(MICRO_WEIGHTS.VERY_CLOSE.map(m => m.name));
    const rng = mulberry32(5);
    for (let i = 0; i < 30; i++) {
      expect(known.has(pickMicro('VERY_CLOSE', rng))).toBe(true);
    }
  });
});

describe('durations and cooldowns', () => {
  it('stays inside the declared range', () => {
    const rng = mulberry32(11);
    const macro = MACRO_TABLE.WAITING[0];
    for (let i = 0; i < 50; i++) {
      const d = durationFor(macro, rng);
      expect(d).toBeGreaterThanOrEqual(macro.minMs);
      expect(d).toBeLessThanOrEqual(macro.maxMs);
    }
  });

  it('cooldowns land inside the 6-12s budget', () => {
    const rng = mulberry32(2);
    for (let i = 0; i < 50; i++) {
      const c = macroCooldownMs(rng);
      expect(c).toBeGreaterThanOrEqual(6_000);
      expect(c).toBeLessThanOrEqual(12_000);
    }
  });
});

describe('speech rolls', () => {
  it('keeps chances within playful bounds', () => {
    expect(SPEECH_CHANCE.WAITING).toBeLessThan(SPEECH_CHANCE.ANTICIPATING);
    expect(SPEECH_CHANCE.ANTICIPATING).toBeLessThan(SPEECH_CHANCE.VERY_CLOSE);
    expect(SPEECH_CHANCE.VERY_CLOSE).toBeLessThan(0.5);
    for (const chance of Object.values(SPEECH_CHANCE)) {
      expect(chance).toBeGreaterThan(0);
      expect(chance).toBeLessThan(1);
    }
  });

  it('forces speech and otherwise respects probability', () => {
    expect(rollSpeech('WAITING', () => 0.5, true)).toBe(true);
    expect(rollSpeech('WAITING', () => 0.99, false)).toBe(false);
    expect(rollSpeech('VERY_CLOSE', () => 0.01, false)).toBe(true);
    expect(rollSpeech('VERY_CLOSE', () => 0.5, false)).toBe(false);
  });
});
