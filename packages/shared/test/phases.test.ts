import { describe, expect, it } from 'vitest';
import { computePhase, computePhaseRatio } from '../src/phases.js';

const CREATED = Date.parse('2026-08-26T10:00:00.000Z');

function at(msOffsetFromCreation: number): number {
  return CREATED + msOffsetFromCreation;
}

describe('computePhaseRatio', () => {
  it('is 0 at creation and 1 at deadline', () => {
    expect(computePhaseRatio(CREATED, at(100_000), CREATED)).toBe(0);
    expect(computePhaseRatio(CREATED, at(100_000), at(100_000))).toBe(1);
  });

  it('clamps past the deadline and guards inverted ranges', () => {
    expect(computePhaseRatio(CREATED, at(100_000), at(150_000))).toBe(1);
    expect(computePhaseRatio(at(100_000), CREATED, CREATED)).toBe(1);
  });
});

describe('computePhase boundaries', () => {
  const hour = 3_600_000;
  const day = 24 * hour;

  function phase(status: 'ACTIVE' | 'COMPLETED' | 'FAILED', createdAt: number, deadline: number, now: number) {
    return computePhase({
      status,
      createdAtISO: new Date(createdAt).toISOString(),
      deadlineISO: new Date(deadline).toISOString(),
      nowMs: now,
    });
  }

  it('returns terminal statuses unchanged regardless of time', () => {
    expect(phase('FAILED', CREATED, at(hour), CREATED)).toBe('FAILED');
    expect(phase('COMPLETED', CREATED, at(day), at(day + day))).toBe('COMPLETED');
  });

  it('returns PAST_DUE for active commitments at or past the deadline', () => {
    expect(phase('ACTIVE', CREATED, at(hour), at(hour))).toBe('PAST_DUE');
    expect(phase('ACTIVE', CREATED, at(hour), at(hour) - 1)).not.toBe('PAST_DUE');
  });

  it('holds INITIAL for the first 60 seconds even under tight deadlines', () => {
    expect(phase('ACTIVE', CREATED, at(90_000), at(59_999))).toBe('INITIAL');
    expect(phase('ACTIVE', CREATED, at(90_000), at(60_000))).toBe('VERY_CLOSE');
  });

  it('escalates WAITING to ANTICIPATING to VERY_CLOSE by remaining ratio', () => {
    const total = day;
    const deadline = CREATED + total;
    expect(phase('ACTIVE', CREATED, deadline, CREATED + total * 0.2)).toBe('WAITING');
    expect(phase('ACTIVE', CREATED, deadline, CREATED + total * 0.41)).toBe('ANTICIPATING');
    expect(phase('ACTIVE', CREATED, deadline, CREATED + total * 0.76)).toBe('VERY_CLOSE');
  });

  it('applies the absolute very-close floor before the ratio rule', () => {
    const total = 40 * 3_600_000;
    const deadline = CREATED + total;
    const hour = 3_600_000;
    const stillAnticipating = deadline - (13 * hour);
    expect(phase('ACTIVE', CREATED, deadline, stillAnticipating)).toBe('ANTICIPATING');
    const flooredToVeryClose = deadline - (11 * hour);
    expect(phase('ACTIVE', CREATED, deadline, flooredToVeryClose)).toBe('VERY_CLOSE');
    const pastDeadline = deadline + 1;
    expect(phase('ACTIVE', CREATED, deadline, pastDeadline)).toBe('PAST_DUE');
  });
});
