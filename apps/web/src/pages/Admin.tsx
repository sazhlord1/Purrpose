import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { DoodleButton, SketchCard } from '../components/ui/index.js';
import { api, ApiError } from '../lib/api.js';
import { useMe } from '../lib/queries.js';

interface Stats {
  users: number;
  accounts: number;
  newUsers24h: number;
  commitments: { active: number; completed: number; failed: number };
  purrPurchased: number;
  unlocksByCat: Record<string, number>;
}

export function Admin() {
  const me = useMe();
  const isAdmin = me.data?.user.role === 'ADMIN';
  const stats = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api<Stats>('/admin/stats'),
    enabled: isAdmin,
  });
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState(100);
  const [note, setNote] = useState<string | null>(null);

  const grant = useMutation({
    mutationFn: () => api<{ email: string; purr: number }>('/admin/purr/grant', { method: 'POST', body: { email, amount } }),
    onSuccess: r => setNote(`${r.email} now has ${r.purr} PURR.`),
    onError: e => setNote(e instanceof ApiError ? e.message : 'Failed.'),
  });

  if (me.isLoading) return <main><p className="muted">checking your badge…</p></main>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const onGrant = (e: FormEvent) => {
    e.preventDefault();
    setNote(null);
    grant.mutate();
  };

  const s = stats.data;
  return (
    <main>
      <h1>Admin</h1>
      <p className="muted">Signed in as {me.data?.user.email}. Every cat and tool is unlocked for you.</p>

      <SketchCard variant="a">
        <h2>Numbers</h2>
        {!s ? (
          <p className="muted">counting cats…</p>
        ) : (
          <>
            <div className="row"><span className="muted">Users (guests + accounts)</span><strong>{s.users}</strong></div>
            <div className="row"><span className="muted">Accounts</span><strong>{s.accounts}</strong></div>
            <div className="row"><span className="muted">New in 24h</span><strong>{s.newUsers24h}</strong></div>
            <div className="row">
              <span className="muted">Pacts active / kept / fed</span>
              <strong>{s.commitments.active} / {s.commitments.completed} / {s.commitments.failed}</strong>
            </div>
            <div className="row"><span className="muted">PURR purchased</span><strong>{s.purrPurchased}</strong></div>
            <div className="row">
              <span className="muted">Cat unlocks</span>
              <strong>{Object.entries(s.unlocksByCat).map(([k, v]) => `${k}: ${v}`).join(' · ') || '—'}</strong>
            </div>
          </>
        )}
      </SketchCard>

      <SketchCard variant="b">
        <h2>Give PURR</h2>
        <form className="auth-form" onSubmit={onGrant}>
          <label className="field">
            <span>Account email</span>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Amount</span>
            <input type="number" min={1} max={100000} required value={amount} onChange={e => setAmount(Number(e.target.value))} />
          </label>
          {note && <p className="muted" role="status">{note}</p>}
          <DoodleButton type="submit" variant="primary" disabled={grant.isPending}>
            Grant PURR
          </DoodleButton>
        </form>
      </SketchCard>

      <SketchCard variant="c">
        <h2>Tools</h2>
        <div className="chip-row">
          <Link className="chip" to="/lab">Cat Lab →</Link>
          <Link className="chip" to="/cats">Cat gallery →</Link>
          <Link className="chip" to="/design">Design kit →</Link>
        </div>
      </SketchCard>
    </main>
  );
}
