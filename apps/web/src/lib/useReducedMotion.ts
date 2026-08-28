import { useEffect, useState } from 'react';

const STORAGE_KEY = 'purrpose.reducedMotion';

function readPreference(): boolean {
  const manual = localStorage.getItem(STORAGE_KEY);
  if (manual !== null) return manual === '1';
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => readPreference());

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(readPreference());
    mq?.addEventListener('change', update);
    window.addEventListener('storage', update);
    return () => {
      mq?.removeEventListener('change', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return reduced;
}
