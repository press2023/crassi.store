import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts, fetchSettings } from '../api'
import type { SiteSettings } from '../api'
import { ProductCard } from '../components/ProductCard'
import { ProductGridShimmer } from '../components/Shimmer'
import { SEO } from '../components/SEO'
import { useLanguage } from '../context/LanguageContext'
import { breadcrumbLD, buildCanonical, itemListLD } from '../lib/seo'
import { getPricing } from '../lib/price'
import { formatNumberEn } from '../lib/formatDigits'
import type { Product } from '../types'

export function Sale() {
  const { isAr } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<SiteSettings>({})
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [bannerImageBroken, setBannerImageBroken] = useState(false)
  const [bannerImageReady, setBannerImageReady] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setSettingsLoading(true)
    Promise.all([
      fetchProducts({ sale: true }),
      fetchSettings(),
    ])
      .then(([rows, s]) => {
        if (!alive) return
        // ترتيب من الأعلى تخفيضاً للأقل
        const sorted = [...rows].sort((a, b) => {
          const pa = getPricing(a).discountPercent
          const pb = getPricing(b).discountPercent
          return pb - pa
        })
        setProducts(sorted)
        setSettings(s)
      })
      .catch(() => {
        if (alive) setProducts([])
      })
      .finally(() => {
        if (alive) {
          setLoading(false)
          setSettingsLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [])

  const bannerImg = settings.saleBannerImage?.trim() || ''

  /**
   * نُحضّر صورة البانر مسبقاً قبل عرض القسم: هكذا ننتقل من الشيمر مباشرة
   * إلى الصورة دون أن تظهر الخلفية الوردية الافتراضية للحظة.
   */
  useEffect(() => {
    setBannerImageBroken(false)
    setBannerImageReady(false)
    if (!bannerImg) return
    let cancelled = false
    const img = new Image()
    img.decoding = 'async'
    img.src = bannerImg
    const done = () => {
      if (cancelled) return
      setBannerImageReady(true)
    }
    const fail = () => {
      if (cancelled) return
      setBannerImageBroken(true)
      setBannerImageReady(true)
    }
    if (img.complete && img.naturalWidth > 0) {
      done()
    } else {
      img.addEventListener('load', done, { once: true })
      img.addEventListener('error', fail, { once: true })
    }
    return () => {
      cancelled = true
      img.removeEventListener('load', done)
      img.removeEventListener('error', fail)
    }
  }, [bannerImg])

  /** نُبقي الشيمر إلى أن تكون الإعدادات جاهزة + صورة البانر (إن وُجدت) محمّلة */
  const bannerSectionLoading = settingsLoading || (Boolean(bannerImg) && !bannerImageReady)

  const url = buildCanonical('/sale')
  const seoLD = useMemo(
    () => [
      itemListLD({
        name: isAr ? 'تخفيضات فيكتوريان' : 'Victorian Sale',
        url,
        items: products.slice(0, 30).map((p) => ({
          slug: p.slug,
          name: isAr ? p.nameAr : p.name,
          image: p.images?.[0],
          price: p.salePrice ?? p.price,
        })),
      }),
      breadcrumbLD([
        { name: isAr ? 'الرئيسية' : 'Home', url: buildCanonical('/') },
        { name: isAr ? 'التخفيضات' : 'Sale', url },
      ]),
    ],
    [isAr, products, url],
  )

  // إحصاءات للعرض في البانر
  const stats = useMemo(() => {
    if (products.length === 0) return null
    const percents = products.map((p) => getPricing(p).discountPercent).filter((n) => n > 0)
    const max = percents.length ? Math.max(...percents) : 0
    const totalSavings = products.reduce((sum, p) => {
      const pr = getPricing(p)
      return pr.hasDiscount ? sum + (pr.original - pr.effective) : sum
    }, 0)
    return { count: products.length, max, totalSavings }
  }, [products])

  return (
    <div>
      <SEO
        title={isAr ? 'التخفيضات والعروض' : 'Sale & Special Offers'}
        description={
          isAr
            ? 'أقوى عروض وتخفيضات على منتجات متجر فيكتوريان: دفاتر فيكتورية، أقلام ريش، ساعات جيب، ظروف وهدايا بأسعار مخفّضة وتوصيل لكل العراق.'
            : 'Top discounts at Victorian Iraq: notebooks, quill pens, pocket watches, envelopes and gifts at reduced prices with delivery across Iraq.'
        }
        lang={isAr ? 'ar' : 'en'}
        keywords={
          isAr
            ? ['تخفيضات', 'عروض', 'خصومات', 'متجر فيكتوريان', 'دفاتر فيكتورية', 'هدايا', 'تخفيضات العراق']
            : ['sale', 'discount', 'offers', 'Victorian Iraq', 'notebooks', 'gifts', 'Iraq sale']
        }
        jsonLd={seoLD}
      />

      {/* بانر التخفيضات: نُبقي الشيمر حتى تجهز الصورة، ثم نظهر إما الصورة المرفوعة فوراً أو اللوحة الافتراضية */}
      {bannerSectionLoading ? (
        <section className="relative overflow-hidden border-b border-victorian-200 dark:border-victorian-800">
          <div className="animate-pulse bg-victorian-200 dark:bg-victorian-800">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-6 w-32 rounded-full bg-victorian-300 dark:bg-victorian-700" />
                <div className="h-12 w-3/4 rounded-lg bg-victorian-300 dark:bg-victorian-700 sm:h-16 md:w-1/2" />
                <div className="h-5 w-2/3 rounded-md bg-victorian-300 dark:bg-victorian-700 sm:w-1/2" />
                <div className="mt-4 grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-4">
                  <div className="h-16 rounded-lg bg-victorian-300 dark:bg-victorian-700" />
                  <div className="h-16 rounded-lg bg-victorian-300 dark:bg-victorian-700" />
                  <div className="h-16 rounded-lg bg-victorian-300 dark:bg-victorian-700" />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section
          className={`relative overflow-hidden border-b border-victorian-200 dark:border-victorian-800 ${
            bannerImg && !bannerImageBroken
              ? 'bg-victorian-900'
              : 'bg-gradient-to-br from-rose-700 via-rose-600 to-burgundy-900'
          }`}
        >
          {bannerImg && !bannerImageBroken ? (
            <>
              <img
                src={bannerImg}
                alt={isAr ? 'تخفيضات فيكتوريان' : 'Victorian Sale'}
                className="absolute inset-0 h-full w-full object-cover"
                onError={() => setBannerImageBroken(true)}
                loading="eager"
                decoding="async"
              />
              {/* تظليل لتحسين قراءة النص فوق الصورة */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/25" />
            </>
          ) : (
            /* أنماط زخرفية للوحة الافتراضية */
            <div className="pointer-events-none absolute inset-0 opacity-20">
              <div className="absolute -top-10 -right-10 h-72 w-72 rounded-full bg-white blur-3xl" />
              <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-amber-300 blur-3xl" />
            </div>
          )}

          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20 text-cream-50">
            <div className="flex flex-col items-center text-center">
              <span className="mb-4 inline-flex items-center justify-center rounded-full border border-cream-50/30 bg-cream-50/10 px-3 py-1 backdrop-blur-sm">
                <span className="font-display text-[11px] font-semibold uppercase tracking-[0.3em]">
                  {isAr ? 'عروض حصرية' : 'Exclusive Deals'}
                </span>
              </span>

              <h1 className="font-display text-4xl font-bold uppercase tracking-wider drop-shadow-lg sm:text-5xl md:text-6xl">
                {isAr ? 'تخفيضات فيكتوريان' : 'Victorian Sale'}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-cream-50/90 sm:text-lg">
                {isAr
                  ? 'تشكيلة منتقاة بأسعار مخفّضة لفترة محدودة. اطلب الآن قبل نفاد الكميات.'
                  : 'A curated selection at reduced prices for a limited time. Order now before stock runs out.'}
              </p>

            {/* إحصاءات سريعة */}
            {stats && stats.count > 0 && (
              <div className="mt-8 grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                  value={String(stats.count)}
                  label={isAr ? 'منتجات بالتخفيض' : 'Items on sale'}
                />
                <StatCard
                  value={`${stats.max}%`}
                  label={isAr ? 'أعلى خصم' : 'Top discount'}
                  highlight
                />
                <StatCard
                  value={formatNumberEn(stats.totalSavings)}
                  label={isAr ? 'مجموع توفير د.ع' : 'Total savings IQD'}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    )}

      {/* الشبكة */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        {loading ? (
          <ProductGridShimmer count={8} />
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-victorian-300 bg-cream-50/50 px-6 py-16 text-center dark:border-victorian-700 dark:bg-victorian-950/40">
            <h2 className="font-display text-xl font-bold text-victorian-900 dark:text-cream-50">
              {isAr ? 'لا توجد تخفيضات حالياً' : 'No active deals'}
            </h2>
            <p className="mt-2 text-sm text-victorian-600 dark:text-cream-300">
              {isAr ? 'ترقّب العروض القادمة قريباً.' : 'Check back soon for upcoming offers.'}
            </p>
            <Link
              to="/products"
              className="mt-6 inline-block rounded-full border-2 border-burgundy-700 bg-burgundy-700 px-6 py-2.5 font-display text-sm font-semibold uppercase tracking-[0.15em] text-cream-50 transition hover:bg-burgundy-800"
            >
              {isAr ? 'تصفّح كل المنتجات' : 'Browse all products'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  value,
  label,
  highlight = false,
}: {
  value: string
  label: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-4 ${
        highlight
          ? 'border-amber-300/70 bg-amber-300/15 shadow-lg shadow-amber-900/20'
          : 'border-cream-50/30 bg-cream-50/10'
      }`}
    >
      <div className="flex items-center justify-center opacity-90">
        <span className="font-display text-2xl font-bold tabular-nums leading-none sm:text-3xl">
          {value}
        </span>
      </div>
      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.15em] opacity-80 sm:text-[11px]">
        {label}
      </p>
    </div>
  )
}
