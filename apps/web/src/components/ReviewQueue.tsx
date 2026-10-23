import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ConsequenceType } from '@purrpose/shared';
import { DoodleButton, SketchCard } from './ui/index.js';
import { api, apiImage, ApiError } from '../lib/api.js';
import { fmtDateTime, foodName, t } from '../i18n/index.js';

interface ReviewRow {
  id: string;
  title: string;
  owner: { email: string | null; firstName: string | null };
  witnessEmail: string | null;
  consequenceType: ConsequenceType;
  consequenceAmount: number;
  deadlineISO: string;
  proof: { text: string; hasImage: boolean };
  submittedAtISO: string | null;
  reviewDueAtISO: string | null;
}

function ReviewItem({ r }: { r: ReviewRow }) {
  const qc = useQueryClient();
  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const decide = useMutation({
    mutationFn: (approve: boolean) =>
      api(`/admin/reviews/${r.id}`, { method: 'POST', body: { approve, ...(note.trim() ? { note: note.trim() } : {}) } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });
  return (
    <li className="admin-review">
      <strong>{r.title}</strong>
      <div className="muted" style={{ fontSize: 13 }}>
        <span className="ltr">{r.owner.email ?? t('guest')}</span> · {t('{n} {food}', { n: r.consequenceAmount, food: foodName(r.consequenceType) })} ·{' '}
        {t('auto-approves {date}', { date: fmtDateTime(r.reviewDueAtISO, { dateStyle: 'short', timeStyle: 'short' }) })}
      </div>
      {r.witnessEmail && (
        <div className="muted" style={{ fontSize: 13 }}>
          {t('Has a witness:')} <span className="ltr">{r.witnessEmail}</span>
        </div>
      )}
      <p className="proof-text" style={{ margin: '6px 0' }}>{r.proof.text}</p>
      {r.proof.hasImage &&
        (photo ? (
          <img className="proof-full" src={photo} alt={t('Proof photo')} />
        ) : (
          <button type="button" className="linklike" onClick={() => void apiImage(`/admin/reviews/${r.id}/image`).then(setPhoto).catch(() => undefined)}>
            {t('Show photo')}
          </button>
        ))}
      <input
        value={note}
        maxLength={200}
        onChange={e => setNote(e.target.value)}
        placeholder={t('Note for them (optional)')}
        style={{ width: '100%', marginTop: 6 }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <DoodleButton variant="primary" disabled={decide.isPending} onClick={() => decide.mutate(true)}>
          {t('Approve')}
        </DoodleButton>
        <DoodleButton disabled={decide.isPending} onClick={() => decide.mutate(false)}>
          {t('Reject')}
        </DoodleButton>
      </div>
      {decide.isError && (
        <p role="alert" style={{ color: 'var(--stamp-red)' }}>
          {decide.error instanceof ApiError ? decide.error.message : t('Could not reach the server.')}
        </p>
      )}
    </li>
  );
}

/** Strict-pact proofs waiting for a decision (the ones without a witness first). */
export function ReviewQueue() {
  const q = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => api<{ reviews: ReviewRow[] }>('/admin/reviews'),
    refetchInterval: 60_000,
  });
  const rows = q.data?.reviews ?? [];
  return (
    <SketchCard variant="b">
      <h2 style={{ marginTop: 0 }}>
        {t('Proofs to review')} <span className="muted" style={{ fontWeight: 400 }}>({rows.length})</span>
      </h2>
      {rows.length === 0 ? (
        <p className="muted">{t('Nothing waiting. Undecided proofs are approved automatically after 48 hours.')}</p>
      ) : (
        <ul className="admin-reviews">
          {rows.map(r => (
            <ReviewItem key={r.id} r={r} />
          ))}
        </ul>
      )}
    </SketchCard>
  );
}
