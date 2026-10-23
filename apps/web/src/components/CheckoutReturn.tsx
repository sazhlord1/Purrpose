import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { foodName, t } from '../i18n/index.js';
import { api } from '../lib/api.js';
import { purrPackById, type ConsequenceType } from '@purrpose/shared';

type Result =
  | { status: 'paid'; kind: 'purr' | 'food'; item: string; quantity: number; credited: boolean }
  | { status: 'pending' };

/**
 * Back from Stripe Checkout (?checkout=done&session_id=… or ?checkout=cancelled):
 * settle the payment, say what arrived, and tidy the address bar.
 */
export function CheckoutReturn() {
  const qc = useQueryClient();
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const state = url.searchParams.get('checkout');
    if (!state) return undefined;
    const sessionId = url.searchParams.get('session_id');
    url.searchParams.delete('checkout');
    url.searchParams.delete('session_id');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);

    if (state === 'cancelled') {
      setText(t('Checkout cancelled. Nothing was charged.'));
      return undefined;
    }
    if (state !== 'done' || !sessionId) return undefined;

    let alive = true;
    const refresh = () => {
      for (const key of ['me', 'shop', 'history']) void qc.invalidateQueries({ queryKey: [key] });
    };
    // A card payment is usually settled already; if not, check again a few times.
    const tryConfirm = async (attempt: number): Promise<void> => {
      try {
        const res = await api<Result>('/payments/confirm', { method: 'POST', body: { sessionId } });
        if (!alive) return;
        if (res.status === 'paid') {
          if (res.kind === 'purr') {
            const purr = purrPackById(res.item)?.purr ?? 0;
            setText(t('Payment received: +{n} PURR.', { n: purr }));
          } else {
            setText(t('Payment received: {n} × {food} added to your pantry.', { n: res.quantity, food: foodName(res.item as ConsequenceType, true) }));
          }
          refresh();
          return;
        }
        if (attempt < 5) {
          setText(t('Payment is processing…'));
          window.setTimeout(() => void tryConfirm(attempt + 1), 2500);
        } else {
          setText(t('Payment is still processing. It will show up here as soon as Stripe confirms it.'));
        }
      } catch {
        if (alive) setText(t('We couldn’t confirm the payment yet. If you were charged, it will show up shortly.'));
      }
    };
    void tryConfirm(0);
    return () => {
      alive = false;
    };
  }, [qc]);

  if (!text) return null;
  return (
    <div className="checkout-toast" role="status">
      <span>{text}</span>
      <button type="button" className="linklike" onClick={() => setText(null)} aria-label={t('Close')}>
        ✕
      </button>
    </div>
  );
}
