import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'docs', 'concept-locations', 'master_showcase.html');
const outPath = path.join(root, 'docs', 'concept-locations', 'master_showcase.png');

async function capture() {
  const channel = process.env.BROWSER_CHANNEL ?? 'chrome';
  const browser = await chromium.launch({ channel }).catch(async err => {
    console.log(`channel "${channel}" failed, trying msedge`);
    return chromium.launch({ channel: 'msedge' });
  });

  const page = await browser.newPage({ viewport: { width: 1300, height: 1600 } });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`✅ Saved Master Showcase screenshot to: ${outPath}`);
  await browser.close();
}

capture().catch(console.error);
