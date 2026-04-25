import { useEffect, useMemo, useState } from 'react'
import { fetchCategories, fetchProducts } from '../api'
import { CategoryCircles } from '../components/CategoryCircles'
import { ProductCard } from '../components/ProductCard'
import { ProductGridShimmer } from '../components/Shimmer'
import { SEO } from '../components/SEO'
import { useLanguage } from '../context/LanguageContext'
import { breadcrumbLD, buildCanonical, itemListLD } from '../lib/seo'
import type { Category, Product } from '../types'

export function Products() {
  const { t, isAr } = useLanguage()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [catLoading, setCatLoading] = useState(true)

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
    fetchProducts()
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
  }, [])

  const url = buildCanonical('/products')
  const seoLD = useMemo(() => {
    const list = itemListLD({
      name: isAr ? 'كل المنتجات' : 'All Products',
      url,
      items: products.slice(0, 30).map((p) => ({
        slug: p.slug,
        name: isAr ? p.nameAr : p.name,
        image: p.images?.[0],
        price: p.price,
      })),
    })
    const crumbs = breadcrumbLD([
      { name: isAr ? 'الرئيسية' : 'Home', url: buildCanonical('/') },
      { name: isAr ? 'المنتجات' : 'Products', url },
    ])
    return [list, crumbs]
  }, [isAr, products, url])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <SEO
        title={isAr ? 'كل المنتجات — تشكيلة فيكتوريان' : 'All Products — Victorian Collection'}
        description={
          isAr
            ? 'تصفّح كل المنتجات في متجر فيكتوريان: دفاتر فيكتورية، أقلام ريش، ساعات جيب، ظروف وهدايا كلاسيكية بالدينار العراقي وتوصيل لكل المحافظات.'
            : 'Browse the full Victorian Iraq collection: notebooks, quill pens, pocket watches, envelopes & gifts — IQD prices and delivery across Iraq.'
        }
        lang={isAr ? 'ar' : 'en'}
        jsonLd={seoLD}
      />
      <h1 className="text-center font-display text-3xl font-bold uppercase tracking-[0.2em] text-victorian-900 dark:text-cream-50">
        {t('navShop')}
      </h1>

      <div className="mt-8">
        <CategoryCircles categories={categories} loading={catLoading} />
      </div>

      <div className="vic-divider mt-10" />

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
