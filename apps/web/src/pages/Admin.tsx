import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { normalizeDigits } from '@purrpose/shared';
import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { BackLink } from '../components/BackLink.js';
import { AppealQueue } from '../components/AppealQueue.js';
import { BazaarPanel } from '../components/BazaarPanel.js';
import { ReviewQueue } from '../components/ReviewQueue.js';
import { DoodleButton, SketchCard } from '../components/ui/index.js';
import { api, ApiError } from '../lib/api.js';
import { useMe } from '../lib/queries.js';
import { backArrow, fwdArrow, t } from '../i18n/index.js';
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
      <h2 style={{ marginTop: 0 }}>{t('Users')} {list.data ? <span className="muted" style={{ fontWeight: 400 }}>({total})</span> : null}</h2>
      <form
        className="admin-search"
        onSubmit={e => {
          e.preventDefault();
          setPage(0);
          setTerm(q.trim());
        }}
      >
        <input type="search" placeholder={t('Search email or name')} value={q} onChange={e => setQ(e.target.value)} aria-label={t('Search users')} />
        <DoodleButton type="submit">{t('Search')}</DoodleButton>
      </form>
      <label className="muted" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13, margin: '8px 0 10px', whiteSpace: 'nowrap' }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={guests} onChange={e => { setGuests(e.target.checked); setPage(0); }} /> {t('include guests')}
      </label>
      {list.isLoading ? (
        <p className="muted">{t('fetching the roster…')}</p>
      ) : !list.data || list.data.users.length === 0 ? (
        <p className="muted">{t('Nobody here yet.')}</p>
      ) : (
        <div className="admin-list">
          {list.data.users.map(u => (
            <Link key={u.id} to={`/admin/users/${u.id}`} className="admin-list-row admin-user-row">
              <div style={{ minWidth: 0 }}>
                <strong className="admin-ellipsis">{u.name ?? u.email ?? u.phone ?? t('Guest')}</strong>
                <div className="muted admin-ellipsis" style={{ fontSize: 12.5 }}>
                  {u.email ? <span className="ltr">{u.email}</span> : u.phone ? <span className="ltr">{u.phone}</span> : t('guest')}{u.viaGoogle ? ' · Google' : ''} · {t('joined {date}', { date: fmtDate(u.createdAtISO) })}
                </div>
                <div style={{ fontSize: 12.5 }}>
                  {t('pacts')} {u.pacts.active}/{u.pacts.kept}/<span style={{ color: 'var(--stamp-red)' }}>{u.pacts.failed}</span> · {t('cases')}{' '}
                  {u.habits.active}/{u.habits.kept}/<span style={{ color: 'var(--stamp-red)' }}>{u.habits.broken}</span> · {t('{n} slips', { n: u.habits.slips })}
                </div>
              </div>
              <div style={{ textAlign: 'end', flexShrink: 0 }}>
                <strong style={{ color: u.fed > 0 ? 'var(--stamp-red)' : undefined }}>{u.fed}</strong>
                <div className="muted" style={{ fontSize: 11 }}>{t('fed')}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>{t('pacts and cases: active / kept / lost')}</p>
      {total > PAGE && (
        <div className="chip-row" style={{ marginTop: 8 }}>
          <button type="button" className="chip" disabled={page === 0} onClick={() => setPage(p => p - 1)}>{backArrow()} {t('newer')}</button>
          <span className="muted" style={{ fontSize: 13 }}>{t('{from}–{to} of {total}', { from: page * PAGE + 1, to: Math.min(total, (page + 1) * PAGE), total })}</span>
          <button type="button" className="chip" disabled={(page + 1) * PAGE >= total} onClick={() => setPage(p => p + 1)}>{t('older')} {fwdArrow()}</button>
        </div>
      )}
    </SketchCard>
  );
}

/** Give PURR: find the account by phone, name or email, pick it, choose how much. */
function GivePurr() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [picked, setPicked] = useState<AdminUserRow | null>(null);
  const [amount, setAmount] = useState(100);
  const [note, setNote] = useState<string | null>(null);
  const found = useQuery({
    queryKey: ['admin-grant-search', term],
    queryFn: () => api<{ total: number; users: AdminUserRow[] }>(`/admin/users?limit=8&offset=0&q=${encodeURIComponent(term)}`),
    enabled: term.length > 0,
  });
  const grant = useMutation({
    mutationFn: () =>
      api<{ label: string; purr: number }>('/admin/purr/grant', { method: 'POST', body: { userId: picked!.id, amount } }),
    onSuccess: r => {
      setNote(t('{email} now has {n} PURR.', { email: r.label, n: r.purr }));
      setPicked(p => (p ? { ...p, purr: r.purr } : p));
      void qc.invalidateQueries({ queryKey: ['admin-users'] });
      void qc.invalidateQueries({ queryKey: ['admin-grant-search'] });
    },
    onError: e => setNote(e instanceof ApiError ? e.message : t('Failed.')),
  });
  const labelOf = (u: AdminUserRow) => u.name ?? u.phone ?? u.email ?? t('Guest');
  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setNote(null);
    setPicked(null);
    setTerm(normalizeDigits(q.trim()));
  };
  return (
    <SketchCard variant="b">
      <h2>{t('Give PURR')}</h2>
      <form className="admin-search" onSubmit={onSearch}>
        <input
          type="search"
          placeholder={t('Mobile number, name or email')}
          value={q}
          onChange={e => setQ(e.target.value)}
          aria-label={t('Find the account')}
        />
        <DoodleButton type="submit">{t('Search')}</DoodleButton>
      </form>
      {term && !picked && (
        <div className="admin-list" style={{ marginTop: 10 }}>
          {found.isLoading ? (
            <p className="muted">{t('fetching the roster…')}</p>
          ) : !found.data || found.data.users.length === 0 ? (
            <p className="muted">{t('Nobody here yet.')}</p>
          ) : (
            found.data.users.map(u => (
              <button key={u.id} type="button" className="admin-list-row admin-pick-row" onClick={() => { setPicked(u); setNote(null); }}>
                <span style={{ minWidth: 0 }}>
                  <strong className="admin-ellipsis">{labelOf(u)}</strong>
                  <span className="muted admin-ellipsis ltr" style={{ display: 'block', fontSize: 12.5 }}>{u.phone ?? u.email ?? ''}</span>
                </span>
                <span className="chip">{t('{n} PURR', { n: u.purr })}</span>
              </button>
            ))
          )}
        </div>
      )}
      {picked && (
        <form
          className="auth-form"
          style={{ marginTop: 12 }}
          onSubmit={e => {
            e.preventDefault();
            setNote(null);
            grant.mutate();
          }}
        >
          <div className="admin-picked">
            <span style={{ minWidth: 0 }}>
              <strong className="admin-ellipsis">{labelOf(picked)}</strong>
              <span className="muted ltr" style={{ display: 'block', fontSize: 12.5 }}>{picked.phone ?? picked.email ?? ''} · {t('{n} PURR', { n: picked.purr })}</span>
            </span>
            <button type="button" className="linklike" onClick={() => setPicked(null)}>{t('Change')}</button>
          </div>
          <label className="field">
            <span>{t('Amount')}</span>
            <input type="number" min={1} max={100000} required value={amount} onChange={e => setAmount(Number(e.target.value))} />
          </label>
          <DoodleButton type="submit" variant="primary" disabled={grant.isPending}>
            {t('Grant PURR')}
          </DoodleButton>
        </form>
      )}
      {note && <p className="muted" role="status" style={{ marginTop: 8 }}>{note}</p>}
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

  if (me.isLoading) return <main><p className="muted">{t('checking your badge…')}</p></main>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const s = stats.data;
  return (
    <main>
      <BackLink />
      <h1>{t('Admin')}</h1>
      <p className="muted">{t('Signed in as {email}. Every cat and tool is unlocked for you.', { email: me.data?.user.email })}</p>

      <BazaarPanel />
      <ReviewQueue />
      <AppealQueue />

      <SketchCard variant="a">
        <h2>{t('Numbers')}</h2>
        {!s ? (
          <p className="muted">{t('counting cats…')}</p>
        ) : (
          <>
            <div className="row"><span className="muted">{t('Users (guests + accounts)')}</span><strong>{s.users}</strong></div>
            <div className="row"><span className="muted">{t('Accounts')}</span><strong>{s.accounts}</strong></div>
            <div className="row"><span className="muted">{t('New in 24h')}</span><strong>{s.newUsers24h}</strong></div>
            <div className="row">
              <span className="muted">{t('Pacts active / kept / fed')}</span>
              <strong>{s.commitments.active} / {s.commitments.completed} / {s.commitments.failed}</strong>
            </div>
            <div className="row">
              <span className="muted">{t('Cases open / dismissed / closed')}</span>
              <strong>{s.habits?.ACTIVE ?? 0} / {s.habits?.KEPT ?? 0} / {s.habits?.BROKEN ?? 0}</strong>
            </div>
            <div className="row"><span className="muted">{t('PURR purchased')}</span><strong>{s.purrPurchased}</strong></div>
            <div className="row">
              <span className="muted">{t('Cat unlocks')}</span>
              <strong>{Object.entries(s.unlocksByCat).map(([k, v]) => `${k}: ${v}`).join(' · ') || '—'}</strong>
            </div>
          </>
        )}
      </SketchCard>

      <UsersPanel />

      <GivePurr />

      <SketchCard variant="c">
        <h2>{t('Tools')}</h2>
        <div className="chip-row">
          <Link className="chip" to="/lab">{t('Cat Lab')} {fwdArrow()}</Link>
          <Link className="chip" to="/cats">{t('Cat gallery')} {fwdArrow()}</Link>
          <Link className="chip" to="/design">{t('Design kit')} {fwdArrow()}</Link>
        </div>
      </SketchCard>
    </main>
  );
}
