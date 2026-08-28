import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = 'http://localhost:4173';
const API = 'http://127.0.0.1:3000/api/v1';
const OUT = path.join(root, 'docs', 'e2e');
const ONBOARDING_LIMIT_MS = 30_000;

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

function assert(cond, label) {
  if (!cond) throw new Error(`ASSERT FAILED: ${label}`);
  console.log(`ok: ${label}`);
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
let clockOffsetMs = 0;
async function resetClock() {
  if (!clockOffsetMs) return;
  await fetch(`${API}/dev/time-travel?addMinutes=${-clockOffsetMs / 60_000}`).catch(() => {});
  clockOffsetMs = 0;
}

try {
  await waitForServer(`${API}/healthz`);
  await waitForServer(`${WEB}/`);
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'chrome' });
  const context = await browser.newContext({ viewport: { width: 460, height: 1000 } });
  await context.addInitScript(() => {
    const read = () => {
      try {
        return JSON.parse(sessionStorage.getItem('__notifs') || '[]');
      } catch {
        return [];
      }
    };
    const write = arr => sessionStorage.setItem('__notifs', JSON.stringify(arr));
    class FakeNotification {
      constructor(title, opts) {
        const arr = read();
        arr.push({ title, body: opts && opts.body, tag: opts && opts.tag });
        write(arr);
      }
      static get permission() {
        return 'granted';
      }
      static requestPermission() {
        return Promise.resolve('granted');
      }
    }
    window.Notification = FakeNotification;
  });

  const page = await context.newPage();
  page.on('pageerror', e => console.log('PAGE_ERR:', String(e).slice(0, 300)));

  const t0 = Date.now();
  await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });

  await page.getByText('Meet Purrpose.').waitFor({ timeout: 10000 });
  assert(true, 'onboarding panel 1 renders');
  await page.screenshot({ path: path.join(OUT, 'onboarding-1.png') });

  await page.keyboard.press('Enter');
  await page.getByText('If you don\u2019t\u2026').waitFor({ timeout: 5000 });
  await page.keyboard.press('Enter');
  await page.getByText('\u2026your cat wins.').waitFor({ timeout: 5000 });
  await page.keyboard.press('Enter');
  await page.getByText('Make your first commitment.').waitFor({ timeout: 5000 });
  assert(true, 'panels advance via keyboard');

  await page.getByRole('button', { name: 'Make It Official' }).click();
  await page.waitForURL('**/new', { timeout: 5000 });
  const onboardingMs = Date.now() - t0;
  assert(onboardingMs < ONBOARDING_LIMIT_MS, `onboarding \u2192 create in ${onboardingMs}ms (< ${ONBOARDING_LIMIT_MS}ms)`);

  await page.getByPlaceholder('Finish YouTube video').fill('Onboarding E2E commitment');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Tomorrow' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Review' }).click();
  await page.getByRole('button', { name: 'Make It Official' }).click();

  await page.waitForURL('**/commitment/**', { timeout: 10000 });
  await page.getByRole('button', { name: 'I DID IT' }).click();
  await page.getByRole('button', { name: 'Yes, I did' }).click();
  await page.getByText('You did it.').waitFor({ timeout: 10000 });
  assert(true, 'commitment completed via UI');

  await wait(600);
  let notifs = await page.evaluate(() => JSON.parse(sessionStorage.getItem('__notifs') || '[]'));
  assert(
    notifs.some(n => n.body === 'You did it. Your cat is disappointed.'),
    'success notification fired',
  );

  const token = await page.evaluate(() => localStorage.getItem('purrpose.session'));
  const created = await fetch(`${API}/commitments`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Doomed commitment',
      deadlineISO: new Date(Date.now() + 6 * 60_000).toISOString(),
      catId: 'black',
      consequenceType: 'MEALS',
      consequenceAmount: 4,
    }),
  });
  assert(created.status === 201, 'second commitment created (6-minute deadline)');
  const doomedId = (await created.json()).commitment.id;

  const travel = await fetch(`${API}/dev/time-travel?addMinutes=10`);
  clockOffsetMs = (await travel.json()).offsetMs ?? 0;

  await page.goto(`${WEB}/commitment/${doomedId}`, { waitUntil: 'networkidle' });
  await page.getByText('The cat won.').waitFor({ timeout: 15000 });
  assert(true, 'settle-on-read reveals failure on detail');

  await wait(600);
  notifs = await page.evaluate(() => JSON.parse(sessionStorage.getItem('__notifs') || '[]'));
  assert(
    notifs.some(n => n.body === 'You failed. Your cat is eating.'),
    'failure notification fired',
  );

  await page.screenshot({ path: path.join(OUT, 'onboarding-final.png'), fullPage: true });

  await browser.close();
  console.log('\nONBOARDING + NOTIFICATIONS E2E PASS');
} finally {
  await resetClock();
  api.kill();
  web.kill();
}
