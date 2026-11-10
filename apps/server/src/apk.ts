/**
 * Direct download of the Iranian Android app: purrpose.ir/download/purrpose.apk.
 *
 * The APK is built by the "Android build" workflow and attached to a GitHub Release
 * tagged android-ir-v<version>-b<build>. This serves the newest one from our own server
 * (inside Iran, so it downloads fast and without GitHub), keeping it in memory. A new
 * release shows up within ten minutes, with no change here. If GitHub can't be reached,
 * the visitor is sent to the app's Cafe Bazaar page instead.
 */
import type { FastifyReply } from 'fastify';

export const APK_PATH = '/download/purrpose.apk';
export const BAZAAR_PAGE = 'https://cafebazaar.ir/app/space.purrpose.app';
const RELEASES = 'https://api.github.com/repos/sazhlord1/Purrpose/releases?per_page=20';
const CHECK_EVERY_MS = 10 * 60_000;

type FetchLike = typeof fetch;
interface Release {
  tag: string;
  name: string;
  url: string;
}
let latest: { release: Release | null; at: number } | null = null;
let file: { tag: string; name: string; bytes: Buffer } | null = null;

/** Newest published IR release with an .apk on it (cached for ten minutes). */
export async function latestIrApk(fetchImpl: FetchLike = fetch, now = Date.now()): Promise<Release | null> {
  if (latest && now - latest.at < CHECK_EVERY_MS) return latest.release;
  try {
    const res = await fetchImpl(RELEASES, {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'purrpose-server' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = (await res.json()) as Array<{
      tag_name: string;
      draft: boolean;
      prerelease: boolean;
      assets: Array<{ name: string; browser_download_url: string }>;
    }>;
    let found: Release | null = null;
    for (const r of list) {
      if (r.draft || r.prerelease || !r.tag_name.startsWith('android-ir-')) continue;
      const apk = r.assets.find(a => a.name.endsWith('.apk'));
      if (apk) {
        found = { tag: r.tag_name, name: apk.name, url: apk.browser_download_url };
        break;
      }
    }
    latest = { release: found, at: now };
    return found;
  } catch (err) {
    console.warn('[apk] could not list releases:', err instanceof Error ? err.message : err);
    // Keep serving the last known one; try GitHub again in a minute.
    if (latest) latest.at = now - CHECK_EVERY_MS + 60_000;
    return latest?.release ?? null;
  }
}

export function resetApkCache(): void {
  latest = null;
  file = null;
}

export async function serveApk(reply: FastifyReply, head: boolean, fetchImpl: FetchLike = fetch): Promise<void> {
  const release = await latestIrApk(fetchImpl);
  if (!release) {
    await reply.redirect(BAZAAR_PAGE, 302);
    return;
  }
  if (file?.tag !== release.tag) {
    try {
      const res = await fetchImpl(release.url, { redirect: 'follow', signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      file = { tag: release.tag, name: release.name, bytes: Buffer.from(await res.arrayBuffer()) };
    } catch (err) {
      console.warn('[apk] could not fetch the APK:', err instanceof Error ? err.message : err);
      // An older copy beats none; with none, let GitHub serve it.
      if (!file) {
        await reply.redirect(release.url, 302);
        return;
      }
    }
  }
  const apk = file;
  if (!apk) {
    await reply.redirect(BAZAAR_PAGE, 302);
    return;
  }
  reply.header('Content-Type', 'application/vnd.android.package-archive');
  reply.header('Content-Disposition', `attachment; filename="${apk.name}"`);
  reply.header('Cache-Control', 'public, max-age=600');
  if (head) {
    reply.header('Content-Length', String(apk.bytes.length));
    await reply.code(200).send();
    return;
  }
  await reply.code(200).send(apk.bytes);
}
