import { Fragment, useState } from 'react';
import { GRACE_WINDOW_MS } from '@purrpose/shared';
import { t } from '../i18n/index.js';

interface GraceDeleteProps {
  createdMs: number;
  nowMs: number;
  busy?: boolean;
  onDelete: () => void;
}

function mmss(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** "Changed your mind?" — free cancellation during the first 5 minutes, with a live countdown. */
export function GraceDelete({ createdMs, nowMs, busy, onDelete }: GraceDeleteProps) {
  const [confirming, setConfirming] = useState(false);
  const left = createdMs + GRACE_WINDOW_MS - nowMs;
  if (left <= 0) return null;

  // "{time}" in the sentence becomes the bold live countdown.
  const offer = t('Changed your mind? Cancel free for {time}').split('{time}');

  return (
    <div className="grace-delete">
      {!confirming ? (
        <button className="chip" onClick={() => setConfirming(true)}>
          {offer.map((part, i) => (
            <Fragment key={i}>
              {i > 0 && <strong className="tabular">{mmss(left)}</strong>}
              {part}
            </Fragment>
          ))}
        </button>
      ) : (
        <div className="chip-row" role="group" aria-label={t('Confirm cancel')}>
          <span className="muted">{t('Cancel this pact? No stake is lost.')}</span>
          <button className="chip chip-active" disabled={busy} onClick={onDelete}>
            {t('Yes, cancel it')}
          </button>
          <button className="chip" onClick={() => setConfirming(false)}>
            {t('Keep it')}
          </button>
        </div>
      )}
    </div>
  );
}
