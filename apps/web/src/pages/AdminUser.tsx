import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import { fmtFood, type BalanceView, type ConsequenceType, type HabitDto } from '@purrpose/shared';
import { SketchCard } from '../components/ui/index.js';
import { api } from '../lib/api.js';
import { catNameOf } from '../lib/labels.js';
import { useMe } from '../lib/queries.js';
import { backArrow, fmtDateTime, foodName, t } from '../i18n/index.js';

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

export const fmtDate = (iso: string | null) => fmtDateTime(iso, { dateStyle: 'medium', timeStyle: 'short' });
const food = (type: ConsequenceType) => foodName(type, true);

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

  if (me.isLoading) return <main><p className="muted">{t('checking your badge…')}</p></main>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  if (q.isLoading) return <main><p className="muted">{t('opening the file…')}</p></main>;
  if (q.isError || !q.data) return <main><p className="muted">{t('No such user.')}</p><Link to="/admin">{backArrow()} {t('Admin')}</Link></main>;

  const d = q.data;
  const totalLost = d.losses.reduce((n, l) => n + l.amount, 0);
  return (
    <main>
      <Link to="/admin" className="back-link">{backArrow()} {t('Users')}</Link>
      <h1 style={{ marginBottom: 4 }}>{d.user.name ?? d.user.email ?? t('Guest')}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {d.user.email ? <span className="ltr">{d.user.email}</span> : t('guest (no account)')} {d.user.viaGoogle ? '· Google' : ''}{' '}
        {d.user.role === 'ADMIN' ? `· ${t('admin')}` : ''}
        <br />
        {t('joined {date}', { date: fmtDate(d.user.createdAtISO) })} · {t('last sign-in {date}', { date: fmtDate(d.user.lastLoginAtISO) })}
      </p>

      <SketchCard variant="a">
        <h2 style={{ marginTop: 0 }}>{t('Wallet')}</h2>
        {d.balances.map(b => (
          <div className="row" key={b.creditType}>
            <span className="muted">{foodName(b.creditType)}</span>
            <strong>
              {b.amount} <span className="muted" style={{ fontWeight: 400 }}>{t('({staked} at stake · {free} free)', { staked: b.stakedActive, free: b.available })}</span>
            </strong>
          </div>
        ))}
        <div className="row"><span className="muted">{t('PURR')}</span><strong>{d.user.purr}</strong></div>
        <div className="row"><span className="muted">{t('Focus')}</span><strong>{t('{n} sessions · {m} min', { n: d.focus.sessions, m: d.focus.minutes })}</strong></div>
        <div className="row"><span className="muted">{t('Cats / items owned')}</span><strong>{d.unlockedCats.length} / {d.ownedItems.length}</strong></div>
        <div className="row"><span className="muted">{t('Lost to the cats (all time)')}</span><strong style={{ color: 'var(--stamp-red)' }}>{totalLost}</strong></div>
      </SketchCard>

      <SketchCard variant="b">
        <h2 style={{ marginTop: 0 }}>{t('Commitments ({n})', { n: d.commitments.length })}</h2>
        {d.commitments.length === 0 ? (
          <p className="muted">{t('None yet.')}</p>
        ) : (
          <div className="admin-list">
            {d.commitments.map(c => (
              <div key={c.id} className="admin-list-row">
                <div>
                  <strong>{c.title}</strong>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {t('{n} {food}', { n: c.consequenceAmount, food: food(c.consequenceType) })} · {catNameOf(c.catId)} · {t('due {date}', { date: fmtDate(c.deadlineISO) })}
                  </div>
                </div>
                <span className={`stamp ${PACT_STATUS[c.status]?.cls ?? ''}`}>{t(PACT_STATUS[c.status]?.label ?? c.status)}</span>
              </div>
            ))}
          </div>
        )}
      </SketchCard>

      <SketchCard variant="c">
        <h2 style={{ marginTop: 0 }}>{t('Detective Cheat ({n})', { n: d.habits.length })}</h2>
        {d.habits.length === 0 ? (
          <p className="muted">{t('No cases.')}</p>
        ) : (
          <div className="admin-list">
            {d.habits.map(h => (
              <div key={h.id} className="admin-list-row">
                <div>
                  <strong>{h.title}</strong>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {t('{n}/{max} slips', { n: h.slipCount, max: h.maxSlips })} ·{' '}
                    {t('{locked} of {stake} {food} locked', { locked: fmtFood(h.locked), stake: h.stakeAmount, food: food(h.consequenceType) })}
                    {h.lostAmount !== null && ` · ${t('cats got {n}', { n: h.lostAmount })}`} · {t('ends {date}', { date: fmtDate(h.endsAtISO) })}
                  </div>
                  {h.slips.length > 0 && (
                    <div className="muted" style={{ fontSize: 12 }}>
                      {t('slips: {list}', { list: h.slips.map(s => fmtDate(s.atISO)).join(' · ') })}
                    </div>
                  )}
                </div>
                <span className={`stamp ${HABIT_STATUS[h.status]?.cls ?? ''}`}>{t(HABIT_STATUS[h.status]?.label ?? h.status)}</span>
              </div>
            ))}
          </div>
        )}
      </SketchCard>

      <SketchCard variant="a">
        <h2 style={{ marginTop: 0 }}>{t('Losses')}</h2>
        {d.losses.length === 0 ? (
          <p className="muted">{t("The cats haven't eaten on this user yet.")}</p>
        ) : (
          <div className="admin-list">
            {d.losses.map(l => (
              <div key={l.id} className="admin-list-row">
                <div>
                  <strong>{l.title ?? '—'}</strong>
                  <div className="muted" style={{ fontSize: 13 }}>{t(l.source)} · {fmtDate(l.atISO)}</div>
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
