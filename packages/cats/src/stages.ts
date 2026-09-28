/**
 * The five "life stages" a cat moves through as the deadline approaches.
 * Each 20% of elapsed time moves the cat one stage up in comfort.
 */
export const SCENE_WIDTH = 380;
export const SCENE_HEIGHT = 480;

export type LifeStage = 1 | 2 | 3 | 4 | 5;

export interface LifeStageInfo {
  stage: LifeStage;
  key: 'box' | 'yard' | 'room' | 'tree' | 'feast';
  icon: string;
  label: string;
}

export const LIFE_STAGES: readonly LifeStageInfo[] = [
  { stage: 1, key: 'box', icon: '📦', label: 'The Box' },
  { stage: 2, key: 'yard', icon: '🌿', label: 'The Yard' },
  { stage: 3, key: 'room', icon: '🛋️', label: 'Cozy Room' },
  { stage: 4, key: 'tree', icon: '🏰', label: 'Cat Tree' },
  { stage: 5, key: 'feast', icon: '👑', label: 'Grand Feast' },
];

export const STAGE_SPAN = 0.2;

export function getLifeStage(progress: number): LifeStage {
  const p = Math.max(0, Math.min(1, progress));
  return Math.min(5, Math.floor(p / STAGE_SPAN) + 1) as LifeStage;
}

export function stageInfo(stage: number): LifeStageInfo {
  return LIFE_STAGES[Math.max(1, Math.min(5, stage)) - 1];
}

/** Milliseconds until the cat moves to the next stage, or null if already at the last one. */
export function msUntilNextStage(createdAtMs: number, deadlineMs: number, nowMs: number): number | null {
  const total = deadlineMs - createdAtMs;
  if (total <= 0) return null;
  const stage = getLifeStage((nowMs - createdAtMs) / total);
  if (stage >= 5) return null;
  const nextAt = createdAtMs + total * stage * STAGE_SPAN;
  return Math.max(0, nextAt - nowMs);
}

export type DayPeriod = 'dawn' | 'day' | 'dusk' | 'night';

/** Scene lighting follows the viewer's real local clock. */
export function dayPeriod(hour: number): DayPeriod {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}
