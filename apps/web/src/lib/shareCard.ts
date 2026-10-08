/**
 * Builds a 1080×1350 PNG "receipt" of a finished pact (the cat scene + result)
 * and hands it to the native share sheet, or downloads it where sharing files
 * isn't supported.
 */
import { getLocale, t } from '../i18n/index.js';

const W = 1080;
const H = 1350;
const INK = '#26201D';
const PAPER = '#FAF6EE';

export interface ShareCardInput {
  sceneSvg: SVGSVGElement | null;
  title: string;
  outcome: 'success' | 'failure';
  amountLabel: string; // e.g. "5 Cat Meals"
  catName: string;
}

function svgToImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', '760');
  clone.setAttribute('height', '960');
  clone.removeAttribute('style');
  // Freeze animations: the snapshot shows the resting pose.
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = '*{animation:none!important;transition:none!important}';
  clone.insertBefore(style, clone.firstChild);
  const xml = new XMLSerializer().serializeToString(clone);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

export async function renderShareCard(input: ShareCardInput, includeScene = true): Promise<Blob> {
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const fa = getLocale() === 'fa';
  if (fa) ctx.direction = 'rtl';
  // Persian is all Anjoman; what English writes by hand uses its heaviest weight.
  const hand = fa ? 'Anjoman, Inter, system-ui, sans-serif' : '"Gochi Hand", "Comic Sans MS", cursive';
  const heavy = fa ? '900 ' : '';
  const body = fa ? 'Anjoman, Inter, system-ui, sans-serif' : 'Inter, system-ui, sans-serif';
  // Canvas only draws fonts that are already loaded; make sure the Persian ones are.
  if (fa) {
    await Promise.all([document.fonts?.load('900 76px Anjoman'), document.fonts?.load('600 38px Anjoman')]).catch(() => undefined);
  }

  // Headline
  const won = input.outcome === 'success';
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = `${heavy}76px ${hand}`;
  ctx.fillText(won ? t('I did it.') : t('{name} won.', { name: input.catName }), W / 2, 110);

  ctx.font = `600 38px ${body}`;
  wrap(ctx, t('“{title}”', { title: input.title }), W - 160).forEach((l, i) => ctx.fillText(l, W / 2, 175 + i * 46));

  // Scene
  if (input.sceneSvg && includeScene) {
    try {
      const img = await svgToImage(input.sceneSvg);
      const sw = 700;
      const sh = (sw * 480) / 380;
      const x = (W - sw) / 2;
      const y = 250;
      ctx.save();
      ctx.fillStyle = INK;
      ctx.fillRect(x + 12, y + 12, sw, sh); // hard offset shadow, like the app's cards
      ctx.drawImage(img, x, y, sw, sh);
      ctx.lineWidth = 6;
      ctx.strokeStyle = INK;
      ctx.strokeRect(x, y, sw, sh);
      ctx.restore();
    } catch {
      // A scene that can't be rasterised just leaves the card text-only.
    }
  }

  // Result line + stamp
  ctx.fillStyle = INK;
  ctx.font = `600 36px ${body}`;
  ctx.fillText(
    won ? t('My {amount} are safe.', { amount: input.amountLabel }) : t('My {amount} will feed a cat.', { amount: input.amountLabel }),
    W / 2,
    H - 150,
  );

  ctx.save();
  ctx.translate(W - 170, H - 250);
  ctx.rotate(-0.14);
  ctx.strokeStyle = won ? INK : '#B4443C';
  ctx.fillStyle = won ? INK : '#B4443C';
  ctx.lineWidth = 7;
  ctx.strokeRect(-110, -44, 220, 88);
  const stamp = won ? t('KEPT') : t('FED');
  // Shrink the stamp word until it fits its box (Persian words run longer).
  let stampSize = 64;
  ctx.font = `${heavy}${stampSize}px ${hand}`;
  while (ctx.measureText(stamp).width > 196 && stampSize > 32) {
    stampSize -= 4;
    ctx.font = `${heavy}${stampSize}px ${hand}`;
  }
  ctx.fillText(stamp, 0, 22);
  ctx.restore();

  ctx.font = `${heavy}34px ${hand}`;
  ctx.fillStyle = '#6B5F57';
  ctx.fillText(window.location.host ? `${t('purrpose')} · ${window.location.host}` : t('purrpose'), W / 2, H - 70);

  // toBlob throws synchronously if some browser considers the SVG snapshot "tainted".
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not render image'))), 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

export async function shareResult(input: ShareCardInput): Promise<'shared' | 'downloaded'> {
  const blob = await renderShareCard(input).catch(() => renderShareCard(input, false));
  const file = new File([blob], 'purrpose.png', { type: 'image/png' });
  const text =
    input.outcome === 'success'
      ? t('I beat {name} and finished “{title}” 🐾', { name: input.catName, title: input.title })
      : t('{name} won this round — my stake feeds a cat 🐾', { name: input.catName });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return 'shared';
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return 'shared';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'purrpose.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
