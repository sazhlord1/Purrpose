import { computePhase, now, type CommitmentDto } from '@purrpose/shared';
import { getLifeStage, msUntilNextStage, seedFor, stageInfo, type CatState, type LifeStageInfo } from '@purrpose/cats';

const ACTIVE_STATES = ['INITIAL', 'WAITING', 'ANTICIPATING', 'VERY_CLOSE'];

export interface CommitmentView {
  createdMs: number;
  deadlineMs: number;
  remainingMs: number;
  /** Deadline passed but the server hasn't settled it yet ("checking on your cat…"). */
  pending: boolean;
  phaseRatio: number;
  /** Live phase, computed on the client between polls. */
  phase: string;
  sceneState: CatState;
  stage: LifeStageInfo;
  nextStageInMs: number | null;
  seed: number;
}

/**
 * Single place that turns a commitment into everything the UI needs — scene state,
 * life stage, countdowns. Home, Detail and the share card all read from here.
 */
export function commitmentView(c: CommitmentDto, nowMs: number = now()): CommitmentView {
  const createdMs = Date.parse(c.createdAtISO);
  const deadlineMs = Date.parse(c.deadlineISO);
  const remainingMs = deadlineMs - nowMs;
  const pending = c.status === 'ACTIVE' && remainingMs <= 0;
  // A finished pact freezes its scene at the moment it ended (it stops "aging").
  const sceneNowMs =
    c.status === 'COMPLETED' && c.completedAtISO
      ? Date.parse(c.completedAtISO)
      : c.status === 'FAILED'
        ? deadlineMs
        : nowMs;
  const phaseRatio = Math.min(1, Math.max(0, (sceneNowMs - createdMs) / Math.max(1, deadlineMs - createdMs)));
  const phase = computePhase({ status: c.status, createdAtISO: c.createdAtISO, deadlineISO: c.deadlineISO, nowMs });

  const sceneState: CatState = pending
    ? 'VERY_CLOSE'
    : c.status === 'COMPLETED'
      ? 'SLEEPING'
      : c.status === 'FAILED'
        ? 'SATISFIED'
        : ACTIVE_STATES.includes(phase)
          ? (phase as CatState)
          : 'WAITING';

  return {
    createdMs,
    deadlineMs,
    remainingMs,
    pending,
    phaseRatio,
    phase,
    sceneState,
    stage: stageInfo(getLifeStage(phaseRatio)),
    nextStageInMs: c.status === 'ACTIVE' && !pending ? msUntilNextStage(createdMs, deadlineMs, nowMs) : null,
    seed: seedFor(c.id, createdMs, nowMs),
  };
}

/** The viewer's local hour, used for scene lighting. */
export function localHour(nowMs: number = now()): number {
  return new Date(nowMs).getHours();
}
