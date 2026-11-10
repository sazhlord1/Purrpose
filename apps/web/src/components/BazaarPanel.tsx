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
  const check = useMutation({
    mutationFn: () => api<{ ok: boolean; problem?: string; status?: number }>('/admin/bazaar/check', { method: 'POST' }),
  });
  const CHECK: Record<string, string> = {
    off: t('Billing is off, so there is nothing to test yet.'),
    unreachable: t('The server could not reach Cafe Bazaar. Try again in a minute.'),
    key: t('Bazaar rejected the key. Make a new API token in the Bazaar panel and put it in BAZAAR_API_SECRET.'),
    package: t('Bazaar does not know the package name. It must be space.purrpose.app.'),
    product: t('Bazaar does not know the product purr_150. Check the product ids in the Bazaar panel.'),
    unknown: t('Bazaar gave an unexpected answer. Try again later.'),
  };
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
              ? t('Off: put the Bazaar API token in BAZAAR_API_SECRET in the server settings.')
              : t('Almost: connect the Bazaar client once.')}
        </p>
      )}
      {s?.mode === 'oauth' && (
        <DoodleButton variant={s.enabled ? undefined : 'primary'} disabled={connect.isPending} onClick={() => connect.mutate()}>
          {s.enabled ? t('Reconnect to Cafe Bazaar') : t('Connect to Cafe Bazaar')}
        </DoodleButton>
      )}
      {s?.enabled && (
        <DoodleButton disabled={check.isPending} onClick={() => check.mutate()} style={{ marginInlineStart: 8 }}>
          {t('Test the connection')}
        </DoodleButton>
      )}
      {check.data && (
        <p role="status" className={check.data.ok ? 'muted' : 'form-error'} style={{ fontWeight: 600 }}>
          {check.data.ok
            ? t('Works: Bazaar accepted the key, the package name and the products.')
            : (CHECK[check.data.problem ?? 'unknown'] ?? CHECK.unknown) + (check.data.status ? ` (HTTP ${check.data.status})` : '')}
        </p>
      )}
      {connect.isError && (
        <p role="alert" className="form-error">
          {connect.error instanceof ApiError ? connect.error.message : t('Could not reach the server.')}
        </p>
      )}
    </SketchCard>
  );
}
