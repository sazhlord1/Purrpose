import type { AuthResponse } from '@purrpose/shared';
import { api, clearToken, storeToken } from './api.js';

/**
 * After any identity change we do a full reload: every cached query, timer and
 * push subscription belongs to the previous user, and a reload resets them all.
 */
function switchTo(token: string | null, to = '/'): void {
  if (token) storeToken(token);
  else clearToken();
  window.location.assign(to);
}

const AFTER_LOGIN_KEY = 'purrpose.afterLogin';

/** Remember where to come back to after signing in (e.g. a witness page). Same-site paths only. */
export function returnAfterLogin(path: string): void {
  try {
    if (path.startsWith('/') && !path.startsWith('//')) sessionStorage.setItem(AFTER_LOGIN_KEY, path);
  } catch {
    /* storage blocked: they land on home instead */
  }
}

function takeReturnPath(): string | null {
  try {
    const path = sessionStorage.getItem(AFTER_LOGIN_KEY);
    sessionStorage.removeItem(AFTER_LOGIN_KEY);
    return path && path.startsWith('/') && !path.startsWith('//') ? path : null;
  } catch {
    return null;
  }
}

/** Admins land straight in their panel; everyone else back where they came from, or home. */
function landingFor(res: AuthResponse): string {
  const back = takeReturnPath();
  return back ?? (res.role === 'ADMIN' ? '/admin' : '/');
}

export async function signIn(email: string, password: string): Promise<void> {
  const res = await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } });
  switchTo(res.token, landingFor(res));
}

/** Google's ID token → our session. Guest progress on this device moves into the account. */
export async function signInWithGoogle(credential: string): Promise<void> {
  const res = await api<AuthResponse>('/auth/google', { method: 'POST', body: { credential } });
  switchTo(res.token, landingFor(res));
}

export async function adminSignIn(email: string, password: string): Promise<void> {
  const res = await api<AuthResponse>('/auth/admin/login', { method: 'POST', body: { email, password } });
  switchTo(res.token, '/admin');
}

/** Upgrades the current guest (keeps all their cats and history) into an account. */
export async function createAccount(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<void> {
  const res = await api<AuthResponse>('/auth/register', {
    method: 'POST',
    body: { email, password, firstName, lastName },
  });
  switchTo(res.token, takeReturnPath() ?? '/settings');
}

export async function signOut(): Promise<void> {
  try {
    await api<void>('/auth/logout', { method: 'POST', retryOn401: false });
  } finally {
    switchTo(null);
  }
}
