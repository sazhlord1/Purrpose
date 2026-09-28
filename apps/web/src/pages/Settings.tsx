import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DoodleButton, SketchCard } from '../components/ui/index.js';
import { signOut } from '../lib/auth.js';
import { currentPushState, disablePush, enablePush, type PushState } from '../lib/notifications.js';
import { useMe } from '../lib/queries.js';

const PUSH_COPY: Record<PushState, string> = {
  on: 'On — reminders arrive even when Purrpose is closed.',
  off: 'Off',
  denied: 'Blocked in your browser settings.',
  unsupported: 'Not supported in this browser. On iPhone, add Purrpose to your Home Screen first.',
  unavailable: 'Not available on this server yet.',
};

export function Settings() {
  const me = useMe();
  const [push, setPush] = useState<PushState | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const reducedMotion =
    typeof localStorage !== 'undefined' && localStorage.getItem('purrpose.reducedMotion') === '1';

  useEffect(() => {
    void currentPushState().then(setPush);
  }, []);

  const togglePush = async () => {
    setPushBusy(true);
    try {
      setPush(push === 'on' ? await disablePush() : await enablePush());
    } catch {
      setPush('off');
    } finally {
      setPushBusy(false);
    }
  };

  const user = me.data?.user;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <main>
      <h1>Settings</h1>

      <SketchCard variant="a">
        <h2>Account</h2>
        {user?.email ? (
          <>
            <div className="row">
              <span className="muted">Signed in as</span>
              <span>{user.email}{isAdmin ? ' · admin' : ''}</span>
            </div>
            <div className="row">
              <span className="muted">Member since</span>
              <span>{new Date(user.createdAtISO).toLocaleDateString()}</span>
            </div>
            <div className="chip-row" style={{ marginTop: 12 }}>
              <DoodleButton onClick={() => void signOut()}>Sign out</DoodleButton>
              {isAdmin && <DoodleButton href="/admin">Admin panel →</DoodleButton>}
            </div>
          </>
        ) : (
          <>
            <p className="muted">
              You're playing as a guest. Create an account so your cats, pantry and PURR are safe if this
              browser is cleared — and so you can sign in on your other devices.
            </p>
            <div className="chip-row">
              <DoodleButton href="/login" variant="primary">
                Create account / Sign in
              </DoodleButton>
            </div>
          </>
        )}
      </SketchCard>

      <SketchCard variant="b">
        <h2>Notifications</h2>
        <div className="row">
          <span>Deadline reminders</span>
          <span className="muted" style={{ textAlign: 'right' }}>{push ? PUSH_COPY[push] : '…'}</span>
        </div>
        {(push === 'on' || push === 'off') && (
          <DoodleButton onClick={() => void togglePush()} disabled={pushBusy}>
            {push === 'on' ? 'Turn off' : 'Turn on'}
          </DoodleButton>
        )}
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
          <strong>Purrpose</strong> v0.2.0
        </p>
        <p className="muted">Get your shit done. Or feed a cat.</p>
        <div className="chip-row">
          <Link className="chip" to="/shop">Cat Shop →</Link>
          {(isAdmin || import.meta.env.DEV) && (
            <>
              <Link className="chip" to="/lab">Cat Lab →</Link>
              <Link className="chip" to="/cats">Cat gallery →</Link>
              <Link className="chip" to="/design">Design kit →</Link>
            </>
          )}
        </div>
      </SketchCard>
    </main>
  );
}
