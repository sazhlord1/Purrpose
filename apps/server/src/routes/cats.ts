import type { FastifyInstance } from 'fastify';
import { getPrisma } from '../db.js';
import { CAT_SEED } from '@purrpose/shared';

export function registerCatsRoutes(app: FastifyInstance): void {
  app.get('/api/v1/cats', async () => {
    const prisma = getPrisma();
    try {
      const dbCats = await prisma.cat.findMany({ select: { id: true } });
      const dbCatIds = new Set(dbCats.map(c => c.id));
      const needsSync = CAT_SEED.some(c => !dbCatIds.has(c.id)) || dbCats.some(c => c.id === 'ziggy');

      if (needsSync) {
        for (const seed of CAT_SEED) {
          await prisma.cat.upsert({
            where: { id: seed.id },
            update: {
              name: seed.name,
              type: seed.type,
              personality: seed.personality,
              config: seed.config as any,
            },
            create: {
              id: seed.id,
              name: seed.name,
              type: seed.type,
              personality: seed.personality,
              config: seed.config as any,
            },
          });
        }
        await prisma.cat
          .deleteMany({
            where: { id: { notIn: CAT_SEED.map(c => c.id) } },
          })
          .catch(() => {});
      }
    } catch {
      // Fallback cleanly to CAT_SEED if DB connection is busy or migrating
    }

    const sortedCats = [...CAT_SEED].sort((a, b) => a.id.localeCompare(b.id));

    return {
      cats: sortedCats.map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type,
        personality: cat.personality,
        config: cat.config,
      })),
    };
  });
}
