import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4173;
const URL_BASE = `http://localhost:${PORT}`;
const OUT_DIR = path.join(root, 'docs', 'gallery');

function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {}
      if (Date.now() > deadline) return reject(new Error('preview server did not start'));
      setTimeout(tick, 400);
    };
    tick();
  });
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: path.join(root, 'apps', 'web'),
  shell: true,
  stdio: 'ignore',
});

try {
  await waitForServer(`${URL_BASE}/`);
  mkdirSync(OUT_DIR, { recursive: true });

  const channel = process.env.BROWSER_CHANNEL ?? 'chrome';
  const browser = await chromium.launch({ channel }).catch(async err => {
    console.log(`channel "${channel}" failed (${err.message.split('\n')[0]}), trying msedge`);
    return chromium.launch({ channel: 'msedge' });
  });

  const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
  await page.goto(`${URL_BASE}/cats`, { waitUntil: 'networkidle' });

  const cells = page.locator('[data-cat-cell]');
  await cells.first().waitFor({ timeout: 15000 });
  const count = await cells.count();
  if (count !== 40) throw new Error(`expected 40 cells, found ${count}`);

  for (let i = 0; i < count; i++) {
    const cell = cells.nth(i);
    const key = (await cell.getAttribute('data-cat-cell')).replace('-', '_');
    await cell.screenshot({ path: path.join(OUT_DIR, `${key}.png`) });
    process.stdout.write(`captured ${key}\n`);
  }

  await page.screenshot({ path: path.join(OUT_DIR, '_grid_full.png'), fullPage: true });
  console.log(`\ncaptured ${count} combos + full grid -> docs/gallery/`);
  await browser.close();
} finally {
  server.kill();
}
