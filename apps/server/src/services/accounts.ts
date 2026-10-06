import type { PrismaClient } from '@prisma/client';
import { SESSION_TTL_MS } from '@purrpose/shared';
import type { Env } from '../env.js';
import { AppError } from '../errors.js';
import { generateToken, hashPassword, hashToken, verifyPassword } from '../security.js';
import type { GoogleProfile } from './google.js';
import { mergeGuestInto } from './merge.js';
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
  names: { firstName: string; lastName: string } = { firstName: '', lastName: '' },
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
    .update({
      where: { id: currentUserId },
      data: {
        email,
        passwordHash,
        ...(names.firstName
          ? { firstName: names.firstName, lastName: names.lastName || null, name: `${names.firstName} ${names.lastName}`.trim() }
          : {}),
      },
    })
    .catch((err: { code?: string }) => {
      if (err.code === 'P2002') throw new AppError('EMAIL_TAKEN', undefined, 'That email is already registered');
      throw err;
    });
  await prisma.appEvent.create({ data: { userId: updated.id, name: 'account_registered' } });
  // Rotate: old guest tokens for this user are dropped, a fresh expiring one is issued.
  await prisma.session.deleteMany({ where: { userId: updated.id } });
  return issueSession(prisma, updated);
}

/**
 * Called after a successful sign-in on a device that had a session. A guest's
 * progress is moved into the account it signed in to; another account's old
 * session on this device is simply dropped (the device switches accounts).
 */
async function absorbDeviceSession(prisma: PrismaClient, deviceSessionHash: string | undefined, targetId: string) {
  if (!deviceSessionHash) return;
  const session = await prisma.session.findUnique({
    where: { tokenHash: deviceSessionHash },
    select: { userId: true, user: { select: { email: true, googleId: true } } },
  });
  if (!session || session.userId === targetId) return;
  if (session.user.email === null && session.user.googleId === null) {
    await prisma.$transaction(tx => mergeGuestInto(tx, session.userId, targetId));
  } else {
    await prisma.session.deleteMany({ where: { tokenHash: deviceSessionHash } });
  }
}

export async function login(
  prisma: PrismaClient,
  email: string,
  password: string,
  opts: { adminOnly?: boolean; deviceSessionHash?: string } = {},
): Promise<IssuedSession> {
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash);
  // Same error for "no such email", "wrong password" and "not an admin" — no account enumeration.
  if (!user || !ok || (opts.adminOnly && user.role !== 'ADMIN')) {
    throw new AppError('INVALID_CREDENTIALS', undefined, 'Email or password is incorrect');
  }
  await prisma.appEvent.create({ data: { userId: user.id, name: opts.adminOnly ? 'admin_login' : 'login' } });
  if (!opts.adminOnly) await absorbDeviceSession(prisma, opts.deviceSessionHash, user.id);
  return issueSession(prisma, user);
}

/**
 * Sign in with Google. Finds the account by Google id, else by (verified) email,
 * else turns this device's guest into an account, else creates a new one. Any
 * guest progress on this device ends up in the account.
 */
export async function googleSignIn(
  prisma: PrismaClient,
  env: Env,
  profile: GoogleProfile,
  deviceSessionHash?: string,
): Promise<IssuedSession> {
  const adminEmail = env.ADMIN_EMAIL?.trim().toLowerCase();
  const refuseAdmin = () =>
    new AppError('FORBIDDEN', undefined, 'This account signs in with its password on the admin page.');
  if (adminEmail && profile.email === adminEmail) throw refuseAdmin();

  let user = await prisma.user.findUnique({ where: { googleId: profile.sub } });
  if (user?.role === 'ADMIN') throw refuseAdmin();

  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
    if (byEmail) {
      if (byEmail.role === 'ADMIN') throw refuseAdmin();
      if (byEmail.googleId && byEmail.googleId !== profile.sub) {
        throw new AppError('EMAIL_TAKEN', undefined, 'That email belongs to a different Google account.');
      }
      if (!profile.emailAuthoritative) {
        // Google can't vouch that this person still owns a non-Gmail address, so it
        // must not unlock an existing account on its own.
        throw new AppError(
          'EMAIL_TAKEN',
          undefined,
          'An account with this email already exists. Sign in with your email and password.',
        );
      }
      // Google has proven this person owns the email. If nobody had proven it before,
      // whoever registered it with a password might not be them: drop that password
      // and sign out its other devices before linking.
      const unproven = byEmail.emailVerifiedAt === null && byEmail.passwordHash !== null;
      user = await prisma.$transaction(async tx => {
        if (unproven) {
          await tx.session.deleteMany({ where: { userId: byEmail.id } });
          await tx.pushSubscription.deleteMany({ where: { userId: byEmail.id } });
        }
        return tx.user.update({
          where: { id: byEmail.id },
          data: {
            googleId: profile.sub,
            emailVerifiedAt: new Date(),
            name: byEmail.name ?? profile.name,
            firstName: byEmail.firstName ?? profile.firstName,
            lastName: byEmail.lastName ?? profile.lastName,
            ...(unproven ? { passwordHash: null } : {}),
          },
        });
      });
      await prisma.appEvent.create({
        data: { userId: user.id, name: 'google_linked', payload: { passwordCleared: unproven } },
      });
    }
  }

  if (!user) {
    // New to us. If this device is a guest, the guest becomes the account (nothing to move).
    const device = deviceSessionHash
      ? await prisma.session.findUnique({ where: { tokenHash: deviceSessionHash }, select: { user: true } })
      : null;
    const guest = device?.user && device.user.email === null && device.user.googleId === null ? device.user : null;
    const data = {
      email: profile.email,
      googleId: profile.sub,
      emailVerifiedAt: profile.emailAuthoritative ? new Date() : null,
      name: profile.name,
      firstName: profile.firstName,
      lastName: profile.lastName,
    };
    user = await prisma.$transaction(async tx => {
      if (guest) return tx.user.update({ where: { id: guest.id }, data: { ...data, name: guest.name ?? profile.name } });
      const created = await tx.user.create({ data });
      await bootstrapUserWithStarterGrant(tx, created.id);
      return created;
    }).catch((err: { code?: string }) => {
      if (err.code === 'P2002') throw new AppError('CONFLICT', undefined, 'Please try signing in again.');
      throw err;
    });
    await prisma.appEvent.create({ data: { userId: user.id, name: 'account_registered', payload: { via: 'google' } } });
    if (guest) await prisma.session.deleteMany({ where: { userId: user.id } }); // rotate the guest token
  } else {
    if (!user.firstName && profile.firstName) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firstName: profile.firstName, lastName: user.lastName ?? profile.lastName },
      });
    }
    await prisma.appEvent.create({ data: { userId: user.id, name: 'login', payload: { via: 'google' } } });
  }

  await absorbDeviceSession(prisma, deviceSessionHash, user.id);
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
