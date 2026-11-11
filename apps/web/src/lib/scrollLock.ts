import { useEffect } from 'react';

/** How many popups are open right now; the page scrolls again when the last one closes. */
let locks = 0;
let saved: { html: string; body: string; overscroll: string } | null = null;

function lock(): void {
  if (locks++ > 0) return;
  const html = document.documentElement;
  saved = { html: html.style.overflow, body: document.body.style.overflow, overscroll: html.style.overscrollBehavior };
  html.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  html.style.overscrollBehavior = 'none';
}

function unlock(): void {
  if (--locks > 0 || !saved) return;
  const html = document.documentElement;
  html.style.overflow = saved.html;
  document.body.style.overflow = saved.body;
  html.style.overscrollBehavior = saved.overscroll;
  saved = null;
}

/** While a popup is open, the page behind it doesn't scroll (the popup itself still can). */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return undefined;
    lock();
    return unlock;
  }, [active]);
}
