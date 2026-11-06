/**
 * Search tweaks for the Iranian landing (purrpose.ir), applied by sync-landing-ir.mjs.
 * Safe to run twice on the same page.
 *
 *   node scripts/landing-ir-seo.mjs apps/landing-ir/index.html   (re-apply by hand)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const SITE = 'https://purrpose.ir/';
export const CONTACT_EMAIL = 'info@purrpose.ir';

const ORG = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE}#org`,
  name: 'پرپس',
  alternateName: 'Purrpose',
  url: SITE,
  logo: `${SITE}icons/icon-512.png`,
  email: CONTACT_EMAIL,
};

export function seoIr(html) {
  // The app's structured data: Persian name first, what it runs on here, prices in rials.
  html = html.replace(
    /<script type="application\/ld\+json">(\{"@context": ?"https:\/\/schema\.org", ?"@type": ?"SoftwareApplication"[\s\S]*?)<\/script>/,
    (_, json) => {
      const d = JSON.parse(json);
      d.name = 'پرپس';
      d.alternateName = 'Purrpose';
      d.operatingSystem = 'Android, Web';
      d.applicationCategory = 'ProductivityApplication';
      d.inLanguage = 'fa';
      d.image = `${SITE}icons/icon-512.png`;
      d.offers = { '@type': 'Offer', price: '0', priceCurrency: 'IRR' };
      d.publisher = { '@id': `${SITE}#org` };
      return `<script type="application/ld+json">${JSON.stringify(d)}</script>`;
    },
  );
  html = html.replace(
    /<script type="application\/ld\+json">(\{"@context": ?"https:\/\/schema\.org", ?"@type": ?"WebSite"[\s\S]*?)<\/script>/,
    (_, json) => {
      const d = JSON.parse(json);
      d.name = 'پرپس';
      d.alternateName = 'Purrpose';
      d.inLanguage = 'fa';
      d.publisher = { '@id': `${SITE}#org` };
      return `<script type="application/ld+json">${JSON.stringify(d)}</script>`;
    },
  );
  if (!html.includes('"@type":"Organization"')) {
    html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(ORG)}</script>\n</head>`);
  }
  return html;
}

export function sitemap(today = new Date().toISOString().slice(0, 10)) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq><priority>1.0</priority>
  </url>
</urlset>
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  writeFileSync(file, seoIr(readFileSync(file, 'utf8')));
  console.log('updated', file);
}
