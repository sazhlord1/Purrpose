/**
 * Imported first by main.tsx: picks the language before any other module is
 * evaluated, so tables built at module load (cat names, quips) are already in it.
 */
import { initLocale } from './i18n/index.js';

initLocale();
