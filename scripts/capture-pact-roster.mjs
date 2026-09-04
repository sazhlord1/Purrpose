import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'docs', 'concept-locations', 'pact_roster.html');
const outPath = path.join(root, 'docs', 'concept-locations', 'pact_sealed_8cats.png');

async function capture() {
  const channel = process.env.BROWSER_CHANNEL ?? 'chrome';
  const browser = await chromium.launch({ channel }).catch(async err => {
    console.log(`channel "${channel}" failed, trying msedge`);
    return chromium.launch({ channel: 'msedge' });
  });

  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`✅ Saved Pact Sealed 8-cat screenshot to: ${outPath}`);
  await browser.close();
}

capture().catch(console.error);
