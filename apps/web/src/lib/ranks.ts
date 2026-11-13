import type { CatId } from '@purrpose/shared';

/**
 * Ranks on the report card: a road map from a cat in a cardboard box to a cat on a
 * podium. Each rank has its own cat (a different one each time, cheaper to dearer, as
 * in the shop), its own place, and its own colours; the card gets fancier as you climb.
 * Only kept pacts count, and losing never takes a rank away. Ranks don't unlock cats.
 */
export type RankScene = 'box' | 'yard' | 'alley' | 'room' | 'rooftop' | 'palace' | 'night' | 'stage';
/** How fancy the card is: 0 plain, 1 trimmed, 2 metallic, 3 holographic. */
export type RankTier = 0 | 1 | 2 | 3;

export interface Rank {
  level: number; // 1-based
  /** Kept pacts needed. */
  minWins: number;
  /** English name (the Persian one lives in the translations). */
  name: string;
  cat: CatId;
  scene: RankScene;
  tier: RankTier;
  /** Frame colours, taken from the rank's cat. */
  main: string;
  light: string;
  dark: string;
}

export const RANKS: readonly Rank[] = [
  { level: 1, minWins: 0, name: 'Rookie', cat: 'orange', scene: 'box', tier: 0, main: '#D9A25B', light: '#F4DDB0', dark: '#8F6128' },
  { level: 2, minWins: 1, name: 'Promise Keeper', cat: 'tuxedo', scene: 'yard', tier: 0, main: '#62708A', light: '#D3DCE8', dark: '#2E3747' },
  { level: 3, minWins: 3, name: 'Gangsta', cat: 'black', scene: 'alley', tier: 1, main: '#4D3D73', light: '#C2B2EE', dark: '#211A36' },
  { level: 4, minWins: 7, name: 'Pro', cat: 'boba', scene: 'room', tier: 1, main: '#D47548', light: '#F8CDAE', dark: '#83391B' },
  { level: 5, minWins: 10, name: 'Veteran', cat: 'mochi', scene: 'palace', tier: 2, main: '#D3779A', light: '#FAD6E2', dark: '#853252' },
  { level: 6, minWins: 20, name: 'Caped', cat: 'oreo', scene: 'rooftop', tier: 2, main: '#2C8079', light: '#A9E3DA', dark: '#123F3C' },
  { level: 7, minWins: 35, name: 'Legend', cat: 'pepper', scene: 'night', tier: 3, main: '#B2323F', light: '#F6BDA6', dark: '#561018' },
  { level: 8, minWins: 50, name: 'The Best', cat: 'yuki', scene: 'stage', tier: 3, main: '#4F86D6', light: '#DCEAFF', dark: '#1D3466' },
];

export function rankFor(wins: number): Rank {
  let r = RANKS[0]!;
  for (const x of RANKS) if (wins >= x.minWins) r = x;
  return r;
}

export function nextRank(rank: Rank): Rank | null {
  return RANKS[rank.level] ?? null;
}
