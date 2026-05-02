import { SEO } from '../components/SEO'
import { useLanguage } from '../context/LanguageContext'
import { breadcrumbLD, buildCanonical } from '../lib/seo'

const SECTIONS_AR = [
  {
    title: 'طبيعة المتجر',
    body: [
      'متجر فيكتوريان متخصص بقطع بروح العصر الفيكتوري — دفاتر يوميات وأقلام ريش وساعات جيب وظروف وهدايا أصيلة',
      'كل قطعة تنشاف بالموقع تنتقى يدوياً وتنوصف بدقة بصور حقيقية',
      'الأسعار كلها بالدينار العراقي وممكن تتغير بدون إشعار مسبق حسب توفر القطعة',
    ],
  },
  {
    title: 'الطلب والتأكيد',
    body: [
      'الطلب يصير مؤكد من ساعة ما يوصلك رقم الطلب على الشاشة بعد الضغط على «تأكيد الطلب»',
      'احفظ رقم الطلب لأنه طريقتك تتبع حالة الشحن من صفحة «تتبع طلبي»',
      'لو ما توفرت قطعة معينة بعد الطلب — نراجعك بالهاتف ونعرض عليك بدائل أو إلغاء بدون أي رسوم',
    ],
  },
  {
    title: 'الدفع والتوصيل',
    body: [
      'الدفع كله نقداً عند الاستلام بعد ما تفحص الطلب وتطمئن إنه مطابق',
      'نوصل لكل المحافظات العراقية برسوم توصيل ثابتة 5,000 دينار تنضاف للمجموع تلقائياً',
      'مدة التوصيل من 1 إلى 4 أيام عمل حسب المحافظة وحالة الطرق',
      'موظف التوصيل ممكن يتأخر بسبب ظروف خارجة عن إرادتنا — نعتذر مقدماً ونحاول نعوّض',
    ],
  },
  {
    title: 'أكواد الخصم',
    body: [
      'الكود يطبق فقط على المنتجات قبل سعر التوصيل',
      'كل كود إله شروط معروضة وقت التطبيق — حد أدنى للطلب أو سقف للخصم أو تاريخ انتهاء',
      'ما يجوز جمع أكثر من كود بنفس الطلب — كود واحد فقط لكل عملية شراء',
      'إدارة المتجر تحتفظ بحق إلغاء أي كود يستخدم بطريقة غير صحيحة',
    ],
  },
  {
    title: 'الصور والوصف',
    body: [
      'الصور المعروضة حقيقية وملتقطة بإضاءة طبيعية',
      'ممكن تلاحظ فرق بسيط بدرجة اللون بسبب اختلاف شاشات الأجهزة — هذا شي طبيعي',
      'مقاسات القطع موصوفة بالسنتيمتر داخل صفحة كل منتج',
    ],
  },
  {
    title: 'الملكية الفكرية',
    body: [
      'كل المحتوى من نصوص وصور وتصاميم في الموقع ملك للمتجر',
      'ممنوع نسخ المحتوى أو إعادة نشره لأغراض تجارية بدون إذن خطّي مسبق',
      'العلامة "Victorian Iraq" والشعار محميين ولا يجوز استخدامها بدون إذن',
    ],
  },
  {
    title: 'تعديل الشروط',
    body: [
      'بإمكاننا نحدّث هاي الشروط بأي وقت لو تطلب الأمر — التحديث يصير ساري من ساعة نشره',
      'إذا فيه تغيير جوهري — راح ننوّه عليه بصفحة «من نحن» أو على إنستغرام',
    ],
  },
]

const SECTIONS_EN = [
  {
    title: 'What this store is',
    body: [
      'Victorian Iraq is a curated shop for Victorian-era pieces — journal notebooks, quill pens, pocket watches, vintage envelopes and classic gifts',
      'Every item shown is hand-picked and described with real photos',
      'All prices are in Iraqi Dinars and may change without prior notice based on availability',
    ],
  },
  {
    title: 'Placing the order',
    body: [
      'Your order is confirmed the moment you receive an Order ID on the screen after submitting',
      'Keep that ID — it is your way to follow the order from the Track page',
      'If a piece runs out after you order, we call you back and offer alternatives or a free cancel',
    ],
  },
  {
    title: 'Payment and delivery',
    body: [
      'Payment is cash on delivery after you inspect the package',
      'We deliver to every Iraqi province for a flat 5,000 IQD fee added to the total',
      'Delivery takes 1 to 4 working days depending on your province and road conditions',
      'A courier may run late due to factors beyond our control — we apologize in advance',
    ],
  },
  {
    title: 'Discount codes',
    body: [
      'A code applies to product subtotal only, before the delivery fee',
      'Each code has its own rules shown at apply time — minimum total, max discount or expiry',
      'Codes cannot be combined — one code per order',
      'We reserve the right to cancel any code used in an abusive way',
    ],
  },
  {
    title: 'Photos and descriptions',
    body: [
      'Photos are genuine and taken under natural light',
      'Slight color shift may appear between screens — this is normal and not a flaw',
      'Item dimensions are stated in centimeters inside each product page',
    ],
  },
  {
    title: 'Intellectual property',
    body: [
      'All site content — text, photos, designs — is owned by the store',
      'You may not copy or republish anything for commercial use without written permission',
      'The Victorian Iraq name and mark are protected and cannot be used without consent',
    ],
  },
  {
    title: 'Updates to these terms',
    body: [
      'We may update these terms when needed — the new version applies from the moment it is posted',
      'Major changes will be announced on the About page or on our Instagram',
    ],
  },
]

export function Terms() {
  const { isAr } = useLanguage()
  const sections = isAr ? SECTIONS_AR : SECTIONS_EN
  const title = isAr ? 'الشروط والأحكام' : 'Terms & Conditions'
  const intro = isAr
    ? 'هاي الصفحة تحكي العلاقة بينك وبين متجر فيكتوريان وقت ما تطلب دفتر أو قلم ريش أو ساعة جيب — اقراها مرة وحدة وكلش راح تكون مرتاح'
    : 'This page sets the rules between you and Victorian Iraq when you order a notebook, a quill pen or a pocket watch — one read and you are good'

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <SEO
        title={title}
        description={intro}
        lang={isAr ? 'ar' : 'en'}
        jsonLd={breadcrumbLD([
          { name: isAr ? 'الرئيسية' : 'Home', url: buildCanonical('/') },
          { name: title, url: buildCanonical('/terms') },
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
          ? 'باستمرارك بالطلب من الموقع تكون موافق ضمنياً على كل الشروط أعلاه'
          : 'By placing an order on this site you implicitly agree to all the terms above'}
      </footer>
    </div>
  )
}
