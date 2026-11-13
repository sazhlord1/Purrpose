/**
 * The rank card as a 1080×1350 PNG for Instagram & co. The art is the card's own SVG
 * (minus its words, since an SVG drawn as an image can't use the app's fonts); the words
 * are drawn on top with the canvas, from the same list and positions as the card.
 */
import { getLocale, t } from '../i18n/index.js';
import { CARD_W, rankCardTexts } from '../components/RankCard.js';
import type { Rank } from './ranks.js';

const W = 1080;
const H = 1350;
const S = W / CARD_W; // 2.7
const INK = '#26201D';

function artImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.querySelectorAll('[data-card-text], animateTransform').forEach(n => n.remove());
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(W));
  clone.setAttribute('height', String(H));
  clone.removeAttribute('class');
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = '*{animation:none!important;transition:none!important}';
  clone.insertBefore(style, clone.firstChild);
  const xml = new XMLSerializer().serializeToString(clone);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  });
}

export async function renderRankCard(svg: SVGSVGElement, rank: Rank, wins: number, catName: string): Promise<Blob> {
  const fa = getLocale() === 'fa';
  const body = fa ? 'Anjoman, Inter, system-ui, sans-serif' : 'Inter, system-ui, sans-serif';
  const title = fa ? 'Anjoman, Inter, system-ui, sans-serif' : '"Gochi Hand", "Comic Sans MS", cursive';
  if (fa) {
    await Promise.all([
      document.fonts?.load('900 100px Anjoman'),
      document.fonts?.load('700 40px Anjoman'),
      document.fonts?.load('600 40px Anjoman'),
    ]).catch(() => undefined);
  }
  await document.fonts?.ready;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(await artImage(svg), 0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.direction = fa ? 'rtl' : 'ltr';
  ctx.lineJoin = 'round';
  for (const x of rankCardTexts(rank, wins, catName)) {
    const px = x.x * S;
    const py = x.y * S;
    if (x.title) {
      let size = x.size * S;
      ctx.font = `${x.weight} ${size}px ${title}`;
      while (ctx.measureText(x.text).width > 290 * S && size > 40) {
        size -= 4;
        ctx.font = `${x.weight} ${size}px ${title}`;
      }
      // Shadow, outline, then the gradient fill: a sticker-like title.
      ctx.fillStyle = INK;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8 * S;
      ctx.strokeText(x.text, px + 3 * S, py + 4 * S);
      ctx.fillText(x.text, px + 3 * S, py + 4 * S);
      ctx.lineWidth = 7 * S;
      ctx.strokeText(x.text, px, py);
      const g = ctx.createLinearGradient(0, py - size, 0, py);
      g.addColorStop(0, rank.tier === 3 ? '#FFF4C2' : '#FAF6EE');
      g.addColorStop(1, rank.tier === 3 ? '#F4C430' : rank.light);
      ctx.fillStyle = g;
      ctx.fillText(x.text, px, py);
    } else {
      ctx.font = `${x.weight} ${x.size * S}px ${body}`;
      ctx.fillStyle = x.fill;
      ctx.fillText(x.text, px, py);
    }
  }

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not render image'))), 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

/** Share sheet where it can take files, a download elsewhere. */
export async function shareRankCard(svg: SVGSVGElement, rank: Rank, wins: number, catName: string): Promise<'shared' | 'downloaded'> {
  const blob = await renderRankCard(svg, rank, wins, catName);
  const file = new File([blob], 'purrpose-rank.png', { type: 'image/png' });
  const text = t('My Purrpose rank: {rank}', { rank: t(rank.name) });
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
  a.download = 'purrpose-rank.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}

