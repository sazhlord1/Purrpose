import { setSkewOffset } from '@purrpose/shared';

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

const TOKEN_KEY = 'purrpose.session';
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ? (import.meta.env.VITE_API_URL as string).replace(/\/$/, '') : '';

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

export async function api<T>(
  path: string,
  opts: { method?: 'GET' | 'POST' | 'DELETE'; body?: unknown; retryOn401?: boolean } = {},
): Promise<T> {
  let token = getToken();
  const isPublic = path === '/session' || path === '/healthz' || path === '/cats';
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
      const newToken = await ensureSession();
      return api<T>(path, { ...opts, retryOn401: false });
    } catch {
      // proceed to standard error handling
    }
  }

  const json: unknown = await res.json().catch(() => null);
  if (json && typeof json === 'object' && 'serverTime' in json) {
    setSkewOffset((json as { serverTime?: unknown }).serverTime);
  }
  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string; details?: unknown } })
      ?.error;
    throw new ApiError(res.status, err?.code ?? 'INTERNAL', err?.message ?? res.statusText, err?.details);
  }
  return json as T;
}
