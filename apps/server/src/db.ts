import { PrismaClient } from '@prisma/client';
import { getEnv } from './env.js';

let instance: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (!instance) {
    instance = new PrismaClient({
      datasources: { db: { url: getEnv().DATABASE_URL } },
    });
  }
  return instance;
}

export async function checkDatabase(prisma: PrismaClient): Promise<boolean> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    return true;
  } catch {
    return false;
  }
}
