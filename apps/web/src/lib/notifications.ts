import { useEffect, useRef } from 'react';
import { NOTIF_COPY, type CommitmentDto } from '@purrpose/shared';
import { api } from './api.js';

export { NOTIF_COPY };

export function notificationsAvailable(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function pushSupported(): boolean {
  return (
    notificationsAvailable() &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/** Registers /sw.js once. Safe to call repeatedly. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushState = 'on' | 'off' | 'denied' | 'unsupported' | 'unavailable';

export async function currentPushState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  return sub ? 'on' : 'off';
}

/**
 * Asks for permission, subscribes this browser to web push and registers the
 * subscription with the server, so reminders arrive even when the app is closed.
 * (On iPhone this works once Purrpose is added to the Home Screen.)
 */
export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  const permission = await Notification.requestPermission().catch(() => 'denied' as NotificationPermission);
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off';

  const { publicKey } = await api<{ publicKey: string | null }>('/push/public-key');
  if (!publicKey) return 'unavailable';

  const reg = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready);
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  await api('/push/subscribe', {
    method: 'POST',
    body: { endpoint: json.endpoint, keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth } },
  });
  return 'on';
}

export async function disablePush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await api('/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } }).catch(() => undefined);
    await sub.unsubscribe().catch(() => undefined);
  }
  return 'off';
}

/** Kept for the create flow: ask once, contextually, right after the first pact. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsAvailable() || Notification.permission === 'denied') return false;
  const state = await enablePush().catch(() => 'off' as PushState);
  return state === 'on' || Notification.permission === 'granted';
}

/** In-page notification. Tags match the server's push tags, so the same event never shows twice. */
export function notify(title: string, body: string, tag?: string): void {
  if (!notificationsAvailable() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag });
  } catch {
    return;
  }
}

export function notifySuccess(commitmentId: string): void {
  notify('Purrpose', NOTIF_COPY.success, `${commitmentId}:SUCCESS`);
}

export function notifyFailure(commitmentId: string): void {
  notify('Purrpose', NOTIF_COPY.failure, `${commitmentId}:FAILED`);
}

const NOTIF_MARKS: Array<[number, string, string]> = [
  [24 * 3_600_000, NOTIF_COPY.t24h, 'T24H'],
  [3_600_000, NOTIF_COPY.t1h, 'T1H'],
];

/**
 * Fallback for browsers without web push (or when the server has no VAPID keys):
 * schedules the 24h / 1h reminders while the tab stays open. Skipped entirely
 * when this browser has a push subscription — the server sends those instead.
 */
export function useNotificationScheduler(commitments: CommitmentDto[] | undefined): void {
  const latest = useRef(commitments);
  latest.current = commitments;
  const scheduled = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!commitments || commitments.length === 0) return;
    if (!notificationsAvailable() || Notification.permission !== 'granted') return;
    let cancelled = false;

    void currentPushState().then(state => {
      if (cancelled || state === 'on') return;
      for (const c of commitments.filter(x => x.status === 'ACTIVE')) {
        const remaining = Date.parse(c.deadlineISO) - Date.now();
        for (const [offset, body, kind] of NOTIF_MARKS) {
          const delay = remaining - offset;
          const tag = `${c.id}:${kind}`;
          // setTimeout can't hold more than ~24.8 days; later marks get picked up on a later visit.
          if (delay > 0 && delay < 2 ** 31 - 1 && !scheduled.current.has(tag)) {
            scheduled.current.add(tag);
            window.setTimeout(() => {
              const still = latest.current?.find(x => x.id === c.id);
              if (still?.status === 'ACTIVE') notify('Purrpose', body, tag);
            }, delay);
          }
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [commitments]);
}
