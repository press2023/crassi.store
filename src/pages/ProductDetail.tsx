import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, ChevronRight, Home, Minus, Package, Plus, ShoppingBag, Share2 } from 'lucide-react'
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
  const [err, setErr] = useState(false)
  const [similar, setSimilar] = useState<Product[]>([])
  const [similarLoading, setSimilarLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [imgKey, setImgKey] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [qty, setQty] = useState(1)
  const [selectedSize, setSelectedSize] = useState('')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!slug) return
    let ok = true
    setProduct(null); setErr(false); setSimilar([]); setSimilarLoading(true); setActiveImg(0); setQty(1); setSelectedSize(''); setAdded(false)
    fetchProductBySlug(slug)
      .then((p) => {
        if (!ok) return
        setProduct(p)
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

  // Auto-rotate images every 3 seconds
  useEffect(() => {
    if (!product || product.images.length <= 1) return
    const interval = setInterval(() => {
      setActiveImg((i) => (i + 1) % product.images.length)
      setImgKey((k) => k + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [product])

  const prevImg = useCallback(() => {
    if (!product) return
    setActiveImg((i) => (i - 1 + product.images.length) % product.images.length)
    setImgKey((k) => k + 1)
  }, [product])

  const nextImg = useCallback(() => {
    if (!product) return
    setActiveImg((i) => (i + 1) % product.images.length)
    setImgKey((k) => k + 1)
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
  const canBuy = product.stock > 0
  const maxQty = Math.max(1, product.stock)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: desc,
          url,
        })
      } catch (err) {
        console.log('Share error', err)
      }
    } else {
      navigator.clipboard.writeText(url)
      alert(isAr ? 'تم نسخ الرابط!' : 'Link copied!')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-victorian-500 dark:text-cream-300" dir={isAr ? 'rtl' : 'ltr'}>
        <Link to="/" className="inline-flex items-center gap-1 transition hover:text-burgundy-700 dark:hover:text-victorian-300">
          <Home className="h-3.5 w-3.5" />
          <span>{isAr ? 'الرئيسية' : 'Home'}</span>
        </Link>
        <ChevronRight className={`h-3.5 w-3.5 ${isAr ? 'rotate-180' : ''}`} />
        {product.category ? (
          <Link to={`/products?category=${product.category.slug}`} className="transition hover:text-burgundy-700 dark:hover:text-victorian-300">
            {isAr ? product.category.nameAr : product.category.name}
          </Link>
        ) : (
          <Link to="/products" className="transition hover:text-burgundy-700 dark:hover:text-victorian-300">
            {isAr ? 'المنتجات' : 'Products'}
          </Link>
        )}
        <ChevronRight className={`h-3.5 w-3.5 ${isAr ? 'rotate-180' : ''}`} />
        <span className="font-medium text-victorian-900 dark:text-cream-50 line-clamp-1">{title}</span>
      </nav>

      {/* Main product area */}
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Main image */}
        <div className="md:w-1/2 lg:w-5/12">
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                className="block w-full overflow-hidden rounded-2xl bg-victorian-100 dark:bg-victorian-900"
              >
                <img
                  key={imgKey}
                  src={images[activeImg]}
                  alt=""
                  className="img-fade aspect-[4/5] w-full cursor-zoom-in object-cover"
                />
              </button>
            )}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setActiveImg(i); setImgKey(k => k + 1) }}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      i === activeImg
                        ? 'border-burgundy-700 dark:border-victorian-300'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

        {/* Info */}
        <div className="md:w-1/2 lg:w-7/12 flex flex-col pt-2 lg:pt-4">
          {/* Title */}
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="font-display text-2xl font-bold leading-tight text-victorian-900 dark:text-cream-50 sm:text-3xl lg:text-4xl">
              {title}
            </h1>
            <button
              type="button"
              onClick={handleShare}
              title={isAr ? 'مشاركة' : 'Share'}
              className="mt-1 flex shrink-0 items-center justify-center rounded-full border border-victorian-200 bg-cream-50 p-2.5 text-victorian-500 shadow-sm transition hover:border-burgundy-300 hover:text-burgundy-700 dark:border-victorian-800 dark:bg-victorian-900/50 dark:text-victorian-400 dark:hover:border-victorian-700 dark:hover:text-cream-100"
            >
              <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Price block */}
          <div className="mt-4 rounded-lg border border-victorian-300 px-4 py-3 dark:border-victorian-700">
            <p className="mb-1 font-display text-[11px] font-semibold uppercase tracking-[0.25em] text-victorian-500">
              {isAr ? 'السعر' : 'Price'}
            </p>
            <div className="flex items-baseline gap-2" dir={isAr ? 'rtl' : 'ltr'}>
              <span className="font-display text-3xl font-bold text-burgundy-700 dark:text-victorian-300 sm:text-4xl">
                {Number(product.price).toLocaleString()}
              </span>
              <span className="font-display text-sm font-semibold uppercase tracking-widest text-victorian-500">
                {isAr ? 'د.ع' : 'IQD'}
              </span>
            </div>
          </div>

          {/* Stock badge */}
          <div className="mt-4">
            {canBuy ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-victorian-300 bg-victorian-100 px-3 py-1 text-xs font-semibold text-victorian-700 dark:border-victorian-700 dark:bg-victorian-900/30 dark:text-victorian-300">
                <Package className="h-3.5 w-3.5" />
                <span>
                  {isAr ? 'متوفر' : 'In stock'} — {product.stock} {isAr ? 'قطعة' : 'units'}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-burgundy-200 bg-burgundy-50 px-3 py-1 text-xs font-semibold text-burgundy-700 dark:border-burgundy-900/50 dark:bg-burgundy-900/20 dark:text-burgundy-300">
                <Package className="h-3.5 w-3.5" />
                <span>{t('outOfStock')}</span>
              </div>
            )}
          </div>

          {/* Sizes */}
          {canBuy && product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 font-display text-[11px] font-semibold uppercase tracking-[0.25em] text-victorian-500">
                {isAr ? 'المقاس' : 'Size'}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`rounded-full border-2 px-4 py-1.5 font-display text-sm font-semibold transition ${
                      selectedSize === s
                        ? 'border-burgundy-700 bg-burgundy-700 text-cream-50 dark:border-victorian-300 dark:bg-victorian-300 dark:text-victorian-900'
                        : 'border-victorian-300 text-victorian-700 hover:border-burgundy-700 dark:border-victorian-700 dark:text-cream-200 dark:hover:border-victorian-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          {canBuy && (
            <div className="mt-6">
              <p className="mb-2 font-display text-[11px] font-semibold uppercase tracking-[0.25em] text-victorian-500">
                {isAr ? 'الكمية' : 'Quantity'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-victorian-300 text-victorian-700 transition hover:border-burgundy-700 hover:bg-burgundy-700 hover:text-cream-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-victorian-300 disabled:hover:bg-transparent disabled:hover:text-victorian-700 dark:border-victorian-700 dark:text-cream-200 dark:hover:border-victorian-300 dark:hover:bg-victorian-300 dark:hover:text-victorian-900"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-display text-lg font-bold text-victorian-900 dark:text-cream-50">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-victorian-300 text-victorian-700 transition hover:border-burgundy-700 hover:bg-burgundy-700 hover:text-cream-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-victorian-300 disabled:hover:bg-transparent disabled:hover:text-victorian-700 dark:border-victorian-700 dark:text-cream-200 dark:hover:border-victorian-300 dark:hover:bg-victorian-300 dark:hover:text-victorian-900"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="text-xs text-victorian-500">
                  {isAr ? `الحد الأقصى: ${maxQty}` : `Max: ${maxQty}`}
                </span>
              </div>
            </div>
          )}

          {/* Total preview */}
          {canBuy && qty > 1 && (
            <div className="mt-5 flex items-center justify-between rounded-lg border border-victorian-300 px-4 py-3 dark:border-victorian-700">
              <span className="text-xs uppercase tracking-wider text-victorian-500">
                {isAr ? 'الإجمالي' : 'Subtotal'}
              </span>
              <span className="font-display text-lg font-bold text-burgundy-700 dark:text-victorian-300">
                {(Number(product.price) * qty).toLocaleString()} {isAr ? 'د.ع' : 'IQD'}
              </span>
            </div>
          )}

          {/* Add to cart */}
          <button
            type="button"
            disabled={!canBuy || (product.sizes.length > 0 && !selectedSize)}
            onClick={() => {
              add({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                nameAr: product.nameAr,
                image: images[0] ?? '',
                price: product.price,
                size: selectedSize,
                quantity: qty,
              })
              setAdded(true)
              setTimeout(() => setAdded(false), 2000)
            }}
            className={`mt-6 inline-flex w-full items-center justify-center gap-2 border-2 py-4 font-display text-sm font-bold uppercase tracking-[0.2em] transition disabled:cursor-not-allowed disabled:opacity-40 ${
              added
                ? 'border-burgundy-700 bg-transparent text-burgundy-700 dark:border-victorian-300 dark:text-victorian-300'
                : product.sizes.length > 0 && !selectedSize
          ? 'border-victorian-300 bg-victorian-100 text-victorian-400 dark:border-victorian-700 dark:bg-victorian-800 dark:text-victorian-500'
          : 'border-burgundy-700 bg-burgundy-700 text-cream-50 hover:bg-burgundy-800'
            }`}
          >
            {added ? (
              <>
                <Check className="h-5 w-5" />
                {isAr ? 'تمت الإضافة' : 'Added'}
              </>
            ) : product.sizes.length > 0 && !selectedSize ? (
              <>
                <ShoppingBag className="h-5 w-5" />
                {isAr ? 'اختر مقاس أولاً' : 'Select a size first'}
              </>
            ) : (
              <>
                <ShoppingBag className="h-5 w-5" />
                {t('addToCart')}
              </>
            )}
          </button>

          {/* Description */}
          {desc && (
            <div className="mt-8 border-t border-victorian-200 pt-6 dark:border-victorian-800">
              <p className="mb-2 font-display text-[11px] font-semibold uppercase tracking-[0.25em] text-victorian-500">
                {isAr ? 'الوصف' : 'Description'}
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-victorian-700 dark:text-cream-200 sm:text-base">
                {desc}
              </p>
            </div>
          )}
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
