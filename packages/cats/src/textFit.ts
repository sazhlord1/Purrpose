import { useEffect, useState, type RefObject } from 'react';

/**
 * Width of an SVG text once the font has loaded, so the pill/bubble around it
 * fits the words exactly instead of a guess per character.
 */
export function useTextWidth(ref: RefObject<SVGTextElement | null>, text: string, guess: number): number {
  const [w, setW] = useState(guess);
  useEffect(() => {
    let alive = true;
    const measure = () => {
      const el = ref.current;
      if (!alive || !el) return;
      try {
        const len = el.getBBox().width; // widest line when the text has several <tspan>s
        if (len > 0) setW(len);
      } catch {
        /* not rendered yet */
      }
    };
    measure();
    void document.fonts?.ready.then(measure);
    return () => {
      alive = false;
    };
  }, [text]);
  return text ? w : 0;
}

