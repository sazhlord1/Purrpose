/**
 * Persian strings shared across the app: brand words, navigation, food types,
 * the cats' homes, and the narration around the cats ("lines about cats").
 *
 * Glossary (keep these consistent everywhere):
 *   Purrpose → پرپوز · PURR → میو · commitment / pact → قرار · stake → گرو
 *   deadline → ددلاین · Pantry → انبار · Impact → کارنامه · Shop → مغازه
 *   Focus Room → اتاق تمرکز · Detective Cheat → کارآگاه چیت · slip / cheat → چیت
 *   case → پرونده · kept → انجامش دادی / سر قولت موندی · fed → گربه خورد
 *   guest → مهمان · account → حساب · sign in → ورود · sign out → خروج
 */
export const COMMON: Record<string, string> = {
  // brand + nav
  Purrpose: 'پرپوز',
  PURR: 'میو',
  '{n} PURR': '{n} میو',
  Home: 'خانه',
  Focus: 'تمرکز',
  Shop: 'مغازه',
  Pantry: 'انبار',
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
  'pact sealed': 'قرار بسته شد',
  relaxed: 'ریلکس',
  'getting hungry': 'داره گشنه میشه',
  'eyeing the food': 'چشمش به غذاست',
  kept: 'انجامش دادی',
  fed: 'گربه خورد',
  'checking…': 'در حال بررسی…',

  // handshake, results, sharing
  '{name} accepts your promise.': '{name} قولت رو قبول کرد.',
  "Don't let your cat down!": 'گربه‌ت رو ناامید نکن!',
  '“…maybe next time.” — {name}, walking away': '«…شاید دفعه‌ی بعد.» — {name}، در حالی که داره میره',
  'The cat won.': 'گربه برد.',
  '{name} won.': '{name} برد.',
  'I did it.': 'انجامش دادم.',
  'I beat {name} and finished “{title}” 🐾': '{name} رو بردم و «{title}» رو تموم کردم 🐾',
  '{name} won this round — my stake feeds a cat 🐾': 'این دور رو {name} برد — گروی من میره شکم یه گربه 🐾',
  'purr…': 'خرخر…',
  '…your cat wins.': '…گربه‌ت می‌بره.',
  'Your cat is ready. Are you?': 'گربه‌ت آماده‌ست. تو چی؟',

  // detective (the line after opening a case)
  "Then it's settled. I'll be watching.": 'حواسم بهت هست! بگو چیکار کردی؟',

  // settings
  Settings: 'تنظیمات',
  Account: 'حساب کاربری',
  'Signed in as': 'وارد شدی با',
  admin: 'ادمین',
  'Member since': 'عضو از',
  'Sign out': 'خروج',
  'Admin panel': 'پنل ادمین',
  "You're playing as a guest. Create an account so your cats, pantry and PURR are safe if this browser is cleared — and so you can sign in on your other devices.":
    'الان مهمونی. یه حساب بساز تا گربه‌ها، انبار و میوهات اگه مرورگر پاک شد از دست نرن — و بتونی با گوشی و لپ‌تاپ دیگه‌ت هم وارد شی.',
  'Create account / Sign in': 'ساخت حساب / ورود',
  Notifications: 'نوتیفیکیشن‌ها',
  'Deadline reminders': 'یادآوری ددلاین',
  'On — reminders arrive even when Purrpose is closed.': 'روشنه — حتی وقتی پرپوز بسته‌ست یادآوری‌ها میرسن.',
  Off: 'خاموش',
  'Blocked in your browser settings.': 'تو تنظیمات مرورگرت بلاک شده.',
  'Not supported in this browser. On iPhone, add Purrpose to your Home Screen first.':
    'این مرورگر پشتیبانی نمی‌کنه. رو آیفون اول پرپوز رو به صفحه‌ی اصلی (Home Screen) اضافه کن.',
  'Not available on this server yet.': 'فعلاً رو سرور فعال نیست.',
  'Turn off': 'خاموشش کن',
  'Turn on': 'روشنش کن',
  Accessibility: 'دسترسی‌پذیری',
  'Reduced motion (calmer cats)': 'حرکت کمتر (گربه‌های آروم‌تر)',
  About: 'درباره',
  'Get your shit done. Or feed a cat.': 'کارتو انجام بده. وگرنه یه گربه رو سیر کن.',
  'Cat Shop': 'مغازه‌ی گربه',
  'Privacy Policy': 'حریم خصوصی',
  'Terms of Service': 'قوانین استفاده',

  'Back to {label}': 'برگشت به {label}',

  // language picker
  Language: 'زبان',
  English: 'English',
  'فارسی': 'فارسی',
  'The app reloads in the language you pick.': 'برنامه با زبانی که انتخاب کنی دوباره باز میشه.',
};
