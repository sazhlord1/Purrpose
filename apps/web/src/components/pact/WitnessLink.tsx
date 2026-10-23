import { useState } from 'react';
import { AppIcon } from '@purrpose/cats';
import { DoodleButton } from '../ui/index.js';
import { shareLink, witnessUrl } from '../../lib/shareLink.js';
import { t } from '../../i18n/index.js';

/** The owner's way to get the witness link to their friend (share sheet, copy, or select it). */
export function WitnessLink({ token, email, title }: { token: string; email: string; title: string }) {
  const [state, setState] = useState<'idle' | 'shared' | 'copied' | 'failed'>('idle');
  const url = witnessUrl(token);
  return (
    <div className="witness-link" data-tour="pact-witness-link">
      <p style={{ margin: '0 0 6px' }}>
        <AppIcon name="account" size={16} /> {t('Witness:')} <span className="ltr">{email}</span>
      </p>
      <p className="muted" style={{ margin: '0 0 8px', fontSize: 13.5 }}>
        {t('Send them this link. They sign in with this email to check your proof.')}
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <DoodleButton
          onClick={async () => setState(await shareLink(url, t('Be my witness on Purrpose: “{title}”', { title })))}
        >
          <AppIcon name="share" size={18} /> {t('Send the link')}
        </DoodleButton>
        {state === 'copied' && <span className="muted">{t('Link copied.')}</span>}
        {state === 'shared' && <span className="muted">{t('Sent.')}</span>}
      </div>
      {state === 'failed' && (
        <input className="ltr witness-url" readOnly value={url} onFocus={e => e.currentTarget.select()} aria-label={t('Witness link')} />
      )}
    </div>
  );
}
