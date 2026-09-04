import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { tap } from '../../lib/motion.js';

type Variant = 'primary' | 'ghost';
type Size = 'md' | 'big';

interface DoodleButtonProps {
  variant?: Variant;
  size?: Size;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}

export function DoodleButton({
  variant = 'ghost',
  size = 'md',
  type = 'button',
  disabled,
  onClick,
  href,
  ariaLabel,
  style,
  children,
}: DoodleButtonProps) {
  const cls = ['btn', variant === 'primary' ? 'btn-primary' : '', size === 'big' ? 'btn-big' : '']
    .filter(Boolean)
    .join(' ');

  if (href !== undefined) {
    return (
      <Link to={href} className={cls} aria-label={ariaLabel} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <motion.button
      type={type}
      className={cls}
      disabled={disabled}
      onClick={onClick}
      style={style}
      whileTap={{ scale: 0.97, y: 1 }}
      transition={tap}
      aria-label={ariaLabel}
    >
      {children}
    </motion.button>
  );
}
