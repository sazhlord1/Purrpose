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
  ['باید چیزی نصب کنم؟',
    'نه. نسخه‌ی وب پرپس توی مرورگر گوشی و کامپیوتر کار می‌کنه و می‌تونی به صفحه‌ی اصلی گوشیت اضافه‌ش کنی. اپ اندروید هم به‌زودی توی کافه‌بازار میاد.'],
  ['چطوری وارد بشم؟ اطلاعاتم امنه؟',
    'با شماره موبایل و کد پیامکی وارد میشی. اطلاعات روی سرورهای داخل ایران نگه داشته میشه، به کسی فروخته نمیشه و هر وقت بخوای می‌تونی پاک شدن حسابت رو بخوای.'],
  ['اگه اینترنت بین‌الملل قطع بشه کار می‌کنه؟',
    'بله. سرورهای پرپس داخل ایرانن و با اینترنت داخلی هم کار می‌کنه.'],
];

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CSS = `<style>
#faq .faq{display:grid;gap:12px;max-width:820px}
#faq details{border:2px solid var(--ink);border-radius:var(--r-card);background:var(--paper-raised);box-shadow:var(--shadow-sm)}
#faq summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 20px;font-weight:700;font-size:17px}
#faq summary::-webkit-details-marker{display:none}
#faq summary::after{content:'+';flex:0 0 auto;width:28px;height:28px;display:grid;place-items:center;border:2px solid var(--ink);border-radius:50%;font-size:18px;line-height:1;transition:transform .2s ease}
#faq details[open] summary::after{transform:rotate(45deg);background:var(--gold)}
#faq details p{padding:0 20px 18px;color:var(--ink-soft);font-size:16px;line-height:1.9;max-width:70ch}
</style>`;

export function faqIr(html) {
  if (html.includes('id="faq"')) return html;
  const items = FAQ.map(
    ([q, a]) => `      <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`,
  ).join('\n');
  const section = `  <section id="faq" class="wrap">
    <div class="sec-head">
      <span class="eyebrow">سؤال‌های پرتکرار</span>
      <h2>هرچی می‌خوای بدونی.</h2>
      <p>جواب سؤال‌هایی که بیشتر از همه درباره‌ی پرپس، قرارها و غذای گربه‌ها می‌پرسن.</p>
    </div>
    <div class="faq">
${items}
    </div>
  </section>

`;
  if (!html.includes('<section id="enter"')) throw new Error('Landing changed: no #enter section for the FAQ.');
  html = html.replace('  <section id="enter"', section + '  <section id="enter"');
  html = html.replace(
    /(<nav aria-label="Footer">[\s\S]*?)(<a href="https:\/\/app\.purrpose\.ir">)/,
    '$1<a href="#faq">سؤال‌های پرتکرار</a>$2',
  );
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'fa',
    mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  html = html.replace('</head>', `${CSS}\n<script type="application/ld+json">${JSON.stringify(ld)}</script>\n</head>`);
  return html;
}
