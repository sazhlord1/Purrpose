/**
 * Pact reminders scheduled on the phone itself (Android app). They fire with no
 * internet and no Google services, which matters in Iran: web push goes through
 * Google's servers, local notifications don't go anywhere.
 *
 * Every time the list of pacts changes, the reminders this app made are replaced
 * with fresh ones: 24 hours left, 1 hour left, and the deadline itself.
 */
import { getLocale, notifCopy, t, type CommitmentDto } from '@purrpose/shared';
import { isNativeApp } from './platform.js';

type LocalNotificationsApi = typeof import('@capacitor/local-notifications').LocalNotifications;

let pluginPromise: Promise<LocalNotificationsApi | null> | null = null;

/** The Capacitor plugin, loaded only inside the app (the website never downloads it). */
function plugin(): Promise<LocalNotificationsApi | null> {
  if (!isNativeApp()) return Promise.resolve(null);
  pluginPromise ??= import('@capacitor/local-notifications')
    .then(m => m.LocalNotifications)
    .catch(() => null);
  return pluginPromise;
}

const OFF_KEY = 'purrpose.localReminders.off';

/** The person can turn reminders off in Settings even when Android allows them. */
function turnedOff(): boolean {
  try {
    return localStorage.getItem(OFF_KEY) === '1';
  } catch {
    return false;
  }
}

function setTurnedOff(off: boolean): void {
  try {
    if (off) localStorage.setItem(OFF_KEY, '1');
    else localStorage.removeItem(OFF_KEY);
  } catch {
    /* private mode: lasts until reload */
  }
}

export function localRemindersSupported(): boolean {
  return isNativeApp();
}

export type LocalReminderState = 'on' | 'off' | 'denied' | 'unsupported';

export async function localReminderState(): Promise<LocalReminderState> {
  const ln = await plugin();
  if (!ln) return 'unsupported';
  const { display } = await ln.checkPermissions().catch(() => ({ display: 'denied' as const }));
  if (display === 'denied') return 'denied';
  if (display !== 'granted') return 'off';
  return turnedOff() ? 'off' : 'on';
}

/** Asks Android for permission (Android 13+ shows a dialog once) and turns reminders on. */
export async function enableLocalReminders(): Promise<LocalReminderState> {
  const ln = await plugin();
  if (!ln) return 'unsupported';
  const { display } = await ln.requestPermissions().catch(() => ({ display: 'denied' as const }));
  if (display !== 'granted') return display === 'denied' ? 'denied' : 'off';
  setTurnedOff(false);
  return 'on';
}

export async function disableLocalReminders(): Promise<LocalReminderState> {
  const ln = await plugin();
  if (!ln) return 'unsupported';
  setTurnedOff(true);
  await clearOurs(ln);
  return 'off';
}

/** Stable 31-bit id per (pact, kind), so rescheduling replaces instead of duplicating. */
export function reminderId(commitmentId: string, kind: string): number {
  let h = 2166136261;
  for (const ch of `${commitmentId}:${kind}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 1) || 1;
}

const OURS = 'purrpose-pact';

async function clearOurs(ln: LocalNotificationsApi): Promise<void> {
  const { notifications } = await ln.getPending().catch(() => ({ notifications: [] as Array<{ id: number; extra?: unknown }> }));
  const mine = notifications.filter(n => (n.extra as { kind?: string } | undefined)?.kind === OURS);
  if (mine.length > 0) await ln.cancel({ notifications: mine.map(n => ({ id: n.id })) }).catch(() => undefined);
}

export interface PlannedReminder {
  id: number;
  at: Date;
  title: string;
  body: string;
  commitmentId: string;
}

/** Which reminders a list of pacts needs, from `nowMs` on (pure, so it can be tested). */
export function planReminders(commitments: CommitmentDto[], nowMs: number): PlannedReminder[] {
  const copy = notifCopy(getLocale());
  const out: PlannedReminder[] = [];
  for (const c of commitments) {
    if (c.status !== 'ACTIVE') continue;
    const deadline = Date.parse(c.deadlineISO);
    const title = t('“{title}”', { title: c.title });
    const marks: Array<[string, number, string]> = [
      ['T24H', deadline - 24 * 3_600_000, copy.t24h],
      ['T1H', deadline - 3_600_000, copy.t1h],
      ['DEADLINE', deadline, t('Time’s up. Open Purrpose to see how it went.')],
    ];
    for (const [kind, atMs, body] of marks) {
      if (atMs <= nowMs + 5_000) continue; // already past
      out.push({ id: reminderId(c.id, kind), at: new Date(atMs), title, body, commitmentId: c.id });
    }
  }
  // Android keeps a limited number of alarms per app; the soonest ones matter most.
  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 60);
}

let lastSignature = '';

/** Replaces this app's scheduled reminders with the ones the current pacts need. */
export async function syncLocalReminders(commitments: CommitmentDto[] | undefined): Promise<void> {
  if (!commitments) return;
  const ln = await plugin();
  if (!ln || (await localReminderState()) !== 'on') return;
  const plan = planReminders(commitments, Date.now());
  const signature = plan.map(p => `${p.id}@${p.at.getTime()}:${p.title}`).join('|') + getLocale();
  if (signature === lastSignature) return;
  lastSignature = signature;
  await clearOurs(ln);
  if (plan.length === 0) return;
  await ln
    .schedule({
      notifications: plan.map(p => ({
        id: p.id,
        title: p.title,
        body: p.body,
        schedule: { at: p.at, allowWhileIdle: true },
        extra: { kind: OURS, url: `/commitment/${p.commitmentId}` },
      })),
    })
    .catch(() => {
      lastSignature = '';
    });
}

/** Tapping a reminder opens that pact. */
export async function onReminderTap(open: (url: string) => void): Promise<void> {
  const ln = await plugin();
  if (!ln) return;
  await ln
    .addListener('localNotificationActionPerformed', action => {
      const url = (action.notification.extra as { url?: string } | undefined)?.url;
      if (typeof url === 'string' && url.startsWith('/')) open(url);
    })
    .catch(() => undefined);
}
