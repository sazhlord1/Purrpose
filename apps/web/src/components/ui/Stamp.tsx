import type { CSSProperties, ReactNode } from 'react';

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
      aria-label={`status: ${LABELS[kind]}`}
    >
      {children ?? LABELS[kind]}
    </span>
  );
}
