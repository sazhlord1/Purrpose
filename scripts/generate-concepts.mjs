import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs', 'concept-locations');
fs.mkdirSync(outDir, { recursive: true });

const SCENES = [
  {
    id: 'stage1_street_box',
    title: 'Stage 1 — The Street Alley & Box (Alley Shelter)',
    stage: 'Stage 1 (Initial / Low Progress)',
    desc: 'Cozy cardboard box nestled in a rustic cobblestone alley with brick walls and warm street lamp.',
    prompt: 'A charming storybook folk art illustration of Winston the tuxedo cat (black and white cat with striped tuxedo cap and rosy pink cheeks) sitting inside a cozy cardboard box in a quaint cobblestone alleyway. Whimsical hand-drawn ink line art with soft watercolor textures, warm paper background #FAF6EE, vintage brick wall, a small green potted sprout, and a warm street lamp glow. Clean composition, storybook picture book aesthetic.'
  },
  {
    id: 'stage2_garden_meadow',
    title: 'Stage 2 — The Sunlit Garden (Cottage Meadow)',
    stage: 'Stage 2 (Early Progress)',
    desc: 'Lush green grassy meadow with wooden picket fence, daisies, butterflies, and gentle breeze.',
    prompt: 'A whimsical storybook folk art illustration of Winston the tuxedo cat sitting happily on a patch of lush green grass in a sunlit cottage garden. Natural wooden fence posts, blooming white daisies, terracotta plant pots, a fluttering yellow butterfly, warm sunbeams, hand-drawn ink contours on warm textured cream paper, gentle watercolor wash.'
  },
  {
    id: 'stage3_cozy_livingroom',
    title: 'Stage 3 — The Cozy Living Room (Study & Hearth)',
    stage: 'Stage 3 (Midway Cushion Life)',
    desc: 'Warm interior with plush embroidered velvet cushion, wooden bookshelf, house plant, and warm lamp.',
    prompt: 'A rich and cozy folk art storybook illustration of Winston the tuxedo cat lounging comfortably on an ornate plush embroidered cushion in a warm home study. Wooden bookshelf filled with old books, a hanging monstera plant, a cozy patterned rug, glowing warm table lamp, warm off-white paper background, beautiful hand-drawn ink and gouache style.'
  },
  {
    id: 'stage4_playful_cat_tree',
    title: 'Stage 4 — The Playful Cat Castle (Toy & Climbing Haven)',
    stage: 'Stage 4 (Almost at the Deadline)',
    desc: 'Whimsical tiered cat tower with dangling feather toys, yarn balls, scratching posts, and fun perches.',
    prompt: 'A playful whimsical folk art illustration of Winston the tuxedo cat perched on a multi-tiered wooden and sisal cat tree tower. Hanging jingle feather wand toys, colorful balls of yarn, climbing ramps, little cat hammocks, celebratory excitement, hand-drawn ink line art with warm watercolor accents on cream paper.'
  },
  {
    id: 'stage5_grand_feast',
    title: 'Stage 5 — The Grand Feast Banquet (Victory Royal Feast)',
    stage: 'Stage 5 (Goal Achieved / Feast Unlocked)',
    desc: 'Grand celebratory banquet table loaded with gourmet fish, golden treats, feast bunting, and confetti.',
    prompt: 'A joyful and celebratory folk art illustration of Winston the tuxedo cat seated at a festive royal banquet feast. Beautiful golden plates stacked with gourmet fish treats and savory kibble, party bunting garlands, glowing warm candlelight, golden celebration star sparkles, happy storybook illustration in ink and watercolor.'
  },
  {
    id: 'focus_room_rainy_window',
    title: 'Focus Room — Rainy Window & Nighttime Sill',
    stage: 'Focus Mode Scene',
    desc: 'Nighttime window sill with raindrops on glass, warm glowing desk lamp, cozy window bed, and city lights.',
    prompt: 'An atmospheric cozy folk art sketch illustration of Winston the tuxedo cat sleeping peacefully on a quilted window cushion during a rainy night. Gentle raindrops trickling on the glass window pane, a glowing warm brass desk lamp casting golden light, blurred colorful city bokeh lights in the dark night sky outside, cozy mindfulness aesthetic, hand-drawn ink and gouache on warm paper.'
  },
  {
    id: 'pact_sealed_handshake',
    title: 'Pact Sealed — Handshake & Sacred Promise',
    stage: 'New Commitment Handshake',
    desc: 'Close-up of cozy human hand shaking the cat\'s paw with glowing commitment aura and pact stamp.',
    prompt: 'A heartwarming folk art storybook illustration of a cozy human hand in a blue knitted sweater clasping paws in a firm friendly handshake with Winston the tuxedo cat\'s white-gloved furry paw. Golden commitment sparkles, vintage red wax seal stamp banner reading "PACT SEALED", warm emotional connection, hand-drawn ink and textured watercolor on warm paper.'
  }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateScene(scene, retries = 5) {
  const filePath = path.join(outDir, `${scene.id}.png`);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 10000) {
    console.log(`⏩ [${scene.id}] already generated, skipping.`);
    return { ...scene, filePath: `${scene.id}.png` };
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`\n🎨 Generating [${scene.id}] - ${scene.title} (Attempt ${attempt}/${retries})...`);
    try {
      const res = await fetch('http://localhost:20128/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'vx/gemini-3.1-flash-image',
          stream: false,
          messages: [
            {
              role: 'user',
              content: scene.prompt
            }
          ]
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 429 || errText.includes('RESOURCE_EXHAUSTED')) {
          console.log(`⏳ Rate limited (429), waiting 12 seconds before retry...`);
          await delay(12000);
          continue;
        }
        throw new Error(`Failed to generate ${scene.id}: ${res.status} - ${errText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      const match = content.match(/data:image\/(?:png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)/);
      if (!match) {
        console.error(`Could not find base64 image in content. Snippet:`, content.slice(0, 300));
        return null;
      }

      const base64Data = match[1];
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
      console.log(`✅ Saved: ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
      
      // Cooldown after success
      await delay(4000);
      return { ...scene, filePath: `${scene.id}.png` };
    } catch (e) {
      console.error(`Attempt ${attempt} error for ${scene.id}:`, e.message);
      if (attempt < retries) {
        await delay(5000);
      }
    }
  }
  return null;
}

