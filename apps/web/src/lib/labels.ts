import { catById } from '@purrpose/shared';

/**
 * Human words for internal phases — the UI never shows INITIAL / VERY_CLOSE etc.
 */
export function moodLabel(phase: string | undefined): { short: string; hot: boolean } {
  switch (phase) {
    case 'INITIAL':
      return { short: 'pact sealed', hot: false };
    case 'WAITING':
      return { short: 'relaxed', hot: false };
    case 'ANTICIPATING':
      return { short: 'getting hungry', hot: false };
    case 'VERY_CLOSE':
      return { short: 'eyeing the food', hot: true };
    case 'COMPLETED':
      return { short: 'kept', hot: false };
    case 'FAILED':
      return { short: 'fed', hot: true };
    default:
      return { short: 'checking…', hot: true };
  }
}

export function catNameOf(catId: string): string {
  return catById(catId)?.name ?? 'Your cat';
}

/** One friendly line under the scene, e.g. "Miso is getting hungry in the Cozy Room." */
export function sceneCaption(catId: string, phase: string, stageLabel: string, pending: boolean): string {
  const name = catNameOf(catId);
  if (pending) return `Time is up. Checking on ${name}…`;
  switch (phase) {
    case 'INITIAL':
      return `${name} just shook on it. Deal sealed in ${stageLabel}.`;
    case 'WAITING':
      return `${name} is relaxing in ${stageLabel}.`;
    case 'ANTICIPATING':
      return `${name} is getting hungry in ${stageLabel}…`;
    case 'VERY_CLOSE':
      return `${name} is eyeing the food. Hurry!`;
    case 'COMPLETED':
      return `${name} is sleeping it off.`;
    case 'FAILED':
      return `${name} is satisfied. For now.`;
    default:
      return `${name} is waiting…`;
  }
}
