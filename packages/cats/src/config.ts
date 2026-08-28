import type { CatId, CatSeedConfig } from '@purrpose/shared';
import { CAT_SEED } from '@purrpose/shared';

export function resolveCatConfig(catId: CatId): CatSeedConfig {
  const seed = CAT_SEED.find(c => c.id === catId);
  if (!seed) throw new Error(`Unknown catId: ${catId}`);
  return seed.config;
}

export function catName(catId: CatId): string {
  return CAT_SEED.find(c => c.id === catId)?.name ?? catId;
}
