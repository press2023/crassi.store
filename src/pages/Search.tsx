import { type FormEvent, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  PackageSearch,
  Search as SearchIcon,
  SearchX,
} from 'lucide-react'
import { fetchCategories, fetchProducts } from '../api'
import { ProductCard } from '../components/ProductCard'
import {
  SearchCategoryChipsShimmer,
  SearchPageShimmer,
  SearchResultsShimmer,
} from '../components/Shimmer'
import { SEO } from '../components/SEO'
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

  const activeChip =
    'inline-flex items-center gap-1.5 rounded-full border border-burgundy-700 bg-burgundy-700/10 px-3 py-1.5 text-xs font-semibold text-burgundy-700 transition dark:border-burgundy-400 dark:bg-burgundy-400/10 dark:text-burgundy-400'

  const chip =
    'inline-flex items-center gap-1.5 rounded-full border border-victorian-300 bg-cream-50 px-3 py-1.5 text-xs font-medium text-victorian-700 transition hover:border-burgundy-600 hover:text-burgundy-700 dark:border-victorian-700 dark:bg-victorian-950 dark:text-cream-300 dark:hover:border-burgundy-400 dark:hover:text-burgundy-400'

  // عند أول تحميل (لم تصل التصنيفات بعد ولا يوجد بحث) اعرض هيكلاً كاملاً
  if (catsLoading && !hasFilter) {
    return <SearchPageShimmer />
  }

  return (
    <div>
      {/* بانر البحث العلوي — يلتصق بأعلى الصفحة بدون أي هامش */}
      <div className="relative">
        <img
          src="/search.png"
          alt={isAr ? 'بحث المنتجات' : 'Product Search'}
          className="block h-52 w-full object-cover sm:h-72"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
          loading="eager"
        />
        {/* تدريج غيمي سفلي يندمج مع المحتوى */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-cream-50 via-cream-50/80 to-transparent dark:from-victorian-950 dark:via-victorian-950/80" />
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-10 pt-6">

      <SEO
        title={
          urlQ.trim()
            ? isAr
              ? `بحث: ${urlQ}`
              : `Search: ${urlQ}`
            : isAr
              ? 'بحث في المنتجات'
              : 'Search Products'
        }
        description={
          isAr
            ? 'ابحث عن منتجات متجر فيكتوريان حسب الاسم أو التصنيف.'
            : 'Search Victorian Store products by name or category.'
        }
        lang={isAr ? 'ar' : 'en'}
        noindex={urlQ.trim().length > 0 || urlCategory.length > 0}
      />

      {/* زر رجوع للتصنيفات */}
      <div className="flex justify-end">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 rounded-full border border-victorian-300 bg-cream-50 px-3 py-1.5 text-[11px] font-medium text-victorian-700 transition hover:border-burgundy-600 hover:text-burgundy-700 dark:border-victorian-700 dark:bg-victorian-950 dark:text-cream-300 dark:hover:border-burgundy-400 dark:hover:text-burgundy-400"
        >
          <ArrowRight className={`h-3.5 w-3.5 ${isAr ? 'rotate-180' : ''}`} />
          {t('navShop')}
        </Link>
      </div>

      {/* نموذج البحث */}
      <form
        onSubmit={onSubmit}
        className="mt-6 flex flex-col gap-3 rounded-2xl border border-victorian-200 bg-white p-4 shadow-md dark:border-victorian-800 dark:bg-victorian-950/70 sm:flex-row sm:items-stretch sm:p-3"
      >
        <label htmlFor="search-category" className="sr-only">
          {t('searchCategoryLabel')}
        </label>
        <div className="relative shrink-0 sm:w-[12rem]">
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
          <span className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[10px] text-victorian-500">
            ▾
          </span>
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
          className="shrink-0 rounded-xl bg-burgundy-700 px-6 py-2.5 text-sm font-semibold text-cream-50 transition hover:bg-burgundy-800"
        >
          {t('search')}
        </button>
      </form>

      {/* فلاتر تصنيف سريعة */}
      {catsLoading ? (
        <div className="mt-4">
          <SearchCategoryChipsShimmer />
        </div>
      ) : categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryInUrl('')}
            className={!urlCategory ? activeChip : chip}
          >
            {t('searchAllCategories')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() =>
                setCategoryInUrl(urlCategory === c.slug ? '' : c.slug)
              }
              className={urlCategory === c.slug ? activeChip : chip}
            >
              {isAr ? c.nameAr : c.name}
            </button>
          ))}
        </div>
      )}

      {/* النتائج */}
      <section className="mt-8" aria-live="polite">
        {!hasFilter ? (
          <div className="flex flex-col items-center py-10 text-center">
            <PackageSearch className="h-10 w-10 text-victorian-300 dark:text-victorian-700" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-victorian-500 dark:text-victorian-400">
              {t('searchEmptyState')}
            </p>
          </div>
        ) : loading ? (
          <SearchResultsShimmer count={8} />
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <SearchX className="h-10 w-10 text-victorian-300 dark:text-victorian-700" />
            <p className="mt-4 text-sm font-medium text-victorian-700 dark:text-cream-300">
              {t('searchNoResults')}
            </p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-victorian-500 dark:text-victorian-400">
              {isAr
                ? 'جرّب كلمة بحث أخرى أو اختر تصنيف مختلف. يمكنك أيضاً تصفّح كل المنتجات.'
                : 'Try another keyword or choose a different category. You can also browse all products.'}
            </p>
            <Link
              to="/products"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-burgundy-700 px-5 py-2 text-xs font-semibold text-cream-50 transition hover:bg-burgundy-800"
            >
              {t('navShop')}
              <ArrowRight className={`h-3.5 w-3.5 ${isAr ? 'rotate-180' : ''}`} />
            </Link>
          </div>
        ) : (
          <div>
            {/* عنوان النتائج — رقم واحد فقط في الشارة */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-burgundy-700 px-2 text-[11px] font-bold text-cream-50 shadow-sm">
                  {products.length}
                </span>
                <p className="text-xs font-medium text-victorian-600 dark:text-victorian-300">
                  {products.length === 1 ? t('searchResultsOne') : t('searchResultsMany')}
                </p>
              </div>
              {urlQ.trim() && (
                <button
                  onClick={() => {
                    const next = new URLSearchParams(params)
                    next.delete('q')
                    setParams(next)
                    setDraftQ('')
                  }}
                  className="text-[11px] font-medium text-victorian-500 underline underline-offset-2 transition hover:text-burgundy-700 dark:text-victorian-400 dark:hover:text-burgundy-400"
                >
                  {isAr ? 'مسح البحث' : 'Clear search'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </section>
      </div>
    </div>
  )
}
