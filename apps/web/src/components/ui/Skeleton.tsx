import type { CSSProperties } from 'react';

export function Skeleton({
  w = '100%',
  h = 16,
  style,
}: {
  w?: number | string;
  h?: number;
  style?: CSSProperties;
}) {
  return <div className="skel" style={{ width: w, height: h, ...style }} aria-hidden />;
}
