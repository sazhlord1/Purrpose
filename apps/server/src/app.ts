import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { authenticate } from './auth.js';
import { clock } from './clock.js';
import { getPrisma } from './db.js';
import { getEnv } from './env.js';
import { AppError } from './errors.js';
import { rateLimitMutations } from './ratelimit.js';
import { registerCatsRoutes } from './routes/cats.js';
import { registerCommitmentRoutes } from './routes/commitments.js';
import { registerDevRoutes } from './routes/dev.js';
import { registerHistoryRoutes } from './routes/history.js';
import { registerMeRoutes } from './routes/me.js';
import { registerSessionRoutes } from './routes/session.js';
import { registerWalletRoutes } from './routes/wallet.js';
import { makeCommitmentEngine } from './services/commitments.js';

export async function buildApp(): Promise<FastifyInstance> {
  const env = getEnv();
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
  });

  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? (process.env.WEB_ORIGIN ?? false) : true,
  });

  const prisma = getPrisma();
  const engine = makeCommitmentEngine(prisma, clock);

  app.setErrorHandler((err, _request, reply) => {
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({
        error: { code: err.code, message: err.message, details: err.details },
      });
    }
    const prismaCode = (err as { code?: string }).code;
    if (prismaCode === 'P2002') {
      return reply
        .code(409)
        .send({ error: { code: 'CONFLICT', message: 'Conflicting state' } });
    }
    app.log.error(err);
    return reply
      .code(500)
      .send({ error: { code: 'INTERNAL', message: 'Internal server error' } });
  });

  app.get('/', async () => ({ ok: true, name: 'purrpose-api', version: '0.1.0' }));
  app.get('/healthz', async () => ({ ok: true, serverTime: clock.now() }));
  app.get('/api/v1/healthz', async () => ({ ok: true, serverTime: clock.now() }));

  registerSessionRoutes(app);
  registerCatsRoutes(app);

  await app.register(async function authenticatedScope(scope) {
    scope.addHook('onRequest', rateLimitMutations);
    scope.addHook('onRequest', authenticate);
    registerMeRoutes(scope);
    registerCommitmentRoutes(scope, engine);
    registerWalletRoutes(scope);
    registerHistoryRoutes(scope);
  });

  if (env.NODE_ENV === 'development') {
    registerDevRoutes(app);
  }

  return app;
}
