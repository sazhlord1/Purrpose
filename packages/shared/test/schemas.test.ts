import { describe, expect, it } from 'vitest';
import { computeSkewOffset, correctedNow } from '../src/time.js';
import { CAT_SEED } from '../src/cats.js';
import { createCommitmentSchema, topUpSchema } from '../src/schemas.js';

describe('time skew helpers', () => {
  it('derives an offset that corrects client time to server time', () => {
    const server = 1_000_000;
    const client = 900_000;
    const offset = computeSkewOffset(server, client);
    expect(offset).toBe(100_000);
    expect(correctedNow(offset)).toBeGreaterThanOrEqual(server);
  });
});

describe('cat seed', () => {
  it('has the five cats with distinct structure', () => {
    expect(CAT_SEED.map(c => c.id)).toEqual(['orange', 'tuxedo', 'black', 'boba', 'ziggy']);
    const tails = new Set(CAT_SEED.map(c => c.config.structure.tailPath));
    const eyes = new Set(CAT_SEED.map(c => c.config.structure.eyeShape));
    expect(tails.size).toBe(5);
    expect(eyes.size).toBe(5);
  });
});

describe('createCommitmentSchema', () => {
  const now = Date.parse('2026-08-26T10:00:00.000Z');
  const schema = createCommitmentSchema(now);

  it('accepts a valid commitment inside bounds', () => {
    const parsed = schema.safeParse({
      title: '  Finish YouTube video  ',
      deadlineISO: new Date(now + 60 * 60_000).toISOString(),
      catId: 'orange',
      consequenceType: 'MEALS',
      consequenceAmount: 5,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.title).toBe('Finish YouTube video');
  });

  it('rejects deadlines closer than 5 minutes or farther than 30 days', () => {
    const tooSoon = schema.safeParse({
      title: 'x',
      deadlineISO: new Date(now + 60_000).toISOString(),
      catId: 'black',
      consequenceType: 'MEALS',
      consequenceAmount: 1,
    });
    const tooFar = schema.safeParse({
      title: 'x',
      deadlineISO: new Date(now + 31 * 24 * 3_600_000).toISOString(),
      catId: 'black',
      consequenceType: 'MEALS',
      consequenceAmount: 1,
    });
    expect(tooSoon.success).toBe(false);
    expect(tooFar.success).toBe(false);
  });

  it('rejects bad titles, cats, types and non-integer amounts', () => {
    const base = {
      deadlineISO: new Date(now + 3_600_000).toISOString(),
      catId: 'orange',
      consequenceType: 'MEALS',
    };
    expect(schema.safeParse({ ...base, title: '', consequenceAmount: 1 }).success).toBe(false);
    expect(
      schema.safeParse({ ...base, title: 'a'.repeat(81), consequenceAmount: 1 }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ ...base, title: 'ok', catId: 'sphinx', consequenceAmount: 1 }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ ...base, title: 'ok', consequenceType: 'PIXEL_DUST', consequenceAmount: 1 })
        .success,
    ).toBe(false);
    expect(schema.safeParse({ ...base, title: 'ok', consequenceAmount: 2.5 }).success).toBe(false);
    expect(schema.safeParse({ ...base, title: 'ok', consequenceAmount: 0 }).success).toBe(false);
  });
});

describe('topUpSchema', () => {
  it('bounds amounts to positive integers within cap', () => {
    expect(topUpSchema.safeParse({ creditType: 'MEALS', amount: 10 }).success).toBe(true);
    expect(topUpSchema.safeParse({ creditType: 'MEALS', amount: 0 }).success).toBe(false);
    expect(topUpSchema.safeParse({ creditType: 'MEALS', amount: 10_000 }).success).toBe(false);
    expect(topUpSchema.safeParse({ creditType: 'PIXEL_DUST', amount: 1 }).success).toBe(false);
  });
});
