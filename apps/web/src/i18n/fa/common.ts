/**
 * Persian strings shared across the app: brand words, navigation, food types,
 * the cats' homes, and the narration around the cats ("lines about cats").
 *
 * Glossary (keep these consistent everywhere):
 *   Purrpose → پرپس · PURR → میو · commitment / pact → قرار · stake → گرو
 *   deadline → ددلاین · Pantry → انبار · Impact → کارنامه · Shop → مغازه
 *   Focus Room → اتاق تمرکز · Detective Cheat → کارآگاه چیت · slip / cheat → چیت
 *   case → پرونده · kept → انجامش دادی / سر قولت موندی · fed → گربه خورد
 *   guest → مهمان · account → حساب · sign in → ورود · sign out → خروج
 */
export const COMMON: Record<string, string> = {
  // brand + nav
  Purrpose: 'پرپس',
  PURR: 'میو',
  '{n} PURR': '{n} میو',
  Home: 'خانه',
  Focus: 'تمرکز',
  Shop: 'مغازه',
  Pantry: "انباری",
  Impact: 'کارنامه',
  'New commitment': 'قرار جدید',
  Main: 'منوی اصلی',

  // food types (CREDIT_TYPE_LABELS)
  'Cat Meals': 'کنسرو گربه',
  'Dry Food': 'غذای خشک',
  'Vet Care': 'ویزیت دامپزشک',
  'cat meals': 'کنسرو گربه',
  'dry food': 'غذای خشک',
  'vet care': 'ویزیت دامپزشک',

  // cat breeds (CAT_SEED.type, shown lower-case)
  tabby: 'راه‌راه طلایی',
  tuxedo: 'فراک‌پوش',
  midnight: 'شب‌رنگ',
  calico: 'سه‌رنگ',
  bicolor: 'دورنگ',
  masked: 'نقاب‌دار',
  polkadot: 'خال‌خالی',
  sketch: 'سفید برفی',
  'Your cat': 'گربه‌ت',
  'Your Cat': 'گربه‌ت',

  // the cat's homes (life stages)
  'The Box': 'جعبه',
  'The Yard': 'حیاط',
  'Cozy Room': 'اتاق دنج',
  'Cat Tree': 'درخت گربه',
  'Grand Feast': 'ضیافت بزرگ',
  'Moving day! {room}': 'اسباب‌کشی! {room}',
  'STAGE {n} · {label}': 'مرحله‌ی {n}: {label}',

  // under the scene (sceneCaption)
  '{name} just shook on it. Deal sealed in {room}.': '{name} دست داد. قرارتون تو {room} بسته شد.',
  '{name} is relaxing in {room}.': '{name} تو {room} لم داده.',
  '{name} is getting hungry in {room}…': '{name} تو {room} کم‌کم داره گشنه‌ش میشه…',
  '{name} is eyeing the food. Hurry!': '{name} چشمش دنبال غذاست. بجنب!',
  '{name} is sleeping it off.': '{name} قهر کرده و خوابیده.',
  '{name} is satisfied. For now.': '{name} سیر شده. فعلاً.',
  'Time is up. Checking on {name}…': 'وقت تموم شد. بریم ببینیم {name} چیکار کرد…',
  '{name} is waiting…': '{name} منتظره…',

  // mood tags (moodLabel)
  'pact sealed': "قرارمون یادت نره!",
  relaxed: "شل کردم",
  'getting hungry': "داره گشنم میشه",
  'eyeing the food': "چی بخوریم!",
  kept: 'انجامش دادی',
  fed: "گربه میل کرد",
  'checking…': 'در حال بررسی…',

  // handshake, results, sharing
  '{name} accepts your promise.': '{name} قولت رو قبول کرد.',
  "Don't let your cat down!": "پیشی رو ناامید نکن!",
  '“…maybe next time.” — {name}, walking away': "دفعه دیگه حالت رو میگیرم",
  'The cat won.': "به پیشی باختی!",
  '{name} won.': '{name} برد.',
  'I did it.': "انجام شد!",
  'I beat {name} and finished “{title}” 🐾': 'سر قولم موندم و «{title}» رو تموم کردم؛ {name} دستش خالی موند 🐾',
  '{name} won this round — my stake feeds a cat 🐾': "این دفعه سر قولم نموندم — غذام میره تو شیکم یه گربه‌ی پناهگاه 🐾",
  'purr…': 'خرخر…',
  '…your cat wins.': '…گربه‌ت می‌بره.',
  'Your cat is ready. Are you?': "پیشی‌ت آماده‌ست، تو چی؟",

  // detective (the line after opening a case)
  "Then it's settled. I'll be watching.": "باز چه دسته‌گلی به آب دادی؟",

  // settings
  Settings: 'تنظیمات',
  Account: 'حساب کاربری',
  'Signed in as': 'وارد شدی با',
  admin: 'ادمین',
  'Member since': "عضو پرپس از",
  'Sign out': 'خروج',
  'Admin panel': 'پنل ادمین',
  "You're playing as a guest. Create an account so your cats, pantry and PURR are safe if this browser is cleared — and so you can sign in on your other devices.":
    "با حساب مهمان وارد شدی. یه حساب بساز تا پیشی‌ها، انبار و میوهات از دست نرن .",
  'Create account / Sign in': 'ساخت حساب / ورود',
  Notifications: 'نوتیفیکیشن‌ها',
  'Deadline reminders': 'یادآوری ددلاین',
  'On — reminders arrive even when Purrpose is closed.': "روشنه — نوتیفیکشن‌ها به دستت میرسه!",
  Off: 'خاموش',
  'Blocked in your browser settings.': "پرپس تو تنظیمات مرورگرت بلاک شده.",
  'Not supported in this browser. On iPhone, add Purrpose to your Home Screen first.':
    'این مرورگر پشتیبانی نمی‌کنه. رو آیفون اول پرپس رو به صفحه‌ی اصلی (Home Screen) اضافه کن.',
  'Not available on this server yet.': 'فعلاً رو سرور فعال نیست.',
  'Turn off': "خاموش باش",
  'Turn on': "روشن باش",
  Accessibility: 'دسترسی‌پذیری',
  'Reduced motion (calmer cats)': "حرکت کمتر (گربه‌های متین‌تر)",
  About: "درباره پرپس",
  'Get your shit done. Or feed a cat.': "یا کارت‌ رو انجام بده، یا یه پیشی رو سیر کن!",
  'Cat Shop': 'مغازه‌ی گربه',
  'Privacy Policy': 'حریم خصوصی',
  'Terms of Service': 'قوانین استفاده',

  'Back to {label}': 'برگشت به {label}',

  // language picker
  Language: 'زبان',
  English: 'English',
  'فارسی': 'فارسی',
  'The app reloads in the language you pick.': 'برنامه با زبانی که انتخاب کنی دوباره باز میشه.',
  // reminders scheduled on the phone (Android app)
  'Time’s up. Open Purrpose to see how it went.': 'وقت تموم شد. پرپس رو باز کن ببین چی شد.',
};