async function main() {
  const results = [];
  for (const scene of SCENES) {
    try {
      const res = await generateScene(scene);
      if (res) results.push(res);
    } catch (e) {
      console.error(`Error generating ${scene.id}:`, e.message);
    }
  }

  // Create an interactive HTML gallery to preview all generated concepts
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purrpose — Redesigned Concept Locations (Nano Banana Showcase)</title>
  <style>
    :root {
      --bg: #FAF6EE;
      --card-bg: #FFFFFF;
      --ink: #26201D;
      --accent: #E07A5F;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 40px 20px 60px;
      background: var(--bg);
      color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    header {
      text-align: center;
      max-width: 800px;
      margin-bottom: 36px;
    }
    h1 {
      margin: 0 0 10px;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    p.sub {
      margin: 0;
      color: #6C5E53;
      font-size: 16px;
      line-height: 1.5;
    }
    .badge {
      display: inline-block;
      background: var(--ink);
      color: #FFFDF9;
      font-size: 12px;
      font-weight: 700;
      padding: 5px 14px;
      border-radius: 999px;
      margin-top: 14px;
      letter-spacing: 0.8px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 28px;
      max-width: 1200px;
      width: 100%;
    }
    .card {
      background: var(--card-bg);
      border: 3px solid var(--ink);
      border-radius: 20px;
      padding: 20px;
      box-shadow: 6px 6px 0 var(--ink);
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .tag {
      position: absolute;
      top: 14px;
      left: 18px;
      background: var(--accent);
      color: white;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 8px;
      letter-spacing: 0.5px;
    }
    .img-wrap {
      width: 100%;
      height: 340px;
      border-radius: 14px;
      border: 2px solid var(--ink);
      overflow: hidden;
      margin-top: 28px;
      background: #F2ECE0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .img-wrap:hover img {
      transform: scale(1.03);
    }
    h2 {
      margin: 16px 0 6px;
      font-size: 20px;
      font-weight: 800;
    }
    p.desc {
      margin: 0 0 10px;
      font-size: 13.5px;
      color: #6C5E53;
      line-height: 1.45;
    }
    .prompt-box {
      background: #F7F3EA;
      border: 1.5px dashed #B8A89A;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 11.5px;
      color: #55483E;
      font-style: italic;
      line-height: 1.4;
      margin-top: auto;
    }
  </style>
</head>
<body>
  <header>
    <h1>Purrpose — Redesigned Locations & Scenes</h1>
    <p class="sub">Generated with <strong>Nano Banana</strong> on 9router, matching the handcrafted Folk Art & Storybook Sketch aesthetic with Winston living inside each location.</p>
    <span class="badge">NANO BANANA AI CONCEPT LAB · 7 SCENES</span>
  </header>

  <div class="grid">
    ${results.map(r => `
      <div class="card">
        <span class="tag">${r.stage}</span>
        <div class="img-wrap">
          <img src="${r.filePath}" alt="${r.title}" />
        </div>
        <h2>${r.title}</h2>
        <p class="desc">${r.desc}</p>
        <div class="prompt-box">
          <strong>Prompt:</strong> "${r.prompt}"
        </div>
      </div>
    `).join('\n')}
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  console.log(`\n🎉 Generated ${results.length} concept scenes! Gallery saved to:`);
  console.log(`👉 ${path.join(outDir, 'index.html')}`);
}

main().catch(console.error);
