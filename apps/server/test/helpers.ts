import type { PrismaClient } from '@prisma/client';
import { resetRateLimits } from '../src/ratelimit.js';
import { resetContactLimit } from '../src/routes/site.js';
import { clearSiteStatsCache } from '../src/services/site.js';

/** Wipes every table (children first) and resets in-memory rate limits. */
export async function wipeDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.inboxMessage.deleteMany({});
  await prisma.deliveryMedia.deleteMany({});
  await prisma.deliveryPost.deleteMany({});
  await prisma.storedMedia.deleteMany({});
  await prisma.blogPost.deleteMany({});
  await prisma.contactMessage.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.phoneCode.deleteMany({});
  await prisma.notificationLog.deleteMany({});
  await prisma.pushSubscription.deleteMany({});
  await prisma.focusSession.deleteMany({});
  await prisma.catUnlock.deleteMany({});
  await prisma.itemUnlock.deleteMany({});
  await prisma.purrTransaction.deleteMany({});
  await prisma.creditTransaction.deleteMany({});
  await prisma.habitSlip.deleteMany({});
  await prisma.habit.deleteMany({});
  await prisma.proofAudio.deleteMany({});
  await prisma.commitment.deleteMany({});
  await prisma.creditBalance.deleteMany({});
  await prisma.appEvent.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  resetRateLimits();
  resetContactLimit();
  clearSiteStatsCache();
}
