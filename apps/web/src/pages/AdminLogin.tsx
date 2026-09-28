import { useState, type FormEvent } from 'react';
import { DoodleButton, SketchCard } from '../components/ui/index.js';
import { ApiError } from '../lib/api.js';
import { adminSignIn } from '../lib/auth.js';

/** Separate entrance for the admin account (only accounts with the ADMIN role get through). */
export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminSignIn(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
      setBusy(false);
    }
  };

  return (
    <main>
      <h1>Admin</h1>
      <SketchCard variant="b">
        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <DoodleButton type="submit" variant="primary" disabled={busy}>
            {busy ? '…' : 'Sign in as admin'}
          </DoodleButton>
        </form>
      </SketchCard>
    </main>
  );
}
