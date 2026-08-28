import { PrismaClient } from '@prisma/client';
import { CAT_SEED } from '@purrpose/shared';

const prisma = new PrismaClient();

async function main() {
  for (const cat of CAT_SEED) {
    await prisma.cat.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        type: cat.type,
        personality: cat.personality,
        config: cat.config,
      },
      create: {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        personality: cat.personality,
        config: cat.config,
      },
    });
  }
  console.log(`seeded ${CAT_SEED.length} cats`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
