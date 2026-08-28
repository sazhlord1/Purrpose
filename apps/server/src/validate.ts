import type { ZodType } from 'zod';
import { AppError } from './errors.js';

export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError('INVALID_INPUT', result.error.flatten(), 'Invalid input');
  }
  return result.data;
}
