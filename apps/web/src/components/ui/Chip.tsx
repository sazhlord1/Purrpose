import type { ReactNode } from 'react';

interface ChipProps {
  onClick?: () => void;
  active?: boolean;
  children: ReactNode;
}

export function Chip({ onClick, active, children }: ChipProps) {
  if (onClick) {
    return (
      <button
        className={`chip${active ? ' chip-active' : ''}`}
        onClick={onClick}
        aria-pressed={active}
      >
        {children}
      </button>
    );
  }
  return <span className={`chip${active ? ' chip-active' : ''}`}>{children}</span>;
}
