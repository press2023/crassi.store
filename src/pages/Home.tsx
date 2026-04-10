import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../api'
import { ProductCard } from '../components/ProductCard'
import { ProductGridShimmer, HeroShimmer } from '../components/Shimmer'
import { useLanguage } from '../context/LanguageContext'
import type { Product } from '../types'

export function Home() {
  const { t } = useLanguage()
  const [featured, setFeatured] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(false)

  useEffect(() => {
    let ok = true
    fetchProducts()
      .then((rows) => {
        if (!ok) return
        setAllProducts(rows)
        setFeatured(rows.filter((p) => p.featured).slice(0, 4))
      })
      .catch(() => setErr(true))
      .finally(() => { if (ok) setLoading(false) })
    return () => {
      ok = false
    }
  }, [])

  const heroImg = allProducts.find((p) => p.images[0])?.images[0]

  return (
    <div>
      {loading ? (
        <HeroShimmer />
      ) : (
        <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-slate-900 sm:min-h-[80vh]">
          {heroImg && (
            <img
              src={heroImg}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
          <div className="relative z-10 mx-auto max-w-6xl px-4 text-center text-white">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">{t('heroTitle')}</h1>
            <Link
              to="/products"
              className="mt-8 inline-block border-2 border-white px-10 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-slate-900"
            >
              {t('shopNow')}
            </Link>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('featured')}</h2>
          <Link
            to="/products"
            className="text-sm text-slate-500 underline underline-offset-4 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            {t('viewAll')}
          </Link>
        </div>

        {err && (
          <p className="py-8 text-center text-sm text-slate-500">
            {t('brand')}: run API + set DATABASE_URL, then npm run db:seed
          </p>
        )}

        {loading ? (
          <ProductGridShimmer count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
