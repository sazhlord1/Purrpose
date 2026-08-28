import { describe, expect, it } from 'vitest';
import { canStake, clampBalance, computeAvailable } from '../src/economy.js';

describe('availability math', () => {
  it('computes available as balance minus active stakes', () => {
    expect(computeAvailable(10, 7)).toBe(3);
    expect(computeAvailable(5, 0)).toBe(5);
    expect(computeAvailable(0, 0)).toBe(0);
  });

  it('allows staking exactly up to available and rejects beyond it', () => {
    expect(canStake(10, 7, 3)).toEqual({ ok: true, available: 3 });
    expect(canStake(10, 7, 4).ok).toBe(false);
    expect(canStake(0, 0, 1).ok).toBe(false);
  });

  it('clamps negative defensive balances to zero', () => {
    expect(clampBalance(-2)).toBe(0);
    expect(clampBalance(4)).toBe(4);
  });
});
