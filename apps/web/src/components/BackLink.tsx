import { Link } from 'react-router-dom';

/** "← Home" at the top of a section (Commitments, Focus Room, Detective Cheat). */
export function BackLink({ to = '/', label = 'Home' }: { to?: string; label?: string }) {
  return (
    <Link to={to} className="back-link" aria-label={`Back to ${label}`}>
      <span aria-hidden>←</span> {label}
    </Link>
  );
}
