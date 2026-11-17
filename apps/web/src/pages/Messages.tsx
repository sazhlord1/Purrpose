import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppIcon } from '@purrpose/cats';
import { PURR_WELCOME } from '@purrpose/shared';
import { DoodleButton, SketchCard, Skeleton } from '../components/ui/index.js';
import { api } from '../lib/api.js';
import { openLogin } from '../lib/modals.js';
import { fmtDateTime, num, t } from '../i18n/index.js';

interface InboxMessage {
  id: string;
  kind: string;
  title: string;
  body: string;
  createdAtISO: string;
  read: boolean;
}

/** The welcome note is written here, in the player's language. */
function welcome(): { title: string; body: string } {
  return {
    title: t('Welcome to Purrpose!'),
    body: t(
      '{n} PURR are yours as a welcome gift. Purrpose is where a feline opponent becomes your rival on the way to your goals: keep your word and your cat stays hungry; miss it, and you save a lot of shelter cats from hunger and illness!',
      { n: num(PURR_WELCOME) },
    ),
  };
}

/** Messages: a welcome note and news from the Purrpose team. */
export function Messages() {
  const qc = useQueryClient();
  const inbox = useQuery({
    queryKey: ['inbox'],
    queryFn: () => api<{ messages: InboxMessage[]; unread: number; guest: boolean }>('/inbox'),
  });

  // Opening the inbox reads everything in it.
  useEffect(() => {
    if (!inbox.data || inbox.data.unread === 0) return;
    void api('/inbox/read', { method: 'POST', body: {} }).then(() => void qc.invalidateQueries({ queryKey: ['me'] }));
  }, [inbox.data?.unread]);

  return (
    <main>
      <h1>{t('Messages')}</h1>
      {inbox.isLoading && <Skeleton h={80} />}
      {inbox.data?.guest && (
        <SketchCard variant="a">
          <p style={{ marginTop: 0 }}>{t('Sign in to get messages from the Purrpose team.')}</p>
          <DoodleButton variant="primary" onClick={() => openLogin()}>
            {t('Sign in')}
          </DoodleButton>
        </SketchCard>
      )}
      {inbox.data && !inbox.data.guest && inbox.data.messages.length === 0 && <p className="muted">{t('No messages yet.')}</p>}
      <div className="inbox-list">
        {inbox.data?.messages.map(m => {
          const text = m.kind === 'welcome' ? welcome() : { title: m.title, body: m.body };
          return (
            <article key={m.id} className={`inbox-item ${m.read ? '' : 'is-new'}`}>
              <div className="inbox-head">
                <span className="inbox-icon" aria-hidden>
                  <AppIcon name={m.kind === 'welcome' ? 'purr' : 'paw'} size={22} />
                </span>
                <strong>{text.title}</strong>
                {!m.read && <span className="inbox-new">{t('new')}</span>}
              </div>
              <p className="inbox-body">{text.body}</p>
              <span className="muted inbox-date">{fmtDateTime(m.createdAtISO)}</span>
            </article>
          );
        })}
      </div>
    </main>
  );
}
