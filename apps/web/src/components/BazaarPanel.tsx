import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { DoodleButton, SketchCard } from './ui/index.js';
import { api, ApiError } from '../lib/api.js';
import { t } from '../i18n/index.js';

/**
 * Admin: is the server signed in to Cafe Bazaar's developer API? With an OAuth client
 * (BAZAAR_CLIENT_ID / BAZAAR_CLIENT_SECRET in the hosting settings) the admin connects
 * once here; Bazaar sends them back to /admin?bazaar=ok|denied|expired|error.
 */
export function BazaarPanel() {
  const [params] = useSearchParams();
  const back = params.get('bazaar');
  const status = useQuery({
    queryKey: ['admin-bazaar'],
    queryFn: () => api<{ mode: 'secret' | 'oauth' | 'none'; enabled: boolean }>('/admin/bazaar'),
  });
  const connect = useMutation({
    mutationFn: () => api<{ url: string }>('/admin/bazaar/connect', { method: 'POST' }),
    onSuccess: res => window.location.assign(res.url),
  });
  const s = status.data;
  const BACK: Record<string, string> = {
    ok: t('Connected to Cafe Bazaar. Purchases can be checked now.'),
    denied: t('Bazaar did not give access. Try again and approve it.'),
    expired: t('The connection took too long. Press the button again.'),
    error: t('Bazaar refused the connection. Check the client id, secret and redirect URL, then try again.'),
  };
  return (
    <SketchCard variant="b">
      <h2 style={{ marginTop: 0 }}>{t('Cafe Bazaar billing')}</h2>
      {back && BACK[back] && (
        <p role="status" className={back === 'ok' ? 'muted' : 'form-error'} style={{ fontWeight: 600 }}>
          {BACK[back]}
        </p>
      )}
      {s && (
        <p>
          {s.enabled
            ? t('On: the app can sell food and PURR through Bazaar.')
            : s.mode === 'none'
              ? t('Off: set BAZAAR_CLIENT_ID and BAZAAR_CLIENT_SECRET (or BAZAAR_API_SECRET) in the server settings.')
              : t('Almost: connect the Bazaar client once.')}
        </p>
      )}
      {s?.mode === 'oauth' && (
        <DoodleButton variant={s.enabled ? undefined : 'primary'} disabled={connect.isPending} onClick={() => connect.mutate()}>
          {s.enabled ? t('Reconnect to Cafe Bazaar') : t('Connect to Cafe Bazaar')}
        </DoodleButton>
      )}
      {connect.isError && (
        <p role="alert" className="form-error">
          {connect.error instanceof ApiError ? connect.error.message : t('Could not reach the server.')}
        </p>
      )}
    </SketchCard>
  );
}
