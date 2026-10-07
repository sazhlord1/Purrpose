import { z } from 'zod';
import { CAT_IDS, CONSEQUENCE_TYPES } from './enums.js';

/**
 * Detective Cheat — habit pacts.
 *
 * You stake some cat food on a habit (quit smoking, stick to a diet) for a fixed
 * number of days and pick how many slips you allow yourself. Every confessed slip
 * locks an equal share of the stake (stake ÷ allowed slips):
 *   2 meals, 4 slips allowed → each slip locks ½ meal; the 4th slip locks it all.
 * Reaching the limit loses the whole stake on the spot (the case is closed).
 * Surviving the period: the locked share goes to the cats, the rest comes back.
 */

export const HABIT_STATUSES = ['ACTIVE', 'KEPT', 'BROKEN'] as const;
export type HabitStatus = (typeof HABIT_STATUSES)[number];

export const HABIT_DURATIONS_DAYS = [7, 14, 30, 60] as const;
export const HABIT_MIN_SLIPS = 2;
export const HABIT_MAX_SLIPS = 10;
export const HABIT_DEFAULT_SLIPS = 4;

/** Food currently locked (may be fractional, e.g. 1.5 meals). */
export function habitLocked(stake: number, slips: number, maxSlips: number): number {
  if (maxSlips <= 0) return 0;
  return (stake * Math.min(slips, maxSlips)) / maxSlips;
}

/** Whole credits the cats get when the habit settles (½ and up rounds up). */
export function habitLoss(stake: number, slips: number, maxSlips: number): number {
  if (slips >= maxSlips) return stake;
  return Math.min(stake, Math.round(habitLocked(stake, slips, maxSlips) + 1e-9));
}

/** "1.5", "2", "0.25" — locked food for display. */
export function fmtFood(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : String(Math.round(amount * 100) / 100);
}

export const createHabitSchema = z.object({
  title: z.string().trim().min(1, 'Name the habit').max(80),
  catId: z.enum(CAT_IDS),
  consequenceType: z.enum(CONSEQUENCE_TYPES),
  stakeAmount: z.number().int().min(1).max(9999),
  maxSlips: z.number().int().min(HABIT_MIN_SLIPS).max(HABIT_MAX_SLIPS),
  durationDays: z
    .number()
    .int()
    .refine(d => (HABIT_DURATIONS_DAYS as readonly number[]).includes(d), 'Pick 7, 14, 30 or 60 days'),
});
export type CreateHabitInput = z.infer<typeof createHabitSchema>;

export interface HabitDto {
  id: string;
  title: string;
  catId: (typeof CAT_IDS)[number];
  consequenceType: (typeof CONSEQUENCE_TYPES)[number];
  stakeAmount: number;
  maxSlips: number;
  slipCount: number;
  status: HabitStatus;
  startedAtISO: string;
  endsAtISO: string;
  settledAtISO: string | null;
  /** Credits the cats got when it settled (null while active). */
  lostAmount: number | null;
  /** Food locked right now (fractional). */
  locked: number;
  slips: { id: string; atISO: string }[];
}

/**
 * What the detective says after a confession. Picked by how far into the
 * allowed slips you are, so the tone hardens as the case builds.
 */
export const DETECTIVE_LINES = {
  idle: [
    'Clean record. For now.',
    "I'm watching you.",
    'Sit. Tell me about your day.',
    "Nothing to confess? I'll wait.",
  ],
  early: [
    'I knew you would slip.',
    'Noted. In ink.',
    "That's one. I'm counting.",
    'Everybody slips once. Not everybody gets away with it.',
  ],
  middle: [
    'Again? The evidence is piling up.',
    'Your alibi is getting thin.',
    'Sit down. We need to talk.',
    'The cats are starting to smell dinner.',
  ],
  late: [
    "Don't you see you're weak?",
    'One more and the food is mine.',
    'The case is almost closed.',
    "I've seen this pattern before. It never ends well.",
  ],
  closed: [
    'Case closed. The cats eat tonight.',
    'Guilty. Sentence: one hungry conscience.',
  ],
  kept: ['Case dismissed. Get out of here before I change my mind.'],
} as const;

export function detectiveLine(slips: number, maxSlips: number, status: HabitStatus, seed = 0): string {
  const pick = <T extends readonly string[]>(list: T) => list[Math.abs(seed) % list.length] as string;
  if (status === 'BROKEN') return pick(DETECTIVE_LINES.closed);
  if (status === 'KEPT') return pick(DETECTIVE_LINES.kept);
  if (slips === 0) return pick(DETECTIVE_LINES.idle);
  const left = maxSlips - slips;
  if (left <= 1) return pick(DETECTIVE_LINES.late);
  if (slips / maxSlips <= 0.34) return pick(DETECTIVE_LINES.early);
  return pick(DETECTIVE_LINES.middle);
}
