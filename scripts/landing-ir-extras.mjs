/**
 * purrpose.ir extras on top of the synced landing page (applied by sync-landing-ir.mjs,
 * safe to run twice):
 *  - top-nav and footer links to the food delivery proofs, the blog and the contact page;
 *  - a home-page section with the top players (most pacts kept) and this month's help;
 *  - two more pages: /deliveries (photos and videos of food reaching shelters, posted from
 *    the app's admin panel) and /contact (a form that lands in the admin panel).
 *
 *   node scripts/landing-ir-extras.mjs apps/landing-ir     (re-apply by hand)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://purrpose.ir';
const BLOG = 'https://blog.purrpose.ir';
const APP = 'https://app.purrpose.ir';
const EMAIL = 'info@purrpose.ir';
const MARK = '<!--purrpose-ir-extras-->';

const ENAMAD =
  `<a class="enamad" referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=8506135&Code=HMRsXaxTeW3DlHIkUaJo7KnxhrOlZfae'>` +
  `<img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=8506135&Code=HMRsXaxTeW3DlHIkUaJo7KnxhrOlZfae' alt='' style='cursor:pointer' code='HMRsXaxTeW3DlHIkUaJo7KnxhrOlZfae'></a>`;

const NAV_LINKS = [
  ['/deliveries', 'مدارک غذارسانی', ''],
  [BLOG + '/', 'بلاگ', ' target="_blank" rel="noopener"'],
  ['/contact', 'ارتباط با ما', ''],
];

/** Shared by the home section and the two extra pages (served as /extras.css). */
const CSS = `
.x-board{display:grid;grid-template-columns:1.1fr .9fr;gap:26px;align-items:start}
@media (max-width:900px){.x-board{grid-template-columns:1fr}}
.x-card{background:var(--paper-raised,#fff);border:2.5px solid var(--ink,#2b231f);border-radius:22px;box-shadow:5px 5px 0 var(--ink,#2b231f);padding:22px 22px 18px}
.x-card h3{font-size:24px;margin:0 0 4px;line-height:1.5}
.x-card .x-sub{color:var(--ink-soft,#5a4e48);margin:0 0 14px;font-size:15px}
.x-leaders{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.x-leaders li{display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:14px;background:var(--paper-tint,#fdfbf7);border:1.5px solid rgba(43,35,31,.14)}
.x-leaders li:nth-child(1){background:#fff1d6;border-color:#e6b04f}
.x-leaders li:nth-child(2){background:#f1f1ee}
.x-leaders li:nth-child(3){background:#fbe7dc}
.x-rank{width:34px;height:34px;flex:none;display:grid;place-items:center;border-radius:50%;background:var(--ink,#2b231f);color:var(--paper,#fbf8f1);font-weight:900;font-size:15px}
.x-leaders li:nth-child(-n+3) .x-rank{background:var(--orange,#e28743)}
.x-name{flex:1;font-weight:700;font-size:17px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.x-wins{font-weight:700;color:var(--ink-soft,#5a4e48);font-size:15px;white-space:nowrap}
.x-wins b{color:var(--ink,#2b231f);font-size:18px}
.x-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.x-stat{border:2px solid var(--ink,#2b231f);border-radius:16px;padding:14px 8px 10px;text-align:center;background:var(--paper-tint,#fdfbf7)}
.x-stat .x-ico{font-size:28px;line-height:1}
.x-stat b{display:block;font-size:34px;font-weight:900;line-height:1.3;margin-top:4px}
.x-stat span{display:block;font-size:13.5px;color:var(--ink-soft,#5a4e48);line-height:1.5}
.x-total{margin:14px 0 6px;font-size:14.5px;color:var(--ink-soft,#5a4e48);line-height:1.9}
.x-link{display:inline-flex;gap:6px;align-items:center;font-weight:700;color:var(--ink,#2b231f);text-decoration:none;border-bottom:2px solid var(--orange,#e28743);padding-bottom:1px}
.x-empty{color:var(--ink-soft,#5a4e48);font-size:15px;padding:14px 4px}
.x-skel{height:46px;border-radius:14px;background:linear-gradient(90deg,#f3ede2,#faf6ef,#f3ede2);background-size:200% 100%;animation:xsk 1.2s infinite}
@keyframes xsk{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.x-skel{animation:none}}
`;

