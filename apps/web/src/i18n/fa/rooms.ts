/** Persian strings for the "rooms" screens. English text → Persian. */
export const ROOMS: Record<string, string> = {
  // Focus Room (pages/Focus.tsx)
  'Could not save this session. Check your connection.': 'این جلسه ذخیره نشد. اینترنتت رو چک کن.',
  'Exit Zen Mode': 'خروج از حالت ذن',
  'Exit Zen': 'خروج از ذن',
  'Focus Room': 'اتاق تمرکز',
  'Mute ambient sound': 'صدای محیط رو قطع کن',
  'Enable ambient sound': 'صدای محیط رو وصل کن',
  'Sound on': 'صدا روشن',
  Muted: 'بی‌صدا',
  'Toggle Zen mode': 'حالت ذن',
  Zen: 'ذن',
  'Open-ended cozy focus. Rainy window, warm lamp, and soothing purrs.':
    'تمرکزِ دنج، بدون ساعت و عجله. پنجره‌ی بارونی، چراغ گرم و خرخرِ آرامش‌بخش.',
  'Start Focus': 'شروع تمرکز',
  Pause: 'مکث',
  Finish: 'تموم',
  Resume: 'ادامه',
  'New Session': 'جلسه‌ی جدید',
  'Focus complete!': 'تمرکز تموم شد!',
  'You stayed in deep flow for {time}. The rain has stopped and fireflies are dancing outside the window.':
    '{time} حسابی غرق کارت بودی. بارون بند اومده و کرم‌های شب‌تاب دارن پشت پنجره می‌رقصن.',
  'Time added to: {title}': 'زمانش اضافه شد به: {title}',
  'Choose your focus companion:': 'رفیق تمرکزت رو انتخاب کن:',
  'Link this focus session to a task (optional):': 'این جلسه‌ی تمرکز رو به یه قرار وصل کن (اختیاری):',
  '-- No specific task (Pure Focus) --': '-- بدون قرار خاص (فقط تمرکز) --',
  '{title} ({n} meals at stake)': '{title} ({n} غذا گروئه)',

  // Focus scene (components/FocusScene.tsx)
  'FOCUSING…': 'در حال تمرکز…',
  'SESSION DONE': 'جلسه تموم شد',
  'READY TO FOCUS': 'آماده‌ی تمرکز',
  'Focus room at night with {name} asleep under a blanket': 'اتاق تمرکز، شب. {name} زیر پتو خوابش برده',
  'Focus room at night with {name} watching you': 'اتاق تمرکز، شب. {name} زل زده بهت',
  z: 'خ',

  // Detective Cheat (pages/Detective.tsx)
  '{locked} of {stake} {food} locked': '{locked} از {stake} {food} قفل شده',
  '{n} day left': '{n} روز مونده',
  '{n} days left': '{n} روز مونده',
  'case dismissed': 'تبرئه شدی',
  'case closed': 'پرونده بسته شد',
  '{used} of {max} slips · each slip locks {share} {food}': '{used} از {max} چیت · هر چیت {share} {food} رو قفل می‌کنه',
  '{used} of {max} slips · each slip locks {share} {food} · if it ended today the cats would get {n}':
    '{used} از {max} چیت · هر چیت {share} {food} رو قفل می‌کنه · اگه همین امروز تموم می‌شد، {n} {food} می‌رسید به گربه‌ها',
  'Could not reach the station.': 'به کلانتری وصل نشدیم.',
  'Open a case': 'یه پرونده باز کن',
  'What are you quitting or sticking to?': 'چی رو می‌خوای ترک کنی یا پاش وایسی؟',
  'No cigarettes · Stick to my diet · No doom-scrolling': 'سیگار بی سیگار · رژیمم رو نشکنم · اسکرول بی‌هدف ممنوع',
  'Detective on the case': 'کارآگاه پرونده',
  'Food on the table': 'غذای روی میز',
  '{n} {food} available': '{n} {food} داری',
  'Not enough food in the pantry.': 'انبارت این‌قدر غذا نداره.',
  'Slips allowed before the case closes: {n}': 'چند تا چیت مجازه تا پرونده بسته شه: {n}',
  'Each slip locks {share} {food}.': 'هر چیت {share} {food} رو قفل می‌کنه.',
  'Slips allowed': 'تعداد چیت مجاز',
  'For how long?': 'تا کی؟',
  '{n} days': '{n} روز',
  'Confess every slip. At the end, whatever is locked goes to the cats and the rest comes back to your pantry.':
    'هر بار چیت کردی اعتراف کن. آخرش هر چی قفل شده می‌رسه به گربه‌ها و بقیه‌ش برمی‌گرده تو انبارت.',
  'Slip {n} times and the whole {stake} {food} is gone.': '{n} بار چیت کنی، کل {stake} {food} پر.',
  'Open the case': 'پرونده رو باز کن',
  'Detective Cheat': 'کارآگاه چیت',
  'Quitting something? Stake food, then confess every slip. Each confession locks a share of it.':
    'داری یه چیزی رو ترک می‌کنی؟ غذا گرو بذار، بعد هر بار چیت کردی اعتراف کن. هر اعتراف یه تیکه از گروت رو قفل می‌کنه.',
  'Open cases': 'پرونده‌های باز',
  'Yes. I confess.': 'آره، اعتراف می‌کنم.',
  'I cheated': 'چیت کردم',
  'Tap again to confess': 'یه بار دیگه بزن تا اعتراف کنی',
  'Evidence locker': 'قفسه‌ی مدارک',
  'Opened this by mistake?': 'اشتباهی بازش کردی؟',
  'Withdraw the case': 'پرونده رو پس بگیر',
  '(only in the first few minutes, before any slip)': '(فقط تو چند دقیقه‌ی اول، قبل از اولین چیت)',
  'pulling the files…': 'دارم پرونده‌ها رو درمیارم…',
  'Open another case': 'یه پرونده‌ی دیگه باز کن',
  'Case files': 'بایگانی پرونده‌ها',
  dismissed: 'تبرئه',
  closed: 'بسته شد',
  '{used} of {max} slips · the cats got {lost} of {stake} {food} · detective {name}':
    '{used} از {max} چیت · گربه‌ها {lost} از {stake} {food} رو بردن · کارآگاه: {name}',

  // Interrogation room (components/InterrogationRoom.tsx)
  'An interrogation room. The detective cat sits behind the table, watching you.':
    'اتاق بازجویی. گربه‌ی کارآگاه پشت میز نشسته و زل زده بهت.',
  CASE: 'پرونده',

  // Pantry (pages/Pantry.tsx)
  'Gourmet wet food feast — your prime currency staked against procrastination.':
    'ضیافت کنسروی درجه‌یک — اصلی‌ترین چیزی که جلوی اهمال‌کاری گرو می‌ذاری.',
  'Primary Stake': 'گروی اصلی',
  'Crispy crunchy kibble that keeps feline energy steady for long stakeouts.':
    'غذای خشکِ قرچ‌قروچی که انرژی گربه رو برای کشیک‌های طولانی سر پا نگه می‌داره.',
  'Daily Ration': 'جیره‌ی روزانه',
  'Comprehensive medical wellness and checkups for absolute peace of mind.':
    'چکاپ و مراقبت کامل پزشکی، که خیالت از همه‌چی راحت باشه.',
  'High Stakes': 'گروی سنگین',
  '{food} topped up to {n}.': 'موجودی {food} شد {n}.',
  'Top-up failed. Even imaginary economies have banks.': 'شارژ نشد. حتی اقتصادهای خیالی هم بانک دارن.',
  'Your Pantry': 'انبارِ تو',
  '{n} PURR · Cat Shop': '{n} میو · مغازه‌ی گربه',
  'click any item to inspect': 'رو هر کدوم بزنی، جزئیاتش رو می‌بینی',
  'Consequence Supplies': 'آذوقه‌ی گروگذاری',
  'Items staked in your commitments. When you procrastinate, your cat feasts on these.':
    'چیزایی که سر قرارهات گرو می‌ذاری. اگه بپیچونی، گربه‌ت اینا رو نوش جان می‌کنه.',
  'The pantry door is stuck.': 'در انبار گیر کرده.',
  'Try again': 'دوباره امتحان کن',
  'Top up {food}': 'شارژ {food}',
  'at stake:': 'گرو:',
  'available:': 'آزاد:',
  'tap to top up': 'بزن شارژش کن',
  "Available = balance − active stakes. That's the part you can still promise to cats.":
    'آزاد = موجودی − گروهای فعال. یعنی همون مقداری که هنوز می‌تونی به گربه‌ها قولش رو بدی.',
  'Recent activity': 'فعالیت‌های اخیر',
  'Nothing yet.': 'هنوز هیچی.',
  'fed a cat': 'یه گربه سیر شد',
  'top-up': 'شارژ',
  'starter pantry': 'انبار اولیه',
  'Item Details': 'جزئیات',
  'In Pantry: {n}': 'تو انبار: {n}',
  'Select top-up amount for {name}:': 'چقدر {name} شارژ کنیم؟',
  'Add {n} to pantry': '{n} تا بریز تو انبار',
  Close: 'بستن',

  // Impact (pages/Impact.tsx)
  'Your Impact': 'کارنامه‌ت',
  'All Receipts': 'همه‌ی رسیدها',
  'Feast Receipts (Fed)': 'رسیدهای ضیافت (گربه خورد)',
  'Top-up History': 'سابقه‌ی شارژ',
  'Nothing here yet. Your first receipt appears when a cat eats or you top up.':
    'هنوز اینجا خبری نیست. اولین رسیدت وقتی میاد که یه گربه غذا بخوره یا انبارت رو شارژ کنی.',
  'No fed receipts yet. Miss a deadline and your cat will leave one.':
    'هنوز هیچ گربه‌ای چیزی نخورده. یه ددلاین رو بپیچونی، گربه‌ت رسیدش رو برات می‌ذاره.',
  'No top-ups yet. Your pantry is waiting.': 'هنوز شارژ نکردی. انبارت منتظره.',
  FED: 'گربه خورد',
  'TOP-UP': 'شارژ',
  STARTER: 'هدیه‌ی شروع',
  'counting kibble…': 'دارم دونه‌های غذا رو می‌شمرم…',
  'The ledger wandered off.': 'دفتر حساب‌ها گم و گور شده.',
  'commitments kept': 'قرارهایی که انجامش دادی',
  'times the cat won': 'دفعه‌هایی که گربه برد',
  "No cats fed yet. Keep procrastinating — this section fills up when you don't.":
    'هنوز هیچ گربه‌ای از جیب تو سیر نشده. هر وقت بپیچونی، اینجا پر میشه.',
  'Filter history': 'فیلتر سابقه',
  '"{title}"': '«{title}»',
  'Load more ({n} left)': 'بیشتر ({n} تای دیگه)',
};
