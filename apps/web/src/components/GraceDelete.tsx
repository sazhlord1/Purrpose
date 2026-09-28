import { useState } from 'react';
import { GRACE_WINDOW_MS } from '@purrpose/shared';

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

  return (
    <div className="grace-delete">
      {!confirming ? (
        <button className="chip" onClick={() => setConfirming(true)}>
          Changed your mind? Cancel free for <strong className="tabular">{mmss(left)}</strong>
        </button>
      ) : (
        <div className="chip-row" role="group" aria-label="Confirm cancel">
          <span className="muted">Cancel this pact? No stake is lost.</span>
          <button className="chip chip-active" disabled={busy} onClick={onDelete}>
            Yes, cancel it
          </button>
          <button className="chip" onClick={() => setConfirming(false)}>
            Keep it
          </button>
        </div>
      )}
    </div>
  );
}