/** Header, footer and page styles of the extra pages (the home page has its own). */
const PAGE_CSS = `
@font-face{font-family:"Anjoman";src:url("/fonts/Anjoman-Regular.woff2") format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:"Anjoman";src:url("/fonts/Anjoman-Medium.woff2") format("woff2");font-weight:500;font-display:swap}
@font-face{font-family:"Anjoman";src:url("/fonts/Anjoman-Bold.woff2") format("woff2");font-weight:700;font-display:swap}
@font-face{font-family:"Anjoman";src:url("/fonts/Anjoman-Black.woff2") format("woff2");font-weight:900;font-display:swap}
:root{--paper:#fbf8f1;--paper-raised:#fff;--paper-warm:#f5efe0;--paper-tint:#fdfbf7;--ink:#2b231f;--ink-soft:#5a4e48;--ink-faint:#8e7f78;--orange:#e28743;--stamp-red:#b83b32;--green:#4e8752}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:400 16.5px/1.9 Anjoman,Tahoma,sans-serif}
a{color:inherit}
.wrap{max-width:1120px;margin:0 auto;padding:0 22px}
.xp-nav{position:sticky;top:0;z-index:10;background:var(--paper);border-bottom:2px solid var(--ink)}
.xp-nav .wrap{display:flex;align-items:center;gap:14px;min-height:64px;flex-wrap:wrap}
.xp-logo{display:flex;align-items:center;gap:9px;font-weight:900;font-size:22px;text-decoration:none}
.xp-logo img{width:36px;height:36px;border-radius:10px;border:2px solid var(--ink)}
.xp-links{display:flex;gap:4px;margin-inline-start:auto;align-items:center;flex-wrap:wrap}
.xp-links a{text-decoration:none;font-weight:500;font-size:15px;padding:6px 11px;border-radius:10px}
.xp-links a:hover,.xp-links a[aria-current=page]{background:rgba(226,135,67,.18)}
.xp-btn{display:inline-flex;align-items:center;gap:8px;font:700 15.5px/1 Anjoman,Tahoma,sans-serif;padding:12px 20px;border:2.5px solid var(--ink);border-radius:14px;background:var(--orange);color:#fff;text-decoration:none;box-shadow:3px 3px 0 var(--ink);cursor:pointer;transition:transform .12s,box-shadow .12s}
.xp-btn:active{transform:translate(3px,3px);box-shadow:0 0 0 var(--ink)}
.xp-btn[disabled]{opacity:.6;cursor:default}
.xp-nav .xp-btn{padding:9px 14px;font-size:14.5px}
@media (max-width:700px){.xp-links{order:3;width:100%;justify-content:center;margin:0 0 6px}.xp-links a{font-size:14px;padding:4px 8px}.xp-nav .xp-btn{margin-inline-start:auto}}
.xp-hero{padding:46px 0 10px}
.xp-hero .eyebrow{color:var(--stamp-red);font-weight:700;font-size:17px}
.xp-hero h1{font-size:clamp(32px,5vw,52px);font-weight:900;line-height:1.35;margin:4px 0 10px}
.xp-hero p{font-size:18px;color:var(--ink-soft);max-width:60ch;margin:0}
main{padding-bottom:60px}
footer.xp-foot{border-top:2px solid var(--ink);padding:24px 0 34px;color:var(--ink-soft);font-size:14px}
footer.xp-foot .wrap{display:flex;gap:16px;flex-wrap:wrap;align-items:center;justify-content:space-between}
footer.xp-foot nav{display:flex;gap:14px;flex-wrap:wrap}
footer.xp-foot a{text-decoration:none}
footer .enamad{display:inline-flex;line-height:0}footer .enamad img{height:56px;width:auto;display:block}
.xp-field{display:grid;gap:6px;margin-bottom:16px}
.xp-field>span{font-weight:700;font-size:15px}
.xp-field input,.xp-field textarea{font:inherit;width:100%;border:2px solid var(--ink);border-radius:14px;padding:11px 14px;background:var(--paper-tint);color:var(--ink);transition:background .15s,box-shadow .15s}
.xp-field input:focus,.xp-field textarea:focus{outline:none;background:#fff4ea;box-shadow:0 0 0 4px rgba(232,129,58,.28)}
.xp-field textarea{min-height:150px;resize:vertical}
.xp-kinds{display:flex;gap:8px;flex-wrap:wrap}
.xp-kinds label{cursor:pointer}
.xp-kinds label{position:relative}.xp-kinds input{position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;margin:0;inset:0}
.xp-kinds span{display:inline-block;border:2px solid var(--ink);border-radius:999px;padding:5px 16px;font-weight:500;background:var(--paper-raised)}
.xp-kinds input:checked+span{background:rgba(226,135,67,.22);box-shadow:2px 2px 0 var(--ink)}
.xp-kinds input:focus-visible+span{box-shadow:0 0 0 4px rgba(232,129,58,.35)}
.xp-hp{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;margin:-1px;padding:0;border:0}
.xp-err{color:var(--stamp-red);font-weight:500;margin:4px 0 12px}
.xp-thanks{text-align:center;padding:30px 10px}
.xp-thanks .big{font-size:54px;line-height:1}
.xp-thanks h2{font-size:26px;font-weight:900;margin:10px 0 6px}
.xp-thanks p{color:var(--ink-soft);margin:0}
.xp-contact{display:grid;grid-template-columns:1.25fr .75fr;gap:26px;align-items:start;margin-top:26px}
@media (max-width:860px){.xp-contact{grid-template-columns:1fr}}
.xp-side p{margin:0 0 10px;color:var(--ink-soft)}
.xp-side a{font-weight:700}
.xp-posts{display:grid;gap:26px;margin-top:26px}
.xp-post .x-sub{margin-bottom:10px}
.xp-post h2{font-size:24px;font-weight:900;margin:0;line-height:1.5}
.xp-meta{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px}
.xp-meta span{border:1.5px solid var(--ink);border-radius:999px;padding:1px 12px;font-size:13.5px;background:var(--paper-tint)}
.xp-meta .xp-sum{background:#fff1d6;border-color:#e6b04f;font-weight:700}
.xp-post p.cap{white-space:pre-wrap;margin:0 0 12px;color:var(--ink-soft)}
.xp-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.xp-gallery button,.xp-gallery video{width:100%;aspect-ratio:1;border:2px solid var(--ink);border-radius:14px;overflow:hidden;padding:0;background:var(--paper-warm);cursor:zoom-in;display:block;object-fit:cover}
.xp-gallery img{width:100%;height:100%;object-fit:cover;display:block}
.xp-gallery video{cursor:auto;background:#000}
.xp-box{position:fixed;inset:0;z-index:50;background:rgba(30,24,20,.82);display:none;place-items:center;padding:18px;cursor:zoom-out}
.xp-box.on{display:grid}
.xp-box img{max-width:100%;max-height:90vh;border-radius:14px;border:3px solid var(--paper)}
.xp-cta{margin-top:30px;text-align:center}
`;

