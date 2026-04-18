import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { fetchCategories, fetchProducts } from '../api'
import { CategoryCircles } from '../components/CategoryCircles'
import { ProductCard } from '../components/ProductCard'
import { ProductGridShimmer } from '../components/Shimmer'
import { useLanguage } from '../context/LanguageContext'
import type { Category, Product } from '../types'

export function Products() {
  const { t, isAr } = useLanguage()
  const [params, setParams] = useSearchParams()
  const cat = params.get('category') ?? ''
  const [q, setQ] = useState(params.get('q') ?? '')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [catLoading, setCatLoading] = useState(true)

  const queryArgs = useMemo(
    () => ({ category: cat || undefined, q: q.trim() || undefined }),
    [cat, q],
  )

  useEffect(() => {
    setCatLoading(true)
    fetchCategories()
      .then((rows) => setCategories(rows))
      .catch(() => setCategories([]))
      .finally(() => setCatLoading(false))
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchProducts(queryArgs)
      .then((rows) => { if (alive) setProducts(rows) })
      .catch(() => { if (alive) setProducts([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [queryArgs])

  const setCategory = (slug: string) => {
    const next = new URLSearchParams(params)
    if (slug) next.set('category', slug)
    else next.delete('category')
    setParams(next)
  }

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams(params)
    if (q.trim()) next.set('q', q.trim())
    else next.delete('q')
    setParams(next)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="text-center font-display text-3xl font-bold uppercase tracking-[0.2em] text-victorian-900 dark:text-cream-50">
        {t('navShop')}
      </h1>

      {/* Category circles */}
      <div className="mt-8">
        <CategoryCircles
          categories={categories}
          activeSlug={cat}
          onSelect={setCategory}
          loading={catLoading}
        />
      </div>

      {/* Search */}
      <form onSubmit={onSearch} className="mx-auto mt-8 flex max-w-xl gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-victorian-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search')}
            className="w-full border border-victorian-300 bg-cream-50 py-2.5 ps-10 pe-4 text-sm text-victorian-900 outline-none placeholder:text-victorian-400 focus:border-burgundy-600 dark:border-victorian-700 dark:bg-victorian-950 dark:text-cream-100"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 border-2 border-burgundy-700 bg-burgundy-700 px-6 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.2em] text-cream-50 hover:bg-burgundy-800"
        >
          {t('search')}
        </button>
      </form>

      {/* Products grid */}
      <div className="mt-10">
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
