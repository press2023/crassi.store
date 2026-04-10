import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { fetchCategories, fetchProducts } from '../api'
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
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {t('navShop')}
      </h1>

      {/* Category chips */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {catLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          ))
        ) : (
          <>
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition ${
                !cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {t('all')}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.slug)}
                className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition ${
                  cat === c.slug
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {isAr ? c.nameAr : c.name}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Search */}
      <form onSubmit={onSearch} className="mt-5 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search')}
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 ps-10 pe-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          {t('search')}
        </button>
      </form>

      {/* Products grid */}
      <div className="mt-8">
        {loading ? (
          <ProductGridShimmer count={8} />
        ) : products.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
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
