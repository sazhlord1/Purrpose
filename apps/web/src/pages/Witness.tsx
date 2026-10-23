import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Cat } from '@purrpose/cats';
import type { WitnessView } from '@purrpose/shared';
import { DoodleButton, SketchCard } from '../components/ui/index.js';
import { api, apiImage, ApiError } from '../lib/api.js';
import { returnAfterLogin } from '../lib/auth.js';
import { catNameOf } from '../lib/labels.js';
import { useMe } from '../lib/queries.js';
import { fmtDateTime, foodName, t } from '../i18n/index.js';

/**
 * What a witness sees when they open the link: the promise, the proof, and two
 * buttons. Only someone signed in with the witness email can press them.
 */
export function Witness() {
  const { token = '' } = useParams<{ token: string }>();
  const qc = useQueryClient();
  const me = useMe();
  const [photo, setPhoto] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');

  const q = useQuery({
    queryKey: ['witness', token],
    queryFn: () => api<{ witness: WitnessView }>(`/witness/${encodeURIComponent(token)}`),
    enabled: Boolean(token),
    retry: false,
  });
  const w = q.data?.witness;

  useEffect(() => {
    if (!w?.proof?.hasImage || !(w.isWitness || w.isOwner)) return undefined;
    let url: string | null = null;
    apiImage(`/witness/${encodeURIComponent(token)}/image`)
      .then(u => {
        url = u;
        setPhoto(u);
      })
      .catch(() => setPhoto(null));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [w?.proof?.hasImage, w?.isWitness, w?.isOwner, token]);

  const review = useMutation({
    mutationFn: (approve: boolean) =>
      api<{ ok: true }>(`/witness/${encodeURIComponent(token)}/review`, {
        method: 'POST',
        body: { approve, ...(note.trim() ? { note: note.trim() } : {}) },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['witness', token] }),
  });

  if (q.isLoading) return <main><p className="muted">{t('opening the case file…')}</p></main>;
  if (q.isError || !w) {
    return (
      <main>
        <h1>{t('This link doesn’t work')}</h1>
        <p className="muted">{t('Ask your friend to send it again.')}</p>
        <DoodleButton href="/">{t('Open Purrpose')}</DoodleButton>
      </main>
    );
  }

  const owner = w.ownerName ?? t('Your friend');
  const stake = t('{n} {food}', { n: w.stakeLabel.amount, food: foodName(w.stakeLabel.type) });
  const signedInEmail = me.data?.user.email ?? null;
  const decided = w.status !== 'ACTIVE';

  return (
    <main>
      <div className="witness-hero">
        <Cat catId={w.catId} state={decided ? (w.status === 'COMPLETED' ? 'SLEEPING' : 'SATISFIED') : 'ANTICIPATING'} size={120} />
        <div>
          <p className="muted" style={{ margin: 0 }}>{t('{name} picked you as their witness', { name: owner })}</p>
          <h1 style={{ margin: '2px 0 4px' }}>{w.title}</h1>
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
            {t('Due {date} · {stake} on the line with {cat}', {
              date: fmtDateTime(w.deadlineISO, { dateStyle: 'medium', timeStyle: 'short' }),
              stake,
              cat: catNameOf(w.catId),
            })}
          </p>
        </div>
      </div>

      <SketchCard variant="a">
        <h2 style={{ marginTop: 0 }}>{t('How this works')}</h2>
        <p style={{ margin: 0 }}>
          {t('{name} promised to do this by the deadline. When they’re done they send a proof, and you say whether it holds. Yes: their food stays theirs. No: it goes to feed real cats at a shelter.', { name: owner })}
        </p>
      </SketchCard>

      {w.proof ? (
        <SketchCard variant="b">
          <h2 style={{ marginTop: 0 }}>{t('Their proof')}</h2>
          <p className="proof-text">{w.proof.text}</p>
          {photo && <img className="proof-full" src={photo} alt={t('Proof photo')} />}
          {w.proof.hasImage && !photo && !w.isWitness && !w.isOwner && (
            <p className="muted">{t('There’s a photo too. Sign in as the witness to see it.')}</p>
          )}
          <p className="muted" style={{ fontSize: 13 }}>
            {t('Sent {date}', { date: fmtDateTime(w.proof.submittedAtISO, { dateStyle: 'medium', timeStyle: 'short' }) })}
          </p>
        </SketchCard>
      ) : (
        !decided && <p className="muted">{t('No proof yet. Come back to this link when {name} says it’s done.', { name: owner })}</p>
      )}

      {decided && (
        <SketchCard variant="c">
          <h2 style={{ marginTop: 0 }}>
            {w.status === 'COMPLETED' ? t('Approved ✓') : t('Not accepted')}
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            {w.reviewedBy === 'auto'
              ? t('Nobody answered within 48 hours, so it counted.')
              : w.reviewedBy === 'admin'
                ? t('The Purrpose team decided this one.')
                : w.reviewedBy === 'witness'
                  ? t('You decided this one. Thanks for keeping them honest.')
                  : t('The deadline passed without a proof.')}
          </p>
        </SketchCard>
      )}

      {!decided && w.proof && w.isWitness && (
        <div className="witness-actions">
          {!rejecting ? (
            <>
              <DoodleButton variant="primary" size="big" disabled={review.isPending} onClick={() => review.mutate(true)}>
                {t('Yes, they did it')}
              </DoodleButton>
              <DoodleButton disabled={review.isPending} onClick={() => setRejecting(true)}>
                {t('No, this doesn’t count')}
              </DoodleButton>
            </>
          ) : (
            <SketchCard variant="c">
              <label className="field">
                <span>{t('Tell them why (optional)')}</span>
                <textarea rows={2} maxLength={200} value={note} onChange={e => setNote(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <DoodleButton variant="primary" disabled={review.isPending} onClick={() => review.mutate(false)}>
                  {t('Confirm: it doesn’t count')}
                </DoodleButton>
                <DoodleButton onClick={() => setRejecting(false)}>{t('Back')}</DoodleButton>
              </div>
            </SketchCard>
          )}
          {review.isError && (
            <p role="alert" style={{ color: 'var(--stamp-red)' }}>
              {review.error instanceof ApiError ? review.error.message : t('Could not reach the server.')}
            </p>
          )}
        </div>
      )}

      {!decided && w.proof && !w.isWitness && !w.isOwner && (
        <SketchCard variant="c">
          <p style={{ marginTop: 0 }}>
            {signedInEmail
              ? t('You’re signed in as {email}, but this witness link is for {witness}.', { email: signedInEmail, witness: w.witnessEmail })
              : t('To decide, sign in or create an account with {witness}.', { witness: w.witnessEmail })}
          </p>
          <DoodleButton
            variant="primary"
            href={`/login?email=${encodeURIComponent(w.witnessEmail)}`}
            onClick={() => returnAfterLogin(`/witness/${token}`)}
          >
            {t('Sign in as the witness')}
          </DoodleButton>
        </SketchCard>
      )}

      {w.isOwner && !decided && (
        <p className="muted">{t('This is your own pact — only your witness can decide it.')}</p>
      )}

      <p className="muted" style={{ marginTop: 24, fontSize: 13 }}>
        <Link to="/">{t('What is Purrpose?')}</Link>
      </p>
    </main>
  );
}
