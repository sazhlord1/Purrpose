export function computeSkewOffset(serverTimeMs: number, clientNowMs: number = Date.now()): number {
  return serverTimeMs - clientNowMs;
}

export function correctedNow(offsetMs: number): number {
  return Date.now() + offsetMs;
}

let skewOffsetMs = 0;

export function setSkewOffset(serverTimeMs?: unknown): void {
  if (typeof serverTimeMs === 'number' && Number.isFinite(serverTimeMs)) {
    skewOffsetMs = computeSkewOffset(serverTimeMs);
  }
}

export function now(): number {
  return correctedNow(skewOffsetMs);
}
