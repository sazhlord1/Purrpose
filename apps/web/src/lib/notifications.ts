import { useEffect, useRef } from 'react';
import type { CommitmentDto } from '@purrpose/shared';

export function notificationsAvailable(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsAvailable()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

export function notify(title: string, body: string, tag?: string): void {
  if (!notificationsAvailable() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag });
  } catch {
    return;
  }
}

export const NOTIF_COPY = {
  reminder: 'Your cat is still waiting.',
  t24h: '24 hours left. Your cat has started checking the food cabinet.',
  t1h: 'Your cat knows what time it is.',
  success: 'You did it. Your cat is disappointed.',
  failure: 'You failed. Your cat is eating.',
} as const;

const NOTIF_MARKS: Array<[number, string]> = [
  [24 * 3_600_000, NOTIF_COPY.t24h],
  [3_600_000, NOTIF_COPY.t1h],
];

export function notifySuccess(commitmentId: string): void {
  notify('Purrpose', NOTIF_COPY.success, `success:${commitmentId}`);
}

export function notifyFailure(commitmentId: string): void {
  notify('Purrpose', NOTIF_COPY.failure, `failure:${commitmentId}`);
}

export function useNotificationScheduler(commitments: CommitmentDto[] | undefined): void {
  const latest = useRef(commitments);
  latest.current = commitments;
  const scheduled = useRef<Set<string>>(new Set());
  const reminded = useRef(false);

  useEffect(() => {
    if (!commitments || commitments.length === 0) return;
    if (!notificationsAvailable() || Notification.permission !== 'granted') return;

    const active = commitments.filter(c => c.status === 'ACTIVE');
    if (!reminded.current && active.length > 0) {
      reminded.current = true;
      notify('Purrpose', NOTIF_COPY.reminder, 'session-reminder');
    }

    for (const c of active) {
      const remaining = Date.parse(c.deadlineISO) - Date.now();
      for (const [offset, body] of NOTIF_MARKS) {
        const delay = remaining - offset;
        const tag = `${c.id}:${offset}`;
        if (delay > 0 && !scheduled.current.has(tag)) {
          scheduled.current.add(tag);
          window.setTimeout(() => {
            const still = latest.current?.find(x => x.id === c.id);
            if (still?.status === 'ACTIVE') notify('Purrpose', body, tag);
          }, delay);
        }
      }
    }
  }, [commitments]);
}
