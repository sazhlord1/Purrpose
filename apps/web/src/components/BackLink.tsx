import { Link } from 'react-router-dom';
import { backArrow, t } from '../i18n/index.js';

/** "← Home" at the top of a section (Commitments, Focus Room, Detective Cheat). */
export function BackLink({ to = '/', label = 'Home' }: { to?: string; label?: string }) {
  const text = t(label);
  return (
    <Link to={to} className="back-link" aria-label={t('Back to {label}', { label: text })}>
      <span aria-hidden>{backArrow()}</span> {text}
    </Link>
  );
}
