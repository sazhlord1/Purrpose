import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BAZAAR_PAGE, latestIrApk, resetApkCache, serveApk } from '../src/apk.js';

const RELEASES = [
  { tag_name: 'android-v0.2', draft: false, prerelease: false, assets: [{ name: 'purrpose-0.2.apk', browser_download_url: 'https://gh/global.apk' }] },
  { tag_name: 'android-ir-v1.1-b9', draft: true, prerelease: false, assets: [{ name: 'purrpose-1.1.apk', browser_download_url: 'https://gh/draft.apk' }] },
  { tag_name: 'android-ir-v1.0.1-b5', draft: false, prerelease: false, assets: [{ name: 'purrpose-1.0.1.apk', browser_download_url: 'https://gh/ir-101.apk' }] },
  { tag_name: 'android-ir-v1.0-b3', draft: false, prerelease: false, assets: [{ name: 'purrpose-1.0.apk', browser_download_url: 'https://gh/ir-10.apk' }] },
];

function fakeFetch(opts: { apkFails?: boolean; listFails?: boolean } = {}) {
  return vi.fn(async (url: string | URL) => {
    const u = String(url);
    if (u.startsWith('https://api.github.com/')) {
      if (opts.listFails) throw new Error('offline');
      return new Response(JSON.stringify(RELEASES), { status: 200 });
    }
    if (opts.apkFails) return new Response('nope', { status: 502 });
    return new Response(new Uint8Array([80, 75, 3, 4]), { status: 200 });
  }) as unknown as typeof fetch;
}

function server(fetchImpl: typeof fetch) {
  const app = Fastify();
  app.get('/download/purrpose.apk', async (_req, reply) => serveApk(reply, false, fetchImpl));
  return app;
}

describe('direct APK download', () => {
  afterEach(() => resetApkCache());

  it('picks the newest published Iranian release', async () => {
    expect(await latestIrApk(fakeFetch())).toEqual({ tag: 'android-ir-v1.0.1-b5', name: 'purrpose-1.0.1.apk', url: 'https://gh/ir-101.apk' });
  });

  it('serves the APK from our server, as a download', async () => {
    const res = await server(fakeFetch()).inject({ url: '/download/purrpose.apk' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/vnd.android.package-archive');
    expect(res.headers['content-disposition']).toBe('attachment; filename="purrpose-1.0.1.apk"');
    expect(res.rawPayload.length).toBe(4);
  });

  it('falls back to GitHub, then to Cafe Bazaar', async () => {
    const viaGithub = await server(fakeFetch({ apkFails: true })).inject({ url: '/download/purrpose.apk' });
    expect(viaGithub.statusCode).toBe(302);
    expect(viaGithub.headers.location).toBe('https://gh/ir-101.apk');
    resetApkCache();
    const viaBazaar = await server(fakeFetch({ listFails: true })).inject({ url: '/download/purrpose.apk' });
    expect(viaBazaar.headers.location).toBe(BAZAAR_PAGE);
  });
});
