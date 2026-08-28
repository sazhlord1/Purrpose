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
