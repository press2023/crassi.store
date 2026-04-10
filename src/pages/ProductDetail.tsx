import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProductBySlug, fetchProducts } from '../api'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { ProductCard } from '../components/ProductCard'
import { ProductCardShimmer, ProductDetailShimmer } from '../components/Shimmer'
import { ImageViewer } from '../components/ImageViewer'
import type { Product } from '../types'

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { t, isAr } = useLanguage()
  const { add } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [size, setSize] = useState('')
  const [err, setErr] = useState(false)
  const [similar, setSimilar] = useState<Product[]>([])
  const [similarLoading, setSimilarLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)

  useEffect(() => {
    if (!slug) return
    let ok = true
    setProduct(null); setErr(false); setSimilar([]); setSimilarLoading(true); setActiveImg(0)
    fetchProductBySlug(slug)
      .then((p) => {
        if (!ok) return
        setProduct(p); setSize(p.sizes[0] ?? '')
        if (p.category?.slug) {
          fetchProducts({ category: p.category.slug })
            .then((rows) => { if (ok) setSimilar(rows.filter((r) => r.id !== p.id).slice(0, 4)) })
            .catch(() => {})
            .finally(() => { if (ok) setSimilarLoading(false) })
        } else setSimilarLoading(false)
      })
      .catch(() => { if (ok) setErr(true) })
    return () => { ok = false }
  }, [slug])

  const prevImg = useCallback(() => {
    if (!product) return
    setActiveImg((i) => (i - 1 + product.images.length) % product.images.length)
  }, [product])

  const nextImg = useCallback(() => {
    if (!product) return
    setActiveImg((i) => (i + 1) % product.images.length)
  }, [product])

  if (err || !slug) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-slate-600 dark:text-slate-300">{t('notFound')}</p>
        <Link to="/products" className="mt-4 inline-block text-sm underline underline-offset-4">{t('viewAll')}</Link>
      </div>
    )
  }

  if (!product) return <ProductDetailShimmer />

  const title = isAr ? product.nameAr : product.name
  const desc = isAr ? product.descriptionAr : product.description
  const images = product.images
  const canBuy = product.stock > 0 && size

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Images */}
        <div>
          {images.length > 0 && (
            <button type="button" onClick={() => setViewerOpen(true)}
              className="block w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
              <img src={images[activeImg]} alt="" className="aspect-[4/5] w-full cursor-zoom-in object-cover" />
            </button>
          )}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} type="button" onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    i === activeImg ? 'border-slate-900 dark:border-white' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {product.category ? (isAr ? product.category.nameAr : product.category.name) : ''}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
          <p className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
            {Number(product.price).toLocaleString()}{' '}
            <span className="text-base font-normal text-slate-400">IQD</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {product.stock > 0 ? `${t('stock')}: ${product.stock}` : t('outOfStock')}
          </p>

          {product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">{t('size')}</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button key={s} type="button" onClick={() => setSize(s)}
                    className={`rounded-full border px-5 py-2 text-sm font-medium transition ${
                      size === s
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                        : 'border-slate-200 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="button" disabled={!canBuy}
            onClick={() => add({
              productId: product.id, slug: product.slug, name: product.name, nameAr: product.nameAr,
              image: images[0] ?? '', price: product.price, size,
            })}
            className="mt-8 w-full rounded-full bg-slate-900 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
            {t('addToCart')}
          </button>
        </div>
      </div>

      {/* Similar */}
      {(similarLoading || similar.length > 0) && (
        <section className="mt-16 border-t border-slate-100 pt-10 dark:border-slate-800">
          <h2 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">{t('similarProducts')}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {similarLoading ? Array.from({ length: 4 }).map((_, i) => <ProductCardShimmer key={i} />) : similar.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {viewerOpen && images.length > 0 && (
        <ImageViewer
          images={images}
          index={activeImg}
          onClose={() => setViewerOpen(false)}
          onPrev={prevImg}
          onNext={nextImg}
        />
      )}
    </div>
  )
}
