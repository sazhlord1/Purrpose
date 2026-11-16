import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { type BlogBlock, blogBlockSchema, escapeHtml, readingMinutes, renderBlock } from '@purrpose/shared';
import { sendMedia } from './services/site.js';
import { webReplies } from './web.js';

/**
 * blog.purrpose.ir — server-rendered pages (no JavaScript), so search engines read
 * every post as plain HTML. Posts are written in the app's admin panel.
 */

export const BLOG_CSP =
  "default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; " +
  "media-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'";

const PER_PAGE = 12;
const ASSETS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'blog-assets');
const RESERVED = new Set(['tag', 'media', 'fonts', 'feed.xml', 'rss.xml', 'sitemap.xml', 'robots.txt', 'favicon.ico', 'icon.png']);

const e = escapeHtml;
const faDate = (d: Date) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Tehran' }).format(d);
const faNum = (n: number) => n.toLocaleString('fa-IR');

interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  lang: string;
  coverMediaId: string | null;
  content: unknown;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  publishedAt: Date | null;
  updatedAt: Date;
}

function blocksOf(content: unknown): BlogBlock[] {
  if (!Array.isArray(content)) return [];
  return content.flatMap(b => {
    const r = blogBlockSchema.safeParse(b);
    return r.success ? [r.data] : [];
  });
}

