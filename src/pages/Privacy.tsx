import { SEO } from '../components/SEO'
import { useLanguage } from '../context/LanguageContext'
import { breadcrumbLD, buildCanonical } from '../lib/seo'

const SECTIONS_AR = [
  {
    title: 'البيانات اللي نجمعها منك',
    body: [
      'نطلب اسمك ورقم هاتفك وعنوان التوصيل والمحافظة وأقرب نقطة دالة',
      'إذا حبّيت تكتب ملاحظة على الطلب — تنحفظ مع طلبك ما تروح لجهة ثانية',
      'ما نطلب أي بطاقة بنكية ولا رقم سري لأن الدفع كله نقداً عند استلام الدفتر أو الساعة أو القلم',
    ],
  },
  {
    title: 'ليش نجمعها',
    body: [
      'نوصل طلبك للعنوان اللي دخلته ونتأكد إنه وصل سليم',
      'نراجعك بالهاتف لو فيه نقص بالعنوان أو حاجة ناقصة بالعدد',
      'نحفظ سجل الطلب لو احتجت ترجع تتبعه أو تسأل عن قطعة معينة',
    ],
  },
  {
    title: 'ويا منو نشاركها',
    body: [
      'نشارك الاسم والعنوان والرقم فقط مع شركة التوصيل اللي توصل الطلب لباب بيتك',
      'ما نبيع بياناتك ولا نأجرها لأي طرف إعلاني أو تسويقي — كلام واضح',
      'الموقع يستخدم Cloudflare Turnstile للتحقق إنك مو بوت، وهذا ما يجمع هويتك',
    ],
  },
  {
    title: 'الكوكيز والتخزين المحلي',
    body: [
      'نستخدم localStorage لحفظ السلة وأكواد الخصم وآخر طلب سويته — كله محلي بمتصفحك',
      'نولّد رقم زائر عشوائي لقياس عدد الزوار الفريدين بدون أي بيانات شخصية',
      'بإمكانك مسحه من إعدادات المتصفح أي وقت ولا راح يأثر على شي مهم',
    ],
  },
  {
    title: 'حقوقك',
    body: [
      'بإمكانك تطلب نسخة من بياناتك أو حذفها كلياً عبر إنستغرام @my.victorian.shop',
      'لو لاحظت إن في بيان غلط — راسلنا ونصلحه بأقصى سرعة',
      'بيانات الطلبات اللي خلصت تنحفظ لمدة محدودة لأغراض المحاسبة فقط',
    ],
  },
]

const SECTIONS_EN = [
  {
    title: 'What we collect',
    body: [
      'Your name, phone number, delivery address, province and a nearby landmark',
      'Any note you write on the order — it stays attached to your order only',
      'No card numbers, no banking details — every order is paid in cash on delivery',
    ],
  },
  {
    title: 'Why we collect it',
    body: [
      'To deliver your notebook, quill pen or pocket watch to the address you gave us',
      'To call you back if the address is unclear or an item needs to be confirmed',
      'To keep a record of your order so you can track it later from your end',
    ],
  },
  {
    title: 'Who we share it with',
    body: [
      'Only the delivery courier sees your name, phone and address — nobody else',
      'We never sell or rent your data to advertisers or third-party marketers',
      'Cloudflare Turnstile is used to block bots on checkout — it does not identify you',
    ],
  },
  {
    title: 'Cookies and local storage',
    body: [
      'We use localStorage to remember your cart, discount code and your latest order ID',
      'A random visitor ID is generated to count unique browsers — no personal data inside',
      'You can clear this anytime from your browser settings without breaking anything',
    ],
  },
  {
    title: 'Your rights',
    body: [
      'You can ask for a copy of your data or full deletion via @my.victorian.shop on Instagram',
      'If something looks wrong, message us and we will fix it as fast as we can',
      'Old order records are kept for a limited period for bookkeeping only',
    ],
  },
]

export function Privacy() {
  const { isAr } = useLanguage()
  const sections = isAr ? SECTIONS_AR : SECTIONS_EN
  const title = isAr ? 'سياسة الخصوصية' : 'Privacy Policy'
  const intro = isAr
    ? 'بياناتك أمانة عدنا — نستخدمها فقط حتى يوصلك طلبك وما نشاركها وياي طرف ما يخصه'
    : 'Your data is a trust we keep — used only to deliver your order, never shared with anyone outside'

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <SEO
        title={title}
        description={intro}
        lang={isAr ? 'ar' : 'en'}
        jsonLd={breadcrumbLD([
          { name: isAr ? 'الرئيسية' : 'Home', url: buildCanonical('/') },
          { name: title, url: buildCanonical('/privacy') },
        ])}
      />

      <header className="border-b border-victorian-200 pb-6 dark:border-victorian-800">
        <h1 className="font-display text-3xl font-bold text-victorian-900 dark:text-cream-50 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-victorian-700 dark:text-cream-200">
          {intro}
        </p>
      </header>

      <div className="mt-10 space-y-6">
        {sections.map((s, idx) => (
          <section
            key={s.title}
            className="rounded-2xl border border-victorian-200 bg-cream-50/60 p-6 shadow-sm dark:border-victorian-800 dark:bg-victorian-950/40"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-display text-sm font-bold text-burgundy-700/70 dark:text-victorian-300/70">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <h2 className="font-display text-lg font-bold text-burgundy-800 dark:text-victorian-200 sm:text-xl">
                {s.title}
              </h2>
            </div>
            <ul className="mt-4 space-y-3 text-base leading-loose text-victorian-800 dark:text-cream-100">
              {s.body.map((line, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-burgundy-700 dark:bg-victorian-400" />
                  <span className="flex-1">{line}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-12 border-t border-victorian-200 pt-6 text-sm text-victorian-500 dark:border-victorian-800 dark:text-victorian-400">
        {isAr
          ? 'لو عندك سؤال خاص بالخصوصية راسلنا على إنستغرام @my.victorian.shop ونرد بأقرب وقت'
          : 'For any privacy concern reach us on Instagram @my.victorian.shop and we will reply soon'}
      </footer>
    </div>
  )
}
