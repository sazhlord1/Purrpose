import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const WEB = 'http://localhost:4173';
const API = 'http://127.0.0.1:3000/api/v1';

function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try { const res = await fetch(url); if (res.ok) return resolve(); } catch {}
      if (Date.now() > deadline) return reject(new Error('no server'));
      setTimeout(tick, 400);
    };
    tick();
  });
}

function assert(cond, label) {
  if (!cond) throw new Error(`ASSERT FAILED: ${label}`);
  console.log(`ok: ${label}`);
}

async function tabTo(page, matcher, label) {
  const norm = s => (s || '').replace(/^\W+|\W+$/g, '').toLowerCase();
  await page.evaluate(() => document.activeElement?.blur?.());
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.getAttribute('aria-label') || el?.textContent || '';
    });
    if (norm(focused) === norm(matcher)) {
      assert(true, `Tab order: "${matcher}" reached in ${i + 1} Tab(s)`);
      await page.keyboard.press('Enter');
      return;
    }
  }
  throw new Error(`ASSERT FAILED: could not Tab to "${matcher}" (${label})`);
}

const api = spawn('node', ['dist/index.js'], { cwd: path.join(root, 'apps', 'server'), stdio: 'ignore' });
const web = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { cwd: path.join(root, 'apps', 'web'), shell: true, stdio: 'ignore' });

try {
  await waitForServer(`${API}/healthz`);
  await waitForServer(`${WEB}/`);
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 460, height: 1000 } });
  await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
  const token = await page.evaluate(() => localStorage.getItem('purrpose.session'));
  await fetch(`${API}/commitments`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Keyboard journey',
      deadlineISO: new Date(Date.now() + 20 * 86400000).toISOString(),
      catId: 'orange', consequenceType: 'MEALS', consequenceAmount: 2,
    }),
  });
  await page.evaluate(() => localStorage.setItem('purrpose.onboarded', '1'));
  await page.reload({ waitUntil: 'networkidle' });

  await tabTo(page, 'New Commitment', '+ New Commitment');
  await page.waitForURL('**/new', { timeout: 5000 });
  assert(true, 'reached create screen via keyboard');

  await page.getByPlaceholder('Finish YouTube video').fill('Keyboard-made commitment');
  await tabTo(page, 'Tomorrow', 'Tomorrow');
  await tabTo(page, 'Seal the Pact', 'Seal the Pact');
  await tabTo(page, 'Yes, I promise!', 'Yes, I promise!');
  await page.waitForURL('**/commitment/**', { timeout: 10000 });
  assert(true, 'commitment created entirely via keyboard');

  await tabTo(page, 'I DID IT', 'I DID IT');
  await tabTo(page, 'Yes, I did', 'Yes, I did');
  await page.getByText('You did it.').waitFor({ timeout: 10000 });
  assert(true, 'completed via keyboard only');

  await page.screenshot({ path: path.join(root, 'docs', 'e2e', 'keyboard-journey.png'), fullPage: true });
  await browser.close();
  console.log('\nKEYBOARD-ONLY JOURNEY PASS');
} finally {
  api.kill(); web.kill();
}
