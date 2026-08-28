import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = 'http://localhost:4173';
const API = 'http://127.0.0.1:3000/api/v1';
const OUT = path.join(root, 'docs', 'e2e', 'responsive');

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

const api = spawn('node', ['dist/index.js'], { cwd: path.join(root, 'apps', 'server'), stdio: 'ignore' });
const web = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
  cwd: path.join(root, 'apps', 'web'),
  shell: true,
  stdio: 'ignore',
});

try {
  await waitForServer(`${API}/healthz`);
  await waitForServer(`${WEB}/`);
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'chrome' });

  for (const [w, h, name] of [
    [320, 700, 'mobile-sm'],
    [460, 1000, 'mobile'],
    [768, 1024, 'tablet'],
    [1280, 900, 'desktop'],
  ]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
    const token = await page.evaluate(() => localStorage.getItem('purrpose.session'));
    if (token) {
      await fetch(`${API}/commitments`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Responsive demo',
          deadlineISO: new Date(Date.now() + 20 * 86_400_000).toISOString(),
          catId: 'orange',
          consequenceType: 'MEALS',
          consequenceAmount: 5,
        }),
      });
    }
    await page.evaluate(() => localStorage.setItem('purrpose.onboarded', '1'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    const overflow = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      bodyScrollW: document.body.scrollWidth,
    }));
    const others = [];
    for (const route of ['/pantry', '/impact', '/new']) {
      await page.goto(`${WEB}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      others.push(
        await page.evaluate(r => ({
          route: r,
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
        }), route),
      );
    }
    const all = [overflow, ...others];
    const bad = all.filter(o => o.scrollW > o.innerW);

    await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `home-${name}.png`), fullPage: false });

    console.log(
      `${name} (${w}px): ${bad.length === 0 ? 'no horizontal overflow' : 'OVERFLOW: ' + JSON.stringify(bad)}`,
    );
    await context.close();
  }

  await browser.close();
  console.log('\nresponsive sweep done');
} finally {
  api.kill();
  web.kill();
}
