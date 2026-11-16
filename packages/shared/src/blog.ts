import { z } from 'zod';

/**
 * Blog posts (blog.purrpose.ir) are a list of blocks, not HTML: the editor can only make
 * what these blocks describe, and the server turns them into HTML with everything escaped.
 *
 * Inline text uses a small markup:
 *   **bold**   *italic*   __underline__   ~~strike~~   ==highlight==   [text](https://link)
 */

export const BLOG_ALIGNS = ['start', 'center', 'end', 'justify'] as const;
export const BLOG_DIRS = ['rtl', 'ltr'] as const;
/** anjoman = Persian (Anjoman, any weight); serif / sans = English body faces. */
export const BLOG_FONTS = ['anjoman', 'serif', 'sans'] as const;
export const BLOG_WEIGHTS = [300, 400, 500, 600, 700, 900] as const;
export const BLOG_SIZES = ['sm', 'md', 'lg', 'xl'] as const;

const text = z.string().max(20_000);
const style = {
  align: z.enum(BLOG_ALIGNS).optional(),
  dir: z.enum(BLOG_DIRS).optional(),
  font: z.enum(BLOG_FONTS).optional(),
  weight: z
    .number()
    .refine(w => (BLOG_WEIGHTS as readonly number[]).includes(w))
    .optional(),
  size: z.enum(BLOG_SIZES).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
};
const mediaId = z.string().min(5).max(40).regex(/^[a-z0-9]+$/);

export const blogBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text, ...style }),
  z.object({ type: z.literal('heading'), level: z.union([z.literal(2), z.literal(3), z.literal(4)]), text: z.string().max(300), ...style }),
  z.object({
    type: z.literal('image'),
    mediaId,
    caption: z.string().max(500).default(''),
    alt: z.string().max(300).default(''),
    width: z.enum(['normal', 'wide', 'full']).default('normal'),
  }),
  z.object({ type: z.literal('quote'), text, cite: z.string().max(200).default(''), ...style }),
  z.object({
    type: z.literal('list'),
    ordered: z.boolean().default(false),
    items: z.array(z.string().max(2000)).min(1).max(100),
    ...style,
  }),
  z.object({ type: z.literal('callout'), tone: z.enum(['info', 'tip', 'warn']).default('info'), text, ...style }),
  z.object({
    type: z.literal('button'),
    label: z.string().min(1).max(80),
    url: z
      .string()
      .max(500)
      .regex(/^(https?:\/\/[^\s]+|\/(?!\/)[^\s]*)$/, 'An http(s) link or a /path'),
    align: z.enum(BLOG_ALIGNS).optional(),
  }),
  z.object({ type: z.literal('divider') }),
]);
export type BlogBlock = z.infer<typeof blogBlockSchema>;

export const blogSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9؀-ۿ]+(?:-[a-z0-9؀-ۿ]+)*$/, 'Use letters, numbers and dashes');

export const blogPostInputSchema = z.object({
  slug: blogSlugSchema,
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(400).default(''),
  lang: z.enum(['fa', 'en']).default('fa'),
  coverMediaId: mediaId.nullable().default(null),
  content: z.array(blogBlockSchema).max(400),
  seoTitle: z.string().trim().max(120).default(''),
  seoDescription: z.string().trim().max(300).default(''),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  published: z.boolean().default(false),
});
export type BlogPostInput = z.infer<typeof blogPostInputSchema>;

