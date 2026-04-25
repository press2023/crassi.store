import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, ChevronRight, Home, Minus, Plus, ShoppingBag, Share2 } from 'lucide-react'
import { fetchProductBySlug, fetchProducts, fetchReviews } from '../api'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { ProductCard } from '../components/ProductCard'
import { ProductCardShimmer, ProductDetailShimmer } from '../components/Shimmer'
import { ImageViewer } from '../components/ImageViewer'
import { SEO } from '../components/SEO'
import { breadcrumbLD, buildCanonical, productLD } from '../lib/seo'
import { formatNumberEn } from '../lib/formatDigits'
import { getPricing } from '../lib/price'
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
  const [siteRating, setSiteRating] = useState<{ value: number; count: number } | null>(null)

  // متوسط تقييم الموقع — يُستخدم في AggregateRating لمنتجات الموقع
  useEffect(() => {
    let ok = true
    fetchReviews()
      .then((r) => {
        if (!ok) return
        if (r.count > 0 && r.average > 0) setSiteRating({ value: r.average, count: r.count })
      })
      .catch(() => {})
    return () => { ok = false }
  }, [])

  useEffect(() => {
    if (!slug) return
    let ok = true
    setProduct(null)
    setErr(false)
    setSimilar([])
    setSimilarLoading(true)
    setActiveImg(0)
    setImgKey(0)
    setViewerOpen(false)
    setQty(1)
    setSelectedSize('')
    setAdded(false)
    fetchProductBySlug(slug)
      .then((p) => {
        if (!ok || p.slug !== slug) return
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

  // ── Hooks: لا بدّ من استدعائها قبل أي return مبكّر ──
  const seoLD = useMemo(() => {
    if (!product) return undefined
    const canonicalUrl = buildCanonical(`/product/${product.slug}`)
    const tt = isAr ? product.nameAr : product.name
    return [
      productLD(
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          nameAr: product.nameAr,
          description: product.description,
          descriptionAr: product.descriptionAr,
          price: product.price,
          images: product.images,
          sizes: product.sizes,
          stock: product.stock,
          category: product.category ?? null,
        },
        { isAr, canonical: canonicalUrl, rating: siteRating },
      ),
      breadcrumbLD([
        { name: isAr ? 'الرئيسية' : 'Home', url: buildCanonical('/') },
        { name: isAr ? 'المنتجات' : 'Products', url: buildCanonical('/products') },
        ...(product.category
          ? [{
              name: isAr ? product.category.nameAr : product.category.name,
              url: buildCanonical(`/category/${product.category.slug}`),
            }]
          : []),
        { name: tt, url: canonicalUrl },
      ]),
    ]
  }, [product, isAr, siteRating])

  if (err || !slug) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-slate-600 dark:text-slate-300">{t('notFound')}</p>
        <Link to="/products" className="mt-4 inline-block text-sm underline underline-offset-4">{t('viewAll')}</Link>
      </div>
    )
  }

  if (!product || product.slug !== slug) return <ProductDetailShimmer />

  const title = isAr ? product.nameAr : product.name
  const desc = isAr ? product.descriptionAr : product.description
  const images = product.images
  const canBuy = product.stock > 0
  const maxQty = Math.max(1, product.stock)
  const pricing = getPricing(product)

  const priceFormatted = `${pricing.effective.toLocaleString('en-US')} IQD`
  const seoDesc = `${priceFormatted}${pricing.hasDiscount ? ` (خصم ${pricing.discountPercent}٪)` : ''} — ${desc || (isAr ? 'منتج فيكتوري راقٍ' : 'A refined Victorian product')}`

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
      <SEO
        title={title}
        description={seoDesc}
        image={images[0] ?? null}
        type="product"
        lang={isAr ? 'ar' : 'en'}
        productPrice={product.price}
        productAvailability={canBuy ? 'in stock' : 'out of stock'}
        keywords={[
          title,
          product.category ? (isAr ? product.category.nameAr : product.category.name) : '',
          isAr ? 'متجر فيكتوريان' : 'Victorian Iraq',
          ...(product.sizes || []),
        ].filter(Boolean) as string[]}
        jsonLd={seoLD}
      />
      {/* Breadcrumb — صفّ واحد دائماً، اسم المنتج يُقصّ بـ … */}
      <nav
        className="mb-6 flex w-full min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden text-sm text-victorian-500 dark:text-cream-300"
        dir={isAr ? 'rtl' : 'ltr'}
        aria-label={isAr ? 'مسار التنقّل' : 'Breadcrumb'}
      >
        <Link
          to="/"
          className="inline-flex shrink-0 items-center gap-1 transition hover:text-burgundy-700 dark:hover:text-victorian-300"
        >
          <Home className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">{isAr ? 'الرئيسية' : 'Home'}</span>
        </Link>
        <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${isAr ? 'rotate-180' : ''}`} />
        {product.category ? (
          <Link
            to={`/products?category=${product.category.slug}`}
            className="max-w-[40%] shrink-0 truncate transition hover:text-burgundy-700 dark:hover:text-victorian-300"
            title={isAr ? product.category.nameAr : product.category.name}
          >
            {isAr ? product.category.nameAr : product.category.name}
          </Link>
        ) : (
          <Link
            to="/products"
            className="shrink-0 transition hover:text-burgundy-700 dark:hover:text-victorian-300"
          >
            {isAr ? 'المنتجات' : 'Products'}
          </Link>
        )}
        <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${isAr ? 'rotate-180' : ''}`} />
        <span
          className="min-w-0 flex-1 truncate font-medium text-victorian-900 dark:text-cream-50"
          title={title}
        >
          {title}
        </span>
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
                  alt={`${title}${product.category ? ` — ${isAr ? product.category.nameAr : product.category.name}` : ''}`}
                  className="img-fade aspect-[4/5] w-full cursor-zoom-in object-cover"
                  loading="eager"
                  decoding="async"
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
                    <img
                      src={img}
                      alt={`${title} — ${isAr ? 'عرض' : 'view'} ${i + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

        {/* Info */}
        <div className="-mt-4 flex flex-col pt-0 md:-mt-6 md:w-1/2 lg:w-7/12 lg:-mt-7">
          <h1 className="font-display text-2xl font-bold leading-tight text-victorian-900 dark:text-cream-50 sm:text-3xl lg:text-4xl">
            {title}
          </h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1" dir={isAr ? 'rtl' : 'ltr'}>
            <span
              className={`font-display text-3xl font-bold sm:text-4xl ${
                pricing.hasDiscount
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-burgundy-700 dark:text-victorian-300'
              }`}
            >
              {formatNumberEn(pricing.effective)}
            </span>
            <span className="font-display text-sm font-semibold uppercase tracking-widest text-victorian-500">
              {isAr ? 'د.ع' : 'IQD'}
            </span>
            {pricing.hasDiscount && (
              <>
                <span className="font-display text-lg font-medium text-victorian-500 line-through tabular-nums dark:text-victorian-400 sm:text-xl">
                  {formatNumberEn(pricing.original)}
                </span>
                <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                  {isAr ? `وفّر ${pricing.discountPercent}٪` : `Save ${pricing.discountPercent}%`}
                </span>
              </>
            )}
          </div>

          <div className="mt-4">
            {canBuy ? (
              <div className="inline-flex items-center rounded-xl border border-victorian-200 bg-transparent px-3 py-2 text-xs font-semibold text-victorian-800 shadow-sm dark:border-victorian-600 dark:bg-transparent dark:text-victorian-200">
                {isAr ? 'متوفر' : 'In stock'} — {product.stock} {isAr ? 'قطعة' : 'units'}
              </div>
            ) : (
              <div className="inline-flex items-center rounded-xl border border-burgundy-200 bg-burgundy-50 px-3 py-1.5 text-xs font-semibold text-burgundy-700 dark:border-burgundy-900/50 dark:bg-burgundy-900/20 dark:text-burgundy-300">
                {t('outOfStock')}
              </div>
            )}
          </div>

          {canBuy && product.sizes.length > 0 && (
            <div className="mt-6 rounded-2xl bg-victorian-100/90 px-4 py-4 shadow-sm outline-none dark:bg-victorian-900/45 sm:px-5 sm:py-5">
              <p className="mb-2.5 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-victorian-500 dark:text-victorian-400">
                {isAr ? 'المقاس' : 'Size'}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`rounded-xl border px-4 py-2 font-display text-sm font-semibold transition ${
                      selectedSize === s
                        ? 'border-burgundy-700 bg-burgundy-700 text-cream-50 shadow-sm dark:border-victorian-300 dark:bg-victorian-300 dark:text-victorian-900'
                        : 'border-victorian-300 bg-cream-50/60 text-victorian-700 hover:border-burgundy-600 dark:border-victorian-600 dark:bg-victorian-950/40 dark:text-cream-200 dark:hover:border-victorian-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 flex items-center gap-3 sm:mt-14 md:mt-16" dir="ltr">
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
                  price: pricing.effectiveStr,
                  size: selectedSize,
                  quantity: qty,
                })
                setAdded(true)
                setTimeout(() => setAdded(false), 2000)
              }}
              className={`inline-flex min-h-0 flex-1 items-center justify-center gap-2 rounded-2xl border-2 py-3.5 font-display text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:py-4 sm:text-sm sm:tracking-[0.18em] ${
                added
                  ? 'border-burgundy-700 bg-transparent text-burgundy-700 dark:border-victorian-300 dark:text-victorian-300'
                  : product.sizes.length > 0 && !selectedSize
                    ? 'border-victorian-300 bg-victorian-100 text-victorian-400 dark:border-victorian-700 dark:bg-victorian-800 dark:text-victorian-500'
                    : 'border-burgundy-700 bg-burgundy-700 text-cream-50 hover:bg-burgundy-800'
              }`}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                  <span className="truncate">{isAr ? 'تمت الإضافة' : 'Added'}</span>
                </>
              ) : product.sizes.length > 0 && !selectedSize ? (
                <>
                  <ShoppingBag className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                  <span className="truncate">{isAr ? 'اختر مقاس أولاً' : 'Select a size first'}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                  <span className="truncate">{t('addToCart')}</span>
                </>
              )}
            </button>

            {canBuy && (
              <div
                className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-victorian-300 bg-cream-50/95 px-3 py-1 shadow-sm dark:border-victorian-600 dark:bg-victorian-950/70 sm:gap-2 sm:px-4 sm:py-1.5"
                role="group"
                aria-label={isAr ? 'الكمية' : 'Quantity'}
              >
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-victorian-700 outline-none transition hover:bg-victorian-200/90 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:text-cream-200 dark:hover:bg-victorian-800/90"
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
                <span className="min-w-[2.25rem] px-2 text-center font-display text-base font-bold tabular-nums leading-none text-victorian-900 dark:text-cream-50 sm:min-w-[2.75rem] sm:px-3">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-victorian-700 outline-none transition hover:bg-victorian-200/90 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:text-cream-200 dark:hover:bg-victorian-800/90"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-victorian-300 bg-cream-50/80 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.15em] text-victorian-800 transition hover:border-burgundy-600 hover:text-burgundy-800 dark:border-victorian-600 dark:bg-victorian-900/40 dark:text-cream-200 dark:hover:border-victorian-400 dark:hover:text-cream-50 sm:mt-8 md:mt-9"
          >
            <Share2 className="h-5 w-5" />
            {isAr ? 'مشاركة' : 'Share'}
          </button>

          {desc && (
            <div className="mt-8 border-t border-victorian-200 pt-6 dark:border-victorian-800">
              <p className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.25em] text-victorian-500 sm:text-[11px]">
                {isAr ? 'الوصف' : 'Description'}
              </p>
              <p className="whitespace-pre-line text-base leading-relaxed text-victorian-700 dark:text-cream-200 sm:text-lg">
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
