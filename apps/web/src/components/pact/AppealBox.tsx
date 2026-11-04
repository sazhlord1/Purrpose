/**
 * A proof was rejected: the owner can ask the Purrpose team for a second look,
 * once, within 3 days of the decision. Shows the answer once there is one.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { CommitmentDto } from '@purrpose/shared';
import { DoodleButton } from '../ui/index.js';
import { api, ApiError } from '../../lib/api.js';
import { fmtDateTime, t } from '../../i18n/index.js';

export function AppealBox({ c }: { c: CommitmentDto }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const send = useMutation({
    mutationFn: () => api(`/commitments/${c.id}/appeal`, { method: 'POST', body: { text: text.trim() } }),
    onSuccess: () => {
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ['commitment', c.id] });
    },
    onError: e => setError(e instanceof ApiError ? e.message : t('Something went wrong on our side. Try again in a bit.')),
  });

  const a = c.appeal;
  if (a) {
    return (
      <div className="appeal-box">
        <strong>
          {a.status === 'pending'
            ? t('Your appeal is with the Purrpose team.')
            : a.status === 'overturned'
              ? t('Appeal accepted: the pact counts as kept and your food is back.')
              : t('Appeal reviewed: the decision stands.')}
        </strong>
        {a.status === 'pending' && <p className="muted">{t('We usually answer within 3 days. The food stays put until then.')}</p>}
        {a.note && <p className="muted">{t('“{note}”', { note: a.note })}</p>}
      </div>
    );
  }
  if (!c.appealUntilISO) return null;

  const tooShort = text.trim().length < 10;
  return (
    <div className="appeal-box">
      {!open ? (
        <>
          <p style={{ margin: '0 0 8px' }}>
            {t('Think the decision was wrong? You can appeal until {date}.', { date: fmtDateTime(c.appealUntilISO) })}
          </p>
          <DoodleButton onClick={() => setOpen(true)}>{t('Appeal the decision')}</DoodleButton>
        </>
      ) : (
        <>
          <label className="field">
            <span>{t('Why was the decision wrong?')}</span>
            <textarea
              rows={3}
              maxLength={600}
              value={text}
              onChange={e => {
                setText(e.target.value);
                setError(null);
              }}
              placeholder={t('Tell the team what you did and what the reviewer missed.')}
            />
          </label>
          <p className="muted" style={{ fontSize: 12.5, margin: '4px 0 10px' }}>
            {t('One appeal per pact. The Purrpose team looks at the proof again and decides.')}
          </p>
          {error && <p className="appeal-error">{error}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DoodleButton variant="primary" disabled={tooShort || send.isPending} onClick={() => send.mutate()}>
              {send.isPending ? t('Sending…') : t('Send appeal')}
            </DoodleButton>
            <DoodleButton onClick={() => setOpen(false)}>{t('Cancel')}</DoodleButton>
          </div>
        </>
      )}
    </div>
  );
}
