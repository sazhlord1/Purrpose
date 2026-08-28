import type { ReactNode } from 'react';
import type { FC } from 'react';
import { CatFace } from '../doodles/index.js';

interface EmptyStateProps {
  icon?: FC<{ size?: number; className?: string }>;
  title: string;
  hint?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = CatFace, title, hint, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)' }}>
      <Icon size={56} />
      <h3>{title}</h3>
      {hint && <p className="muted">{hint}</p>}
      {action && <div style={{ marginTop: 'var(--space-4)' }}>{action}</div>}
    </div>
  );
}
