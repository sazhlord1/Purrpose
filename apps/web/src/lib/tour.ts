import { useEffect, useSyncExternalStore } from 'react';

/**
 * Small store for the guided tours: which ones were already seen (per device),
 * and whether something else (onboarding, a welcome message, a popup) is on
 * screen — a tour waits until nothing else is.
 */
const SEEN_PREFIX = 'purrpose.tour.';
const blockers = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;

function emit(): void {
  version++;
  for (const l of listeners) l();
}

export function tourSeen(id: string): boolean {
  try {
    return localStorage.getItem(SEEN_PREFIX + id) === '1';
  } catch {
    return true; // no storage: don't nag on every visit
  }
}

export function markTourSeen(id: string): void {
  try {
    localStorage.setItem(SEEN_PREFIX + id, '1');
  } catch {
    /* ignore */
  }
  emit();
}

/** Settings → "Show the guide again": every page explains itself once more. */
export function resetTours(): void {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith(SEEN_PREFIX)) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  emit();
}

/** While `active`, tours stay hidden (e.g. a popup is open). */
export function useBlockTours(key: string, active: boolean): void {
  useEffect(() => {
    if (!active) return undefined;
    blockers.add(key);
    emit();
    return () => {
      blockers.delete(key);
      emit();
    };
  }, [key, active]);
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Re-renders when blockers or seen-flags change; returns whether tours may show now. */
export function useToursAllowed(): boolean {
  useSyncExternalStore(subscribe, () => version);
  return blockers.size === 0;
}
