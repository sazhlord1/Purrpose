/**
 * Frequently asked questions on purrpose.ir: a section before "بیا تو", a footer link,
 * and FAQPage structured data built from the same list (so the two never drift).
 * Applied by landing-ir-seo.mjs; safe to run twice.
 */
export const FAQ = [
  ['پرپس چیه؟',
    'یه اپلیکیشن بهره‌وریه که کمکت می‌کنه سر قولت بمونی. برای هر کار یه قرار با ددلاین می‌ذاری، یه گربه حواسش بهت هست و یادآور می‌فرسته، و اگه بخوای برای قرارت گرو می‌ذاری تا جدی‌تر بشه.'],
  ['پرپس رایگانه؟',
    'بله. ساختن قرار، اتاق تمرکز، کارآگاه چیت و سه تا گربه‌ی اول رایگانن. خرید غذای گربه برای گرو گذاشتن و خرید میو برای گربه‌ها و وسایل بیشتر، اختیاریه.'],
  ['قرار ساده با قرار سفت و سخت چه فرقی داره؟',
    'تو قرار ساده میو گرو می‌ذاری و پرپس به قولت اعتماد می‌کنه. تو قرار سفت و سخت، غذای واقعی گربه گرو می‌ذاری و باید مدرک انجام کار (متن و عکس) بفرستی تا شاهدت یا تیم پرپس تأییدش کنه.'],
  ['اگه سر قولم نمونم چی میشه؟',
    'تو قرار ساده، میویی که گرو گذاشتی رو گربه می‌بره. تو قرار سفت و سخت، غذایی که گرو گذاشتی به گربه‌های پناهگاه اهدا میشه و برنمی‌گرده. این رو قبل از بستن قرار صریحاً تأیید می‌کنی.'],
  ['پرپس شرط‌بندیه؟',
    'نه. هیچ‌کس پول، جایزه یا غذای کس دیگه‌ای رو نمی‌بره. نتیجه فقط به این بستگی داره که خودت کارت رو انجام بدی؛ اگه انجامش بدی، غذای خودت برات می‌مونه.'],
  ['غذاها واقعاً به گربه‌ها می‌رسه؟',
    'بله. غذای قرارهایی که انجام نشدن، بعد از تموم شدن مهلت اعتراض، برای گربه‌های پناهگاه اهدا میشه و توی اپ می‌تونی ببینی از طرف تو چقدر غذا به گربه‌ها رسیده.'],
  ['شاهد کیه و چطوری تأیید می‌کنه؟',
    'یه دوست که شماره موبایلش رو موقع ساختن قرار وارد می‌کنی. لینک قرار رو براش می‌فرستی، با همون شماره وارد میشه و مدرکت رو قبول یا رد می‌کنه. اگه تا ۴۸ ساعت جواب نده، قرار انجام‌شده حساب میشه.'],
  ['اگه مدرکم ناعادلانه رد شد چی؟',
    'تا ۳ روز بعد از رد شدن، از صفحه‌ی همون قرار می‌تونی یک بار اعتراض بدی. تیم پرپس مدرک رو دوباره بررسی می‌کنه و اگه اعتراضت قبول بشه، قرار انجام‌شده حساب میشه و غذات برمی‌گرده.'],
  ['کارآگاه چیت به چه دردی می‌خوره؟',
    'برای ترک یه عادت بده. یه مدت (۷ تا ۶۰ روز) و تعداد چیت مجاز رو انتخاب می‌کنی و غذا گرو می‌ذاری. هر بار چیت کردی اعتراف می‌کنی و یه سهم از گرو قفل میشه؛ تا آخر دووم بیاری، بقیه‌ش برمی‌گرده.'],
  ['چطوری وارد بشم؟ اطلاعاتم امنه؟',
    'با شماره موبایل و کد پیامکی وارد میشی. اطلاعات روی سرورهای داخل ایران نگه داشته میشه، به کسی فروخته نمیشه و هر وقت بخوای می‌تونی پاک شدن حسابت رو بخوای.'],
];

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CSS = `<style>
#faq{padding-block:28px}
#faq .faq-all{max-width:820px;margin-inline:auto;border:2px solid var(--ink);border-radius:var(--r-card);background:var(--paper-raised)}
#faq .faq-all>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 20px;font-weight:800;font-size:19px}
#faq summary::-webkit-details-marker{display:none}
#faq .faq-all>summary small{font-weight:500;font-size:14px;color:var(--ink-soft);margin-inline-start:8px}
#faq summary::after{content:'+';flex:0 0 auto;width:26px;height:26px;display:grid;place-items:center;border:2px solid var(--ink);border-radius:50%;font-size:17px;line-height:1;transition:transform .2s ease}
#faq details[open]>summary::after{transform:rotate(45deg);background:var(--gold)}
#faq .faq{display:grid;padding:0 12px 12px}
#faq .faq details{border-top:1.5px dashed rgba(42,35,32,.2)}
#faq .faq summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 8px;font-weight:700;font-size:16px}
#faq .faq summary::after{width:22px;height:22px;font-size:15px;border-width:1.5px}
#faq .faq details p{margin:0;padding:0 8px 14px;color:var(--ink-soft);font-size:15px;line-height:1.9;max-width:70ch}
</style>`;

const FA_DIGITS = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

/**
 * One closed box: "سؤال‌های پرتکرار" opens to the list, and each question opens to its
 * answer. Rebuilt on every run, so changes to FAQ above always land.
 */
export function faqIr(html) {
  // Drop an earlier copy (section, styles, structured data) before adding the current one.
  html = html.replace(/  <section id="faq" class="wrap">[\s\S]*?<\/section>\n\n?/, '');
  html = html.replace(/<style>\n#faq[\s\S]*?<\/style>\n?/, '');
  html = html.replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"FAQPage"[\s\S]*?<\/script>\n?/, '');

  const items = FAQ.map(
    ([q, a]) => `        <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`,
  ).join('\n');
  const section = `  <section id="faq" class="wrap">
    <details class="faq-all">
      <summary><span>سؤال‌های پرتکرار<small>${FA_DIGITS(FAQ.length)} سؤال</small></span></summary>
      <div class="faq">
${items}
      </div>
    </details>
  </section>

`;
  if (html.includes('<section id="enter"')) html = html.replace('  <section id="enter"', section + '  <section id="enter"');
  else if (html.includes('</main>')) html = html.replace('</main>', section + '</main>');
  else throw new Error('Landing changed: nowhere to put the FAQ.');
  if (!html.includes('<a href="#faq">')) {
    html = html.replace(
      /(<nav aria-label="Footer">[\s\S]*?)(<a href="https:\/\/app\.purrpose\.ir">)/,
      '$1<a href="#faq">سؤال‌های پرتکرار</a>$2',
    );
  }
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'fa',
    mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  html = html.replace('</head>', `${CSS}\n<script type="application/ld+json">${JSON.stringify(ld)}</script>\n</head>`);
  return html;
}
