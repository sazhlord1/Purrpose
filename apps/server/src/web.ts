import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Serves the built web app (Vite's dist folder) from this server, for the Iranian
 * edition on Liara where one app hosts both the website and the API. Files that exist
 * are sent as they are; any other GET outside /api gets index.html (client-side routes).
 */

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

/** Same rules as the global site's _headers, minus Google (the Iranian build loads nothing from abroad). */
export const WEB_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; " +
  "img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self'; worker-src 'self'; " +
  "manifest-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'";

/**
 * The landing page is a single static file with inline scripts (no build step), so it
 * needs 'unsafe-inline' for scripts. It has no sign-in and no user data.
 */
export const LANDING_CSP = WEB_CSP.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'").replace(
  "img-src 'self' data: blob:",
  // The Enamad trust seal image is served by Enamad (an Iranian site, so it still loads in an outage).
  "img-src 'self' data: blob: https://trustseal.enamad.ir",
);

/** Replies that are a web page/file rather than the API, with the CSP each one gets. */
export const webReplies = new WeakMap<FastifyReply, string>();

export function isApiPath(url: string): boolean {
  const p = url.split('?')[0] ?? '';
  return p === '/healthz' || p === '/api' || p.startsWith('/api/');
}

async function fileAt(root: string, urlPath: string): Promise<string | null> {
  let rel: string;
  try {
    rel = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  } catch {
    return null;
  }
  if (rel.includes('\0')) return null;
  const full = path.resolve(root, '.' + path.posix.normalize('/' + rel));
  if (full !== root && !full.startsWith(root + path.sep)) return null; // no escaping the folder
  try {
    const s = await stat(full);
    return s.isFile() ? full : null;
  } catch {
    return null;
  }
}

interface Site {
  root: string;
  csp: string;
  index: Buffer | null;
}

/**
 * `distDir` is the app. With a landing folder, requests for one of `landingHosts`
 * (e.g. purrpose.ir, www.purrpose.ir) get the landing page instead; every other
 * address (app.purrpose.ir, purrpose.liara.run) gets the app.
 */
export function makeWebHandler(distDir: string, landing?: { dir: string; hosts: string[] }) {
  const app: Site = { root: path.resolve(distDir), csp: WEB_CSP, index: null };
  const land: Site | null = landing ? { root: path.resolve(landing.dir), csp: LANDING_CSP, index: null } : null;
  const landingHosts = new Set((landing?.hosts ?? []).map(h => h.trim().toLowerCase()).filter(Boolean));

  return async function serveWeb(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
    if ((request.method !== 'GET' && request.method !== 'HEAD') || isApiPath(request.url)) return false;

    const host = (request.hostname ?? '').toLowerCase().replace(/:\d+$/, '');
    // One address for the landing: www.purrpose.ir → purrpose.ir (so search engines see one site).
    if (land && host.startsWith('www.') && landingHosts.has(host) && landingHosts.has(host.slice(4))) {
      reply.header('Location', `https://${host.slice(4)}${request.url}`);
      await reply.code(301).send();
      return true;
    }
    const site = land && landingHosts.has(host) ? land : app;
    // The app (pacts, witness links, account pages) is private: keep it out of search results.
    // The landing page is what should be found.
    if (site === app) reply.header('X-Robots-Tag', 'noindex, nofollow');
    const root = site.root;
    const file = await fileAt(root, request.url);
    webReplies.set(reply, site.csp);
    if (file) {
      const ext = path.extname(file).toLowerCase();
      reply.header('Content-Type', TYPES[ext] ?? 'application/octet-stream');
      // Vite puts content hashes in /assets file names, so those never change.
      const immutable = request.url.startsWith('/assets/');
      reply.header('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-cache');
      if (file.endsWith(`${path.sep}sw.js`)) reply.header('Service-Worker-Allowed', '/');
      await reply.code(200).send(await readFile(file));
      return true;
    }

    // A missing file with an extension is a real 404, not an app route.
    const last = (request.url.split('?')[0] ?? '').split('/').pop() ?? '';
    if (last.includes('.')) {
      reply.header('Content-Type', 'text/plain; charset=utf-8');
      await reply.code(404).send('Not found');
      return true;
    }

    site.index ??= await readFile(path.join(root, 'index.html'));
    reply.header('Content-Type', TYPES['.html']);
    reply.header('Cache-Control', 'no-cache');
    await reply.code(200).send(site.index);
    return true;
  };
}
