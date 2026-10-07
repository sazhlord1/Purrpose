import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CREDIT_TYPE_LABELS, fmtFood, type BalanceView, type ConsequenceType, type HabitDto } from '@purrpose/shared';
import { SketchCard } from '../components/ui/index.js';
import { api } from '../lib/api.js';
import { catNameOf } from '../lib/labels.js';
import { useMe } from '../lib/queries.js';

export interface AdminUserRow {
  id: string;
  email: string | null;
  name: string | null;
  role: 'USER' | 'ADMIN';
  viaGoogle: boolean;
  createdAtISO: string;
  lastLoginAtISO: string | null;
  purr: number;
}

interface AdminUserDetail {
  user: AdminUserRow;
  balances: BalanceView[];
  focus: { sessions: number; minutes: number };
  unlockedCats: string[];
  ownedItems: string[];
  commitments: Array<{
    id: string;
    title: string;
    status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
    catId: string;
    consequenceType: ConsequenceType;
    consequenceAmount: number;
    createdAtISO: string;
    deadlineISO: string;
    settledAtISO: string | null;
  }>;
  habits: HabitDto[];
  losses: Array<{ id: string; creditType: ConsequenceType; amount: number; title: string | null; source: 'pact' | 'habit'; atISO: string }>;
}

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const food = (t: ConsequenceType) => CREDIT_TYPE_LABELS[t].toLowerCase();

const PACT_STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'active', cls: '' },
  COMPLETED: { label: 'kept', cls: 'stamp-kept' },
  FAILED: { label: 'lost', cls: 'stamp-fed' },
};
const HABIT_STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'open', cls: '' },
  KEPT: { label: 'dismissed', cls: 'stamp-kept' },
  BROKEN: { label: 'closed', cls: 'stamp-fed' },
};

/** Admin: one user's whole story — wallet, every pact and habit, and what the cats got. */
export function AdminUser() {
  const { id = '' } = useParams();
  const me = useMe();
  const isAdmin = me.data?.user.role === 'ADMIN';
  const q = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => api<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`),
    enabled: isAdmin && !!id,
  });

  if (me.isLoading) return <main><p className="muted">checking your badge…</p></main>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  if (q.isLoading) return <main><p className="muted">opening the file…</p></main>;
  if (q.isError || !q.data) return <main><p className="muted">No such user.</p><Link to="/admin">← Admin</Link></main>;

  const d = q.data;
  const totalLost = d.losses.reduce((n, l) => n + l.amount, 0);
  return (
    <main>
      <Link to="/admin" className="back-link">← Users</Link>
      <h1 style={{ marginBottom: 4 }}>{d.user.name ?? d.user.email ?? 'Guest'}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {d.user.email ?? 'guest (no account)'} {d.user.viaGoogle ? '· Google' : ''} {d.user.role === 'ADMIN' ? '· admin' : ''}
        <br />
        joined {fmtDate(d.user.createdAtISO)} · last sign-in {fmtDate(d.user.lastLoginAtISO)}
      </p>

      <SketchCard variant="a">
        <h2 style={{ marginTop: 0 }}>Wallet</h2>
        {d.balances.map(b => (
          <div className="row" key={b.creditType}>
            <span className="muted">{CREDIT_TYPE_LABELS[b.creditType]}</span>
            <strong>
              {b.amount} <span className="muted" style={{ fontWeight: 400 }}>({b.stakedActive} at stake · {b.available} free)</span>
            </strong>
          </div>
        ))}
        <div className="row"><span className="muted">PURR</span><strong>{d.user.purr}</strong></div>
        <div className="row"><span className="muted">Focus</span><strong>{d.focus.sessions} sessions · {d.focus.minutes} min</strong></div>
        <div className="row"><span className="muted">Cats / items owned</span><strong>{d.unlockedCats.length} / {d.ownedItems.length}</strong></div>
        <div className="row"><span className="muted">Lost to the cats (all time)</span><strong style={{ color: 'var(--stamp-red)' }}>{totalLost}</strong></div>
      </SketchCard>

      <SketchCard variant="b">
        <h2 style={{ marginTop: 0 }}>Commitments ({d.commitments.length})</h2>
        {d.commitments.length === 0 ? (
          <p className="muted">None yet.</p>
        ) : (
          <div className="admin-list">
            {d.commitments.map(c => (
              <div key={c.id} className="admin-list-row">
                <div>
                  <strong>{c.title}</strong>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {c.consequenceAmount} {food(c.consequenceType)} · {catNameOf(c.catId)} · due {fmtDate(c.deadlineISO)}
                  </div>
                </div>
                <span className={`stamp ${PACT_STATUS[c.status]?.cls ?? ''}`}>{PACT_STATUS[c.status]?.label ?? c.status}</span>
              </div>
            ))}
          </div>
        )}
      </SketchCard>

      <SketchCard variant="c">
        <h2 style={{ marginTop: 0 }}>Detective Cheat ({d.habits.length})</h2>
        {d.habits.length === 0 ? (
          <p className="muted">No cases.</p>
        ) : (
          <div className="admin-list">
            {d.habits.map(h => (
              <div key={h.id} className="admin-list-row">
                <div>
                  <strong>{h.title}</strong>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {h.slipCount}/{h.maxSlips} slips · {fmtFood(h.locked)} of {h.stakeAmount} {food(h.consequenceType)} locked
                    {h.lostAmount !== null && ` · cats got ${h.lostAmount}`} · ends {fmtDate(h.endsAtISO)}
                  </div>
                  {h.slips.length > 0 && (
                    <div className="muted" style={{ fontSize: 12 }}>
                      slips: {h.slips.map(s => fmtDate(s.atISO)).join(' · ')}
                    </div>
                  )}
                </div>
                <span className={`stamp ${HABIT_STATUS[h.status]?.cls ?? ''}`}>{HABIT_STATUS[h.status]?.label ?? h.status}</span>
              </div>
            ))}
          </div>
        )}
      </SketchCard>

      <SketchCard variant="a">
        <h2 style={{ marginTop: 0 }}>Losses</h2>
        {d.losses.length === 0 ? (
          <p className="muted">The cats haven't eaten on this user yet.</p>
        ) : (
          <div className="admin-list">
            {d.losses.map(l => (
              <div key={l.id} className="admin-list-row">
                <div>
                  <strong>{l.title ?? '—'}</strong>
                  <div className="muted" style={{ fontSize: 13 }}>{l.source} · {fmtDate(l.atISO)}</div>
                </div>
                <strong style={{ color: 'var(--stamp-red)' }}>−{l.amount} {food(l.creditType)}</strong>
              </div>
            ))}
          </div>
        )}
      </SketchCard>
    </main>
  );
}
