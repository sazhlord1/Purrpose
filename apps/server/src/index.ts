import './loadenv.js';
import { buildApp } from './app.js';
import { getPrisma } from './db.js';
import { getEnv } from './env.js';
import { ensureAdmin } from './services/accounts.js';
import { startSweep } from './sweep.js';

const env = getEnv();
const app = await buildApp();

// Never let an admin-bootstrap hiccup (e.g. DB still waking up) keep the API offline.
try {
  const admin = await ensureAdmin(getPrisma(), env);
  if (admin !== 'skipped') app.log.info(`admin account: ${admin}`);
} catch (err) {
  app.log.error({ err }, 'admin bootstrap failed — will retry on next restart');
}

try {
  await app.listen({ port: env.PORT, host: env.HOST });
  if (env.NODE_ENV !== 'test') startSweep();
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
