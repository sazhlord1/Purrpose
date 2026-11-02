import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { PHONE_CODE_LENGTH } from '@purrpose/shared';
import { AppError } from '../errors.js';
import type { SmsSender } from './sms.js';

/** How long a code works. */
export const CODE_TTL_MS = 3 * 60_000;
/** Minimum wait before sending another code to the same number. */
export const RESEND_AFTER_MS = 60_000;
/** Wrong guesses allowed for one code. */
export const MAX_ATTEMPTS = 5;

function codeHash(phone: string, code: string): string {
  return createHash('sha256').update(`${phone}:${code}`, 'utf8').digest('hex');
}

function newCode(): string {
  return String(randomInt(0, 10 ** PHONE_CODE_LENGTH)).padStart(PHONE_CODE_LENGTH, '0');
}

/** Creates a fresh code for `phone` (replacing any older one) and sends it by SMS. */
export async function sendPhoneCode(
  prisma: PrismaClient,
  sms: SmsSender,
  phone: string,
  nowMs = Date.now(),
): Promise<{ resendInMs: number; expiresInMs: number }> {
  const existing = await prisma.phoneCode.findUnique({ where: { phone } });
  if (existing) {
    const wait = existing.sentAt.getTime() + RESEND_AFTER_MS - nowMs;
    if (wait > 0) {
      throw new AppError('RATE_LIMITED', { retryAfterMs: wait }, 'A code was just sent. Wait a minute before asking for another.');
    }
  }
  const code = newCode();
  const data = { codeHash: codeHash(phone, code), expiresAt: new Date(nowMs + CODE_TTL_MS), attempts: 0, sentAt: new Date(nowMs) };
  await prisma.phoneCode.upsert({ where: { phone }, create: { phone, ...data }, update: data });
  try {
    await sms.sendCode(phone, code);
  } catch (err) {
    // Not sent: let them try again right away.
    await prisma.phoneCode.deleteMany({ where: { phone, codeHash: data.codeHash } });
    throw err;
  }
  return { resendInMs: RESEND_AFTER_MS, expiresInMs: CODE_TTL_MS };
}

/** Checks a code. Correct → the code is used up. Wrong → counts the attempt. */
export async function checkPhoneCode(prisma: PrismaClient, phone: string, code: string, nowMs = Date.now()): Promise<void> {
  const row = await prisma.phoneCode.findUnique({ where: { phone } });
  if (!row || row.expiresAt.getTime() <= nowMs) {
    throw new AppError('CODE_INVALID', undefined, 'This code has expired. Ask for a new one.');
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    throw new AppError('CODE_INVALID', undefined, 'Too many wrong tries. Ask for a new code.');
  }
  const a = Buffer.from(row.codeHash, 'hex');
  const b = Buffer.from(codeHash(phone, code), 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await prisma.phoneCode.update({ where: { phone }, data: { attempts: { increment: 1 } } });
    throw new AppError('CODE_INVALID', undefined, 'That code isn’t right. Check the SMS and try again.');
  }
  // One use only (and only one of two simultaneous correct requests wins).
  const used = await prisma.phoneCode.deleteMany({ where: { phone, codeHash: row.codeHash } });
  if (used.count === 0) throw new AppError('CODE_INVALID', undefined, 'This code has expired. Ask for a new one.');
}
