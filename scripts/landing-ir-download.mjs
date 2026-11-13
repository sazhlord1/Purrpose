/**
 * Ways to get Purrpose on purrpose.ir, right under the hero's main button:
 *  - Android: Cafe Bazaar, or the APK straight from our server (/download/purrpose.apk);
 *  - iPhone: the web app, added to the home screen (PWA).
 * Plus a "دانلود" link in the top bar. The landing repo's closing "بیا تو" section (with
 * its "coming soon" App Store / Google Play badges) is dropped: the hero covers it.
 * Applied by landing-ir-seo.mjs; safe to run twice.
 */
export const BAZAAR_URL = 'https://cafebazaar.ir/app/space.purrpose.app';
export const APK_URL = '/download/purrpose.apk';

const CSS = `<style>
.get-btn{display:inline-flex;align-items:center;gap:12px;padding:10px 20px 10px 16px;border:2.5px solid var(--ink);border-radius:14px 18px 12px 20px/18px 12px 20px 14px;background:var(--ink);color:var(--paper);text-decoration:none;box-shadow:var(--shadow);transition:transform .15s}
.get-btn:hover,.get-btn:focus-visible{transform:rotate(-1.2deg)}
.get-btn img,.get-btn svg{width:28px;height:28px;flex:none}
.get-btn small{display:block;font:600 12px/1.3 var(--body);opacity:.75}
.get-btn b{display:block;font:700 18px/1.2 var(--body)}
.get-alt{background:var(--paper-raised);color:var(--ink)}
.hero-side .get-hint,.get-hint{margin:0;max-width:none;font-size:13px;line-height:1.8;color:var(--ink-soft)}
.hero-get{display:flex;flex-wrap:wrap;gap:10px;align-items:center;scroll-margin-top:110px}
.hero-get .get-btn{padding:7px 14px 7px 12px;gap:9px;box-shadow:3px 3px 0 var(--ink)}
.hero-get .get-btn img,.hero-get .get-btn svg{width:22px;height:22px}
.hero-get .get-btn small{font-size:11px}
.hero-get .get-btn b{font-size:15px}
.nav-dl{display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:15px;color:var(--ink);text-decoration:none;white-space:nowrap}
.nav-dl svg{width:18px;height:18px}
@media (min-width:821px){.nav-dl{display:none}}
@media (max-width:420px){.nav-right{gap:10px}}
@media (max-width:340px){.nav-dl span{display:none}}
.hero h1,.hero h1 .feed{line-height:1.2}
</style>`;

const DL_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 20h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
const PHONE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"></rect><path d="M10 18.5h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>';

/** The three ways, right under the hero's main button: seen first. */
const HERO = `<div class="hero-get" id="get" aria-label="دریافت پرپس">
          <a class="get-btn" href="${BAZAAR_URL}" target="_blank" rel="noopener"><img src="/icons/bazaar.png" alt="" width="22" height="22"><span><small>اندروید</small><b>کافه‌بازار</b></span></a>
          <a class="get-btn get-alt" href="${APK_URL}" download>${DL_ICON}<span><small>اندروید</small><b>دانلود مستقیم</b></span></a>
          <a class="get-btn get-alt" href="https://app.purrpose.ir">${PHONE_ICON}<span><small>آیفون</small><b>وب‌اپ (PWA)</b></span></a>
        </div>
        <p class="get-hint">آیفون: پرپس رو توی Safari باز کن، دکمه‌ی اشتراک‌گذاری رو بزن و «<bdi>Add to Home Screen</bdi>» رو انتخاب کن.</p>`;

/** Hero buttons + a "دانلود" link in the top bar (kept on phones too). */
function heroIr(html) {
  // A copy from an earlier run is replaced with the current one.
  html = html.replace(/\n\s*<div class="hero-get"[\s\S]*?<\/a>\s*<\/div>(\s*<p class="get-hint">[\s\S]*?<\/p>)?/, '');
  html = html.replace(/<a class="nav-dl" href="#get">[\s\S]*?<\/a>\n\s*/, '');
  const cta = /(<a class="btn btn-primary btn-big" href="https:\/\/app\.purrpose\.ir">برو تو اپ[\s\S]*?<\/span>\s*<\/div>)/;
  if (!cta.test(html)) throw new Error('Landing changed: could not find the hero buttons. Update scripts/landing-ir-download.mjs.');
  html = html.replace(cta, `$1\n        ${HERO}`);
  html = html.replace('<span class="pill-note"><span class="dot-live"></span>وب‌اپ الان فعاله · شروعش مجانیه</span>', '<span class="pill-note"><span class="dot-live"></span>اندروید، آیفون و وب · شروعش مجانیه</span>');
  html = html.replace('<a href="#enter">دریافت اپ</a>', '<a href="#get">دانلود</a>');
  html = html.replace(
    /(<div class="nav-right">[\s\S]*?)(<a class="btn btn-primary" href="https:\/\/app\.purrpose\.ir">ورود به اپ)/,
    `$1<a class="nav-dl" href="#get">${DL_ICON}<span>دانلود</span></a>\n      $2`,
  );
  return html;
}

/** The closing "بیا تو" section is gone; its page script tolerates the missing greeting. */
function dropEnter(html) {
  html = html.replace(/\n\s*<section id="enter" class="wrap">[\s\S]*?<\/section>/, '');
  html = html.replace("document.getElementById('greet').textContent=", "(document.getElementById('greet')||{}).textContent=");
  return html;
}

/** The hero line, shorter: "انجامش بده، / یا یه گربه رو سیر کن." with the lines a bit closer. */
function headlineIr(html) {
  html = html.replace('<h1>کارتو انجام بده.<br><span class="feed">وگرنه یه گربه رو سیر کن.', '<h1>انجامش بده،<br><span class="feed">یا یه گربه رو سیر کن.');
  html = html.replace('"Get your stuff done.": "کارتو انجام بده."', '"Get your stuff done.": "انجامش بده،"');
  html = html.replace('"Or feed a cat.": "وگرنه یه گربه رو سیر کن."', '"Or feed a cat.": "یا یه گربه رو سیر کن."');
  return html;
}

/** Our styles, always the current ones (an older copy from a previous run is swapped out). */
function withCss(html) {
  html = html.replace(/<style>\n\.get(\{display:grid|-btn\{)[\s\S]*?<\/style>\n?/, '');
  return html.replace('</head>', `${CSS}\n</head>`);
}

export function downloadIr(html) {
  return withCss(dropEnter(headlineIr(heroIr(html))));
}
