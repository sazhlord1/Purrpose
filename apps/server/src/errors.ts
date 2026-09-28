export type ErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INSUFFICIENT_AVAILABLE'
  | 'ALREADY_SETTLED'
  | 'FAILED_AT_DEADLINE'
  | 'GRACE_EXPIRED'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_TAKEN'
  | 'ALREADY_REGISTERED'
  | 'CAT_LOCKED'
  | 'ITEM_LOCKED'
  | 'ALREADY_OWNED'
  | 'INSUFFICIENT_PURR'
  | 'PAYMENTS_UNAVAILABLE'
  | 'PUSH_UNAVAILABLE'
  | 'INTERNAL';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  INVALID_INPUT: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INSUFFICIENT_AVAILABLE: 409,
  ALREADY_SETTLED: 409,
  FAILED_AT_DEADLINE: 409,
  GRACE_EXPIRED: 409,
  RATE_LIMITED: 429,
  CONFLICT: 409,
  INVALID_CREDENTIALS: 401,
  EMAIL_TAKEN: 409,
  ALREADY_REGISTERED: 409,
  CAT_LOCKED: 403,
  ITEM_LOCKED: 403,
  ALREADY_OWNED: 409,
  INSUFFICIENT_PURR: 409,
  PAYMENTS_UNAVAILABLE: 503,
  PUSH_UNAVAILABLE: 503,
  INTERNAL: 500,
};

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly details?: unknown,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'AppError';
  }

  get statusCode(): number {
    return STATUS_BY_CODE[this.code];
  }
}
