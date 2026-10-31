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

/** Requests answered with a web page/file rather than the API (they get web headers). */
export const webReplies = new WeakSet<FastifyReply>();

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

export function makeWebHandler(distDir: string) {
  const root = path.resolve(distDir);
  let indexHtml: Buffer | null = null;

  return async function serveWeb(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
    if ((request.method !== 'GET' && request.method !== 'HEAD') || isApiPath(request.url)) return false;

    const file = await fileAt(root, request.url);
    webReplies.add(reply);
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

    indexHtml ??= await readFile(path.join(root, 'index.html'));
    reply.header('Content-Type', TYPES['.html']);
    reply.header('Cache-Control', 'no-cache');
    await reply.code(200).send(indexHtml);
    return true;
  };
}
