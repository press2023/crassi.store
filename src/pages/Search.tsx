import { type FormEvent, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Search as SearchIcon } from 'lucide-react'
import { fetchCategories, fetchProducts } from '../api'
import { ProductCard } from '../components/ProductCard'
import { ProductGridShimmer } from '../components/Shimmer'
import { useLanguage } from '../context/LanguageContext'
import type { Category, Product } from '../types'

export function Search() {
  const { t, isAr } = useLanguage()
  const [params, setParams] = useSearchParams()
  const urlQ = params.get('q') ?? ''
  const urlCategory = params.get('category') ?? ''

  const [draftQ, setDraftQ] = useState(urlQ)
  const [categories, setCategories] = useState<Category[]>([])
  const [catsLoading, setCatsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setDraftQ(urlQ)
  }, [urlQ])

  useEffect(() => {
    let ok = true
    setCatsLoading(true)
    fetchCategories()
      .then((rows) => {
        if (ok) setCategories(rows)
      })
      .catch(() => {
        if (ok) setCategories([])
      })
      .finally(() => {
        if (ok) setCatsLoading(false)
      })
    return () => {
      ok = false
    }
  }, [])

  const hasFilter = Boolean(urlCategory) || urlQ.trim().length > 0

  useEffect(() => {
    if (!hasFilter) {
      setProducts([])
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    fetchProducts({
      category: urlCategory || undefined,
      q: urlQ.trim() || undefined,
    })
      .then((rows) => {
        if (alive) setProducts(rows)
      })
      .catch(() => {
        if (alive) setProducts([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [urlQ, urlCategory, hasFilter])

  const setCategoryInUrl = (slug: string) => {
    const next = new URLSearchParams(params)
    if (slug) next.set('category', slug)
    else next.delete('category')
    setParams(next)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams(params)
    const trimmed = draftQ.trim()
    if (trimmed) next.set('q', trimmed)
    else next.delete('q')
    setParams(next)
  }

  const field =
    'w-full rounded-xl border border-victorian-300 bg-cream-50 px-3 py-2.5 text-sm text-victorian-900 outline-none transition focus:border-burgundy-600 dark:border-victorian-700 dark:bg-victorian-950 dark:text-cream-100'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-victorian-900 dark:text-cream-50 sm:text-2xl">
          {t('searchPageTitle')}
        </h1>
        <Link
          to="/products"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-victorian-600 hover:text-burgundy-700 dark:text-victorian-400"
        >
          <ArrowRight className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} />
          {t('navShop')}
        </Link>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-6 flex flex-col gap-3 rounded-xl border border-victorian-200 bg-cream-50/90 p-4 dark:border-victorian-800 dark:bg-victorian-950/60 sm:flex-row sm:items-stretch sm:p-3"
      >
        <label htmlFor="search-category" className="sr-only">
          {t('searchCategoryLabel')}
        </label>
        <div className="relative shrink-0 sm:w-[11.5rem]">
          <select
            id="search-category"
            disabled={catsLoading}
            value={urlCategory}
            onChange={(e) => setCategoryInUrl(e.target.value)}
            className={`${field} cursor-pointer appearance-none pe-8`}
          >
            <option value="">{t('searchAllCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {isAr ? c.nameAr : c.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[10px] text-victorian-500">▾</span>
        </div>

        <div className="relative min-w-0 flex-1">
          <label htmlFor="search-q" className="sr-only">
            {t('searchQueryLabel')}
          </label>
          <SearchIcon className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-victorian-500" />
          <input
            id="search-q"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={`${field} ps-9`}
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          className="shrink-0 rounded-xl bg-burgundy-700 px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:bg-burgundy-800 sm:px-6"
        >
          {t('search')}
        </button>
      </form>

      <section className="mt-8" aria-live="polite">
        {!hasFilter ? (
          <p className="py-8 text-center text-xs text-victorian-500 dark:text-victorian-400">{t('searchEmptyState')}</p>
        ) : loading ? (
          <ProductGridShimmer count={6} />
        ) : products.length === 0 ? (
          <p className="py-10 text-center text-sm text-victorian-500">{t('searchNoResults')}</p>
        ) : (
          <div>
            <p className="mb-4 text-center text-[11px] text-victorian-500 dark:text-victorian-400">
              {products.length === 1
                ? t('searchResultsOne')
                : t('searchResultsMany').replace('{count}', String(products.length))}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
