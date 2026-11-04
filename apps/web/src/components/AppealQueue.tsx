import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { AppealView, ConsequenceType } from '@purrpose/shared';
import { DoodleButton, SketchCard } from './ui/index.js';
import { api, apiImage, ApiError } from '../lib/api.js';
import { fmtDateTime, foodName, t } from '../i18n/index.js';

interface AppealRow {
  id: string;
  title: string;
  owner: { email: string | null; phone: string | null; firstName: string | null };
  witnessEmail: string | null;
  consequenceType: ConsequenceType;
  consequenceAmount: number;
  proof: { text: string; hasImage: boolean };
  reviewedBy: string | null;
  reviewNote: string | null;
  appeal: AppealView;
}

function AppealItem({ r }: { r: AppealRow }) {
  const qc = useQueryClient();
  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const decide = useMutation({
    mutationFn: (overturn: boolean) =>
      api(`/admin/appeals/${r.id}`, { method: 'POST', body: { overturn, ...(note.trim() ? { note: note.trim() } : {}) } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-appeals'] }),
  });
  const pending = r.appeal.status === 'pending';
  return (
    <li className="admin-review">
      <strong>{r.title}</strong>
      <div className="muted" style={{ fontSize: 13 }}>
        <span className="ltr">{r.owner.phone ?? r.owner.email ?? t('guest')}</span> ·{' '}
        {t('{n} {food}', { n: r.consequenceAmount, food: foodName(r.consequenceType) })} ·{' '}
        {fmtDateTime(r.appeal.createdAtISO, { dateStyle: 'short', timeStyle: 'short' })}
      </div>
      <div className="muted" style={{ fontSize: 13 }}>
        {r.reviewedBy === 'witness' ? t('Rejected by the witness') : t('Rejected by the Purrpose team')}
        {r.witnessEmail ? <> (<span className="ltr">{r.witnessEmail}</span>)</> : null}
        {r.reviewNote ? ` — ${t('“{note}”', { note: r.reviewNote })}` : ''}
      </div>
      <p className="proof-text" style={{ margin: '6px 0' }}>
        <b>{t('Proof:')}</b> {r.proof.text}
      </p>
      {r.proof.hasImage &&
        (photo ? (
          <img className="proof-full" src={photo} alt={t('Proof photo')} />
        ) : (
          <button type="button" className="linklike" onClick={() => void apiImage(`/admin/reviews/${r.id}/image`).then(setPhoto).catch(() => undefined)}>
            {t('Show photo')}
          </button>
        ))}
      <p className="proof-text" style={{ margin: '6px 0' }}>
        <b>{t('Appeal:')}</b> {r.appeal.text}
      </p>
      {pending ? (
        <>
          <input
            value={note}
            maxLength={300}
            onChange={e => setNote(e.target.value)}
            placeholder={t('Note for them (optional)')}
            style={{ width: '100%', marginTop: 6 }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <DoodleButton variant="primary" disabled={decide.isPending} onClick={() => decide.mutate(true)}>
              {t('Accept appeal (food back)')}
            </DoodleButton>
            <DoodleButton disabled={decide.isPending} onClick={() => decide.mutate(false)}>
              {t('Keep the decision')}
            </DoodleButton>
          </div>
        </>
      ) : (
        <span className="chip">{r.appeal.status === 'overturned' ? t('Accepted') : t('Decision kept')}</span>
      )}
      {decide.isError && (
        <p role="alert" style={{ color: 'var(--stamp-red)' }}>
          {decide.error instanceof ApiError ? decide.error.message : t('Could not reach the server.')}
        </p>
      )}
    </li>
  );
}

/** Appeals against rejected proofs (pending first). Wait until the window closes before donating that food. */
export function AppealQueue() {
  const q = useQuery({
    queryKey: ['admin-appeals'],
    queryFn: () => api<{ appeals: AppealRow[] }>('/admin/appeals'),
    refetchInterval: 60_000,
  });
  const rows = q.data?.appeals ?? [];
  const open = rows.filter(r => r.appeal.status === 'pending').length;
  return (
    <SketchCard variant="b">
      <h2 style={{ marginTop: 0 }}>
        {t('Appeals')} <span className="muted" style={{ fontWeight: 400 }}>({open})</span>
      </h2>
      {rows.length === 0 ? (
        <p className="muted">{t('No appeals. Players can appeal a rejected proof within 3 days.')}</p>
      ) : (
        <ul className="admin-reviews">
          {rows.map(r => (
            <AppealItem key={r.id} r={r} />
          ))}
        </ul>
      )}
    </SketchCard>
  );
}
