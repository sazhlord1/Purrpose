import type { ZodType, ZodTypeDef } from 'zod';
import { AppError } from './errors.js';

/** Validates `data`; the schema may transform/default its input (e.g. query strings → numbers). */
export function parse<T>(schema: ZodType<T, ZodTypeDef, unknown>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError('INVALID_INPUT', result.error.flatten(), 'Invalid input');
  }
  return result.data;
}
