import { useCallback, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { DoodleButton, SketchCard } from '../components/ui/index.js';
import { ApiError } from '../lib/api.js';
import { GoogleButton } from '../components/GoogleButton.js';
import { createAccount, signIn, signInWithGoogle } from '../lib/auth.js';
import { useMe } from '../lib/queries.js';

type Mode = 'signin' | 'register';

export function Login() {
  const me = useMe();
  const isGuest = me.data ? me.data.user.email === null : true;
  const [mode, setMode] = useState<Mode>(isGuest ? 'register' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const describe = (err: unknown) =>
    err instanceof ApiError
      ? err.code === 'INVALID_INPUT'
        ? 'Check your name and email, and use a password of at least 8 characters.'
        : err.message
      : 'Could not reach the server.';

  const onGoogle = useCallback(async (credential: string) => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle(credential);
    } catch (err) {
      setError(describe(err));
      setBusy(false);
    }
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'register') await createAccount(email, password, firstName, lastName);
      else await signIn(email, password);
    } catch (err) {
      setError(describe(err));
      setBusy(false);
    }
  };

  if (me.data?.user.email) {
    return (
      <main>
        <h1>You're signed in</h1>
        <p className="muted">as {me.data.user.email}</p>
        <DoodleButton href="/settings">Go to settings</DoodleButton>
      </main>
    );
  }

  return (
    <main>
      <h1>{isGuest ? 'Keep your cats safe' : 'Welcome back'}</h1>
      <p className="muted">
        Sign in to save your progress and pick it up on any device. Everything you did here as a guest — pacts,
        pantry, PURR, cats and items — comes with you into your account.
      </p>

      <SketchCard variant="a">
        <GoogleButton onToken={onGoogle} disabled={busy} />
        <div className="auth-divider" role="separator">
          <span>or use email</span>
        </div>
        <div className="chip-row" role="tablist">
          <button role="tab" aria-selected={mode === 'register'} className={`chip ${mode === 'register' ? 'chip-active' : ''}`} onClick={() => setMode('register')}>
            Create account
          </button>
          <button role="tab" aria-selected={mode === 'signin'} className={`chip ${mode === 'signin' ? 'chip-active' : ''}`} onClick={() => setMode('signin')}>
            Sign in
          </button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <div className="name-row">
              <label className="field">
                <span>First name</span>
                <input autoComplete="given-name" required maxLength={40} value={firstName} onChange={e => setFirstName(e.target.value)} />
              </label>
              <label className="field">
                <span>Last name</span>
                <input autoComplete="family-name" required maxLength={40} value={lastName} onChange={e => setLastName(e.target.value)} />
              </label>
            </div>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <DoodleButton type="submit" variant="primary" size="big" disabled={busy}>
            {busy ? '…' : mode === 'register' ? 'Create account' : 'Sign in'}
          </DoodleButton>
        </form>
      </SketchCard>
      <p className="muted legal-note">
        By continuing you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
      </p>
      <p className="muted">
        <Link to="/">← back home</Link>
      </p>
    </main>
  );
}
