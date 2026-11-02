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

/** Is "sign in with your phone number" switched on at this server? */
export async function phoneLoginEnabled(): Promise<boolean> {
  try {
    return (await api<{ enabled: boolean }>('/auth/phone')).enabled;
  } catch {
    return false;
  }
}

/** Step 1: text a code to an 09… number. */
export async function sendPhoneCode(phone: string): Promise<{ resendInMs: number; expiresInMs: number }> {
  return api('/auth/phone/send', { method: 'POST', body: { phone } });
}

/**
 * Step 2: the code → a session. The token is stored but the page isn't reloaded yet,
 * so a brand-new account can give its name first (finishSignIn reloads).
 */
export async function verifyPhoneCode(phone: string, code: string): Promise<AuthResponse> {
  const res = await api<AuthResponse>('/auth/phone/verify', { method: 'POST', body: { phone, code } });
  storeToken(res.token);
  return res;
}

export async function saveName(firstName: string, lastName: string): Promise<void> {
  await api('/me/name', { method: 'POST', body: { firstName, lastName } });
}

/** After a phone sign-in: reload into the account. */
export function finishSignIn(res: AuthResponse): void {
  window.location.assign(landingFor(res));
}

/** Guests have neither an email nor a phone number. */
export function isGuestAccount(user: { email: string | null; phone?: string | null } | undefined): boolean {
  return !user || (!user.email && !user.phone);
}

export async function signOut(): Promise<void> {
  try {
    await api<void>('/auth/logout', { method: 'POST', retryOn401: false });
  } finally {
    switchTo(null);
  }
}
