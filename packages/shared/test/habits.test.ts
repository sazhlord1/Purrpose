import { describe, expect, it } from 'vitest';
import { createHabitSchema, detectiveLine, fmtFood, habitLocked, habitLoss } from '../src/habits.js';

describe('habit lock math', () => {
  it('locks an equal share per slip (2 meals, 4 slips → ½ each)', () => {
    expect([0, 1, 2, 3, 4, 5].map(s => habitLocked(2, s, 4))).toEqual([0, 0.5, 1, 1.5, 2, 2]);
  });

  it('settles whole credits, rounding ½ up, and the limit takes everything', () => {
    expect(habitLoss(2, 1, 4)).toBe(1);
    expect(habitLoss(3, 1, 4)).toBe(1); // 0.75
    expect(habitLoss(10, 1, 3)).toBe(3); // 3.33
    expect(habitLoss(5, 0, 4)).toBe(0);
    expect(habitLoss(5, 4, 4)).toBe(5);
  });

  it('formats fractional food', () => {
    expect(fmtFood(1.5)).toBe('1.5');
    expect(fmtFood(2)).toBe('2');
    expect(fmtFood(10 / 3)).toBe('3.33');
  });

  it('validates the setup', () => {
    const base = { title: 'No sugar', catId: 'orange', consequenceType: 'MEALS', stakeAmount: 2, maxSlips: 4, durationDays: 30 };
    expect(createHabitSchema.safeParse(base).success).toBe(true);
    expect(createHabitSchema.safeParse({ ...base, maxSlips: 1 }).success).toBe(false);
    expect(createHabitSchema.safeParse({ ...base, maxSlips: 11 }).success).toBe(false);
    expect(createHabitSchema.safeParse({ ...base, durationDays: 10 }).success).toBe(false);
  });

  it('the detective gets harsher as the slips add up', () => {
    expect(detectiveLine(1, 4, 'ACTIVE')).toBe('I knew you would slip.');
    expect(detectiveLine(3, 4, 'ACTIVE')).toBe("Don't you see you're weak?");
    expect(detectiveLine(4, 4, 'BROKEN')).toMatch(/Case closed/);
  });
});
