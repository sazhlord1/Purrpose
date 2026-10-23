export function computeAvailable(balanceAmount: number, activeStakes: number): number {
  return balanceAmount - activeStakes;
}

export function canStake(
  balanceAmount: number,
  activeStakes: number,
  requested: number,
): { ok: boolean; available: number } {
  const available = computeAvailable(balanceAmount, activeStakes);
  return { ok: available >= requested, available };
}

export function clampBalance(amount: number): number {
  return amount < 0 ? 0 : amount;
}

// ─── Pact modes ──────────────────────────────────────────────────────────────
/** PURR every new player gets once. Exactly enough to win one cat with three kept starter pacts. */
export const PURR_WELCOME = 120;
/** The first honor (PURR) pacts are "starter" pacts: fixed stake, bonus when kept. */
export const HONOR_STARTER_COUNT = 3;
export const HONOR_STARTER_STAKE = 40;
export const HONOR_STARTER_BONUS = 10;
/** Smallest PURR stake for an honor pact after the starters. */
export const HONOR_MIN_STAKE = 10;
/** A strict pact's proof is approved automatically if nobody decides within this window. */
export const REVIEW_WINDOW_MS = 48 * 3_600_000;
/** Proof photos are shrunk in the browser; the API refuses anything larger. */
export const PROOF_MAX_IMAGE_BYTES = 600_000;
export const PROOF_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
