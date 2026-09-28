/**
 * The cat catalog lives in code now, so the only thing to seed is the admin
 * account (from ADMIN_EMAIL / ADMIN_PASSWORD). The server also does this on boot.
 */
import '../src/loadenv.js';
import { getPrisma } from '../src/db.js';
import { getEnv } from '../src/env.js';
import { ensureAdmin } from '../src/services/accounts.js';

const prisma = getPrisma();

ensureAdmin(prisma, getEnv())
  .then(result => console.log(`admin: ${result}`))
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
