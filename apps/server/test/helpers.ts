import type { PrismaClient } from '@prisma/client';
import { resetRateLimits } from '../src/ratelimit.js';

/** Wipes every table (children first) and resets in-memory rate limits. */
export async function wipeDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.notificationLog.deleteMany({});
  await prisma.pushSubscription.deleteMany({});
  await prisma.focusSession.deleteMany({});
  await prisma.catUnlock.deleteMany({});
  await prisma.itemUnlock.deleteMany({});
  await prisma.purrTransaction.deleteMany({});
  await prisma.creditTransaction.deleteMany({});
  await prisma.habitSlip.deleteMany({});
  await prisma.habit.deleteMany({});
  await prisma.commitment.deleteMany({});
  await prisma.creditBalance.deleteMany({});
  await prisma.appEvent.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  resetRateLimits();
}
