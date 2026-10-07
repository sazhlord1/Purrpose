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

/** Admins land straight in their panel; everyone else on the home screen. */
function landingFor(res: AuthResponse): string {
  return res.role === 'ADMIN' ? '/admin' : '/';
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
  switchTo(res.token, '/settings');
}

export async function signOut(): Promise<void> {
  try {
    await api<void>('/auth/logout', { method: 'POST', retryOn401: false });
  } finally {
    switchTo(null);
  }
}