function navLinksHtml(current) {
  return NAV_LINKS.map(([href, label, extra]) => `<a href="${href}"${extra}${href === current ? ' aria-current="page"' : ''}>${label}</a>`).join('');
}

function shell({ title, description, canonical, current, jsonLd, body, script }) {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:site_name" content="پرپس">
<meta property="og:type" content="website">
<meta property="og:locale" content="fa_IR">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/og-fa.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#fbf8f1">
<link rel="icon" href="/icons/favicon-32.png" type="image/png" sizes="32x32">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-title" content="پرپس">
<link rel="preload" href="/fonts/Anjoman-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/extras.css">
<style>${PAGE_CSS}</style>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<header class="xp-nav"><div class="wrap">
  <a class="xp-logo" href="/"><img src="/icons/icon-192.png" alt="" width="36" height="36">پرپس</a>
  <nav class="xp-links" aria-label="منو"><a href="/">صفحه‌ی اصلی</a>${navLinksHtml(current)}</nav>
  <a class="xp-btn" href="${APP}">ورود به اپ ←</a>
</div></header>
<main>${body}</main>
<footer class="xp-foot"><div class="wrap">
  <nav aria-label="پایین صفحه"><a href="/">پرپس</a>${navLinksHtml(current)}<a href="${APP}">ورود به اپ</a></nav>
  <span>© ۲۰۲۶ پرپس · کارتو انجام بده. وگرنه یه گربه رو سیر کن.</span>
  ${ENAMAD}
</div></footer>
<script>${script}</script>
</body>
</html>
`;
}

const FA_NUM = `function faN(n){return Number(n||0).toLocaleString('fa-IR')}`;

const BOARD_SECTION = `
  <section id="board" class="wrap" aria-labelledby="board-title">
    <div class="sec-head">
      <span class="eyebrow">سر قولشون موندن</span>
      <h2 id="board-title">قهرمان‌های پرپس و کمک‌های این ماه.</h2>
      <p>بیشترین قرارهای انجام‌شده، و غذایی که از قرارهای نیمه‌کاره به گربه‌های پناهگاه رسیده.</p>
    </div>
    <div class="x-board">
      <div class="x-card">
        <h3>🏆 برترین‌ها</h3>
        <p class="x-sub">بیشترین قرار برده‌شده</p>
        <ol class="x-leaders" id="x-leaders"><li class="x-skel"></li><li class="x-skel"></li><li class="x-skel"></li></ol>
      </div>
      <div class="x-card">
        <h3 id="x-month-title">🐾 کمک‌های این ماه</h3>
        <p class="x-sub">غذای قرارهایی که انجام نشدن، برای گربه‌های پناهگاه</p>
        <div class="x-stats">
          <div class="x-stat"><div class="x-ico">🥫</div><b id="x-meals">—</b><span>کنسرو</span></div>
          <div class="x-stat"><div class="x-ico">🍚</div><b id="x-dry">—</b><span>کیلو غذای خشک</span></div>
          <div class="x-stat"><div class="x-ico">🩺</div><b id="x-vet">—</b><span>ویزیت دامپزشک</span></div>
        </div>
        <p class="x-total" id="x-total"></p>
        <a class="x-link" href="/deliveries">عکس و ویدیوی غذارسانی‌ها ←</a>
      </div>
    </div>
  </section>
`;

const BOARD_SCRIPT = `
<script>
(function(){
  ${FA_NUM}
  var L=document.getElementById('x-leaders');if(!L)return;
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  fetch('/api/v1/public/site').then(function(r){return r.ok?r.json():null}).then(function(d){
    if(!d){L.innerHTML='<li class="x-empty">فعلاً در دسترس نیست.</li>';return}
    L.innerHTML=d.leaders.length?d.leaders.map(function(u,i){return '<li><span class="x-rank">'+faN(i+1)+'</span><span class="x-name">'+esc(u.name)+'</span><span class="x-wins"><b>'+faN(u.wins)+'</b> قرار</span></li>'}).join(''):'<li class="x-empty">هنوز کسی قراری رو تموم نکرده. اولین نفر تو باش!</li>';
    document.getElementById('x-month-title').textContent='🐾 کمک‌های '+d.month.name;
    document.getElementById('x-meals').textContent=faN(d.month.meals);
    document.getElementById('x-dry').textContent=faN(d.month.dryFood);
    document.getElementById('x-vet').textContent=faN(d.month.vetCare);
    var t=d.total;document.getElementById('x-total').textContent='از اول تا حالا: '+faN(t.meals)+' کنسرو، '+faN(t.dryFood)+' کیلو غذای خشک و '+faN(t.vetCare)+' ویزیت دامپزشک · '+faN(t.pactsKept)+' قرار انجام‌شده.';
  }).catch(function(){L.innerHTML='<li class="x-empty">فعلاً در دسترس نیست.</li>'});
})();
</script>
`;

export function addExtras(html) {
  if (html.includes(MARK)) return html;
  const must = (re, label) => {
    if (!re.test(html)) throw new Error(`Landing changed: could not find ${label}. Update scripts/landing-ir-extras.mjs.`);
  };
  // Top nav: three more links. On phones the section links are hidden; these stay, on a second row.
  must(/<nav class="nav-links" aria-label="Main">[\s\S]*?<\/nav>/, 'the top nav');
  html = html.replace(/(<nav class="nav-links" aria-label="Main">[\s\S]*?)(\s*<\/nav>)/, (_, a, b) =>
    `${a}\n      ${NAV_LINKS.map(([href, label, extra]) => `<a class="nav-x" href="${href}"${extra}>${label}</a>`).join('\n      ')}${b}`,
  );
  // Footer nav.
  must(/<nav aria-label="Footer">[\s\S]*?<\/nav>/, 'the footer nav');
  html = html.replace(/(<nav aria-label="Footer">[\s\S]*?)(<\/nav>)/, (_, a, b) =>
    `${a}${NAV_LINKS.map(([href, label, extra]) => `<a href="${href}"${extra}>${label}</a>`).join('')}${b}`,
  );
  // Leaderboard + monthly help, right before the FAQ.
  must(/<section id="faq"/, 'the FAQ section');
  html = html.replace(/(\n\s*)<section id="faq"/, `${BOARD_SECTION}$1<section id="faq"`);
  html = html.replace(
    '</head>',
    `<link rel="stylesheet" href="/extras.css">\n<style>.nav-links a.nav-x{white-space:nowrap}@media (max-width:820px){.nav .wrap{flex-wrap:wrap;row-gap:2px}.nav-links{order:3;width:100%;margin:0;justify-content:center;gap:18px;padding-bottom:6px}.nav-links a.nav-x{display:inline-block!important;font-size:14px}}</style>\n${MARK}\n</head>`,
  );
  html = html.replace('</body>', `${BOARD_SCRIPT}</body>`);
  return html;
}

const CONTACT_BODY = `
<div class="wrap">
  <section class="xp-hero">
    <span class="eyebrow">ارتباط با ما</span>
    <h1>سلام! بنویس، می‌خونیم.</h1>
    <p>پناهگاه هستی و می‌خوای غذا به گربه‌هات برسه؟ از پرپس سؤال یا پیشنهادی داری؟ این فرم مستقیم به تیم پرپس می‌رسه.</p>
  </section>
  <div class="xp-contact">
    <div class="x-card" id="xp-form-card">
      <form id="xp-form" novalidate>
        <div class="xp-field"><span>چه کسی هستی؟</span>
          <div class="xp-kinds" role="radiogroup" aria-label="نوع پیام">
            <label><input type="radio" name="kind" value="shelter"><span>🏠 پناهگاه</span></label>
            <label><input type="radio" name="kind" value="user" checked><span>🙋 کاربر پرپس</span></label>
            <label><input type="radio" name="kind" value="other"><span>✉️ سایر</span></label>
          </div>
        </div>
        <label class="xp-field"><span>نام</span><input name="name" autocomplete="name" required minlength="2" maxlength="80" placeholder="نام شما یا نام پناهگاه"></label>
        <label class="xp-field"><span>ایمیل</span><input name="email" type="email" dir="ltr" autocomplete="email" required maxlength="160" placeholder="you@example.com"></label>
        <label class="xp-field"><span>پیام</span><textarea name="message" required minlength="5" maxlength="3000" placeholder="پیامت رو اینجا بنویس…"></textarea></label>
        <label class="xp-hp" aria-hidden="true">وب‌سایت<input name="website" tabindex="-1" autocomplete="off"></label>
        <p class="xp-err" id="xp-err" role="alert" hidden></p>
        <button class="xp-btn" type="submit" id="xp-send">فرستادن پیام ←</button>
      </form>
    </div>
    <aside class="xp-side">
      <div class="x-card">
        <h3>راه‌های دیگه</h3>
        <p>ایمیل: <a href="mailto:${EMAIL}" dir="ltr">${EMAIL}</a></p>
        <p>پیام‌ها رو معمولاً تا دو روز کاری جواب می‌دیم.</p>
        <p>پناهگاه‌ها: اسم پناهگاه، شهر و تعداد تقریبی گربه‌ها رو هم بنویسید تا زودتر هماهنگ کنیم.</p>
      </div>
    </aside>
  </div>
</div>`;

const CONTACT_SCRIPT = `
(function(){
  var f=document.getElementById('xp-form'),err=document.getElementById('xp-err'),btn=document.getElementById('xp-send');
  function show(m){err.textContent=m;err.hidden=!m}
  f.addEventListener('submit',function(e){
    e.preventDefault();show('');
    var d={name:f.name.value.trim(),email:f.email.value.trim(),message:f.message.value.trim(),kind:(f.querySelector('input[name=kind]:checked')||{}).value||'other',website:f.website.value};
    if(d.name.length<2)return show('اسمت رو بنویس.');
    if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(d.email))return show('ایمیل درست به نظر نمی‌رسه.');
    if(d.message.length<5)return show('چند کلمه بنویس.');
    btn.disabled=true;btn.textContent='در حال فرستادن…';
    fetch('/api/v1/public/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){
        if(r.ok){document.getElementById('xp-form-card').innerHTML='<div class="xp-thanks"><div class="big">💌</div><h2>ممنون، نظر شما ثبت شد.</h2><p>به‌زودی به شما برمی‌گردیم.</p></div>';return}
        show(r.status===429?'پیام‌های زیادی فرستادی. کمی بعد دوباره امتحان کن.':'یه جای فرم درست نیست. دوباره نگاهش کن.');
        btn.disabled=false;btn.textContent='فرستادن پیام ←';
      })
      .catch(function(){show('ارتباط برقرار نشد. اینترنتت رو چک کن و دوباره بفرست.');btn.disabled=false;btn.textContent='فرستادن پیام ←'});
  });
})();`;

const DELIVERIES_BODY = `
<div class="wrap">
  <section class="xp-hero">
    <span class="eyebrow">مدارک غذارسانی</span>
    <h1>غذاها واقعاً به گربه‌ها می‌رسه.</h1>
    <p>هر بار که غذای قرارهای انجام‌نشده رو به پناهگاه‌ها می‌رسونیم، عکس و ویدیوش رو اینجا می‌ذاریم. شفاف، بدون اغراق.</p>
  </section>
  <div class="xp-posts" id="xp-posts"><div class="x-skel" style="height:220px"></div></div>
  <div class="xp-cta"><a class="xp-btn" href="/contact">پناهگاه هستید؟ با ما در تماس باشید ←</a></div>
