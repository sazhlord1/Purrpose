import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = 'http://localhost:4173';
const API = 'http://127.0.0.1:3000/api/v1';
const OUT = path.join(root, 'docs', 'gallery');

function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {}
      if (Date.now() > deadline) return reject(new Error(`server did not start: ${url}`));
      setTimeout(tick, 400);
    };
    tick();
  });
}

const api = spawn('node', ['dist/index.js'], {
  cwd: path.join(root, 'apps', 'server'),
  stdio: 'ignore',
});
const web = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
  cwd: path.join(root, 'apps', 'web'),
  shell: true,
  stdio: 'ignore',
});

try {
  await waitForServer(`${API}/healthz`);
  await waitForServer(`${WEB}/`);
  mkdirSync(OUT, { recursive: true });

  const session = await (await fetch(`${API}/session`, { method: 'POST' })).json();
  void session;

  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'chrome' });
  const page = await browser.newPage({ viewport: { width: 460, height: 1100 } });
  page.on('pageerror', e => console.log('PAGE_ERR:', String(e).slice(0, 300)));

  await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
  const token = await page.evaluate(() => localStorage.getItem('purrpose.session'));
  if (!token) throw new Error('browser session missing');

  const deadline = new Date(Date.now() + 20 * 86_400_000).toISOString();
  for (const c of [
    { title: 'Finish the demo edit', days: 20, catId: 'orange', amount: 5 },
    { title: 'Ship the portfolio site', days: 2, catId: 'black', amount: 3 },
  ]) {
    const res = await fetch(`${API}/commitments`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        title: c.title,
        deadlineISO: new Date(Date.now() + c.days * 86_400_000).toISOString(),
        catId: c.catId,
        consequenceType: 'MEALS',
        consequenceAmount: c.amount,
      }),
    });
    if (res.status !== 201) console.log('create failed:', res.status, await res.text());
  }

  await page.reload({ waitUntil: 'networkidle' });
  const skip = page.getByRole('button', { name: 'skip' });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.locator('[data-world-cat]').first().waitFor({ timeout: 15000 });
  await wait(2500);
  await page.screenshot({ path: path.join(OUT, 'living_home.png') });
  console.log('captured living_home.png');

  await page.goto(`${WEB}/lab`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'VERY_CLOSE' }).click();
  await wait(3500);
  await page.screenshot({ path: path.join(OUT, 'living_lab_veryclose.png') });
  console.log('captured living_lab_veryclose.png');

  await page.getByRole('button', { name: '▶ FAILURE' }).click();
  await wait(4500);
  await page.screenshot({ path: path.join(OUT, 'living_lab_failure.png') });
  console.log('captured living_lab_failure.png');

  await browser.close();
} finally {
  api.kill();
  web.kill();
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}
