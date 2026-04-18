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
      .catch(() => { if (alive) { setCategory(null); setProducts([]) } })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [slug])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="mx-auto mt-6 h-24 w-24 animate-pulse rounded-full bg-victorian-100 dark:bg-victorian-900 sm:h-28 sm:w-28" />
        <div className="mx-auto mt-8 h-8 w-40 animate-pulse rounded bg-victorian-100 dark:bg-victorian-900" />
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
      {/* Back button */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-victorian-700 hover:text-burgundy-700 dark:text-cream-200 dark:hover:text-victorian-300"
      >
        <ArrowLeft className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} />
        {isAr ? 'التصنيفات' : 'Categories'}
      </Link>

      {/* Category header with image */}
      {category.image && (
        <div className="mx-auto mt-2 h-24 w-24 overflow-hidden rounded-full border-4 border-victorian-200 bg-victorian-100 dark:border-victorian-700 dark:bg-victorian-900 sm:h-28 sm:w-28">
          <img
            src={category.image}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <h1 className="mt-4 text-center font-display text-2xl font-bold uppercase tracking-[0.2em] text-victorian-900 dark:text-cream-50 sm:text-3xl">
        {title}
      </h1>

      {/* Victorian divider */}
      <div className="vic-divider mt-10" />

      {/* Products grid */}
      <div className="mt-16">
        {loading ? (
          <ProductGridShimmer count={8} />
        ) : products.length === 0 ? (
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
