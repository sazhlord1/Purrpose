import type { FastifyRequest } from 'fastify';
import { getPrisma } from './db.js';
import { AppError } from './errors.js';
import { hashToken } from './security.js';

export type Role = 'USER' | 'ADMIN';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    role?: Role;
    /** Hash of the bearer token used for this request (lets /auth/logout delete it). */
    sessionHash?: string;
  }
}

export function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 && token.length <= 256 ? token : null;
}

export async function authenticate(request: FastifyRequest): Promise<void> {
  const token = bearerToken(request);
  if (!token) throw new AppError('UNAUTHORIZED', undefined, 'Missing bearer token');
  const tokenHash = hashToken(token);
  const session = await getPrisma().session.findUnique({
    where: { tokenHash },
    select: { userId: true, expiresAt: true, user: { select: { role: true } } },
  });
  if (!session) throw new AppError('UNAUTHORIZED', undefined, 'Invalid session');
  if (session.expiresAt && session.expiresAt.getTime() <= Date.now()) {
    await getPrisma().session.delete({ where: { tokenHash } }).catch(() => undefined);
    throw new AppError('UNAUTHORIZED', undefined, 'Session expired');
  }
  request.userId = session.userId;
  request.role = session.user.role;
  request.sessionHash = tokenHash;
}

export async function requireAdmin(request: FastifyRequest): Promise<void> {
  if (request.role !== 'ADMIN') throw new AppError('FORBIDDEN', undefined, 'Admins only');
}

/** Use inside handlers of the authenticated scope. */
export function userIdOf(request: FastifyRequest): string {
  if (!request.userId) throw new AppError('UNAUTHORIZED');
  return request.userId;
}
