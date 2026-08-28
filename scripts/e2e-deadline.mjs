import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = 'http://localhost:4173';
const API = 'http://127.0.0.1:3000/api/v1';
const OUT = path.join(root, 'docs', 'e2e');

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
  stdio: 'ignore',
});
const web = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
  cwd: path.join(root, 'apps', 'web'),
  shell: true,
  stdio: 'ignore',
});

// The dev clock is shared state for the whole API process. Always restore its
// offset so later runs / other suites are not affected by the +10m jump.
async function resetClock() {
  if (!clockOffsetMs) return;
  await fetch(`${API}/dev/time-travel?addMinutes=${-clockOffsetMs / 60_000}`).catch(() => {});
  clockOffsetMs = 0;
}
let clockOffsetMs = 0;

function assert(cond, label) {
  if (!cond) throw new Error(`ASSERT FAILED: ${label}`);
  console.log(`ok: ${label}`);
}

try {
  await waitForServer(`${API}/healthz`);
  await waitForServer(`${WEB}/`);
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'chrome' });
  const page = await browser.newPage({ viewport: { width: 460, height: 1100 } });
  page.on('pageerror', e => console.log('PAGE_ERR:', String(e).slice(0, 300)));

  await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
  const token = await page.evaluate(() => localStorage.getItem('purrpose.session'));
  assert(token, 'browser session exists');

  const created = await fetch(`${API}/commitments`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Time travel test',
      deadlineISO: new Date(Date.now() + 6 * 60_000).toISOString(),
      catId: 'tuxedo',
      consequenceType: 'MEALS',
      consequenceAmount: 4,
    }),
  });
  assert(created.status === 201, 'commitment created (6-minute deadline)');
  const id = (await created.json()).commitment.id;

  await page.reload({ waitUntil: 'networkidle' });
  const skip = page.getByRole('button', { name: 'skip' });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.getByRole('link', { name: 'Time travel test' }).waitFor({ timeout: 15000 });
  assert(true, 'home shows the commitment before travel');

  const travel = await fetch(`${API}/dev/time-travel?addMinutes=10`);
  clockOffsetMs = (await travel.json()).offsetMs ?? 0;
  assert(travel.status === 200, 'server clock advanced +10 minutes (dev only)');

  await page.getByRole('link', { name: 'Time travel test' }).click();
  await page.waitForURL('**/commitment/**');
  await page.getByText('The cat won.').waitFor({ timeout: 15000 });
  assert(true, 'settle-on-read reveals "The cat won." on detail');
  assert(await page.locator('.stamp-fed').first().isVisible(), 'FED stamp shown');

  const sceneState = await page.locator('[data-scene-state]').getAttribute('data-scene-state');
  assert(sceneState === 'SATISFIED', `scene settled (${sceneState})`);

  await page.goto(`${WEB}/pantry`, { waitUntil: 'networkidle' });
  await wait(600);
  const pantryText = await page.locator('main').innerText();
  assert(/Cat Meals/.test(pantryText), 'pantry visible');
  const balanceMatch = pantryText.match(/Cat Meals\s*\n?\s*(\d+)/i);
  const balance = balanceMatch ? Number(balanceMatch[1]) : NaN;
  assert(balance === 6, `balance drained to 6 (found ${balance})`);

  await page.goto(`${WEB}/impact`, { waitUntil: 'networkidle' });
  await wait(600);
  const impactText = await page.locator('main').innerText();
  assert(/FED/.test(impactText) && /Time travel test/.test(impactText), 'impact receipt stamped FED');

  await page.goto(`${WEB}/commitment/${id}`, { waitUntil: 'networkidle' });
  await wait(800);
  await page.screenshot({ path: path.join(OUT, 'deadline-failure.png') });

  await browser.close();
  console.log('\nTIME-TRAVEL E2E PASS — failure settled once, wallet drained, receipt stamped');
} finally {
  await resetClock();
  api.kill();
  web.kill();
}
