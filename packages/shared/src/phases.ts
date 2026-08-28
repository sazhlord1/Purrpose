import type { CommitmentStatus } from './enums.js';

export const PHASE_RULES = {
  initialDurationMs: 60_000,
  anticipatingRatio: 0.6,
  veryCloseRatio: 0.25,
  veryCloseAbsoluteMs: 12 * 3_600_000,
} as const;

export const IDLE_RULES = {
  windowMs: 15_000,
  macroCooldownMinMs: 6_000,
  macroCooldownMaxMs: 12_000,
} as const;

export type ActivePhase = 'INITIAL' | 'WAITING' | 'ANTICIPATING' | 'VERY_CLOSE';

export type CommitmentPhase = ActivePhase | 'COMPLETED' | 'FAILED' | 'PAST_DUE';

export function computePhaseRatio(
  createdAtMs: number,
  deadlineMs: number,
  nowMs: number,
): number {
  const total = deadlineMs - createdAtMs;
  if (total <= 0) return 1;
  const elapsed = nowMs - createdAtMs;
  return Math.min(1, Math.max(0, elapsed / total));
}

export function computePhase(input: {
  status: CommitmentStatus;
  createdAtISO: string;
  deadlineISO: string;
  nowMs: number;
}): CommitmentPhase {
  if (input.status === 'COMPLETED' || input.status === 'FAILED') return input.status;

  const createdAtMs = Date.parse(input.createdAtISO);
  const deadlineMs = Date.parse(input.deadlineISO);

  if (input.nowMs >= deadlineMs) return 'PAST_DUE';

  const elapsed = input.nowMs - createdAtMs;
  if (elapsed < PHASE_RULES.initialDurationMs) return 'INITIAL';

  const remaining = deadlineMs - input.nowMs;
  const ratioElapsed = computePhaseRatio(createdAtMs, deadlineMs, input.nowMs);
  const veryCloseByRatio = 1 - ratioElapsed <= PHASE_RULES.veryCloseRatio;
  if (remaining <= PHASE_RULES.veryCloseAbsoluteMs || veryCloseByRatio) return 'VERY_CLOSE';
  if (1 - ratioElapsed <= PHASE_RULES.anticipatingRatio) return 'ANTICIPATING';
  return 'WAITING';
}

export interface CommitmentTimeView {
  commitmentId: string;
  catId: string;
  status: CommitmentStatus;
  createdAtISO: string;
  deadlineISO: string;
  phaseRatio: number;
  msRemaining: number;
  phase: CommitmentPhase;
}

export function buildTimeView(params: {
  commitmentId: string;
  catId: string;
  status: CommitmentStatus;
  createdAtISO: string;
  deadlineISO: string;
  nowMs: number;
}): CommitmentTimeView {
  const deadlineMs = Date.parse(params.deadlineISO);
  return {
    commitmentId: params.commitmentId,
    catId: params.catId,
    status: params.status,
    createdAtISO: params.createdAtISO,
    deadlineISO: params.deadlineISO,
    phaseRatio: computePhaseRatio(Date.parse(params.createdAtISO), deadlineMs, params.nowMs),
    msRemaining: Math.max(0, deadlineMs - params.nowMs),
    phase: computePhase(params),
  };
}