/** Makes a URL slug from a title (keeps Persian letters; spaces → dashes). */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\u200c\s_]+/g, '-')
    .replace(/[^a-z0-9؀-ۿ-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Inline markup → safe HTML (the text is escaped first; only these tags can come out). */
export function renderInline(raw: string): string {
  let s = escapeHtml(raw);
  // Links: [text](https://…) — only http(s), mailto and site-relative.
  s = s.replace(/\[([^\]]{1,300})\]\(((?:https?:\/\/|mailto:|\/(?!\/))[^\s)]{0,500})\)/g, (_m, label: string, href: string) => {
    const external = /^https?:/.test(href) && !/^https:\/\/([a-z]+\.)?purrpose\.(ir|space)\b/.test(href);
    return `<a href="${href}"${external ? ' rel="noopener" target="_blank"' : ''}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+?)__/g, '<u>$1</u>');
  s = s.replace(/~~([^~]+?)~~/g, '<s>$1</s>');
  s = s.replace(/==([^=]+?)==/g, '<mark>$1</mark>');
  s = s.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
  return s.replace(/\n/g, '<br>');
}

/** Plain text of a post (for the excerpt, reading time and search). */
export function blogPlainText(blocks: BlogBlock[]): string {
  const strip = (t: string) => t.replace(/\*\*|__|~~|==|\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return blocks
    .map(b => {
      if (b.type === 'list') return b.items.map(strip).join(' ');
      if ('text' in b) return strip(b.text);
      if (b.type === 'image') return b.caption;
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

/** Minutes to read (≈ 200 words a minute, at least 1). */
export function readingMinutes(blocks: BlogBlock[]): number {
  const words = blogPlainText(blocks).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const FONT_CSS: Record<(typeof BLOG_FONTS)[number], string> = {
  anjoman: "'Anjoman', Tahoma, sans-serif",
  serif: "'Lora', Georgia, 'Times New Roman', serif",
  sans: "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};
const SIZE_REM: Record<(typeof BLOG_SIZES)[number], string> = { sm: '0.92rem', md: '1.06rem', lg: '1.25rem', xl: '1.5rem' };

/** Inline style for a block's options (all values come from fixed lists above). */
export function blockStyle(b: { align?: string; dir?: string; font?: string; weight?: number; size?: string; color?: string }): string {
  const out: string[] = [];
  if (b.align) out.push(`text-align:${b.align === 'start' ? 'start' : b.align === 'end' ? 'end' : b.align}`);
  if (b.font && b.font in FONT_CSS) out.push(`font-family:${FONT_CSS[b.font as keyof typeof FONT_CSS]}`);
  if (b.weight) out.push(`font-weight:${Number(b.weight)}`);
  if (b.size && b.size in SIZE_REM) out.push(`font-size:${SIZE_REM[b.size as keyof typeof SIZE_REM]}`);
  if (b.color && /^#[0-9a-fA-F]{6}$/.test(b.color)) out.push(`color:${b.color}`);
  return out.join(';');
}

/** One block → safe HTML. `mediaUrl` maps an uploaded picture's id to its address. */
export function renderBlock(b: BlogBlock, mediaUrl: (id: string) => string): string {
  const st = 'align' in b || 'font' in b ? blockStyle(b as Parameters<typeof blockStyle>[0]) : '';
  const attrs = (cls: string) =>
    ` class="${cls}"${st ? ` style="${st}"` : ''}${'dir' in b && b.dir ? ` dir="${b.dir}"` : ''}`;
  switch (b.type) {
    case 'paragraph':
      return `<p${attrs('b-p')}>${renderInline(b.text)}</p>`;
    case 'heading':
      return `<h${b.level}${attrs('b-h')}>${renderInline(b.text)}</h${b.level}>`;
    case 'quote':
      return `<blockquote${attrs('b-quote')}><p>${renderInline(b.text)}</p>${b.cite ? `<cite>${escapeHtml(b.cite)}</cite>` : ''}</blockquote>`;
    case 'list': {
      const tag = b.ordered ? 'ol' : 'ul';
      return `<${tag}${attrs('b-list')}>${b.items.map(i => `<li>${renderInline(i)}</li>`).join('')}</${tag}>`;
    }
    case 'callout':
      return `<div${attrs(`b-callout b-callout-${b.tone}`)}>${renderInline(b.text)}</div>`;
    case 'image':
      return `<figure class="b-img b-img-${b.width}"><img src="${escapeHtml(mediaUrl(b.mediaId))}" alt="${escapeHtml(b.alt || b.caption)}" loading="lazy" decoding="async">${
        b.caption ? `<figcaption>${renderInline(b.caption)}</figcaption>` : ''
      }</figure>`;
    case 'button':
      return `<p class="b-btn-row"${b.align ? ` style="text-align:${b.align}"` : ''}><a class="b-btn" href="${escapeHtml(b.url)}">${escapeHtml(b.label)}</a></p>`;
    case 'divider':
      return '<hr class="b-hr">';
  }
}