</div>
<div class="xp-box" id="xp-box" role="dialog" aria-label="عکس بزرگ"><img alt=""></div>`;

const DELIVERIES_SCRIPT = `
(function(){
  ${FA_NUM}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  var fmt=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Tehran'});
  var box=document.getElementById('xp-box'),boxImg=box.querySelector('img');
  box.addEventListener('click',function(){box.classList.remove('on')});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')box.classList.remove('on')});
  var P=document.getElementById('xp-posts');
  P.addEventListener('click',function(e){var b=e.target.closest('button[data-src]');if(!b)return;boxImg.src=b.getAttribute('data-src');box.classList.add('on')});
  fetch('/api/v1/public/deliveries').then(function(r){return r.ok?r.json():null}).then(function(d){
    if(!d||!d.deliveries.length){P.innerHTML='<div class="x-card x-empty">اولین غذارسانی به‌زودی اینجا ثبت میشه. 🐾</div>';return}
    P.innerHTML=d.deliveries.map(function(p){
      var media=p.media.map(function(m){
        return m.type.indexOf('video/')===0
          ?'<video src="'+m.url+'" controls playsinline preload="metadata"></video>'
          :'<button type="button" data-src="'+m.url+'" aria-label="بزرگ‌تر"><img src="'+m.url+'" alt="'+esc(p.title)+'" loading="lazy"></button>';
      }).join('');
      return '<article class="x-card xp-post"><h2>'+esc(p.title)+'</h2><div class="xp-meta">'+
        (p.shelter?'<span>🏠 '+esc(p.shelter)+'</span>':'')+'<span>📅 '+fmt.format(new Date(p.deliveredAt))+'</span>'+
        (p.summary?'<span class="xp-sum">'+esc(p.summary)+'</span>':'')+'</div>'+
        (p.caption?'<p class="cap">'+esc(p.caption)+'</p>':'')+
        (media?'<div class="xp-gallery">'+media+'</div>':'')+'</article>';
    }).join('');
  }).catch(function(){P.innerHTML='<div class="x-card x-empty">فعلاً در دسترس نیست. کمی بعد دوباره سر بزن.</div>'});
})();`;

export function writeExtraPages(out) {
  writeFileSync(path.join(out, 'extras.css'), CSS.trim() + '\n');
  writeFileSync(
    path.join(out, 'contact.html'),
    shell({
      title: 'ارتباط با ما · پرپس',
      description: 'با تیم پرپس در تماس باشید: پناهگاه‌های گربه، کاربران و همکاران. پیام شما مستقیم به ما می‌رسه.',
      canonical: `${SITE}/contact`,
      current: '/contact',
      jsonLd: { '@context': 'https://schema.org', '@type': 'ContactPage', name: 'ارتباط با پرپس', url: `${SITE}/contact`, inLanguage: 'fa', about: { '@type': 'Organization', name: 'پرپس', url: `${SITE}/`, email: EMAIL } },
      body: CONTACT_BODY,
      script: CONTACT_SCRIPT,
    }),
  );
  writeFileSync(
    path.join(out, 'deliveries.html'),
    shell({
      title: 'مدارک غذارسانی به گربه‌های پناهگاه · پرپس',
      description: 'عکس و ویدیوی غذاهایی که از قرارهای انجام‌نشده‌ی کاربران پرپس به گربه‌های پناهگاه رسیده.',
      canonical: `${SITE}/deliveries`,
      current: '/deliveries',
      jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'مدارک غذارسانی پرپس', url: `${SITE}/deliveries`, inLanguage: 'fa', isPartOf: { '@type': 'WebSite', name: 'پرپس', url: `${SITE}/` } },
      body: DELIVERIES_BODY,
      script: DELIVERIES_SCRIPT,
    }),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = path.resolve(process.argv[2] ?? 'apps/landing-ir');
  const file = path.join(out, 'index.html');
  writeFileSync(file, addExtras(readFileSync(file, 'utf8')));
  writeExtraPages(out);
  console.log('updated', out);
}
