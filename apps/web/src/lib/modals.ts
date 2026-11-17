import { useSyncExternalStore } from 'react';

/**
 * App-wide pop-ups that any screen can open: sign in, a new pact, a new detective case,
 * a peek at the pantry. One at a time; opening one closes the other.
 */
export type ModalState =
  | { kind: 'none' }
  | { kind: 'login'; reason?: string }
  | { kind: 'newPact'; catId?: string }
  | { kind: 'newCase' }
  | { kind: 'pantry' };

let state: ModalState = { kind: 'none' };
const listeners = new Set<() => void>();

function set(next: ModalState) {
  state = next;
  listeners.forEach(l => l());
}

export const openLogin = (reason?: string) => set({ kind: 'login', reason });
export const openNewPact = (catId?: string) => set({ kind: 'newPact', catId });
export const openNewCase = () => set({ kind: 'newCase' });
export const openPantryPeek = () => set({ kind: 'pantry' });
export const closeModal = () => set({ kind: 'none' });

export function useModal(): ModalState {
  return useSyncExternalStore(
    l => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}
