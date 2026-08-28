import type { FastifyRequest } from 'fastify';
import { getPrisma } from './db.js';
import { AppError } from './errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function authenticate(request: FastifyRequest): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('UNAUTHORIZED', undefined, 'Missing bearer token');
  }
  const token = header.slice(7).trim();
  const session = await getPrisma().session.findUnique({
    where: { token },
    select: { userId: true },
  });
  if (!session) throw new AppError('UNAUTHORIZED', undefined, 'Invalid session');
  request.userId = session.userId;
}
