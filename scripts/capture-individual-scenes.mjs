import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'docs', 'concept-locations', 'index.html');
const outDir = path.join(root, 'docs', 'concept-locations');

async function captureCards() {
  const channel = process.env.BROWSER_CHANNEL ?? 'chrome';
  const browser = await chromium.launch({ channel }).catch(async err => {
    console.log(`channel "${channel}" failed, trying msedge`);
    return chromium.launch({ channel: 'msedge' });
  });

  const page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  const cards = page.locator('.scene-card');
  const count = await cards.count();
  console.log(`Found ${count} scene cards to capture.`);

  const names = [
    '1_sidewalk_box.png',
    '2_yard_grass.png',
    '3_indoor_cushion.png',
    '4_scratcher_play.png',
    '5_couch_meal.png',
    '6_night_rain_focus.png',
    '7_pact_sealed_handshake.png'
  ];

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const savePath = path.join(outDir, names[i] || `scene_${i + 1}.png`);
    await card.screenshot({ path: savePath });
    console.log(`📸 Saved: ${savePath}`);
  }

  await browser.close();
}

captureCards().catch(console.error);
