import { useEffect, useState, type RefObject } from 'react';

/**
 * Bumps whenever a web font finishes loading. Persian fonts are fetched only
 * once Persian text is on screen, so anything measured before that is
 * measured in the fallback font and has to be measured again.
 */
export function useFontsVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    if (!fonts) return undefined;
    let alive = true;
    const bump = () => alive && setV(n => n + 1);
    fonts.addEventListener?.('loadingdone', bump);
    void fonts.ready.then(bump);
    return () => {
      alive = false;
      fonts.removeEventListener?.('loadingdone', bump);
    };
  }, []);
  return v;
}

/**
 * Width of an SVG text once the font has loaded, so the pill/bubble around it
 * fits the words exactly instead of a guess per character.
 */
export function useTextWidth(ref: RefObject<SVGTextElement | null>, text: string, guess: number): number {
  const [w, setW] = useState(guess);
  const fontsV = useFontsVersion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      const len = el.getBBox().width; // widest line when the text has several <tspan>s
      if (len > 0) setW(len);
    } catch {
      /* not rendered yet */
    }
  }, [text, fontsV]);
  return text ? w : 0;
}

let canvas: HTMLCanvasElement | null = null;

/** Resolves a CSS custom property such as `--font-hand` to its font-family list. */
export function cssFontFamily(variable: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return v || fallback;
}

export interface TextBlock {
  lines: string[];
  /** Widest line, in px (advance width and ink, whichever is wider). */
  width: number;
  /** Ink above the first baseline. */
  ascent: number;
  /** Ink below the last baseline, measured from the first baseline. */
  bottom: number;
}

/**
 * Wraps `text` into lines no wider than `maxWidth` using the real font
 * (canvas measurement), and reports the ink box of the result, so a bubble can
 * be drawn exactly around it. Never drops words.
 */
export function layoutText(text: string, font: string, maxWidth: number, lineHeight: number, rtl: boolean): TextBlock {
  canvas ??= typeof document !== 'undefined' ? document.createElement('canvas') : null;
  const ctx = canvas?.getContext('2d');
  const words = text.trim().split(/\s+/);
  const measure = (s: string) => {
    if (!ctx) return { w: s.length * 8, asc: 12, desc: 5 };
    const m = ctx.measureText(s);
    const ink = (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0);
    return { w: Math.max(m.width, ink), asc: m.actualBoundingBoxAscent || 12, desc: m.actualBoundingBoxDescent || 5 };
  };
  if (ctx) {
    ctx.font = font;
    ctx.direction = rtl ? 'rtl' : 'ltr';
  }
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && measure(next).w > maxWidth) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  let width = 0;
  let ascent = 0;
  let descent = 0;
  for (const l of lines) {
    const m = measure(l);
    width = Math.max(width, m.w);
    ascent = Math.max(ascent, m.asc);
    descent = Math.max(descent, m.desc);
  }
  return { lines, width, ascent, bottom: (lines.length - 1) * lineHeight + descent };
}
