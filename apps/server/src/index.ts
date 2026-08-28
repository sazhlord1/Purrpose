import './loadenv.js';
import { buildApp } from './app.js';
import { getEnv } from './env.js';
import { startSweep } from './sweep.js';

const env = getEnv();
const app = await buildApp();

const port = Number(process.env.PORT) || env.PORT || 3000;
const host = process.env.HOST || env.HOST || '0.0.0.0';

try {
  await app.listen({ port, host });
  if (env.NODE_ENV !== 'test') startSweep();
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
