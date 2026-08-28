import type { FastifyInstance } from 'fastify';
import { getPrisma } from '../db.js';

export function registerCatsRoutes(app: FastifyInstance): void {
  app.get('/api/v1/cats', async () => {
    const cats = await getPrisma().cat.findMany({ orderBy: { id: 'asc' } });
    return {
      cats: cats.map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type,
        personality: cat.personality,
        config: cat.config,
      })),
    };
  });
}
