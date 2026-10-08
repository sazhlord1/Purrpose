import type { CSSProperties, ReactNode } from 'react';
import { t } from '../../i18n/index.js';

type StampKind = 'fed' | 'kept' | 'stake';

const LABELS: Record<StampKind, string> = {
  fed: 'FED',
  kept: 'KEPT',
  stake: 'AT STAKE',
};

export function Stamp({
  kind,
  style,
  children,
}: {
  kind: StampKind;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <span
      className={`stamp ${kind === 'fed' ? 'stamp-fed' : ''}`.trim()}
      style={style}
      role="status"
      aria-label={t('status: {label}', { label: t(LABELS[kind]) })}
    >
      {children ?? t(LABELS[kind])}
    </span>
  );
}
