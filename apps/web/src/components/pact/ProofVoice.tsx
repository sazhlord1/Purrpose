import { useEffect, useState } from 'react';
import { AppIcon } from '@purrpose/cats';
import { apiAudio } from '../../lib/api.js';
import { t } from '../../i18n/index.js';

/** A proof's voice note: loads when asked (it's private), then plays in place. */
export function ProofVoice({ path, autoLoad = false }: { path: string; autoLoad?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const load = () => {
    setState('loading');
    apiAudio(path)
      .then(u => {
        setUrl(u);
        setState('idle');
      })
      .catch(() => setState('error'));
  };
  useEffect(() => {
    if (autoLoad) load();
  }, [path, autoLoad]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  if (url) {
    return (
      <div className="proof-voice">
        <AppIcon name="sparkle" size={16} />
        <audio controls preload="metadata" src={url} />
      </div>
    );
  }
  return (
    <button type="button" className="linklike proof-voice-load" onClick={load} disabled={state === 'loading'}>
      {state === 'loading' ? t('Loading the voice note…') : state === 'error' ? t('The voice note could not be loaded. Try again.') : t('Play the voice note')}
    </button>
  );
}
