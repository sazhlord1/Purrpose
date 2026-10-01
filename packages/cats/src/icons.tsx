/**
 * Purrpose icon set: small, coloured doodles in the same ink-and-paper style
 * as the cats (thick dark outline, flat warm fills, slightly wobbly shapes).
 * Replaces every emoji in the app.
 *
 * All icons share a 24×24 box. Use <AppIcon name="home" /> in HTML, or
 * <IconGlyph name="home" /> inside an existing SVG.
 */
import type { ReactNode } from 'react';

const INK = '#26201D';
const PAPER = '#FFFDF9';

export type IconName =
  | 'home'
  | 'focus'
  | 'shop'
  | 'pantry'
  | 'impact'
  | 'cats'
  | 'toys'
  | 'bowls'
  | 'comfort'
  | 'wearables'
  | 'decor'
  | 'purr'
  | 'meals'
  | 'dryFood'
  | 'vetCare'
  | 'box'
  | 'yard'
  | 'room'
  | 'tree'
  | 'crown'
  | 'paw'
  | 'share'
  | 'settings'
  | 'lock'
  | 'sound'
  | 'mute'
  | 'expand'
  | 'sparkle';

const s = { stroke: INK, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const GLYPHS: Record<IconName, ReactNode> = {
  // ── Navigation ──
  home: (
    <>
      <path d="M5 11.2 L5 20 L19 20 L19 11.2" fill="#FFF1C2" {...s} />
      <path d="M3 12 L12 4.2 L21 12" fill="none" {...s} strokeWidth={2} />
      <path d="M6.2 8.6 L6.6 3.8 L9.4 6.6" fill="#E28743" {...s} />
      <path d="M17.8 8.6 L17.4 3.8 L14.6 6.6" fill="#E28743" {...s} />
      <path d="M10 20 L10 15.6 C10 14.2 14 14.2 14 15.6 L14 20" fill="#B5703A" {...s} />
      <circle cx="12" cy="11.2" r="1.3" fill="#F4B63F" stroke={INK} strokeWidth={1.2} />
    </>
  ),
  focus: (
    <>
      <path d="M15.5 3.6 C10.4 3.4 6.6 7.4 6.8 12.2 C7 17 11 20.6 15.8 20.2 C17.6 20 19.2 19.3 20.4 18.2 C14.6 18.4 10.8 13.4 12.6 8 C13.2 6.2 14.2 4.7 15.5 3.6 Z" fill="#F4B63F" {...s} />
      <path d="M18.6 6.2 L19.2 7.6 L20.6 8.1 L19.2 8.7 L18.6 10.1 L18 8.7 L16.6 8.1 L18 7.6 Z" fill="#FFF1C2" {...s} strokeWidth={1.1} />
      <circle cx="4.2" cy="6" r="0.9" fill="#FFF1C2" stroke={INK} strokeWidth={1} />
    </>
  ),
  shop: (
    <>
      <path d="M4.6 8.6 L19.4 8.6 L18.4 20.4 L5.6 20.4 Z" fill="#B79CE6" {...s} />
      <path d="M8.6 10.4 L8.6 6.8 C8.6 2.6 15.4 2.6 15.4 6.8 L15.4 10.4" fill="none" {...s} />
      <ellipse cx="12" cy="16.2" rx="1.9" ry="1.5" fill={PAPER} stroke={INK} strokeWidth={1.1} />
      <circle cx="9.9" cy="13.9" r="0.85" fill={PAPER} stroke={INK} strokeWidth={0.9} />
      <circle cx="12" cy="13.2" r="0.85" fill={PAPER} stroke={INK} strokeWidth={0.9} />
      <circle cx="14.1" cy="13.9" r="0.85" fill={PAPER} stroke={INK} strokeWidth={0.9} />
    </>
  ),
  pantry: (
    <>
      <path d="M5.6 6.4 L5.6 18 C5.6 19.9 18.4 19.9 18.4 18 L18.4 6.4" fill="#E86A3A" {...s} />
      <path d="M5.6 10 C5.6 11.6 18.4 11.6 18.4 10 L18.4 14.6 C18.4 16.2 5.6 16.2 5.6 14.6 Z" fill="#F4B63F" {...s} strokeWidth={1.3} />
      <ellipse cx="12" cy="6.4" rx="6.4" ry="2.2" fill="#C9CDD2" {...s} />
      <path d="M9.4 12.9 c1.4 -1.3 3.4 -1.3 4.4 0 c-1 1.3 -3 1.3 -4.4 0 Z M13.8 12.9 l1.5 -1 v2 Z" fill="#6FA8DC" stroke={INK} strokeWidth={0.9} />
    </>
  ),
  impact: (
    <>
      <path d="M12 20.2 C6.2 16.4 3.2 13 3.4 9.2 C3.6 6.2 6 4.2 8.6 4.4 C10.2 4.5 11.4 5.5 12 6.8 C12.6 5.5 13.8 4.5 15.4 4.4 C18 4.2 20.4 6.2 20.6 9.2 C20.8 13 17.8 16.4 12 20.2 Z" fill="#E86A7A" {...s} />
      <ellipse cx="12" cy="13" rx="2.2" ry="1.7" fill={PAPER} stroke={INK} strokeWidth={1} />
      <circle cx="9.7" cy="10.4" r="0.9" fill={PAPER} stroke={INK} strokeWidth={0.9} />
      <circle cx="12" cy="9.6" r="0.9" fill={PAPER} stroke={INK} strokeWidth={0.9} />
      <circle cx="14.3" cy="10.4" r="0.9" fill={PAPER} stroke={INK} strokeWidth={0.9} />
    </>
  ),

  // ── Shop sections ──
  cats: (
    <>
      <path d="M4.6 11 L5 3.8 L9.4 7.2 C11 6.8 13 6.8 14.6 7.2 L19 3.8 L19.4 11 C20.2 16 16.6 19.6 12 19.6 C7.4 19.6 3.8 16 4.6 11 Z" fill="#EEB038" {...s} />
      <circle cx="9.2" cy="12.4" r="1.1" fill={INK} />
      <circle cx="14.8" cy="12.4" r="1.1" fill={INK} />
      <path d="M11.2 14.6 L12.8 14.6 L12 15.6 Z" fill={INK} />
      <path d="M2.4 13.4 L6 14 M2.6 16 L6 15.4 M21.6 13.4 L18 14 M21.4 16 L18 15.4" stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
    </>
  ),
  toys: (
    <>
      <path d="M15.6 18.8 c2.6 0.6 4.6 -0.2 5.4 -2" fill="none" stroke="#E76F51" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx="11" cy="12" r="8" fill="#E76F51" {...s} />
      <path d="M4.6 9.8 C8 12.4 13.6 12.8 18 10.4 M4.2 13.4 C8.4 16 14 16.2 18.4 13.8 M9.2 4.2 C7.4 9 8.4 15.4 11.4 19.8" fill="none" stroke={PAPER} strokeWidth={1.3} strokeLinecap="round" />
    </>
  ),
  bowls: (
    <>
      <path d="M8 11.2 L9.4 8.6 L10.8 11 L12.2 8.4 L13.6 11 L15 8.6 L16.4 11.2" fill="#B5703A" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M3.4 11.6 L20.6 11.6 C20.2 17.2 16.6 19.8 12 19.8 C7.4 19.8 3.8 17.2 3.4 11.6 Z" fill="#6FA8DC" {...s} />
      <path d="M7.6 15.2 C10.4 16.2 13.6 16.2 16.4 15.2" fill="none" stroke={PAPER} strokeWidth={1.3} strokeLinecap="round" />
    </>
  ),
  comfort: (
    <>
      <ellipse cx="12" cy="14.4" rx="9.4" ry="5" fill="#8FC1B5" {...s} />
      <ellipse cx="12" cy="13.4" rx="5.6" ry="2.4" fill="#F6EBDD" {...s} strokeWidth={1.3} />
      <path d="M5.4 16.6 q1 -0.8 2 0 M16.6 16.6 q1 -0.8 2 0" fill="none" stroke="#5E8E83" strokeWidth={1.2} strokeLinecap="round" />
    </>
  ),
  wearables: (
    <>
      <path d="M12 12 L3.4 7 L3.4 17 Z" fill="#E86A7A" {...s} />
      <path d="M12 12 L20.6 7 L20.6 17 Z" fill="#E86A7A" {...s} />
      <rect x="9.8" y="9.6" width="4.4" height="4.8" rx="1.6" fill="#C94F60" {...s} />
      <circle cx="6.4" cy="11" r="0.8" fill={PAPER} />
      <circle cx="17.6" cy="13.2" r="0.8" fill={PAPER} />
    </>
  ),
  decor: (
    <>
      <path d="M12 13 C10.6 9.4 6.4 8 3.6 9.4 C5 12.4 8.8 13.8 12 13 Z" fill="#7FA36E" {...s} />
      <path d="M12 13 C13.4 9.4 17.6 8 20.4 9.4 C19 12.4 15.2 13.8 12 13 Z" fill="#7FA36E" {...s} />
      <path d="M12 13 C10.4 9.4 10.8 5.4 12.4 3 C14 5.4 14 9.6 12 13 Z" fill="#5E8C5A" {...s} />
      <path d="M7 13.4 L17 13.4 L15.8 20.6 L8.2 20.6 Z" fill="#D98B62" {...s} />
    </>
  ),
  purr: (
    <>
      <circle cx="12" cy="12" r="8.8" fill="#F4B63F" {...s} />
      <circle cx="12" cy="12" r="6.4" fill="none" stroke="#C98A1E" strokeWidth={1.2} />
      <ellipse cx="12" cy="13.6" rx="2.2" ry="1.7" fill="#C98A1E" />
      <circle cx="9.6" cy="10.8" r="0.95" fill="#C98A1E" />
      <circle cx="12" cy="9.9" r="0.95" fill="#C98A1E" />
      <circle cx="14.4" cy="10.8" r="0.95" fill="#C98A1E" />
    </>
  ),

  // ── Pantry credits (match the landing page) ──
  meals: (
    <>
      <path d="M5.6 6.6 L5.6 17.6 C5.6 19.6 18.4 19.6 18.4 17.6 L18.4 6.6" fill="#E86A3A" {...s} />
      <path d="M5.6 9.8 C5.6 11.4 18.4 11.4 18.4 9.8 L18.4 14.4 C18.4 16 5.6 16 5.6 14.4 Z" fill="#F4B63F" {...s} strokeWidth={1.3} />
      <ellipse cx="12" cy="6.6" rx="6.4" ry="2.2" fill="#C9CDD2" {...s} />
      <path d="M9.4 12.8 c1.4 -1.3 3.4 -1.3 4.4 0 c-1 1.3 -3 1.3 -4.4 0 Z M13.8 12.8 l1.5 -1 v2 Z" fill="#6FA8DC" stroke={INK} strokeWidth={0.9} />
    </>
  ),
  dryFood: (
    <>
      <path d="M6.8 5 L17.2 5 L18.8 18.8 C14.4 20.4 9.6 20.4 5.2 18.8 Z" fill="#5B8FD6" {...s} />
      <path d="M6.8 5 L7.6 3.2 L16.4 3.2 L17.2 5" fill="#3E6FB0" {...s} />
      <circle cx="12" cy="12.4" r="3.4" fill="#F4D58D" {...s} strokeWidth={1.3} />
      <circle cx="11" cy="11.6" r="0.8" fill="#B5703A" />
      <circle cx="13" cy="12" r="0.8" fill="#B5703A" />
      <circle cx="11.8" cy="13.6" r="0.8" fill="#B5703A" />
    </>
  ),
  vetCare: (
    <>
      <path d="M9 7 L9 5 C9 3.8 15 3.8 15 5 L15 7" fill="none" {...s} />
      <rect x="3.6" y="7" width="16.8" height="12.6" rx="3" fill={PAPER} {...s} />
      <path d="M10.4 10 L13.6 10 L13.6 12 L15.6 12 L15.6 15 L13.6 15 L13.6 17 L10.4 17 L10.4 15 L8.4 15 L8.4 12 L10.4 12 Z" fill="#E0533C" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
    </>
  ),

  // ── Life stages ──
  box: (
    <>
      <path d="M3.6 10 L12 13.4 L20.4 10 L20.4 18.4 L12 21.6 L3.6 18.4 Z" fill="#C89F6E" {...s} />
      <path d="M12 13.4 L12 21.6" stroke={INK} strokeWidth={1.4} />
      <path d="M3.6 10 L1.8 6.4 L9.8 3.6 L12 7 Z" fill="#DDB483" {...s} />
      <path d="M20.4 10 L22.2 6.4 L14.2 3.6 L12 7 Z" fill="#DDB483" {...s} />
      <path d="M3.6 10 L12 7 L20.4 10 L12 13.4 Z" fill="#A47C4E" {...s} strokeWidth={1.3} />
    </>
  ),
  yard: (
    <>
      <path d="M2.6 19.6 C6 17.4 18 17.4 21.4 19.6" fill="#8FA37E" {...s} />
      <path d="M12 18 C12 13.6 11.4 10 12 6.4" fill="none" {...s} />
      <path d="M12 11.6 C9.4 8.6 5.8 8.8 4.6 10.6 C6.6 13 9.8 13.2 12 11.6 Z" fill="#7FA36E" {...s} />
      <path d="M12 9 C14.2 5.6 18 5.4 19.4 7.2 C17.6 9.8 14.4 10.4 12 9 Z" fill="#5E8C5A" {...s} />
      <circle cx="18" cy="15.4" r="1.4" fill={PAPER} stroke={INK} strokeWidth={1} />
      <circle cx="18" cy="15.4" r="0.5" fill="#F4B63F" />
    </>
  ),
  room: (
    <>
      <path d="M5 9.4 C5 6.6 19 6.6 19 9.4 L19 13 L5 13 Z" fill="#849674" {...s} />
      <rect x="2.6" y="11" width="4" height="7" rx="1.6" fill="#758765" {...s} />
      <rect x="17.4" y="11" width="4" height="7" rx="1.6" fill="#758765" {...s} />
      <rect x="5" y="13" width="14" height="4.4" rx="1.4" fill="#9BAD8A" {...s} />
      <path d="M5 18 L5 20.2 M19 18 L19 20.2" {...s} />
    </>
  ),
  tree: (
    <>
      <rect x="10.2" y="7" width="3.6" height="11.6" fill="#D8C39A" {...s} />
      <path d="M10.2 9.6 l3.6 0.8 M10.2 12.4 l3.6 0.8 M10.2 15.2 l3.6 0.8" stroke="#A88E60" strokeWidth={1.1} strokeLinecap="round" />
      <rect x="5.4" y="4.2" width="13.2" height="3.4" rx="1.2" fill="#8FC1B5" {...s} />
      <rect x="5.4" y="18.4" width="13.2" height="2.6" rx="1" fill="#A8835B" {...s} />
      <path d="M16.6 7.6 L16.6 11.4" stroke={INK} strokeWidth={1.1} />
      <circle cx="16.6" cy="12.6" r="1.3" fill="#E86A7A" stroke={INK} strokeWidth={1} />
    </>
  ),
  crown: (
    <>
      <path d="M3.4 18 L2.6 7.6 L8 11.6 L12 4.8 L16 11.6 L21.4 7.6 L20.6 18 Z" fill="#F4B63F" {...s} />
      <rect x="3.4" y="17.4" width="17.2" height="2.8" rx="1" fill="#E0A11B" {...s} />
      <circle cx="12" cy="13.6" r="1.4" fill="#E86A7A" stroke={INK} strokeWidth={1} />
      <circle cx="7.4" cy="15" r="0.9" fill="#6FA8DC" stroke={INK} strokeWidth={0.9} />
      <circle cx="16.6" cy="15" r="0.9" fill="#6FA8DC" stroke={INK} strokeWidth={0.9} />
    </>
  ),

  // ── Small UI glyphs ──
  paw: (
    <>
      <path d="M12 12.6 C9 12.6 6.6 14.6 6.8 17 C7 19 9.2 20 12 20 C14.8 20 17 19 17.2 17 C17.4 14.6 15 12.6 12 12.6 Z" fill="#F4A3AE" {...s} />
      <ellipse cx="6.2" cy="9.8" rx="1.9" ry="2.3" fill="#F4A3AE" {...s} />
      <ellipse cx="10" cy="6.6" rx="1.9" ry="2.4" fill="#F4A3AE" {...s} />
      <ellipse cx="14" cy="6.6" rx="1.9" ry="2.4" fill="#F4A3AE" {...s} />
      <ellipse cx="17.8" cy="9.8" rx="1.9" ry="2.3" fill="#F4A3AE" {...s} />
    </>
  ),
  share: (
    <>
      <rect x="4.6" y="9.4" width="14.8" height="11" rx="2.4" fill="#8FC1B5" {...s} />
      <path d="M12 15 L12 3.4 M8.4 6.8 L12 3.2 L15.6 6.8" fill="none" {...s} strokeWidth={2} />
    </>
  ),
  settings: (
    <>
      <path d="M12 2.8 L13.6 5.2 L16.4 4.4 L16.8 7.2 L19.6 8 L18.6 10.6 L20.8 12.4 L18.6 14.2 L19.6 16.8 L16.8 17.6 L16.4 20.4 L13.6 19.6 L12 22 L10.4 19.6 L7.6 20.4 L7.2 17.6 L4.4 16.8 L5.4 14.2 L3.2 12.4 L5.4 10.6 L4.4 8 L7.2 7.2 L7.6 4.4 L10.4 5.2 Z" fill="#C9CDD2" {...s} strokeWidth={1.4} />
      <circle cx="12" cy="12.4" r="3.2" fill={PAPER} {...s} />
    </>
  ),
  lock: (
    <>
      <path d="M8 10.6 L8 7.6 C8 2.8 16 2.8 16 7.6 L16 10.6" fill="none" {...s} strokeWidth={2} />
      <rect x="4.8" y="10.4" width="14.4" height="10" rx="2.4" fill="#F4B63F" {...s} />
      <circle cx="12" cy="14.6" r="1.4" fill={INK} />
      <path d="M12 15.4 L12 17.6" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
    </>
  ),
  sound: (
    <>
      <path d="M3.6 9.4 L7.4 9.4 L12 5.4 L12 18.6 L7.4 14.6 L3.6 14.6 Z" fill="#B79CE6" {...s} />
      <path d="M15 9 C16.6 10.6 16.6 13.4 15 15 M17.6 6.6 C20.6 9.6 20.6 14.4 17.6 17.4" fill="none" {...s} />
    </>
  ),
  mute: (
    <>
      <path d="M3.6 9.4 L7.4 9.4 L12 5.4 L12 18.6 L7.4 14.6 L3.6 14.6 Z" fill="#C9CDD2" {...s} />
      <path d="M15.4 9.4 L20.4 14.6 M20.4 9.4 L15.4 14.6" fill="none" {...s} strokeWidth={2} />
    </>
  ),
  expand: (
    <>
      <path d="M4 9 L4 4 L9 4 M15 4 L20 4 L20 9 M20 15 L20 20 L15 20 M9 20 L4 20 L4 15" fill="none" {...s} strokeWidth={2} />
      <rect x="8.4" y="8.4" width="7.2" height="7.2" rx="1.6" fill="#8FC1B5" {...s} strokeWidth={1.3} />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 2.6 L13.9 9.4 L20.6 11.6 L13.9 13.8 L12 20.6 L10.1 13.8 L3.4 11.6 L10.1 9.4 Z" fill="#F4B63F" {...s} />
      <circle cx="19" cy="4.6" r="1.2" fill="#FFF1C2" stroke={INK} strokeWidth={1} />
    </>
  ),
};

/** The icon's shapes, for use inside an existing <svg> (24×24 units). */
export function IconGlyph({ name }: { name: IconName }) {
  return <g data-icon={name}>{GLYPHS[name]}</g>;
}

/** A coloured doodle icon. Decorative by default; pass `label` when it carries meaning on its own. */
export function AppIcon({
  name,
  size = 22,
  label,
  className,
}: {
  name: IconName;
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className ? `app-icon ${className}` : 'app-icon'}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={{ display: 'inline-block', verticalAlign: '-0.2em', flex: 'none', overflow: 'visible' }}
    >
      {GLYPHS[name]}
    </svg>
  );
}

/** Which icon belongs to each life stage. */
export const STAGE_ICON: Record<'box' | 'yard' | 'room' | 'tree' | 'feast', IconName> = {
  box: 'box',
  yard: 'yard',
  room: 'room',
  tree: 'tree',
  feast: 'crown',
};
