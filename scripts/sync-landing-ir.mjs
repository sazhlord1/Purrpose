#!/usr/bin/env node
/**
 * Builds the Iranian landing page (apps/landing-ir) from the landing repo
 * (sazhlord1/purrposelanding). Run it again whenever the Persian landing changes:
 *
 *   node scripts/sync-landing-ir.mjs ../purrposelanding
 *
 * The Liara server shows it on purrpose.ir / www.purrpose.ir. Changes from the
 * Persian page of purrpose.space:
 *  - served at / (not /fa/), Persian only: no language switch, no hreflang;
 *  - links go to app.purrpose.ir, canonical / Open Graph to purrpose.ir;
 *  - no Google Fonts (nothing loaded from outside Iran; Persian uses Anjoman).
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.resolve(process.argv[2] ?? path.join(repoRoot, '..', 'purrposelanding'), 'public');
const out = path.join(repoRoot, 'apps', 'landing-ir');
if (!existsSync(path.join(src, 'fa', 'index.html'))) {
  console.error(`Not found: ${path.join(src, 'fa', 'index.html')} — pass the landing repo folder.`);
  process.exit(1);
}

let html = readFileSync(path.join(src, 'fa', 'index.html'), 'utf8');
const must = (re, label) => {
  if (!re.test(html)) throw new Error(`Landing changed: could not find ${label}. Update scripts/sync-landing-ir.mjs.`);
};

// Assets: the page lives at / now.
html = html.replaceAll('"../', '"/');

// Google Fonts → none.
must(/fonts\.googleapis\.com/, 'the Google Fonts links');
html = html.replace(/\n?<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>/g, '');

// One language, one address.
html = html.replace(/\n?<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g, '');
html = html.replace(/\n?<meta property="og:locale:alternate"[^>]*>/g, '');
html = html
  .replaceAll('https://app.purrpose.space', 'https://app.purrpose.ir')
  .replaceAll('app.purrpose.space', 'app.purrpose.ir')
  .replaceAll('https://purrpose.space/fa/', 'https://purrpose.ir/')
  .replaceAll('https://purrpose.space/', 'https://purrpose.ir/');
html = html.replace('"inLanguage": ["en", "fa"]', '"inLanguage": "fa"');

// Enamad (e-trust seal) site verification: meta tag on the home page + empty file at the root.
const ENAMAD_CODE = '4894141';
html = html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<meta name="enamad" content="${ENAMAD_CODE}" />`);

// Enamad trust seal in the footer: small but visible (its markup must stay as Enamad gives it).
const ENAMAD_SEAL =
  `<a class="enamad" referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=8506135&Code=HMRsXaxTeW3DlHIkUaJo7KnxhrOlZfae'>` +
  `<img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=8506135&Code=HMRsXaxTeW3DlHIkUaJo7KnxhrOlZfae' alt='' style='cursor:pointer' code='HMRsXaxTeW3DlHIkUaJo7KnxhrOlZfae'></a>`;
must(/<\/span>\s*<\/div>\s*<\/footer>/, 'the footer');
html = html.replace(/(<\/span>)(\s*<\/div>\s*<\/footer>)/, `$1\n    ${ENAMAD_SEAL}$2`);
html = html.replace(
  '</head>',
  '<style>footer .enamad{display:inline-flex;line-height:0}footer .enamad img{height:56px;width:auto;display:block}</style>\n</head>',
);

// Persian only: fix the language and hide the switch.
must(/var LANG=\(function\(\)\{/, 'the language picker script');
html = html.replace(/var LANG=\(function\(\)\{[\s\S]*?\}\)\(\);/, "var LANG='fa';");
html = html.replace('</head>', '<style>.lang{display:none!important}</style>\n</head>');

if (/purrpose\.space|googleapis|gstatic/.test(html)) {
  throw new Error('Some purrpose.space or Google links are left in the page.');
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, 'index.html'), html);

cpSync(path.join(src, 'fonts'), path.join(out, 'fonts'), { recursive: true });
// The app's own icons (Mahsham), so the site and the app look the same.
mkdirSync(path.join(out, 'icons'), { recursive: true });
for (const f of ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'])
  cpSync(path.join(repoRoot, 'apps', 'web', 'public', 'icons', f), path.join(out, 'icons', f));
mkdirSync(path.join(out, 'img'), { recursive: true });
for (const f of readdirSync(path.join(src, 'img'))) {
  if (/-en(-|\.)/.test(f)) continue; // English scene images aren't used here
  cpSync(path.join(src, 'img', f), path.join(out, 'img', f));
}
cpSync(path.join(src, 'og-fa.png'), path.join(out, 'og-fa.png'));

writeFileSync(path.join(out, `${ENAMAD_CODE}.txt`), '');
writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: https://purrpose.ir/sitemap.xml\n');
writeFileSync(
  path.join(out, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://purrpose.ir/</loc>
    <changefreq>weekly</changefreq><priority>1.0</priority>
  </url>
</urlset>
`,
);
console.log(`Iranian landing written to ${path.relative(repoRoot, out)}/`);
