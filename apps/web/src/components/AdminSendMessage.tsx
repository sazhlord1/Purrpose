import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { DoodleButton, SketchCard } from './ui/index.js';
import { api, ApiError } from '../lib/api.js';
import { num, t } from '../i18n/index.js';

/** Admin: write to one player's inbox, or to everyone with an account (with a push). */
export function AdminSendMessage({ userId, name }: { userId?: string; name?: string }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const send = useMutation({
    mutationFn: () => api<{ sent: number }>('/admin/messages', { method: 'POST', body: { title, body, ...(userId ? { userId } : {}) } }),
    onSuccess: r => {
      setNote(t('Sent to {n} inboxes.', { n: num(r.sent) }));
      setTitle('');
      setBody('');
    },
    onError: e => setNote(e instanceof ApiError ? e.message : t('Failed.')),
  });
  return (
    <SketchCard variant="b">
      <h2 style={{ marginTop: 0 }}>{userId ? t('Message {name}', { name: name || t('this player') }) : t('Message everyone')}</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        {userId ? t('Goes to their Messages, with a “new message” notification.') : t('Goes to every account’s Messages, with a “new message” notification.')}
      </p>
      <form
        className="auth-form"
        onSubmit={e => {
          e.preventDefault();
          if (!userId && !window.confirm(t('Send this to everyone?'))) return;
          send.mutate();
        }}
      >
        <label className="field">
          <span>{t('Title')}</span>
          <input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} />
        </label>
        <label className="field">
          <span>{t('Message')}</span>
          <textarea required rows={4} maxLength={4000} value={body} onChange={e => setBody(e.target.value)} />
        </label>
        <DoodleButton type="submit" variant="primary" disabled={send.isPending}>
          {send.isPending ? '…' : t('Send')}
        </DoodleButton>
        {note && <p className="muted" role="status">{note}</p>}
      </form>
    </SketchCard>
  );
}
