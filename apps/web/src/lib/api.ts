import { catNameIn, hasTranslation, itemById, setSkewOffset } from '@purrpose/shared';
import { getLocale, t } from '../i18n/index.js';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** What to say for each error code when the server's own message has no translation. */
const ERROR_FALLBACK: Record<string, string> = {
  INVALID_INPUT: 'Something in there doesn’t look right. Check it and try again.',
  UNAUTHORIZED: 'Your session ran out. Reload the page and try again.',
  FORBIDDEN: 'You can’t do that from this account.',
  NOT_FOUND: 'We couldn’t find that.',
  INSUFFICIENT_AVAILABLE: 'Not enough free food in your pantry for that.',
  ALREADY_SETTLED: 'This one is already settled.',
  FAILED_AT_DEADLINE: 'Too late — the deadline passed and the cat already ate.',
  GRACE_EXPIRED: 'Too late to take this one back.',
  RATE_LIMITED: 'Too many tries. Take a short break and try again.',
  CONFLICT: 'Something changed in the meantime. Try again.',
  INVALID_CREDENTIALS: 'Email or password is incorrect',
  EMAIL_TAKEN: 'That email is already registered',
  ALREADY_REGISTERED: 'This device is already signed in to an account',
  CAT_LOCKED: 'That cat isn’t yours yet.',
  ITEM_LOCKED: 'That item isn’t yours yet.',
  ALREADY_OWNED: 'You already have that.',
  INSUFFICIENT_PURR: 'Not enough PURR for that.',
  PAYMENTS_UNAVAILABLE: 'Purchases are not available yet',
  PUSH_UNAVAILABLE: 'Push is not configured',
  INTERNAL: 'Something went wrong on our side. Try again in a bit.',
};

/**
 * Server errors are written in English. In Persian, show the translation of the
 * exact message when we have one, otherwise a Persian line chosen by error code.
 */
function localizeError(code: string, message: string, details: unknown): string {
  if (getLocale() === 'en') return message;
  const d = details && typeof details === 'object' ? (details as Record<string, unknown>) : {};
  const catId = typeof d.catId === 'string' ? d.catId : undefined;
  const item = typeof d.itemId === 'string' ? itemById(d.itemId) : undefined;
  const name = catId ? catNameIn(catId, getLocale()) : item ? t(item.name) : undefined;
  if (name && (code === 'CAT_LOCKED' || code === 'ITEM_LOCKED')) return t('{name} is not yours yet', { name });
  if (name && code === 'ALREADY_OWNED') return t('{name} is already yours', { name });
  if (code === 'INSUFFICIENT_PURR' && typeof d.needed === 'number') return t('You need {n} PURR', { n: d.needed });
  if (message && hasTranslation(message)) return t(message);
  return t(ERROR_FALLBACK[code] ?? ERROR_FALLBACK.INTERNAL ?? message);
}

const TOKEN_KEY = 'purrpose.session';
export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ? (import.meta.env.VITE_API_URL as string).replace(/\/$/, '') : '';

export function getToken(): string | null {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
}

export function storeToken(token: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

let sessionInitPromise: Promise<string> | null = null;

export async function ensureSession(): Promise<string> {
  const existing = getToken();
  if (existing) return existing;
  if (sessionInitPromise) return sessionInitPromise;
  sessionInitPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/session`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      if (data?.token) {
        storeToken(data.token);
        return data.token as string;
      }
      throw new Error('No token returned from session');
    } finally {
      sessionInitPromise = null;
    }
  })();
  return sessionInitPromise;
}

const PUBLIC_PATHS = new Set([
  '/session',
  '/healthz',
  '/cats',
  '/auth/login',
  '/auth/google',
  '/auth/admin/login',
  '/push/public-key',
]);

export async function api<T>(
  path: string,
  opts: { method?: 'GET' | 'POST' | 'DELETE'; body?: unknown; retryOn401?: boolean } = {},
): Promise<T> {
  let token = getToken();
  const isPublic = PUBLIC_PATHS.has(path);
  if (!token && !isPublic) {
    try {
      token = await ensureSession();
    } catch {
      // let server reply with 401 if token was needed
    }
  }

  const res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  });

  if (res.status === 401 && opts.retryOn401 !== false && !isPublic) {
    clearToken();
    try {
      await ensureSession();
      return api<T>(path, { ...opts, retryOn401: false });
    } catch {
      // proceed to standard error handling
    }
  }

  const json: unknown = res.status === 204 ? null : await res.json().catch(() => null);
  if (json && typeof json === 'object' && 'serverTime' in json) {
    setSkewOffset((json as { serverTime?: unknown }).serverTime);
  }
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string; details?: unknown } })
      ?.error;
    const code = err?.code ?? 'INTERNAL';
    throw new ApiError(res.status, code, localizeError(code, err?.message ?? res.statusText, err?.details), err?.details);
  }
  return json as T;
}
