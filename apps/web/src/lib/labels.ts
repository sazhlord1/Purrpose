import { catById, t } from '@purrpose/shared';

/**
 * Human words for internal phases — the UI never shows INITIAL / VERY_CLOSE etc.
 */
export function moodLabel(phase: string | undefined): { short: string; hot: boolean } {
  switch (phase) {
    case 'INITIAL':
      return { short: t('pact sealed'), hot: false };
    case 'WAITING':
      return { short: t('relaxed'), hot: false };
    case 'ANTICIPATING':
      return { short: t('getting hungry'), hot: false };
    case 'VERY_CLOSE':
      return { short: t('eyeing the food'), hot: true };
    case 'COMPLETED':
      return { short: t('kept'), hot: false };
    case 'FAILED':
      return { short: t('fed'), hot: true };
    default:
      return { short: t('checking…'), hot: true };
  }
}

export function catNameOf(catId: string): string {
  return catById(catId)?.name ?? t('Your cat');
}

/** One friendly line under the scene, e.g. "Miso is getting hungry in the Cozy Room." */
export function sceneCaption(catId: string, phase: string, stageLabel: string, pending: boolean): string {
  const name = catNameOf(catId);
  const room = t(stageLabel);
  if (pending) return t('Time is up. Checking on {name}…', { name });
  switch (phase) {
    case 'INITIAL':
      return t('{name} just shook on it. Deal sealed in {room}.', { name, room });
    case 'WAITING':
      return t('{name} is relaxing in {room}.', { name, room });
    case 'ANTICIPATING':
      return t('{name} is getting hungry in {room}…', { name, room });
    case 'VERY_CLOSE':
      return t('{name} is eyeing the food. Hurry!', { name });
    case 'COMPLETED':
      return t('{name} is sleeping it off.', { name });
    case 'FAILED':
      return t('{name} is satisfied. For now.', { name });
    default:
      return t('{name} is waiting…', { name });
  }
}
