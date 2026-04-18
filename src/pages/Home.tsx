import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { fetchCategories, fetchProducts, fetchSettings } from '../api'
import type { SiteSettings } from '../api'
import { CategoryCircles } from '../components/CategoryCircles'
import { ProductCard } from '../components/ProductCard'
import { ProductGridShimmer, HeroShimmer } from '../components/Shimmer'
import type { Category, Product } from '../types'

export function Home() {
  const { t, isAr } = useLanguage()
  const [featured, setFeatured] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<SiteSettings>({})
  const [loading, setLoading] = useState(true)
  const [catLoading, setCatLoading] = useState(true)

  useEffect(() => {
    let ok = true
    fetchProducts()
      .then((rows) => {
        if (!ok) return
        setFeatured(rows.filter((p) => p.featured).slice(0, 8))
      })
      .catch(() => { /* ignore */ })
      .finally(() => { if (ok) setLoading(false) })
    return () => { ok = false }
  }, [])

  useEffect(() => {
    let ok = true
    fetchCategories()
      .then((rows) => { if (ok) setCategories(rows) })
      .catch(() => { if (ok) setCategories([]) })
      .finally(() => { if (ok) setCatLoading(false) })
    return () => { ok = false }
  }, [])

  useEffect(() => {
    let ok = true
    fetchSettings().then((s) => { if (ok) setSettings(s) })
    return () => { ok = false }
  }, [])

  const heroImg = settings.heroImage

  return (
    <div>
      {loading ? (
        <HeroShimmer />
      ) : (
        <section className="relative flex min-h-[55vh] items-center justify-center overflow-hidden bg-victorian-950 sm:min-h-[70vh]">
          {heroImg ? (
            <>
              <img
                src={heroImg}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-burgundy-900 via-victorian-800 to-victorian-950" />
          )}

          <div className="relative z-10 flex flex-col items-center justify-end gap-6 px-6 pb-10 pt-64 sm:pt-80">
            {settings.heroTitle ? (
              <h1 className="text-center font-display text-4xl font-bold tracking-wide text-cream-50 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-5xl md:text-6xl">
                {settings.heroTitle}
              </h1>
            ) : null}
            <Link
              to="/products"
              className="inline-block border-2 border-cream-50 bg-black/40 px-12 py-3 font-display text-base font-semibold text-cream-50 backdrop-blur-sm transition hover:bg-cream-50 hover:text-victorian-950 sm:text-lg"
            >
              {isAr ? 'اطلب الآن' : 'Order now'}
            </Link>
          </div>
        </section>
      )}

      {/* Category circles */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <CategoryCircles
          categories={categories}
          loading={catLoading}
          title={t('shopByCategory')}
        />
      </section>

      {/* المختارات — تُخفى لو فارغة */}
      {featured.length > 0 && (
        <>
          <div className="mx-auto max-w-2xl px-6">
            <div className="vic-divider">
              <Crown className="h-4 w-4" />
            </div>
          </div>

          <section className="mx-auto max-w-6xl px-4 py-14">
            <div className="mb-8 flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-bold text-victorian-900 dark:text-cream-50">
                {t('featured')}
              </h2>
              <Link
                to="/products"
                className="font-display text-sm text-burgundy-700 underline underline-offset-4 hover:text-burgundy-900 dark:text-victorian-300 dark:hover:text-victorian-100"
              >
                {t('viewAll')}
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
              {featured.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* لو جارِ تحميل المنتجات، اعرض شبكة shimmer */}
      {loading && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <ProductGridShimmer count={4} />
        </section>
      )}
    </div>
  )
}
