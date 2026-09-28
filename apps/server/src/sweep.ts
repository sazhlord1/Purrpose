import { clock } from './clock.js';
import { getPrisma } from './db.js';
import { getEnv } from './env.js';
import { makeCommitmentEngine } from './services/commitments.js';
import { dispatchPushNotifications } from './services/push.js';

/**
 * Every minute: settle overdue commitments (exactly-once, see settleDue) and
 * send any due web-push notifications (24h left / 1h left / the cat won).
 */
export function startSweep(intervalMs = 60_000): NodeJS.Timeout {
  const prisma = getPrisma();
  const engine = makeCommitmentEngine(prisma, clock);
  let running = false;
  const timer = setInterval(() => {
    if (running) return; // never overlap two sweeps on a slow DB
    running = true;
    (async () => {
      const settled = await engine.settleDue();
      await dispatchPushNotifications(prisma, getEnv(), clock.now(), settled);
    })()
      .catch(err => console.error('[sweep] failed:', err))
      .finally(() => {
        running = false;
      });
  }, intervalMs);
  timer.unref();
  return timer;
}
