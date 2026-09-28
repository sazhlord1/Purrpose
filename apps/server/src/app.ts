import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { authenticate } from './auth.js';
import { clock } from './clock.js';
import { getPrisma } from './db.js';
import { allowedOrigins, getEnv } from './env.js';
import { AppError } from './errors.js';
import { rateLimitMutations } from './ratelimit.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAccountRoutes, registerPublicAuthRoutes } from './routes/auth.js';
import { registerCatsRoutes } from './routes/cats.js';
import { registerCommitmentRoutes } from './routes/commitments.js';
import { registerDevRoutes } from './routes/dev.js';
import { registerFocusRoutes } from './routes/focus.js';
import { registerHistoryRoutes } from './routes/history.js';
import { registerMeRoutes } from './routes/me.js';
import { registerPublicPushRoutes, registerPushRoutes } from './routes/push.js';
import { registerSessionRoutes } from './routes/session.js';
import { registerShopRoutes } from './routes/shop.js';
import { registerWalletRoutes } from './routes/wallet.js';
import { makeCommitmentEngine } from './services/commitments.js';

export async function buildApp(): Promise<FastifyInstance> {
  const env = getEnv();
  const isProd = env.NODE_ENV === 'production';

  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : { level: isProd ? 'info' : 'debug', redact: ['req.headers.authorization'] },
    // Needed behind Render/Vercel-style proxies so request.ip is the real client (rate limits).
    trustProxy: env.TRUST_PROXY ?? isProd,
    bodyLimit: 32 * 1024,
  });

  // CORS: in production only the configured web origin(s) may call the API from a browser.
  const origins = allowedOrigins(env);
  await app.register(cors, {
    origin: isProd ? (origins.length > 0 ? origins : false) : true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['authorization', 'content-type'],
    maxAge: 600,
  });
  if (isProd && origins.length === 0) {
    app.log.warn('WEB_ORIGIN is not set: browsers on other origins will be blocked by CORS.');
  }

  // Security headers for every API response (an API never needs to be framed or sniffed).
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('Cross-Origin-Opener-Policy', 'same-origin');
    reply.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    reply.header('Cache-Control', 'no-store');
    if (isProd) reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    return payload;
  });

  const prisma = getPrisma();
  const engine = makeCommitmentEngine(prisma, clock);

  app.setErrorHandler((err, request, reply) => {
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({
        error: { code: err.code, message: err.message, details: err.details },
      });
    }
    const prismaCode = (err as { code?: string }).code;
    if (prismaCode === 'P2002') {
      return reply.code(409).send({ error: { code: 'CONFLICT', message: 'Conflicting state' } });
    }
    // Fastify's own client errors (bad JSON, body too large, wrong content-type…).
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status >= 400 && status < 500) {
      return reply.code(status).send({ error: { code: 'INVALID_INPUT', message: 'Invalid request' } });
    }
    request.log.error(err);
    return reply.code(500).send({ error: { code: 'INTERNAL', message: 'Internal server error' } });
  });

  app.setNotFoundHandler((_request, reply) =>
    reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Not found' } }),
  );

  app.get('/', async () => ({ ok: true, name: 'purrpose-api' }));
  app.get('/healthz', async () => ({ ok: true, serverTime: clock.now() }));
  app.get('/api/v1/healthz', async () => ({ ok: true, serverTime: clock.now() }));

  // Public routes
  registerSessionRoutes(app);
  registerCatsRoutes(app);
  registerPublicAuthRoutes(app);
  registerPublicPushRoutes(app);

  // Everything below requires a valid bearer token.
  await app.register(async function authenticatedScope(scope) {
    scope.addHook('onRequest', rateLimitMutations);
    scope.addHook('onRequest', authenticate);
    registerMeRoutes(scope);
    registerAccountRoutes(scope);
    registerCommitmentRoutes(scope, engine);
    registerWalletRoutes(scope);
    registerHistoryRoutes(scope);
    registerShopRoutes(scope);
    registerFocusRoutes(scope);
    registerPushRoutes(scope);
    await registerAdminRoutes(scope);
  });

  // Time travel / reset wipe the whole database: development only, never in production.
  if (env.NODE_ENV === 'development') {
    registerDevRoutes(app);
  }

  return app;
}
