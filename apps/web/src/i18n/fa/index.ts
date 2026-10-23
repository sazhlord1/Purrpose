import { ACCOUNT } from './account.js';
import { MODES } from './modes.js';
import { TOUR } from './tour.js';
import { COMMON } from './common.js';
import { PACTS } from './pacts.js';
import { ROOMS } from './rooms.js';

/** Every Persian string in the app (English text → Persian). */
export const FA: Record<string, string> = { ...COMMON, ...PACTS, ...ROOMS, ...ACCOUNT, ...MODES, ...TOUR };
