import { describe, expect, it } from 'vitest';
import { dayPeriod, getLifeStage, msUntilNextStage, stageInfo } from '../src/stages.js';

describe('life stages', () => {
  it('moves up one stage every 20% of elapsed time', () => {
    expect(getLifeStage(0)).toBe(1);
    expect(getLifeStage(0.199)).toBe(1);
    expect(getLifeStage(0.2)).toBe(2);
    expect(getLifeStage(0.59)).toBe(3);
    expect(getLifeStage(0.8)).toBe(5);
    expect(getLifeStage(1.5)).toBe(5);
    expect(stageInfo(3).label).toBe('Cozy Room');
  });

  it('counts down to the next stage and stops at the last one', () => {
    const created = 0;
    const deadline = 100_000;
    expect(msUntilNextStage(created, deadline, 5_000)).toBe(15_000);
    expect(msUntilNextStage(created, deadline, 20_000)).toBe(20_000);
    expect(msUntilNextStage(created, deadline, 85_000)).toBeNull();
  });

  it('maps local hours to lighting periods', () => {
    expect(dayPeriod(6)).toBe('dawn');
    expect(dayPeriod(12)).toBe('day');
    expect(dayPeriod(18)).toBe('dusk');
    expect(dayPeriod(23)).toBe('night');
    expect(dayPeriod(2)).toBe('night');
  });
});
