/**
 * Persian for the two kinds of pact (مرامی / سفت و سخت), witnesses and proofs,
 * the welcome gift, the guided tour and the intro arrows.
 * Glossary: honor pact → قرار مرامی · strict pact → قرار سفت و سخت · witness → شاهد
 * · proof → مدرک · PURR → میو · stake → گرو.
 */
export const MODES: Record<string, string> = {
  // pact type popup
  'Do you want this pact strict, or on your word?': 'می‌خوای قرارت خیلی سفت و سخت باشه یا مرامی جلو بره؟',
  'On my word': 'مرامی',
  'with PURR': 'با میو',
  Strict: 'سفت و سخت',
  'with real food': 'با غذای واقعی',
  'You put PURR on the line. No money involved.': 'میو گرو می‌ذاری، پای پول وسط نیست.',
  'Your word is enough: tap “I did it” and it’s done.': 'قول خودت کافیه: بزنی «انجامش دادم»، تمومه.',
  'Your first {n} pacts: {stake} PURR each, and +{bonus} for every one you keep. Keep all three and a new cat is yours.':
    '{n} قرار اولت هر کدوم {stake} میوئه و هر کدوم رو ببری {bonus}+ میو جایزه داره. هر سه رو ببری، یه گربه‌ی جدید مال توئه.',
  'You pick how much PURR. Miss it and the PURR is gone.': 'خودت انتخاب می‌کنی چقدر میو. اگه نشد، میوها می‌رن.',
  'You stake real cat food from your pantry.': 'از انبارت غذای واقعی گربه گرو می‌ذاری.',
  'When you’re done, you send a proof: a short note, a photo if you like.': 'کارت که تموم شد یه مدرک می‌فرستی: یه توضیح کوتاه، اگه خواستی یه عکس.',
  'A friend you pick checks it (or we do). Miss it and the food really goes to a shelter.':
    'یه دوست که خودت انتخاب می‌کنی چکش می‌کنه (یا ما). اگه نشد، غذا واقعاً می‌ره برای گربه‌های پناهگاه.',
  'Your pantry is empty right now.': 'الان انبارت خالیه.',
  'Keep it as it is': 'همین که هست بمونه',

  // new pact form
  'Strict · real food': 'سفت و سخت · غذای واقعی',
  'On my word · PURR': 'مرامی · میو',
  change: 'عوضش کن',
  'PURR on the line:': 'میوی گرو:',
  '{n} PURR free': '{n} میو آزاد',
  'Starter pact {k} of {n}: keep it and get +{bonus} PURR.': 'قرار شروع {k} از {n}: ببریش، {bonus}+ میو جایزه می‌گیری.',
  'Get PURR in the shop': 'از مغازه میو بگیر',
  'Not enough free PURR for that.': 'میوی آزادت برای این کافی نیست.',
  'Strict pacts stake real food, and your pantry is empty. Buying food opens soon — meanwhile, an honor pact works with PURR.':
    'قرار سفت و سخت غذای واقعی گرو می‌ذاره و انبارت خالیه. خرید غذا به‌زودی باز می‌شه — تا اون موقع قرار مرامی با میو جواب می‌ده.',
  'Switch to on my word': 'برو روی مرامی',
  'Witness (optional):': 'شاهد (اختیاری):',
  'their email': 'ایمیلش',
  'You send them a link. When you’re done, they look at your proof and say yes or no. No witness? The Purrpose team checks it. Nobody answers in 48 hours? It counts.':
    'یه لینک براش می‌فرستی. کارت که تموم شد، مدرکت رو می‌بینه و می‌گه آره یا نه. شاهد نداری؟ تیم پرپوز چکش می‌کنه. تا ۴۸ ساعت کسی جواب نداد؟ قبول حساب می‌شه.',
  'That email doesn’t look right.': 'این ایمیل درست به نظر نمیاد.',
  'Your witness needs an email that isn’t yours.': 'ایمیل شاهدت باید با ایمیل خودت فرق کنه.',
  'You are staking {stake} with {cat}. Keep your word and the PURR stays yours. Miss it, and {name} takes it!':
    'داری با {cat} سرِ {stake} قرار می‌ذاری. سر قولت بمونی، میوها مال خودته. اگه نشد، {name} برشون می‌داره!',
  'You are staking {stake} with {cat}. When you’re done, send a proof. If it holds, your food stays yours. If not, it feeds real cats at a shelter.':
    'داری با {cat} سرِ {stake} قرار می‌ذاری. کارت که تموم شد مدرک بفرست. اگه قبول شد، غذات می‌مونه. اگه نه، شکم گربه‌های واقعی پناهگاه رو سیر می‌کنه.',

  // pact page
  'Food pact': 'قرار غذایی',
  'proof under review': 'مدرک در حال بررسی',
  '+{n} PURR for keeping a starter pact.': '{n}+ میو جایزه‌ی بردن قرار شروع.',
  'Your witness approved your proof.': 'شاهدت مدرکت رو قبول کرد.',
  'The Purrpose team approved your proof.': 'تیم پرپوز مدرکت رو قبول کرد.',
  'Nobody objected within 48 hours, so it counts.': 'تا ۴۸ ساعت کسی مخالفت نکرد، پس قبوله.',
  'You didn’t make it. {name} took your {amount}.': 'نشد. {name} {amount}ت رو برداشت.',
  'Your witness didn’t accept the proof.': 'شاهدت مدرک رو قبول نکرد.',
  'The Purrpose team didn’t accept the proof.': 'تیم پرپوز مدرک رو قبول نکرد.',
  '“{note}”': '«{note}»',
  'Proof sent': 'مدرک فرستاده شد',
  'Waiting for your witness to say yes or no.': 'منتظر شاهدتیم که بگه آره یا نه.',
  'Waiting for the Purrpose team to check it.': 'منتظریم تیم پرپوز چکش کنه.',
  'If nobody answers by {date}, it counts.': 'اگه تا {date} کسی جواب نده، قبول حساب می‌شه.',
  'Your photo': 'عکست',
  '{title} ({stake} at stake)': '{title} ({stake} گرو)',

  // proof form
  'Show what you did': 'نشون بده چیکار کردی',
  'Your witness will look at this and say yes or no.': 'شاهدت اینو می‌بینه و می‌گه آره یا نه.',
  'The Purrpose team will look at this and say yes or no.': 'تیم پرپوز اینو می‌بینه و می‌گه آره یا نه.',
  'If nobody answers within 48 hours, it counts.': 'اگه تا ۴۸ ساعت کسی جواب نده، قبول حساب می‌شه.',
  'What did you do?': 'چیکار کردی؟',
  'e.g. Sent the report to my manager at 5pm.': 'مثلاً: گزارش رو ساعت ۵ برای مدیرم فرستادم.',
  'Remove photo': 'حذف عکس',
  'Shrinking the photo…': 'دارم عکس رو کوچیک می‌کنم…',
  'Add a photo (optional)': 'یه عکس بذار (اختیاری)',
  'Send proof': 'بفرست',
  'Could not send it. Try again.': 'نشد بفرستیم. دوباره امتحان کن.',
  'That photo could not be used. Try another one.': 'این عکس قابل استفاده نبود. یه عکس دیگه امتحان کن.',

  // witness link (owner)
  'Witness:': 'شاهد:',
  'Send them this link. They sign in with this email to check your proof.': 'این لینک رو براش بفرست. با همین ایمیل وارد می‌شه و مدرکت رو چک می‌کنه.',
  'Be my witness on Purrpose: “{title}”': 'توی پرپوز شاهدم شو: «{title}»',
  'Send the link': 'فرستادن لینک',
  'Link copied.': 'لینک کپی شد.',
  'Sent.': 'فرستاده شد.',
  'Witness link': 'لینک شاهد',

  // witness page
  'opening the case file…': 'داریم پرونده رو باز می‌کنیم…',
  'This link doesn’t work': 'این لینک کار نمی‌کنه',
  'Ask your friend to send it again.': 'از دوستت بخواه دوباره بفرستدش.',
  'Open Purrpose': 'باز کردن پرپوز',
  'Your friend': 'دوستت',
  '{name} picked you as their witness': '{name} تو رو شاهد قرارش کرده',
  'Due {date} · {stake} on the line with {cat}': 'ددلاین {date} · {stake} گرو با {cat}',
  'How this works': 'ماجرا چیه',
  '{name} promised to do this by the deadline. When they’re done they send a proof, and you say whether it holds. Yes: their food stays theirs. No: it goes to feed real cats at a shelter.':
    '{name} قول داده این کار رو تا ددلاین انجام بده. وقتی تموم شد یه مدرک می‌فرسته و تو می‌گی قبوله یا نه. آره: غذاش برای خودش می‌مونه. نه: می‌ره برای سیر کردن گربه‌های واقعی پناهگاه.',
  'Their proof': 'مدرکش',
  'Proof photo': 'عکس مدرک',
  'There’s a photo too. Sign in as the witness to see it.': 'یه عکس هم هست. برای دیدنش با ایمیل شاهد وارد شو.',
  'Sent {date}': 'فرستاده‌شده {date}',
  'No proof yet. Come back to this link when {name} says it’s done.': 'هنوز مدرکی نیومده. وقتی {name} گفت تموم شد، دوباره همین لینک رو باز کن.',
  'Approved ✓': 'قبول شد ✓',
  'Not accepted': 'قبول نشد',
  'Nobody answered within 48 hours, so it counted.': 'تا ۴۸ ساعت کسی جواب نداد، پس قبول حساب شد.',
  'The Purrpose team decided this one.': 'این یکی رو تیم پرپوز تصمیم گرفت.',
  'You decided this one. Thanks for keeping them honest.': 'این یکی رو تو تصمیم گرفتی. مرسی که حواست بهش بود.',
  'The deadline passed without a proof.': 'ددلاین گذشت و مدرکی نیومد.',
  'Yes, they did it': 'آره، انجامش داد',
  'No, this doesn’t count': 'نه، این قبول نیست',
  'Tell them why (optional)': 'بهش بگو چرا (اختیاری)',
  'Confirm: it doesn’t count': 'مطمئنم: قبول نیست',
  Back: 'برگشت',
  'You’re signed in as {email}, but this witness link is for {witness}.': 'با {email} وارد شدی، ولی این لینک شاهد برای {witness}ه.',
  'To decide, sign in or create an account with {witness}.': 'برای تصمیم گرفتن، با {witness} وارد شو یا حساب بساز.',
  'Sign in as the witness': 'ورود به‌عنوان شاهد',
  'This is your own pact — only your witness can decide it.': 'این قرار خودته — فقط شاهدت می‌تونه درباره‌ش تصمیم بگیره.',
  'What is Purrpose?': 'پرپوز چیه؟',

  // admin review queue
  'Proofs to review': 'مدرک‌های منتظر بررسی',
  'Nothing waiting. Undecided proofs are approved automatically after 48 hours.': 'چیزی منتظر نیست. مدرک‌هایی که بررسی نشن بعد از ۴۸ ساعت خودکار قبول می‌شن.',
  'auto-approves {date}': 'قبول خودکار {date}',
  'Has a witness:': 'شاهد داره:',
  'Show photo': 'نمایش عکس',
  'Note for them (optional)': 'یادداشت برای کاربر (اختیاری)',
  Approve: 'قبول',
  Reject: 'رد',
  witness: 'شاهد',
  'reviewed by {who}': 'بررسی‌شده توسط {who}',
  auto: 'خودکار',

  // welcome gift
  'You got {n} free PURR!': '{n} میو رایگان گیرت اومد!',
  'Put them on the line in “on my word” pacts. Keep your first three and you’ll have enough for a new cat.':
    'توی قرارهای مرامی گروشون بذار. سه قرار اولت رو ببری، میوت برای یه گربه‌ی جدید بس می‌شه.',
  'Nice!': 'ایول!',

  // intro slides
  Previous: 'قبلی',
  Next: 'بعدی',
  'tap the arrow or anywhere to continue': 'روی فلش یا هر جای صفحه بزن تا بریم بعدی',

  // tour chrome
  'Skip guide': 'رد کردن راهنما',
  'Got it': 'فهمیدم',

  // settings
  Guide: 'راهنما',
  'Each screen explains itself the first time you open it. Want the explanations again?': 'هر صفحه بار اولی که بازش می‌کنی خودش رو توضیح می‌ده. می‌خوای توضیح‌ها دوباره بیان؟',
  'Show the guide again': 'نمایش دوباره‌ی راهنما',
  'Done — open any screen to see its guide.': 'انجام شد — هر صفحه‌ای رو باز کنی راهنماش میاد.',

  // shop / pantry
  '({n} in open pacts)': '({n} توی قرارهای باز)',
  'Buying real cat food opens soon. Until then, “on my word” pacts work with PURR.': 'خرید غذای واقعی گربه به‌زودی باز می‌شه. تا اون موقع قرارهای مرامی با میو جواب می‌دن.',

  // server messages
  'Send a proof to finish this pact': 'برای تموم کردن این قرار مدرک بفرست',
  'Only the witness can decide': 'فقط شاهد می‌تونه تصمیم بگیره',
  'Your witness needs an email that is not yours': 'ایمیل شاهدت باید با ایمیل خودت فرق کنه.',
  'Sign in as the witness to see the photo': 'برای دیدن عکس با ایمیل شاهد وارد شو',
  'This witness link does not work': 'این لینک شاهد کار نمی‌کنه',
  'Buying food is not open yet': 'خرید غذا هنوز باز نشده',
  'That photo could not be used': 'این عکس قابل استفاده نبود',
  'Tell us in a few words what you did': 'با چند کلمه بگو چیکار کردی',
  'Pick how much PURR to stake': 'انتخاب کن چقدر میو گرو بذاری',
};
