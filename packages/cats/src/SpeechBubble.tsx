import { useMemo } from 'react';
import { getLocale } from '@purrpose/shared';
import { cssFontFamily, layoutText, useFontsVersion } from './textFit.js';

/**
 * In a right-to-left line, ASCII faces like ":(" or ">-<" get flipped by the bidi
 * algorithm (brackets mirror, order reverses). Wrapping each one in a left-to-right
 * isolate (U+2066 … U+2069) keeps it exactly as typed.
 */
export function isolateEmoticons(text: string): string {
  return text.replace(/[:;=^<>()\-_~*xXoO0-9]{2,}/g, m =>
    /[:;=^<>()]/.test(m) ? `⁦${m}⁩` : m,
  );
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BubbleLayout {
  lines: string[];
  rtl: boolean;
  size: number;
  weight: number;
  lineH: number;
  /** Bubble box in its own units (before `s`). */
  w: number;
  h: number;
  baseline: number;
  /** Where the box's top-left lands in the scene, and its scale. */
  left: number;
  top: number;
  s: number;
  /** Tail tip, in the bubble's own units. */
  tailX: number;
  tailLen: number;
  /** The box in scene units (for keeping other things out of its way). */
  box: Rect;
}

const PAD_X = 16;
const TAIL = 10;
const MARGIN = 8;

export function overlaps(a: Rect, b: Rect, gap = 4): boolean {
  return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
}

/**
 * Lays a speech bubble out inside the scene: the text is wrapped and balanced, the
 * box is kept inside the scene's edges, it steps around `avoid` (the stage badge)
 * when there is room to, and when there is little room above the head the lines
 * get wider instead of the box running off the top.
 */
export function useBubbleLayout(
  raw: string | null,
  anchor: { x: number; tailY: number; s: number },
  scene: { w: number; h: number },
  avoid?: Rect,
): BubbleLayout | null {
  const fontsV = useFontsVersion();
  const rtl = getLocale() === 'fa';
  return useMemo(() => {
    if (!raw) return null;
    const text = rtl ? isolateEmoticons(raw) : raw;
    const { x: ax, tailY, s } = anchor;
    const weight = rtl ? 900 : 500;
    const family = cssFontFamily('--font-hand', rtl ? 'Anjoman, sans-serif' : "'Gochi Hand', cursive");
    const padY = rtl ? 10 : 9;
    const padTop = padY + (rtl ? 3 : 0); // Persian marks sit a hair above the measured ink
    const maxText = (scene.w - 2 * MARGIN) / s - 2 * PAD_X;
    const roomH = (tailY - MARGIN) / s - TAIL;

    const fit = (size: number) => {
      const lineH = Math.round(size * (rtl ? 1.66 : 1.33));
      const font = `${weight} ${size}px ${family}`;
      const heightOf = (b: ReturnType<typeof layoutText>) => Math.ceil(b.ascent + b.bottom) + padTop + padY;
      const widths = [200, 250, 290, maxText].filter(v => v <= maxText);
      let b = layoutText(text, font, widths[0] ?? maxText, lineH, rtl);
      for (const mw of widths) {
        b = layoutText(text, font, mw, lineH, rtl);
        if (b.lines.length <= 3 && heightOf(b) <= roomH) break;
      }
      // Balance the rows: the narrowest width that still needs the same number of lines.
      for (let mw = b.width - 6; b.lines.length > 1 && mw > 60; mw -= 6) {
        const tighter = layoutText(text, font, mw, lineH, rtl);
        if (tighter.lines.length !== b.lines.length) break;
        b = tighter;
      }
      return { b, size, lineH, h: heightOf(b) };
    };
    let f = fit(15);
    if (f.h > roomH) f = fit(13);

    const w = Math.max(90, Math.ceil(f.b.width) + PAD_X * 2);
    const h = f.h;
    const sw = w * s;
    const sh = h * s;
    const clampX = (x: number) => Math.min(Math.max(x, MARGIN), scene.w - MARGIN - sw);
    let left = clampX(ax - sw / 2);
    let top = tailY - (h + TAIL) * s;
    if (top < MARGIN) top = MARGIN;
    // Step around the badge sideways if that still keeps the tail over the head.
    if (avoid && overlaps({ x: left, y: top, w: sw, h: sh }, avoid)) {
      const shifted = clampX(avoid.x + avoid.w + 6);
      if (shifted <= ax - 22 * s && !overlaps({ x: shifted, y: top, w: sw, h: sh }, avoid)) left = shifted;
    }
    const tailX = Math.min(Math.max((ax - left) / s, 18), w - 18);
    const tailLen = Math.max(4, (tailY - top) / s - h);
    return {
      lines: f.b.lines,
      rtl,
      size: f.size,
      weight,
      lineH: f.lineH,
      w,
      h,
      baseline: padTop + f.b.ascent,
      left,
      top,
      s,
      tailX,
      tailLen,
      box: { x: left, y: top, w: sw, h: sh + tailLen * s },
    };
  }, [raw, anchor.x, anchor.tailY, anchor.s, scene.w, scene.h, avoid?.x, avoid?.y, avoid?.w, avoid?.h, fontsV, rtl]);
}

export function SpeechBubble({ layout: L }: { layout: BubbleLayout }) {
  const { w, h, tailX, tailLen } = L;
  return (
    <g transform={`translate(${L.left} ${L.top}) scale(${L.s})`} pointerEvents="none" data-part="speech-bubble">
      {/* Inner <g> carries the pop-in CSS animation (a CSS transform would override the position). */}
      <g className="lc-bubble">
        <rect x={0} y={0} rx={14} ry={16} width={w} height={h} fill="#FFFDF8" stroke="#2B231F" strokeWidth={2.4} />
        <path
          d={`M${tailX - 6} ${h - 1} L${tailX} ${h + tailLen} L${tailX + 8} ${h - 1} Z`}
          fill="#FFFDF8"
          stroke="#2B231F"
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
        <path d={`M${tailX - 8} ${h - 3} h18 v3 h-18 z`} fill="#FFFDF8" stroke="none" />
        {/* One <text> per line: with several <tspan>s in one right-to-left <text>, some
            browsers (Android WebView) run the bidi reordering across the lines and swap
            letters between them ("هستم" ended up split as "ه" + "ستم"). */}
        {L.lines.map((l, i) => (
          <text
            key={i}
            x={w / 2}
            y={L.baseline + i * L.lineH}
            textAnchor="middle"
            fontSize={L.size}
            fontWeight={L.weight}
            fill="#2B231F"
            direction={L.rtl ? 'rtl' : undefined}
            unicodeBidi={L.rtl ? 'isolate' : undefined}
            style={{ fontFamily: 'var(--font-hand)', letterSpacing: L.rtl ? 0 : '0.2px' }}
          >
            {l}
          </text>
        ))}
      </g>
    </g>
  );
}
