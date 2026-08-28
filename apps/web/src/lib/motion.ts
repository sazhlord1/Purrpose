import type { Transition } from 'framer-motion';

export const tap: Transition = { duration: 0.11, ease: 'easeOut' };

export const standardSpring: Transition = { type: 'spring', stiffness: 260, damping: 18 };

export const sheetSpring: Transition = { type: 'spring', stiffness: 380, damping: 34 };

export const popSpring: Transition = { type: 'spring', stiffness: 420, damping: 16 };

export const fade: Transition = { duration: 0.2 };

export const gaze: Transition = { duration: 0.32, ease: [0.3, 0, 0.2, 1] };

export const drift = (seconds = 4): Transition => ({
  duration: seconds,
  repeat: Infinity,
  ease: 'easeInOut',
});

export function stepped(steps: number) {
  return (t: number): number => Math.min(1, Math.floor(t * steps) / steps + (t >= 1 ? 1 : 0));
}
