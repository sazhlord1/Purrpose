import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB_PORT = 4174;
const WEB = `http://localhost:${WEB_PORT}`;
const API_PORT = 3000;
const LIMIT_MS = 45_000;

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

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
  env: { ...process.env, PORT: String(API_PORT), HOST: '127.0.0.1' },
  stdio: 'ignore',
});
const web = spawn('npx', ['vite', 'preview', '--port', String(WEB_PORT), '--strictPort'], {
  cwd: path.join(root, 'apps', 'web'),
  shell: true,
  stdio: 'ignore',
});

try {
  await waitForServer(`http://127.0.0.1:${API_PORT}/api/v1/healthz`);
  await waitForServer(`${WEB}/`);

  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'chrome' });
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });

  await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });

  const skip = page.getByRole('button', { name: 'skip' });
  if (await skip.isVisible().catch(() => false)) await skip.click();

  const t0 = Date.now();
  await page.getByRole('link', { name: 'New commitment' }).first().click();
  await page.waitForURL('**/new');

  await page.getByPlaceholder('Finish YouTube video').fill('E2E timed commitment');

  await page.getByRole('button', { name: 'Tomorrow' }).click();

  // Test overstake on unified Task Card
  await page.getByRole('button', { name: /Vet Care/ }).click();
  await page.getByRole('button', { name: '10', exact: true }).first().click();

  const sealBtn = page.getByRole('button', { name: /Seal the Pact/ });
  if (await sealBtn.isEnabled()) throw new Error('overstake should block Seal the Pact');
  const quip = await page.locator('[role="alert"]').textContent();
  if (!quip || quip.length < 5) throw new Error('expected overstake quip');
  console.log(`overstake quip shown: "${quip.trim()}"`);

  // Switch back to valid amount
  await page.getByRole('button', { name: /Cat Meals/ }).click();
  await page.getByRole('button', { name: '5', exact: true }).first().click();

  // Seal the pact & confirm
  await page.getByRole('button', { name: /Seal the Pact/ }).click();
  await page.getByRole('button', { name: /Yes, I promise/ }).click();

  await page.waitForURL('**/commitment/**', { timeout: 10000 });
  await page.getByRole('button', { name: 'I DID IT' }).waitFor({ timeout: 10000 });
  const elapsed = Date.now() - t0;

  mkdirSync(path.join(root, 'docs', 'e2e'), { recursive: true });
  await page.screenshot({ path: path.join(root, 'docs', 'e2e', 'create-flow.png') });

  if (elapsed > LIMIT_MS) throw new Error(`create flow took ${elapsed}ms (> ${LIMIT_MS}ms)`);
  console.log(`CREATE FLOW E2E PASS — committed in ${elapsed}ms (limit ${LIMIT_MS}ms)`);

  await browser.close();
} finally {
  api.kill();
  web.kill();
}
