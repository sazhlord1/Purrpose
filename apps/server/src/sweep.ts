import { clock } from './clock.js';
import { getPrisma } from './db.js';
import { makeCommitmentEngine } from './services/commitments.js';

export function startSweep(intervalMs = 60_000): NodeJS.Timeout {
  const engine = makeCommitmentEngine(getPrisma(), clock);
  const timer = setInterval(() => {
    engine.settleDue().catch(err => {
      console.error('[sweep] settlement failed:', err);
    });
  }, intervalMs);
  timer.unref();
  return timer;
}