export function makeBlogHandler(prisma: () => PrismaClient, opts: { hosts: string[]; fontsDir?: string; siteUrl?: string }) {
  const hosts = new Set(opts.hosts.map(h => h.trim().toLowerCase()).filter(Boolean));
  const primary = opts.hosts[0]?.trim().toLowerCase() || 'blog.purrpose.ir';
  const base = `https://${primary}`;
  const site = opts.siteUrl ?? 'https://purrpose.ir';
  const app = site.replace('://', '://app.');
  const media = (id: string) => `/media/${id}`;

  const css = `
@font-face{font-family:Anjoman;src:url(/fonts/Anjoman-Light.woff2) format("woff2");font-weight:300;font-display:swap}
@font-face{font-family:Anjoman;src:url(/fonts/Anjoman-Regular.woff2) format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:Anjoman;src:url(/fonts/Anjoman-Medium.woff2) format("woff2");font-weight:500;font-display:swap}
@font-face{font-family:Anjoman;src:url(/fonts/Anjoman-SemiBold.woff2) format("woff2");font-weight:600;font-display:swap}
@font-face{font-family:Anjoman;src:url(/fonts/Anjoman-Bold.woff2) format("woff2");font-weight:700;font-display:swap}
@font-face{font-family:Anjoman;src:url(/fonts/Anjoman-Black.woff2) format("woff2");font-weight:900;font-display:swap}
@font-face{font-family:Lora;src:url(/fonts/Lora-Variable.woff) format("woff");font-weight:400 700;font-display:swap}
@font-face{font-family:Lora;src:url(/fonts/Lora-Italic-Variable.woff) format("woff");font-weight:400 700;font-style:italic;font-display:swap}
:root{--paper:#fbf8f1;--card:#fff;--warm:#f5efe0;--ink:#2b231f;--soft:#5a4e48;--faint:#8e7f78;--orange:#e28743;--line:#e6dccb}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:400 17px/1.95 Anjoman,Tahoma,sans-serif}
body.en{font-family:Lora,Georgia,serif;line-height:1.75}
a{color:inherit}
img,video{max-width:100%;height:auto}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
.read{max-width:720px;margin:0 auto;padding:0 20px}
header.top{border-bottom:2px solid var(--ink);background:var(--paper);position:sticky;top:0;z-index:5}
header.top .wrap{display:flex;align-items:center;gap:18px;height:62px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:900;font-size:20px}
.brand img{width:34px;height:34px;border-radius:9px;border:2px solid var(--ink)}
.brand small{font-weight:500;color:var(--faint);font-size:14px}
header.top nav{margin-inline-start:auto;display:flex;gap:6px;align-items:center}
header.top nav a{text-decoration:none;font-weight:500;font-size:15px;padding:6px 12px;border-radius:10px}
header.top nav a:hover{background:rgba(226,135,67,.16)}
header.top nav a.cta{background:var(--orange);color:#fff;border:2px solid var(--ink);box-shadow:2px 2px 0 var(--ink)}
@media (max-width:620px){header.top nav a.hide-sm{display:none}}
.hero{padding:46px 0 18px}
.hero h1{font-size:clamp(30px,5vw,44px);font-weight:900;line-height:1.3;margin:0 0 6px}
.hero p{color:var(--soft);margin:0;font-size:18px}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 0;padding:0;list-style:none}
.tags a{display:inline-block;text-decoration:none;font-size:14px;border:1.5px solid var(--ink);border-radius:999px;padding:2px 12px;background:var(--card)}
.tags a.on,.tags a:hover{background:var(--ink);color:var(--paper)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;padding:22px 0 50px}
.card{display:flex;flex-direction:column;background:var(--card);border:2px solid var(--ink);border-radius:18px;overflow:hidden;text-decoration:none;box-shadow:4px 4px 0 var(--ink);transition:transform .15s,box-shadow .15s}
.card:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--ink)}
.card .ph{aspect-ratio:16/9;background:var(--warm) center/cover no-repeat;border-bottom:2px solid var(--ink)}
.card .ph.none{display:grid;place-items:center;font-size:44px}
.card .bd{padding:16px 18px 18px;display:flex;flex-direction:column;gap:6px;flex:1}
.card h2{font-size:20px;line-height:1.5;margin:0;font-weight:700}
.card p{margin:0;color:var(--soft);font-size:15px;line-height:1.85;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.meta{color:var(--faint);font-size:14px;display:flex;gap:10px;flex-wrap:wrap}
.pager{display:flex;justify-content:center;gap:12px;padding:0 0 60px}
.pager a{text-decoration:none;border:2px solid var(--ink);border-radius:12px;padding:6px 16px;background:var(--card);box-shadow:2px 2px 0 var(--ink)}
.empty{text-align:center;color:var(--soft);padding:70px 0}
article header{padding:40px 0 10px}
article h1{font-size:clamp(28px,4.6vw,42px);line-height:1.4;margin:6px 0 12px;font-weight:900}
.crumbs{font-size:14px;color:var(--faint)}
.crumbs a{text-decoration:none}
.cover{margin:18px auto 8px;max-width:960px;padding:0 20px}
.cover img{width:100%;border:2px solid var(--ink);border-radius:20px;display:block;aspect-ratio:16/9;object-fit:cover}
.body{padding:10px 0 20px;font-size:18px}
.body .b-p{margin:0 0 1.15em}
.body .b-h{line-height:1.5;margin:1.6em 0 .55em;font-weight:800}
.body h2.b-h{font-size:27px}.body h3.b-h{font-size:22px}.body h4.b-h{font-size:19px}
.body a{color:#b4602a;text-decoration-thickness:1.5px;text-underline-offset:4px}
.body mark{background:#ffe3a3;padding:0 3px;border-radius:4px}
.body .b-quote{margin:1.5em 0;padding:14px 22px;border-inline-start:5px solid var(--orange);background:var(--warm);border-radius:0 14px 14px 0;font-size:19px}
[dir=rtl] .body .b-quote,.body[dir=rtl] .b-quote{border-radius:14px 0 0 14px}
.body .b-quote p{margin:0}
.body .b-quote cite{display:block;margin-top:6px;color:var(--faint);font-style:normal;font-size:15px}
.body .b-list{margin:0 0 1.15em;padding-inline-start:1.4em}
.body .b-list li{margin:.25em 0}
.body .b-callout{margin:1.4em 0;padding:14px 18px;border:2px solid var(--ink);border-radius:14px;background:#fff7ea}
.body .b-callout-tip{background:#eef6ea}.body .b-callout-warn{background:#fdecea}
.body .b-img{margin:1.6em 0;text-align:center}
.body .b-img img{border-radius:14px;border:2px solid var(--ink);display:block;margin:0 auto}
.body .b-img-wide{margin-inline:-6%}.body .b-img-full{margin-inline:calc(50% - 50vw)}
.body .b-img-full img{border-radius:0;border-inline:0;width:100%}
.body figcaption{color:var(--faint);font-size:14px;margin-top:8px}
.body .b-hr{border:0;text-align:center;margin:2em 0}
.body .b-hr::before{content:"• • •";color:var(--faint);letter-spacing:8px}
.body .b-btn{display:inline-block;text-decoration:none;color:#fff;background:var(--orange);border:2px solid var(--ink);border-radius:14px;padding:8px 22px;box-shadow:3px 3px 0 var(--ink);font-weight:700}
.share{display:flex;gap:8px;flex-wrap:wrap;align-items:center;border-top:2px dashed var(--line);padding:18px 0;margin-top:10px;color:var(--soft);font-size:15px}
.share a{text-decoration:none;border:1.5px solid var(--ink);border-radius:999px;padding:3px 14px;background:var(--card);font-size:14px}
.promo{margin:26px 0 10px;background:var(--ink);color:var(--paper);border-radius:20px;padding:22px 24px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.promo img{width:58px;height:58px;border-radius:14px}
.promo div{flex:1;min-width:200px}
.promo b{font-size:19px;display:block}
.promo span{color:#d9cfc2;font-size:15px}
.promo a{background:var(--orange);color:#fff;text-decoration:none;border-radius:12px;padding:8px 18px;font-weight:700;border:2px solid var(--paper)}
.more{padding:10px 0 60px}
.more h2{font-size:22px;margin:0 0 4px}
footer.bot{border-top:2px solid var(--ink);padding:22px 0 34px;color:var(--faint);font-size:14px}
footer.bot .wrap{display:flex;gap:14px;flex-wrap:wrap;justify-content:space-between}
footer.bot a{text-decoration:none}
`;

  function page(p: {
    title: string;
    description: string;
    canonical: string;
    lang?: string;
    image?: string | null;
    type?: 'website' | 'article';
    jsonLd?: object[];
    body: string;
    noindex?: boolean;
  }): string {
    const lang = p.lang === 'en' ? 'en' : 'fa';
    const dir = lang === 'en' ? 'ltr' : 'rtl';
    const img = p.image ?? `${site}/og-fa.png`;
    return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(p.title)}</title>
<meta name="description" content="${e(p.description)}">
<link rel="canonical" href="${e(p.canonical)}">
${p.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta property="og:site_name" content="بلاگ پرپس">
<meta property="og:type" content="${p.type ?? 'website'}">
<meta property="og:title" content="${e(p.title)}">
<meta property="og:description" content="${e(p.description)}">
<meta property="og:url" content="${e(p.canonical)}">
<meta property="og:image" content="${e(img)}">
<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'fa_IR'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#fbf8f1">
<link rel="icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/icon.png">
<link rel="alternate" type="application/rss+xml" title="بلاگ پرپس" href="${base}/feed.xml">
<link rel="preload" href="/fonts/Anjoman-Regular.woff2" as="font" type="font/woff2" crossorigin>
<style>${css}</style>
${(p.jsonLd ?? []).map(j => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body class="${lang}">
<header class="top"><div class="wrap">
  <a class="brand" href="/"><img src="/icon.png" alt="" width="34" height="34">بلاگ پرپس</a>
  <nav aria-label="منو">
    <a href="/">همه‌ی نوشته‌ها</a>
    <a class="hide-sm" href="${site}/">سایت پرپس</a>
    <a class="cta" href="${app}/">ورود به اپ</a>
  </nav>
</div></header>
<main>${p.body}</main>
<footer class="bot"><div class="wrap">
  <span>© ${faNum(new Date().getFullYear())} پرپس · کارتو انجام بده. وگرنه یه گربه رو سیر کن.</span>
  <span><a href="${site}/">purrpose.ir</a> · <a href="${site}/deliveries">مدارک غذارسانی</a> · <a href="${site}/contact">ارتباط با ما</a> · <a href="/feed.xml">RSS</a></span>
</div></footer>
</body>
</html>`;
  }

  function card(p: PostRow): string {
    const blocks = blocksOf(p.content);
    const date = p.publishedAt ? faDate(p.publishedAt) : '';
    return `<a class="card" href="/${encodeURIComponent(p.slug)}"${p.lang === 'en' ? ' dir="ltr" lang="en"' : ''}>
  ${p.coverMediaId ? `<div class="ph" style="background-image:url('${media(p.coverMediaId)}')" role="img" aria-label="${e(p.title)}"></div>` : '<div class="ph none" aria-hidden="true">🐾</div>'}
  <div class="bd"><h2>${e(p.title)}</h2><p>${e(p.excerpt)}</p>
  <span class="meta"><span>${date}</span><span>${faNum(readingMinutes(blocks))} دقیقه مطالعه</span></span></div>
</a>`;
  }

  const published = { published: true, publishedAt: { not: null } } as const;

  async function allTags(): Promise<string[]> {
    const rows = await prisma().blogPost.findMany({ where: published, select: { tags: true } });
    const count = new Map<string, number>();
    for (const r of rows) for (const t of r.tags) count.set(t, (count.get(t) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([t]) => t);
  }

  async function listPage(tag: string | null, pageNo: number): Promise<string> {
    const where = tag ? { ...published, tags: { has: tag } } : published;
    const [posts, total, tags] = await Promise.all([
      prisma().blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (pageNo - 1) * PER_PAGE,
        take: PER_PAGE,
      }),
      prisma().blogPost.count({ where }),
      allTags(),
    ]);
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));
    const here = tag ? `/tag/${encodeURIComponent(tag)}` : '/';
    const pageUrl = (n: number) => `${here}${n > 1 ? `?page=${n}` : ''}`;
    const title = tag ? `${tag} · بلاگ پرپس` : 'بلاگ پرپس · بهره‌وری، عادت‌ها و گربه‌ها';
    const description = tag
      ? `نوشته‌های بلاگ پرپس درباره‌ی «${tag}».`
      : 'نوشته‌های پرپس درباره‌ی سر قول موندن، ترک عادت‌های بد، تمرکز، اهلی‌کردن تنبلی و کمک به گربه‌های پناهگاه.';
    const body = `<div class="wrap">
  <section class="hero"><h1>${tag ? e(tag) : 'بلاگ پرپس'}</h1><p>${e(description)}</p>
  ${tags.length ? `<ul class="tags"><li><a href="/"${tag ? '' : ' class="on"'}>همه</a></li>${tags.map(t => `<li><a href="/tag/${encodeURIComponent(t)}"${t === tag ? ' class="on"' : ''}>${e(t)}</a></li>`).join('')}</ul>` : ''}
  </section>
  ${posts.length ? `<div class="grid">${posts.map(card).join('')}</div>` : '<p class="empty">هنوز نوشته‌ای اینجا نیست. به‌زودی!</p>'}
  ${pages > 1 ? `<nav class="pager" aria-label="صفحه‌ها">${pageNo > 1 ? `<a href="${pageUrl(pageNo - 1)}" rel="prev">→ قبلی</a>` : ''}<span>${faNum(pageNo)} از ${faNum(pages)}</span>${pageNo < pages ? `<a href="${pageUrl(pageNo + 1)}" rel="next">بعدی ←</a>` : ''}</nav>` : ''}
</div>`;
    return page({
      title: pageNo > 1 ? `${title} · صفحه‌ی ${faNum(pageNo)}` : title,
      description,
      canonical: `${base}${pageUrl(pageNo)}`,
      jsonLd: [
        { '@context': 'https://schema.org', '@type': 'Blog', name: 'بلاگ پرپس', url: `${base}/`, inLanguage: 'fa', publisher: { '@type': 'Organization', name: 'پرپس', url: site, logo: `${site}/icons/icon-512.png` } },
      ],
      body,
    });
  }

  async function postPage(post: PostRow): Promise<string> {
    const blocks = blocksOf(post.content);
    const url = `${base}/${encodeURIComponent(post.slug)}`;
    const date = post.publishedAt ?? post.updatedAt;
    const html = blocks.map(b => renderBlock(b, media)).join('\n');
    const more = await prisma().blogPost.findMany({
      where: { ...published, id: { not: post.id } },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });
    const en = post.lang === 'en';
    const image = post.coverMediaId ? `${base}${media(post.coverMediaId)}` : null;
    const shareText = encodeURIComponent(post.title);
    const shareUrl = encodeURIComponent(url);
    const body = `<article${en ? ' dir="ltr" lang="en"' : ''}>
  <div class="read"><header>
    <div class="crumbs"><a href="/">بلاگ</a>${post.tags[0] ? ` / <a href="/tag/${encodeURIComponent(post.tags[0])}">${e(post.tags[0])}</a>` : ''}</div>
    <h1>${e(post.title)}</h1>
    <div class="meta"><time datetime="${date.toISOString()}">${faDate(date)}</time><span>${faNum(readingMinutes(blocks))} دقیقه مطالعه</span></div>
  </header></div>
  ${post.coverMediaId ? `<figure class="cover"><img src="${media(post.coverMediaId)}" alt="${e(post.title)}" fetchpriority="high"></figure>` : ''}
  <div class="read">
    <div class="body">${html}</div>
    ${post.tags.length ? `<ul class="tags">${post.tags.map(t => `<li><a href="/tag/${encodeURIComponent(t)}">${e(t)}</a></li>`).join('')}</ul>` : ''}
    <div class="share"><span>هم‌رسانی:</span>
      <a href="https://t.me/share/url?url=${shareUrl}&amp;text=${shareText}" rel="noopener" target="_blank">تلگرام</a>
      <a href="https://wa.me/?text=${shareText}%20${shareUrl}" rel="noopener" target="_blank">واتس‌اپ</a>
      <a href="https://x.com/intent/post?url=${shareUrl}&amp;text=${shareText}" rel="noopener" target="_blank">ایکس</a>
    </div>
    <aside class="promo" dir="rtl"><img src="/icon.png" alt="" width="58" height="58"><div><b>قول بده، انجامش بده، یه گربه رو سیر کن.</b><span>با پرپس برای کارهات قرار بذار؛ اگه انجامشون ندی، غذات برای گربه‌های پناهگاه می‌ره.</span></div><a href="${app}/">شروع رایگان</a></aside>
  </div>
</article>
${more.length ? `<section class="wrap more"><h2>نوشته‌های دیگه</h2><div class="grid">${more.map(card).join('')}</div></section>` : ''}`;
    const description = post.seoDescription || post.excerpt;
    return page({
      title: `${post.seoTitle || post.title} · بلاگ پرپس`,
      description,
      canonical: url,
      lang: post.lang,
      image,
      type: 'article',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description,
          inLanguage: en ? 'en' : 'fa',
          datePublished: date.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          mainEntityOfPage: url,
          ...(image ? { image } : {}),
          keywords: post.tags.join(', '),
          author: { '@type': 'Organization', name: 'پرپس', url: site },
          publisher: { '@type': 'Organization', name: 'پرپس', url: site, logo: { '@type': 'ImageObject', url: `${site}/icons/icon-512.png` } },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'پرپس', item: `${site}/` },
            { '@type': 'ListItem', position: 2, name: 'بلاگ', item: `${base}/` },
            { '@type': 'ListItem', position: 3, name: post.title, item: url },
          ],
        },
      ],
      body,
    });
  }

  async function sitemapXml(): Promise<string> {
    const posts = await prisma().blogPost.findMany({ where: published, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: 'desc' } });
    const urls = [
      `<url><loc>${base}/</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
      ...posts.map(p => `<url><loc>${base}/${e(encodeURIComponent(p.slug))}</loc><lastmod>${p.updatedAt.toISOString().slice(0, 10)}</lastmod></url>`),
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  }

  async function feedXml(): Promise<string> {
    const posts = await prisma().blogPost.findMany({ where: published, orderBy: { publishedAt: 'desc' }, take: 30 });
    const items = posts
      .map(
        p => `<item><title>${e(p.title)}</title><link>${base}/${e(encodeURIComponent(p.slug))}</link><guid isPermaLink="false">${p.id}</guid><pubDate>${(p.publishedAt ?? p.updatedAt).toUTCString()}</pubDate><description>${e(p.excerpt)}</description></item>`,
      )
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>بلاگ پرپس</title><link>${base}/</link><description>بهره‌وری، عادت‌ها و گربه‌ها</description><language>fa</language>\n${items}\n</channel></rss>\n`;
  }

  async function send(reply: FastifyReply, code: number, type: string, body: string | Buffer, cache = 'public, max-age=300') {
    webReplies.set(reply, BLOG_CSP);
    reply.header('Content-Type', type);
    reply.header('Cache-Control', cache);
    await reply.code(code).send(body);
  }

  async function notFound(reply: FastifyReply) {
    const body = `<div class="wrap"><p class="empty">این صفحه پیدا نشد. <a href="/">برگرد به بلاگ</a></p></div>`;
    await send(reply, 404, 'text/html; charset=utf-8', page({ title: 'پیدا نشد · بلاگ پرپس', description: '', canonical: `${base}/`, body, noindex: true }), 'no-cache');
  }

  async function staticFile(reply: FastifyReply, file: string, type: string): Promise<boolean> {
    try {
      await send(reply, 200, type, await readFile(file), 'public, max-age=604800');
      return true;
    } catch {
      return false;
    }
  }

  return {
    isBlogHost(request: FastifyRequest): boolean {
      const host = (request.hostname ?? '').toLowerCase().replace(/:\d+$/, '');
      return hosts.has(host);
    },
    async serve(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
      if (request.method !== 'GET' && request.method !== 'HEAD') return false;
      const [rawPath, query = ''] = request.url.split('?') as [string, string?];
      let pathname: string;
      try {
        pathname = decodeURIComponent(rawPath);
      } catch {
        await notFound(reply);
        return true;
      }
      const parts = pathname.split('/').filter(Boolean);
      const pageNo = Math.min(1000, Math.max(1, Number(new URLSearchParams(query).get('page')) || 1));
      try {
        if (parts.length === 0) {
          await send(reply, 200, 'text/html; charset=utf-8', await listPage(null, pageNo));
          return true;
        }
        const [first, second] = parts;
        if (first === 'robots.txt') {
          await send(reply, 200, 'text/plain; charset=utf-8', `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
          return true;
        }
        if (first === 'sitemap.xml') {
          await send(reply, 200, 'application/xml; charset=utf-8', await sitemapXml());
          return true;
        }
        if (first === 'feed.xml' || first === 'rss.xml') {
          await send(reply, 200, 'application/rss+xml; charset=utf-8', await feedXml());
          return true;
        }
        if (first === 'favicon.ico' && opts.fontsDir) {
          if (await staticFile(reply, path.join(opts.fontsDir, '..', 'favicon.ico'), 'image/x-icon')) return true;
        }
        if (first === 'icon.png' && opts.fontsDir) {
          if (await staticFile(reply, path.join(opts.fontsDir, '..', 'icons', 'icon-192.png'), 'image/png')) return true;
        }
        if (first === 'fonts' && second && /^[A-Za-z0-9-]+\.(woff2?|ttf)$/.test(second) && parts.length === 2) {
          const type = second.endsWith('.woff2') ? 'font/woff2' : second.endsWith('.woff') ? 'font/woff' : 'font/ttf';
          for (const dir of [ASSETS, opts.fontsDir]) {
            if (dir && (await staticFile(reply, path.join(dir, second), type))) return true;
          }
        }
        if (first === 'media' && second && parts.length === 2) {
          webReplies.set(reply, BLOG_CSP);
          if (await sendMedia(prisma(), second, request, reply)) return true;
        }
        if (first === 'tag' && second && parts.length === 2) {
          await send(reply, 200, 'text/html; charset=utf-8', await listPage(second, pageNo));
          return true;
        }
        if (parts.length === 1 && !RESERVED.has(first!)) {
          const post = await prisma().blogPost.findFirst({ where: { slug: first, ...published } });
          if (post) {
            await send(reply, 200, 'text/html; charset=utf-8', await postPage(post));
            return true;
          }
        }
      } catch (err) {
        request.log.error(err);
        await send(reply, 503, 'text/html; charset=utf-8', page({ title: 'بلاگ پرپس', description: '', canonical: `${base}/`, body: '<div class="wrap"><p class="empty">بلاگ الان در دسترس نیست. کمی بعد دوباره سر بزن.</p></div>', noindex: true }), 'no-cache');
        return true;
      }
      await notFound(reply);
      return true;
    },
  };
}
