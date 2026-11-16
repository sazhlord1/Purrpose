import type { BlogBlock } from '@purrpose/shared';
import { API_BASE_URL, ApiError, ensureSession, getToken } from './api.js';

/** Admin tools for the website (purrpose.ir) and the blog (blog.purrpose.ir). */

export interface MediaRef {
  id: string;
  type: string;
  url: string;
}

export interface DeliveryRow {
  id: string;
  title: string;
  shelter: string;
  summary: string;
  caption: string;
  deliveredAt: string;
  published: boolean;
  media: MediaRef[];
}

export interface ContactRow {
  id: string;
  name: string;
  email: string;
  kind: 'shelter' | 'user' | 'other';
  message: string;
  createdAt: string;
  handledAt: string | null;
}

export interface BlogListRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  lang: 'fa' | 'en';
  coverMediaId: string | null;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

export interface BlogPostFull extends BlogListRow {
  content: BlogBlock[];
  seoTitle: string;
  seoDescription: string;
}

export const BLOG_URL = 'https://blog.purrpose.ir';
export const mediaUrl = (id: string) => `${API_BASE_URL}/api/v1/public/media/${id}`;

/** Big photos are shrunk on the phone first (faster upload, lighter pages). */
async function shrinkImage(file: File, maxSide = 1800): Promise<Blob> {
  if (file.type === 'image/gif' || typeof createImageBitmap !== 'function') return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')?.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const toBlob = (type: string, q: number) => new Promise<Blob | null>(r => canvas.toBlob(r, type, q));
    let out = await toBlob('image/webp', 0.84);
    if (!out || out.type !== 'image/webp') out = await toBlob('image/jpeg', 0.86);
    return out && out.size < file.size ? out : file;
  } catch {
    return file;
  }
}

/** Uploads a picture or video; resolves with its id. */
export async function uploadMedia(file: File, purpose: 'delivery' | 'blog'): Promise<MediaRef> {
  const body = file.type.startsWith('image/') ? await shrinkImage(file) : file;
  const type = body.type || file.type;
  const token = getToken() ?? (await ensureSession());
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/media?purpose=${purpose}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': type },
    body,
  });
  const json = (await res.json().catch(() => null)) as { id?: string; type?: string; error?: { code?: string; message?: string } } | null;
  if (!res.ok || !json?.id) {
    if (res.status === 413) throw new ApiError(413, 'INVALID_INPUT', 'That file is too big.');
    if (res.status === 415) throw new ApiError(415, 'INVALID_INPUT', 'Send a picture (JPG, PNG, WebP, GIF) or a video (MP4, WebM, MOV).');
    throw new ApiError(res.status, json?.error?.code ?? 'INTERNAL', json?.error?.message ?? 'Upload failed.');
  }
  return { id: json.id, type: json.type ?? type, url: mediaUrl(json.id) };
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ZWNJ = '\u200c';

/**
 * Tidies Persian text the way a careful editor would: Persian ی/ک, half-spaces after
 * می/نمی and before ها/تر/ترین, Persian comma and question mark, Persian digits,
 * no space before punctuation. Links and English words are left alone.
 */
export function tidyPersian(text: string): string {
  // Leave links [label](url) untouched (only the label is tidied).
  return text
    .split(/(\]\([^)]*\))/)
    .map((part, i) => (i % 2 === 1 ? part : tidyChunk(part)))
    .join('');
}

function tidyChunk(s: string): string {
  const fa = '؀-ۿ';
  return (
    s
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/ى/g, 'ی')
      // نمی / می + space → half-space
      .replace(new RegExp(`(^|[\\s(«])(ن?می)[ ]+(?=[${fa}])`, 'g'), `$1$2${ZWNJ}`)
      // ها / های / هایی / تر / ترین after a word
      .replace(new RegExp(`([${fa}])[ ]+(ها|های|هایی|هایم|هایت|هایش|هایمان|هایتان|هایشان|تر|ترین|ترها)(?=$|[^${fa}])`, 'g'), `$1${ZWNJ}$2`)
      // Persian punctuation next to Persian letters
      .replace(new RegExp(`([${fa}])\\s*,`, 'g'), '$1،')
      .replace(new RegExp(`([${fa}])\\s*;`, 'g'), '$1؛')
      .replace(new RegExp(`([${fa}])\\s*\\?`, 'g'), '$1؟')
      // no space before punctuation, one after
      .replace(/[ ]+([،؛؟!.:»)])/g, '$1')
      .replace(/([«(])[ ]+/g, '$1')
      // digits that sit among Persian words (not inside English words or numbers like v2)
      .replace(/(?<![A-Za-z0-9_\-/.])\d+(?:[.,]\d+)?(?![A-Za-z_\-/])/g, n => n.replace(/\d/g, d => PERSIAN_DIGITS[Number(d)]!).replace('.', '٫'))
      .replace(/[ \t]{2,}/g, ' ')
      .replace(new RegExp(`${ZWNJ}{2,}`, 'g'), ZWNJ)
  );
}

/** Words in the post (for the counter next to the editor). */
export function wordCount(text: string): number {
  return text.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}
