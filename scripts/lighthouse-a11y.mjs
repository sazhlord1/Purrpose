import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = 'http://localhost:4173';
const API = 'http://127.0.0.1:3000/api/v1';
const DEBUG_PORT = 9222;

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

  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? 'chrome',
    args: [`--remote-debugging-port=${DEBUG_PORT}`],
  });
  const context = await browser.newContext({ viewport: { width: 460, height: 1000 } });
  const warmup = await context.newPage();
  await warmup.goto(`${WEB}/`, { waitUntil: 'networkidle' });
  await warmup.evaluate(() => localStorage.setItem('purrpose.onboarded', '1'));
  await warmup.close();

  const lhModule = await import('lighthouse');
  const lighthouse = lhModule.default ?? lhModule.lighthouse;
  const result = await lighthouse(
    `${WEB}/`,
    { port: DEBUG_PORT, output: 'json', onlyCategories: ['accessibility'] },
    undefined,
  );

  const lhr = result.lhr;
  writeFileSync(path.join(root, 'docs', 'e2e', 'lighthouse.json'), result.report);

  const score = Math.round(lhr.categories.accessibility.score * 100);
  console.log(`\nLIGHTHOUSE ACCESSIBILITY SCORE: ${score}/100`);
  for (const ref of lhr.categories.accessibility.auditRefs) {
    const audit = lhr.audits[ref.id];
    if (audit && audit.score !== null && audit.score < 1) {
      console.log(`  failed: ${ref.id} — ${audit.title}`);
    }
  }

  await browser.close();
  process.exit(score >= 95 ? 0 : 1);
} finally {
  api.kill();
  web.kill();
}
