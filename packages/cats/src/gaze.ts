import { useEffect, type RefObject } from 'react';

const VARS = ['--gx', '--gy', '--hx', '--hy', '--hr'] as const;

function reset(el: SVGElement | HTMLElement): void {
  for (const v of VARS) el.style.setProperty(v, v === '--hr' ? '0deg' : '0px');
}

/**
 * Pou-style: the cat follows the mouse or your finger — the eyes swing all the
 * way to the side and the head turns and leans a little toward it. Writes CSS
 * variables straight onto the scene <svg> (no re-render); after a few quiet
 * seconds the cat looks back at you.
 */
export function useGazeFollow(ref: RefObject<SVGSVGElement | null>, enabled: boolean): void {
  useEffect(() => {
    const svg = ref.current;
    if (!svg || typeof window === 'undefined') return undefined;
    if (!enabled) {
      reset(svg);
      return undefined;
    }
    let frame = 0;
    let idle = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      frame = 0;
      const eyes = svg.querySelector('.pcat-eyes');
      if (!eyes) return;
      const r = eyes.getBoundingClientRect();
      const dx = px - (r.left + r.width / 2);
      const dy = py - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, dist / 110); // close to the face → smaller movement
      const ux = (dx / dist) * reach;
      const uy = (dy / dist) * reach;
      svg.style.setProperty('--gx', `${(ux * 6.5).toFixed(2)}px`);
      svg.style.setProperty('--gy', `${(uy * 4.5).toFixed(2)}px`);
      svg.style.setProperty('--hx', `${(ux * 4).toFixed(2)}px`);
      svg.style.setProperty('--hy', `${(uy * 3).toFixed(2)}px`);
      svg.style.setProperty('--hr', `${(ux * 8).toFixed(2)}deg`);
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!frame) frame = window.requestAnimationFrame(apply);
      window.clearTimeout(idle);
      idle = window.setTimeout(() => reset(svg), 2500);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(idle);
    };
  }, [enabled, ref]);
}
