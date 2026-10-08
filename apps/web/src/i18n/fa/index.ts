import { ACCOUNT } from './account.js';
import { COMMON } from './common.js';
import { PACTS } from './pacts.js';
import { ROOMS } from './rooms.js';

/** Every Persian string in the app (English text → Persian). */
export const FA: Record<string, string> = { ...COMMON, ...PACTS, ...ROOMS, ...ACCOUNT };
