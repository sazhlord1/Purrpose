import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = 'http://localhost:4173';
const API = 'http://127.0.0.1:3000/api/v1';
const AXE_PATH = path.join(root, 'node_modules', 'axe-core', 'axe.min.js');

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

try {
  await waitForServer(`${API}/healthz`);
  await waitForServer(`${WEB}/`);

  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'chrome' });
  const context = await browser.newContext({ viewport: { width: 460, height: 1000 } });

  const page = await context.newPage();
  await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
  const token = await page.evaluate(() => localStorage.getItem('purrpose.session'));
  await fetch(`${API}/commitments`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'A11y audit commitment',
      deadlineISO: new Date(Date.now() + 20 * 86_400_000).toISOString(),
      catId: 'orange',
      consequenceType: 'MEALS',
      consequenceAmount: 5,
    }),
  });
  const list = await (await fetch(`${API}/commitments`, { headers: { authorization: `Bearer ${token}` } })).json();
  const detailId = list.commitments[0].id;

  await page.evaluate(() => localStorage.setItem('purrpose.onboarded', '1'));

  const routes = ['/', '/focus', '/pantry', '/impact', '/settings', '/new', `/commitment/${detailId}`, '/lab', '/design', '/cats'];

  let totalViolations = 0;
  for (const route of routes) {
    await page.goto(`${WEB}${route}`, { waitUntil: 'networkidle' });
    await wait(800);
    await page.addScriptTag({ path: AXE_PATH });
    const results = await page.evaluate(() =>
      window.axe.run(document, {
        resultTypes: ['violations'],
        rules: { 'region': { enabled: false } },
      }),
    );
    const violations = results.violations;
    totalViolations += violations.length;
    console.log(`\n=== ${route} ===`);
    if (violations.length === 0) {
      console.log('  clean');
    } else {
      for (const v of violations) {
        console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
        for (const node of v.nodes.slice(0, 3)) {
          console.log(`    -> ${node.target.join(' ')}`);
          const fix = node.repairText || node.any.find(a => a.repairText)?.repairText;
          if (fix) console.log(`       fix: ${fix}`);
        }
      }
    }
  }

  await browser.close();
  console.log(`\nTOTAL violating rules across routes: ${totalViolations}`);
  if (totalViolations > 0) process.exit(1);
} finally {
  api.kill();
  web.kill();
}
