import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchCategoryBySlug, fetchProducts } from '../api'
import { ProductCard } from '../components/ProductCard'
import { ProductGridShimmer } from '../components/Shimmer'
import { useLanguage } from '../context/LanguageContext'
import type { Category, Product } from '../types'

export function CategoryPage() {
  const { t, isAr } = useLanguage()
  const { slug } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    let alive = true
    setLoading(true)
    Promise.all([fetchCategoryBySlug(slug), fetchProducts({ category: slug })])
      .then(([cat, rows]) => {
        if (alive) {
          setCategory(cat)
          setProducts(rows)
        }
      })
      .catch(() => {
        if (alive) {
          setCategory(null)
          setProducts([])
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [slug])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="h-4 w-28 animate-pulse rounded bg-victorian-100 dark:bg-victorian-900" />
        <div className="relative mt-6 aspect-[4/3] min-h-[16rem] max-h-[52vh] w-full overflow-hidden rounded-2xl bg-victorian-100 dark:bg-victorian-900 sm:min-h-[20rem] sm:max-h-[62vh]">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-victorian-300/40 to-transparent dark:from-victorian-700/40" />
          <div className="absolute inset-x-6 bottom-6 h-10 max-w-md animate-pulse rounded bg-black/20 sm:bottom-8" />
        </div>
        <div className="mt-12">
          <ProductGridShimmer count={8} />
        </div>
      </div>
    )
  }

  if (!slug || !category) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-slate-500">{t('notFound')}</p>
        <Link to="/products" className="mt-4 inline-block text-sm underline underline-offset-4">
          {t('navShop')}
        </Link>
      </div>
    )
  }

  const title = isAr ? category.nameAr : category.name

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-victorian-700 hover:text-burgundy-700 dark:text-cream-200 dark:hover:text-victorian-300"
      >
        <ArrowLeft className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} />
        {t('navShop')}
      </Link>

      {/* بانر التصنيف: صورة تملأ العرض، تدرّج من الأسفل، الاسم على الصورة */}
      <section
        className="relative mt-6 aspect-[4/3] min-h-[16rem] max-h-[56vh] w-full overflow-hidden rounded-2xl border border-victorian-200/60 shadow-md dark:border-victorian-800 sm:min-h-[20rem] sm:max-h-[64vh] md:max-h-[68vh]"
        aria-label={title}
      >
        {category.image ? (
          <img
            src={category.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-burgundy-900 via-victorian-800 to-victorian-950"
            aria-hidden
          />
        )}
        {/* تدرّج قوي من الأسفل يخفّ حتى الأعلى ليوضّح الاسم في الوسط */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.72)_22%,rgba(0,0,0,0.38)_48%,transparent_78%)]"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 flex justify-center px-5 pb-8 pt-20 sm:px-8 sm:pb-10 sm:pt-28">
          <h1 className="w-full max-w-5xl text-center font-display text-3xl font-bold uppercase leading-[1.1] tracking-[0.1em] text-cream-50 drop-shadow-[0_2px_18px_rgba(0,0,0,0.9)] sm:text-4xl md:text-5xl lg:text-6xl">
            {title}
          </h1>
        </div>
      </section>

      <div className="vic-divider mt-10" />

      <div className="mt-10">
        {products.length === 0 ? (
          <p className="py-12 text-center text-sm text-victorian-500">
            {isAr ? 'لا توجد نتائج' : 'No products found.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
