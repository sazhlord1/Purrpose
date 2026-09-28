import { useState } from 'react';
import { API_BASE_URL } from '../lib/api.js';

const TRAVELS: Array<[string, string]> = [
  ['+10s', '0.1667'],
  ['+1m', '1'],
  ['+1h', '60'],
  ['+1d', '1440'],
];

export function DevDrawer() {
  const [open, setOpen] = useState(false);
  if (!import.meta.env.DEV) return null;

  const travel = async (minutes: string) => {
    await fetch(`${API_BASE_URL}/api/v1/dev/time-travel?addMinutes=${minutes}`);
    location.reload();
  };

  const reset = async () => {
    await fetch(`${API_BASE_URL}/api/v1/dev/reset-demo`, { method: 'POST' });
    localStorage.clear();
    location.href = '/';
  };

  return (
    <div className="dev-drawer">
      {open &&
        TRAVELS.map(([label, minutes]) => (
          <button key={label} className="dev-drawer-chip" onClick={() => travel(minutes)}>
            ⏩ {label}
          </button>
        ))}
      {open && (
        <button className="dev-drawer-chip" onClick={reset}>
          ⟲ reset demo
        </button>
      )}
      <button
        className="dev-drawer-chip"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close dev drawer' : 'Open dev drawer'}
        title="Dev tools"
      >
        {open ? '✕ dev' : '🛠'}
      </button>
    </div>
  );
}
