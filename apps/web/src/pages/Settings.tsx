import { useQuery } from '@tanstack/react-query';
import type { MeResponse } from '@purrpose/shared';
import { api, getToken } from '../lib/api.js';
import { SketchCard } from '../components/ui/index.js';

export function Settings() {
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<MeResponse>('/me') });
  const token = getToken();
  const deviceCode = token ? `…${token.slice(-4)}` : 'unknown';
  const reducedMotion =
    typeof localStorage !== 'undefined' && localStorage.getItem('purrpose.reducedMotion') === '1';

  return (
    <main>
      <h1>Settings</h1>

      <SketchCard variant="a">
        <h2>Session</h2>
        <div className="row">
          <span className="muted">Identity created</span>
          <span>{me.data ? new Date(me.data.user.createdAtISO).toLocaleDateString() : '…'}</span>
        </div>
        <div className="row">
          <span className="muted">Device code</span>
          <span>{deviceCode}</span>
        </div>
        <p className="muted">
          Purrpose runs on an anonymous device session for now. Accounts and cloud backup are
          future scope — clearing site data starts a fresh identity.
        </p>
        <button
          className="chip"
          onClick={() => {
            if (confirm('Clear local data? Your current commitments will be orphaned.')) {
              localStorage.removeItem('purrpose.session');
              localStorage.removeItem('purrpose.onboarded');
              location.reload();
            }
          }}
        >
          Clear local data
        </button>
      </SketchCard>

      <SketchCard variant="b">
        <h2>Accessibility</h2>
        <label className="row" style={{ cursor: 'pointer' }}>
          <span>Reduced motion (calmer cats)</span>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={e => {
              localStorage.setItem('purrpose.reducedMotion', e.target.checked ? '1' : '0');
              location.reload();
            }}
            style={{ width: 'auto' }}
          />
        </label>
      </SketchCard>

      <SketchCard variant="c">
        <h2>About</h2>
        <p>
          <strong>Purrpose</strong> v0.1.0
        </p>
        <p className="muted">Get your shit done. Or feed a cat.</p>
        <a className="chip" href="/design" style={{ textDecoration: 'none' }}>
          Design kit →
        </a>{' '}
        <a className="chip" href="/cats" style={{ textDecoration: 'none' }}>
          Cat gallery →
        </a>{' '}
        <a className="chip" href="/lab" style={{ textDecoration: 'none' }}>
          Cat Lab →
        </a>
      </SketchCard>
    </main>
  );
}
