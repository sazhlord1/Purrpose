/**
 * Ways to get Purrpose on purrpose.ir, in the "بیا تو" section:
 *  - Android: Cafe Bazaar, or the APK straight from our server (/download/purrpose.apk);
 *  - iPhone: the web app, added to the home screen (PWA).
 * Replaces the landing repo's "coming soon" App Store / Google Play badges.
 * Applied by landing-ir-seo.mjs; safe to run twice.
 */
export const BAZAAR_URL = 'https://cafebazaar.ir/app/space.purrpose.app';
export const APK_URL = '/download/purrpose.apk';

const CSS = `<style>
.get{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:22px 28px;scroll-margin-top:96px}
.get-col{display:grid;gap:12px;align-content:start}
.get-btn{display:inline-flex;align-items:center;gap:12px;padding:10px 20px 10px 16px;border:2.5px solid var(--ink);border-radius:14px 18px 12px 20px/18px 12px 20px 14px;background:var(--ink);color:var(--paper);text-decoration:none;box-shadow:var(--shadow);transition:transform .15s}
.get-btn:hover,.get-btn:focus-visible{transform:rotate(-1.2deg)}
.get-btn img,.get-btn svg{width:28px;height:28px;flex:none}
.get-btn small{display:block;font:600 12px/1.3 var(--body);opacity:.75}
.get-btn b{display:block;font:700 18px/1.2 var(--body)}
.get-alt{background:var(--paper-raised);color:var(--ink)}
.get-hint{margin:0;font-size:14px;line-height:1.8;color:var(--ink-soft)}
.hero-get{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.hero-get .get-btn{padding:7px 14px 7px 12px;gap:9px;box-shadow:3px 3px 0 var(--ink)}
.hero-get .get-btn img,.hero-get .get-btn svg{width:22px;height:22px}
.hero-get .get-btn small{font-size:11px}
.hero-get .get-btn b{font-size:15px}
.nav-dl{display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:15px;color:var(--ink);text-decoration:none;white-space:nowrap}
.nav-dl svg{width:18px;height:18px}
@media (min-width:821px){.nav-dl{display:none}}
@media (max-width:420px){.nav-right{gap:10px}}
@media (max-width:340px){.nav-dl span{display:none}}
</style>`;

const BLOCK = `<div class="get" id="get">
          <div class="get-col">
            <span class="or">اندروید</span>
            <div class="store-row">
              <a class="get-btn" href="${BAZAAR_URL}" target="_blank" rel="noopener">
                <img src="/icons/bazaar.png" alt="" width="28" height="28">
                <span><small>دریافت از</small><b>کافه‌بازار</b></span>
              </a>
              <a class="get-btn get-alt" href="${APK_URL}" download>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 20h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                <span><small>فایل APK</small><b>دانلود مستقیم</b></span>
              </a>
            </div>
          </div>
          <div class="get-col">
            <span class="or">آیفون</span>
            <div class="store-row">
              <a class="get-btn get-alt" href="https://app.purrpose.ir">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"></rect><path d="M10 18.5h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>
                <span><small>وب‌اپ (PWA)</small><b>نصب از مرورگر</b></span>
              </a>
            </div>
            <p class="get-hint">پرپس رو توی Safari باز کن، دکمه‌ی اشتراک‌گذاری رو بزن و «<bdi>Add to Home Screen</bdi>» رو انتخاب کن.</p>
          </div>
        </div>`;

const OLD_INTRO =
  'لازم نیست چیزی دانلود کنی. پرپس رو تو مرورگرت باز کن، به صفحه‌ی اصلی گوشیت اضافه‌ش کن و یه اتاق انتخاب کن: یه قرار، اتاق تمرکز یا یه پرونده برای کارآگاه.';
const NEW_INTRO =
  'روی اندروید پرپس رو از کافه‌بازار بگیر یا فایلش رو مستقیم دانلود کن. روی آیفون و کامپیوتر هم توی مرورگر کار می‌کنه و می‌تونی به صفحه‌ی اصلی گوشیت اضافه‌ش کنی. بعد یه اتاق انتخاب کن: یه قرار، اتاق تمرکز یا یه پرونده برای کارآگاه.';

const DL_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 20h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
const PHONE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"></rect><path d="M10 18.5h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>';

/** The same three ways, small, right under the hero's main button: seen first. */
const HERO = `<div class="hero-get" aria-label="دریافت پرپس">
          <a class="get-btn" href="${BAZAAR_URL}" target="_blank" rel="noopener"><img src="/icons/bazaar.png" alt="" width="22" height="22"><span><small>اندروید</small><b>کافه‌بازار</b></span></a>
          <a class="get-btn get-alt" href="${APK_URL}" download>${DL_ICON}<span><small>اندروید</small><b>دانلود مستقیم</b></span></a>
          <a class="get-btn get-alt" href="#get">${PHONE_ICON}<span><small>آیفون</small><b>وب‌اپ (PWA)</b></span></a>
        </div>`;

/** Hero buttons + a "دانلود" link in the top bar (kept on phones too). Runs on its own marker. */
function heroIr(html) {
  if (html.includes('class="hero-get"')) return html;
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

/** Our styles, always the current ones (an older copy from a previous run is swapped out). */
function withCss(html) {
  html = html.replace(/<style>\n\.get\{display:grid[\s\S]*?<\/style>\n?/, '');
  return html.replace('</head>', `${CSS}\n</head>`);
}

export function downloadIr(html) {
  html = withCss(heroIr(html));
  if (html.includes('id="get"')) return html;
  const badges = /<span class="or">اپ‌های موبایل<\/span>\s*<div class="store-row">[\s\S]*?<\/span>\s*<\/span>\s*<span class="store"[\s\S]*?<\/span>\s*<\/span>\s*<\/div>/;
  if (!badges.test(html)) throw new Error('Landing changed: could not find the app-store badges. Update scripts/landing-ir-download.mjs.');
  html = html.replace(badges, BLOCK);
  // Both the page and its English→Persian table carry the intro.
  html = html.split(OLD_INTRO).join(NEW_INTRO);
  return html;
}
