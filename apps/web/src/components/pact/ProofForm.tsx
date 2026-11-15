import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { CommitmentDto } from '@purrpose/shared';
import { DoodleButton, Sheet } from '../ui/index.js';
import { api, ApiError } from '../../lib/api.js';
import { shrinkPhoto, type ShrunkPhoto } from '../../lib/image.js';
import { markPermissionExplained, permissionExplained, type PermissionKind } from '../../lib/permissionNotes.js';
import { t } from '../../i18n/index.js';
import { VoiceRecorder, canRecordVoice, type RecordedVoice } from './VoiceRecorder.js';

/** "I did it" for a strict pact: a few words and, if you like, a photo and a voice note. */
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
  const [voice, setVoice] = useState<RecordedVoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Which permission we're explaining before the phone asks for it, and what to do after. */
  const [asking, setAsking] = useState<{ kind: PermissionKind; then: () => void } | null>(null);
  const [recorderOn, setRecorderOn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  /** Runs `then` after our own explanation (once per device), so the phone's prompt makes sense. */
  const withPermission = (kind: PermissionKind, then: () => void) => {
    if (permissionExplained(kind)) then();
    else setAsking({ kind, then });
  };

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.previewUrl);
  }, [photo]);

  const send = useMutation({
    mutationFn: () =>
      api<{ commitment: CommitmentDto }>(`/commitments/${commitment.id}/proof`, {
        method: 'POST',
        body: {
          text: text.trim(),
          ...(photo ? { image: { type: photo.type, data: photo.data } } : {}),
          ...(voice ? { audio: { type: voice.type, data: voice.data } } : {}),
        },
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
      {asking && (
        <div className="permission-note" role="dialog" aria-label={t('Permission')}>
          <p style={{ margin: '0 0 8px' }}>
            {asking.kind === 'camera'
              ? t('To take a photo of your proof, Purrpose needs the camera. Your phone will ask you next; the photo is only sent with this proof.')
              : t('To record a voice note, Purrpose needs the microphone. Your phone will ask you next; nothing is recorded until you press record.')}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DoodleButton
              variant="primary"
              onClick={() => {
                markPermissionExplained(asking.kind);
                const next = asking.then;
                setAsking(null);
                next();
              }}
            >
              {t('OK, continue')}
            </DoodleButton>
            <DoodleButton onClick={() => setAsking(null)}>{t('Not now')}</DoodleButton>
          </div>
        </div>
      )}
      <div className="proof-photo">
        {photo ? (
          <>
            <img src={photo.previewUrl} alt={t('Your photo')} />
            <button type="button" className="linklike" onClick={() => setPhoto(null)}>
              {t('Remove photo')}
            </button>
          </>
        ) : (
          <div className="proof-add-row">
            <DoodleButton onClick={() => withPermission('camera', () => cameraRef.current?.click())} disabled={photoBusy}>
              📷 {photoBusy ? t('Shrinking the photo…') : t('Take a photo')}
            </DoodleButton>
            <DoodleButton onClick={() => fileRef.current?.click()} disabled={photoBusy}>
              🖼️ {t('From gallery')}
            </DoodleButton>
          </div>
        )}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={e => {
            void pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
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
      {canRecordVoice() && (
        <div className="proof-voice-row">
          {recorderOn || voice ? (
            <VoiceRecorder voice={voice} onVoice={v => { setVoice(v); if (!v) setRecorderOn(false); }} onError={e => { setError(e); setRecorderOn(false); }} autoStart={!voice} />
          ) : (
            <DoodleButton onClick={() => withPermission('microphone', () => setRecorderOn(true))}>
              🎙️ {t('Add a voice note (optional)')}
            </DoodleButton>
          )}
        </div>
      )}
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
