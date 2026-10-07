import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { DoodleButton, SketchCard } from '../components/ui/index.js';
import { api, ApiError } from '../lib/api.js';
import { useMe } from '../lib/queries.js';
import { fmtDate, type AdminUserRow } from './AdminUser.js';

interface UserListRow extends AdminUserRow {
  pacts: { active: number; kept: number; failed: number };
  habits: { active: number; kept: number; broken: number; slips: number };
  fed: number;
}

/** Registered users, newest first; click one to see their pacts, cases and losses. */
function UsersPanel() {
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [guests, setGuests] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE = 30;
  const list = useQuery({
    queryKey: ['admin-users', term, guests, page],
    queryFn: () =>
      api<{ total: number; users: UserListRow[] }>(
        `/admin/users?limit=${PAGE}&offset=${page * PAGE}&guests=${guests}${term ? `&q=${encodeURIComponent(term)}` : ''}`,
      ),
  });
  const total = list.data?.total ?? 0;
  return (
    <SketchCard variant="c">
      <h2 style={{ marginTop: 0 }}>Users {list.data ? <span className="muted" style={{ fontWeight: 400 }}>({total})</span> : null}</h2>
      <form
        className="admin-search"
        onSubmit={e => {
          e.preventDefault();
          setPage(0);
          setTerm(q.trim());
        }}
      >
        <input type="search" placeholder="Search email or name" value={q} onChange={e => setQ(e.target.value)} aria-label="Search users" />
        <DoodleButton type="submit">Search</DoodleButton>
      </form>
      <label className="muted" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13, margin: '8px 0 10px', whiteSpace: 'nowrap' }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={guests} onChange={e => { setGuests(e.target.checked); setPage(0); }} /> include guests
      </label>
      {list.isLoading ? (
        <p className="muted">fetching the roster…</p>
      ) : !list.data || list.data.users.length === 0 ? (
        <p className="muted">Nobody here yet.</p>
      ) : (
        <div className="admin-list">
          {list.data.users.map(u => (
            <Link key={u.id} to={`/admin/users/${u.id}`} className="admin-list-row admin-user-row">
              <div style={{ minWidth: 0 }}>
                <strong className="admin-ellipsis">{u.name ?? u.email ?? 'Guest'}</strong>
                <div className="muted admin-ellipsis" style={{ fontSize: 12.5 }}>
                  {u.email ?? 'guest'}{u.viaGoogle ? ' · Google' : ''} · joined {fmtDate(u.createdAtISO)}
                </div>
                <div style={{ fontSize: 12.5 }}>
                  pacts {u.pacts.active}/{u.pacts.kept}/<span style={{ color: 'var(--stamp-red)' }}>{u.pacts.failed}</span> · cases{' '}
                  {u.habits.active}/{u.habits.kept}/<span style={{ color: 'var(--stamp-red)' }}>{u.habits.broken}</span> · {u.habits.slips} slips
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <strong style={{ color: u.fed > 0 ? 'var(--stamp-red)' : undefined }}>{u.fed}</strong>
                <div className="muted" style={{ fontSize: 11 }}>fed</div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>pacts and cases: active / kept / lost</p>
      {total > PAGE && (
        <div className="chip-row" style={{ marginTop: 8 }}>
          <button className="chip" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← newer</button>
          <span className="muted" style={{ fontSize: 13 }}>{page * PAGE + 1}–{Math.min(total, (page + 1) * PAGE)} of {total}</span>
          <button className="chip" disabled={(page + 1) * PAGE >= total} onClick={() => setPage(p => p + 1)}>older →</button>
        </div>
      )}
    </SketchCard>
  );
}

interface Stats {
  users: number;
  accounts: number;
  newUsers24h: number;
  commitments: { active: number; completed: number; failed: number };
  habits?: Partial<Record<'ACTIVE' | 'KEPT' | 'BROKEN', number>>;
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
            <div className="row">
              <span className="muted">Cases open / dismissed / closed</span>
              <strong>{s.habits?.ACTIVE ?? 0} / {s.habits?.KEPT ?? 0} / {s.habits?.BROKEN ?? 0}</strong>
            </div>
            <div className="row"><span className="muted">PURR purchased</span><strong>{s.purrPurchased}</strong></div>
            <div className="row">
              <span className="muted">Cat unlocks</span>
              <strong>{Object.entries(s.unlocksByCat).map(([k, v]) => `${k}: ${v}`).join(' · ') || '—'}</strong>
            </div>
          </>
        )}
      </SketchCard>

      <UsersPanel />

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
