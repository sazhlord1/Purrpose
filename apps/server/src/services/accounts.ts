import type { PrismaClient } from '@prisma/client';
import { SESSION_TTL_MS } from '@purrpose/shared';
import type { Env } from '../env.js';
import { AppError } from '../errors.js';
import { generateToken, hashPassword, hashToken, verifyPassword } from '../security.js';
import { bootstrapUserWithStarterGrant } from './wallet.js';

export interface IssuedSession {
  token: string;
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

async function issueSession(
  prisma: PrismaClient,
  user: { id: string; email: string | null; role: 'USER' | 'ADMIN' },
): Promise<IssuedSession> {
  const token = generateToken();
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { token, userId: user.id, email: user.email ?? '', role: user.role };
}

/** Creates a brand-new guest user + session (the original anonymous flow). */
export async function createGuestSession(prisma: PrismaClient) {
  return prisma.$transaction(async tx => {
    const user = await tx.user.create({ data: {} });
    const starterGrantApplied = await bootstrapUserWithStarterGrant(tx, user.id);
    const token = generateToken();
    await tx.session.create({ data: { tokenHash: hashToken(token), userId: user.id } });
    await tx.appEvent.create({
      data: { userId: user.id, name: 'session_started', payload: { starterGrantApplied } },
    });
    return { userId: user.id, token, starterGrantApplied };
  });
}

/**
 * Turns the CURRENT guest user into a real account, so everything they already
 * did on this device (commitments, pantry, history) is kept.
 */
export async function registerAccount(
  prisma: PrismaClient,
  env: Env,
  currentUserId: string,
  email: string,
  password: string,
): Promise<IssuedSession> {
  if (env.ADMIN_EMAIL && email === env.ADMIN_EMAIL.toLowerCase()) {
    throw new AppError('EMAIL_TAKEN', undefined, 'That email is already registered');
  }
  const current = await prisma.user.findUnique({ where: { id: currentUserId } });
  if (!current) throw new AppError('UNAUTHORIZED');
  if (current.email) {
    throw new AppError('ALREADY_REGISTERED', undefined, 'This device is already signed in to an account');
  }
  const passwordHash = await hashPassword(password);
  const updated = await prisma.user
    .update({ where: { id: currentUserId }, data: { email, passwordHash } })
    .catch((err: { code?: string }) => {
      if (err.code === 'P2002') throw new AppError('EMAIL_TAKEN', undefined, 'That email is already registered');
      throw err;
    });
  await prisma.appEvent.create({ data: { userId: updated.id, name: 'account_registered' } });
  // Rotate: old guest tokens for this user are dropped, a fresh expiring one is issued.
  await prisma.session.deleteMany({ where: { userId: updated.id } });
  return issueSession(prisma, updated);
}

export async function login(
  prisma: PrismaClient,
  email: string,
  password: string,
  opts: { adminOnly?: boolean } = {},
): Promise<IssuedSession> {
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash);
  // Same error for "no such email", "wrong password" and "not an admin" — no account enumeration.
  if (!user || !ok || (opts.adminOnly && user.role !== 'ADMIN')) {
    throw new AppError('INVALID_CREDENTIALS', undefined, 'Email or password is incorrect');
  }
  await prisma.appEvent.create({ data: { userId: user.id, name: opts.adminOnly ? 'admin_login' : 'login' } });
  return issueSession(prisma, user);
}

export async function logout(prisma: PrismaClient, tokenHash: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash } });
}

/**
 * Makes sure the admin account from ADMIN_EMAIL / ADMIN_PASSWORD exists, has the
 * ADMIN role and that its password matches the environment (the env is the
 * source of truth — to change the admin password, change the env var and restart).
 */
export async function ensureAdmin(prisma: PrismaClient, env: Env): Promise<'created' | 'updated' | 'unchanged' | 'skipped'> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return 'skipped';
  const email = env.ADMIN_EMAIL.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
    await prisma.$transaction(async tx => {
      const user = await tx.user.create({ data: { email, passwordHash, role: 'ADMIN', name: 'Admin' } });
      await bootstrapUserWithStarterGrant(tx, user.id);
    });
    return 'created';
  }

  const passwordOk = await verifyPassword(env.ADMIN_PASSWORD, existing.passwordHash);
  if (passwordOk && existing.role === 'ADMIN') return 'unchanged';
  await prisma.user.update({
    where: { id: existing.id },
    data: {
      role: 'ADMIN',
      ...(passwordOk ? {} : { passwordHash: await hashPassword(env.ADMIN_PASSWORD) }),
    },
  });
  if (!passwordOk) await prisma.session.deleteMany({ where: { userId: existing.id } });
  return 'updated';
}
