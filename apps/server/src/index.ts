import './loadenv.js';
import { buildApp } from './app.js';
import { getEnv } from './env.js';
import { startSweep } from './sweep.js';

const env = getEnv();
const app = await buildApp();

try {
  await app.listen({ port: env.PORT, host: env.HOST });
  if (env.NODE_ENV !== 'test') startSweep();
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
