import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AppIcon } from '@purrpose/cats';
import type { CommitmentDto } from '@purrpose/shared';
import { DoodleButton, Sheet } from '../ui/index.js';
import { api, ApiError } from '../../lib/api.js';
import { shrinkPhoto, type ShrunkPhoto } from '../../lib/image.js';
import { t } from '../../i18n/index.js';

/** "I did it" for a strict pact: a few words and, if you like, a photo. */
export function ProofForm({
  open,
  commitment,
  onClose,
  onSent,
  onLate,
}: {
  open: boolean;
  commitment: CommitmentDto;
  onClose: () => void;
  onSent: () => void;
  onLate: () => void;
}) {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<ShrunkPhoto | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.previewUrl);
  }, [photo]);

  const send = useMutation({
    mutationFn: () =>
      api<{ commitment: CommitmentDto }>(`/commitments/${commitment.id}/proof`, {
        method: 'POST',
        body: { text: text.trim(), ...(photo ? { image: { type: photo.type, data: photo.data } } : {}) },
      }),
    onSuccess: res => {
      qc.setQueryData(['commitment', commitment.id], { commitment: res.commitment });
      void qc.invalidateQueries({ queryKey: ['commitments'] });
      onSent();
    },
    onError: e => {
      if (e instanceof ApiError && e.code === 'FAILED_AT_DEADLINE') {
        onLate();
        return;
      }
      setError(e instanceof ApiError ? e.message : t('Could not send it. Try again.'));
    },
  });

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPhotoBusy(true);
    try {
      setPhoto(await shrinkPhoto(file));
    } catch {
      setError(t('That photo could not be used. Try another one.'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const ok = text.trim().length >= 3 && !photoBusy && !send.isPending;

  return (
    <Sheet open={open} onClose={onClose} title={t('Show what you did')}>
      <p className="muted" style={{ marginTop: -4 }}>
        {commitment.witnessEmail
          ? t('Your witness will look at this and say yes or no.')
          : t('The Purrpose team will look at this and say yes or no.')}{' '}
        {t('If nobody answers within 48 hours, it counts.')}
      </p>
      <label className="field">
        <span>{t('What did you do?')}</span>
        <textarea
          rows={3}
          maxLength={600}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('e.g. Sent the report to my manager at 5pm.')}
        />
      </label>
      <div className="proof-photo">
        {photo ? (
          <>
            <img src={photo.previewUrl} alt={t('Your photo')} />
            <button type="button" className="linklike" onClick={() => setPhoto(null)}>
              {t('Remove photo')}
            </button>
          </>
        ) : (
          <DoodleButton onClick={() => fileRef.current?.click()} disabled={photoBusy}>
            <AppIcon name="sparkle" size={18} /> {photoBusy ? t('Shrinking the photo…') : t('Add a photo (optional)')}
          </DoodleButton>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={e => {
            void pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      {error && (
        <p role="alert" style={{ color: 'var(--stamp-red)', fontSize: 13.5 }}>
          {error}
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <DoodleButton variant="primary" disabled={!ok} onClick={() => send.mutate()}>
          {send.isPending ? '…' : t('Send proof')}
        </DoodleButton>
        <DoodleButton onClick={onClose}>{t('Not yet')}</DoodleButton>
      </div>
    </Sheet>
  );
}
