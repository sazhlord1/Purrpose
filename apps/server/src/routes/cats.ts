import type { FastifyInstance } from 'fastify';
import { CAT_SEED, FREE_CAT_IDS } from '@purrpose/shared';

/** Public catalog. The catalog lives in code (packages/shared/src/cats.ts) — no DB table. */
export function registerCatsRoutes(app: FastifyInstance): void {
  const payload = {
    cats: [...CAT_SEED]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type,
        personality: cat.personality,
        pricePurr: cat.pricePurr,
        config: cat.config,
      })),
    freeCatIds: FREE_CAT_IDS,
  };
  app.get('/api/v1/cats', async () => payload);
}
