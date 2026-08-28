import type { CSSProperties, ReactNode } from 'react';

interface SketchCardProps {
  variant?: 'a' | 'b' | 'c';
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function SketchCard({ variant = 'a', className = '', style, children }: SketchCardProps) {
  return (
    <div className={`card card-${variant} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
