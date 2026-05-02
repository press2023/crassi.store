import { ChevronDown, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SEO } from '../components/SEO'
import { useLanguage } from '../context/LanguageContext'
import { breadcrumbLD, buildCanonical, faqLD } from '../lib/seo'

type QA = { q: string; a: string | string[] }

export function FAQ() {
  const { isAr } = useLanguage()

  const items: QA[] = isAr
    ? [
        {
          q: 'تصممون نوت بوك حسب الطلب؟',
          a: 'ماكو تصميم حسب الطلب — المتوفر هي تصاميم احنه نشتغلها بأنفسنا، والتنفيذ عن طريق معمل خارج العراق لضمان الجودة',
        },
        {
          q: 'اكو خدمة توصيل؟',
          a: 'نعم، نوصّل لكل المحافظات بدون استثناء',
        },
        {
          q: 'اكو تغليف هدايا وشكد يكلف؟',
          a: 'موجود تغليف هدايا أنيق وفيكتوري، وهو مجاني تماماً مع كل طلب',
        },
        {
          q: 'تشتغلون أختام حسب الطلب وشكد سعرها؟',
          a: 'نعم، نشتغل أختام حسب الطلب — والسعر يعتمد على حجم التصميم وتفاصيله. راسلنا على إنستغرام @my.victorian.shop ونعطيك السعر الدقيق',
        },
        {
          q: 'إذا طلبت، شوكت يوصلني الطلب؟',
          a: 'مدة التوصيل من 24 إلى 48 ساعة من وقت تأكيد الطلب',
        },
        {
          q: 'نكدر نرسم أو نكتب بأي قلم على النوت بوك؟ ونكدر نطبع عليه بالطابعة؟',
          a: 'تكدرون ترسمون وتكتبون بأي نوع من الأقلام والألوان بدون مشاكل، بس ما تكدرون تطبعون عليه بالطابعة لأن الورق ما يلائم للطباعة',
        },
        {
          q: 'اكو حجز مسبق؟',
          a: 'لا، ماكو حجز مسبق. السبب إن بعض الزبائن كانوا يحجزون لمدة شهر وبعدها يلغون الحجز، فاضطرّينا نلغي الخدمة. أقصى مدة للحجز عندنا 48 ساعة فقط — أي شي تطلبونه تستلمونه ثاني يوم',
        },
        {
          q: 'شلون أطلب منكم وشلون أدفع؟',
          a: [
            'الطلب من الموقع سهل وبخطوات قليلة:',
            '١. تتصفّح المنتجات وتختار اللي يعجبك',
            '٢. تضغط على المنتج وتختار المقاس والكمية',
            '٣. تضيفه للسلة 🛒',
            '٤. تروح لصفحة السلة وتضغط «إكمال الطلب»',
            '٥. تكتب بياناتك (الاسم، رقم الهاتف، المحافظة، المدينة، العنوان، أقرب نقطة دالّة)',
            '٦. تأكّد الطلب',
            '٧. نتواصل وياك على الرقم لتأكيد التفاصيل',
            'الدفع: نقداً عند الاستلام مباشرةً للموظف اللي يوصّل الطلب — تتفقّد الطرد قبل الدفع وكلش راحة',
          ],
        },
      ]
    : [
        {
          q: 'Do you make custom-designed notebooks?',
          a: 'No custom designs — we offer a curated collection of designs we crafted ourselves, manufactured at a partner facility outside Iraq to guarantee quality',
        },
        {
          q: 'Do you offer delivery?',
          a: 'Yes, we deliver to every governorate in Iraq without exception',
        },
        {
          q: 'Do you offer gift wrapping and how much does it cost?',
          a: 'We offer elegant Victorian-style gift wrapping — completely free with every order',
        },
        {
          q: 'Do you make custom stamps and how much do they cost?',
          a: 'Yes, we make custom stamps. The price depends on the size and complexity of the design. Message us on Instagram @my.victorian.shop for an exact quote',
        },
        {
          q: 'How long does delivery take?',
          a: 'Delivery takes between 24 and 48 hours from order confirmation',
        },
        {
          q: 'Can I draw or write on the notebooks with any pen? Can I print on them?',
          a: 'You can draw and write with any kind of pen or ink without issues. However, the paper is not suitable for printer use',
        },
        {
          q: 'Do you allow advance reservations?',
          a: 'No advance reservations. Some customers used to reserve items for a month then cancel, so we had to discontinue the service. The maximum hold time is 48 hours — you order today and receive tomorrow',
        },
        {
          q: 'How do I order and how do I pay?',
          a: [
            'Ordering from the website is simple:',
            '1. Browse the catalogue and pick what you like',
            '2. Click the product and choose size and quantity',
            '3. Add it to your cart 🛒',
            '4. Open the cart and click "Checkout"',
            '5. Fill in your details (name, phone, governorate, city, address, nearest landmark)',
            '6. Confirm the order',
            '7. We will contact you to confirm the details',
            'Payment: cash on delivery directly to the courier — you can inspect the package before paying, completely worry-free',
          ],
        },
      ]

  const title = isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'
  const intro = isAr
    ? 'كل ما تريد معرفته عن المتجر، التوصيل، الطلبات والأختام في مكان واحد'
    : 'Everything you need to know about the shop, delivery, orders and stamps in one place'

  // FAQ JSON-LD يحتاج إجابات نصية مسطّحة
  const flatItems = items.map((it) => ({
    q: it.q,
    a: Array.isArray(it.a) ? it.a.join(' — ') : it.a,
  }))

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <SEO
        title={title}
        description={intro}
        lang={isAr ? 'ar' : 'en'}
        jsonLd={[
          breadcrumbLD([
            { name: isAr ? 'الرئيسية' : 'Home', url: buildCanonical('/') },
            { name: title, url: buildCanonical('/faq') },
          ]),
          faqLD(flatItems),
        ]}
      />

      <header className="border-b border-victorian-200 pb-6 dark:border-victorian-800">
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy-100 text-burgundy-700 dark:bg-burgundy-900/40 dark:text-burgundy-200">
            <HelpCircle className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold text-victorian-900 dark:text-cream-50 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-victorian-700 dark:text-cream-200">
              {intro}
            </p>
          </div>
        </div>
      </header>

      <ul className="mt-8 space-y-3">
        {items.map((it, idx) => (
          <li key={idx}>
            <details className="group rounded-2xl border border-victorian-200 bg-cream-50/60 shadow-sm transition open:shadow-md dark:border-victorian-800 dark:bg-victorian-950/40">
              <summary
                className="flex cursor-pointer list-none items-center gap-4 p-5 outline-none transition hover:bg-cream-100/60 focus-visible:ring-2 focus-visible:ring-burgundy-500 dark:hover:bg-victorian-900/40"
              >
                <span className="font-display text-sm font-bold text-burgundy-700/70 dark:text-victorian-300/70">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 font-display text-base font-bold text-victorian-900 dark:text-cream-50 sm:text-lg">
                  {it.q}
                </span>
                <ChevronDown className="h-5 w-5 shrink-0 text-victorian-500 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="border-t border-victorian-200 px-5 py-4 dark:border-victorian-800">
                {Array.isArray(it.a) ? (
                  <ul className="space-y-2 text-base leading-loose text-victorian-800 dark:text-cream-100">
                    {it.a.map((line, i) => (
                      <li key={i} className="flex gap-3">
                        {i > 0 && i < it.a.length - 1 ? (
                          <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-burgundy-700 dark:bg-victorian-400" />
                        ) : (
                          <span className="w-1.5 shrink-0" aria-hidden />
                        )}
                        <span className={i === 0 || i === it.a.length - 1 ? 'font-semibold text-victorian-900 dark:text-cream-50' : ''}>
                          {line}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base leading-loose text-victorian-800 dark:text-cream-100">
                    {it.a}
                  </p>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>

      <footer className="mt-12 rounded-2xl border border-victorian-200 bg-cream-100/60 p-6 text-center dark:border-victorian-800 dark:bg-victorian-950/50">
        <p className="font-display text-sm text-victorian-700 dark:text-cream-200">
          {isAr ? 'سؤالك مو موجود هنا؟' : 'Your question is not here?'}
        </p>
        <p className="mt-2 text-sm text-victorian-600 dark:text-cream-300">
          {isAr ? 'راسلنا على إنستغرام ' : 'Message us on Instagram '}
          <a
            href="https://instagram.com/my.victorian.shop"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-burgundy-700 hover:underline dark:text-victorian-200"
            dir="ltr"
          >
            @my.victorian.shop
          </a>
          {isAr ? ' ونرد بأسرع وقت' : ' and we will reply quickly'}
        </p>
        <Link
          to="/products"
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-burgundy-700 bg-burgundy-700 px-5 py-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-cream-50 transition hover:bg-burgundy-800"
        >
          {isAr ? 'تصفح المنتجات' : 'Browse products'}
        </Link>
      </footer>
    </article>
  )
}
