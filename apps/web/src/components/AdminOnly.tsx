import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useMe } from '../lib/queries.js';
import { t } from '../i18n/index.js';

/** Local dev server or a local `vite preview` (screenshot/e2e scripts run against it). */
function isLocal(): boolean {
  return import.meta.env.DEV || ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

/**
 * Dev tools (Cat Lab, gallery, design kit) are for admins in production. They are
 * purely client-side views — the server never trusts this check for anything.
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  const me = useMe();
  if (isLocal()) return <>{children}</>;
  if (me.isLoading) return <p className="muted">{t('checking your badge…')}</p>;
  if (me.data?.user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}
