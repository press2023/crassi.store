/**
 * أدوات SEO مشتركة بين الواجهة والخادم.
 * - تحديد canonical site URL
 * - بناء روابط مطلقة آمنة للصور
 * - مولّدات JSON-LD (Organization, WebSite, Product, BreadcrumbList, ItemList, FAQPage)
 * - تخريج HTML آمن للـ meta tags في SSR
 */

export const SITE_NAME = 'Victorian Iraq'
export const SITE_NAME_AR = 'متجر فيكتوريان'
export const DEFAULT_LOCALE = 'ar_IQ'
export const ALT_LOCALE = 'en_US'
export const CURRENCY = 'IQD'

/** أصل الموقع العام (يُستخدم في canonical/og:url). */
export function getSiteOrigin(): string {
  const env = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || ''
  if (env) return env.trim().replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  return 'https://victorianiraq.com'
}

/** أصل ملفات /uploads (قد يختلف عن أصل الصفحة لو الـ API على Railway والصفحة على Netlify). */
export function getUploadsOrigin(): string {
  const env = (import.meta.env.VITE_PUBLIC_API_ORIGIN as string | undefined) || ''
  if (env) return env.trim().replace(/\/$/, '')
  return getSiteOrigin()
}

/** يحوّل صورة نسبية (/uploads/x.jpg) أو مطلقة إلى URL مطلق صالح للمشاركة. */
export function absoluteImageUrl(raw: string | undefined | null, fallback?: string): string {
  const fb = fallback ?? `${getSiteOrigin()}/site-logo.jpg`
  const img = (raw || '').trim()
  if (!img) return fb
  if (/^https?:\/\//i.test(img)) return img
  const path = img.startsWith('/') ? img : `/${img}`
  const base = path.startsWith('/uploads/') ? getUploadsOrigin() : getSiteOrigin()
  return `${base}${path}`
}

/** يبني canonical لمسار داخلي (يبدأ بـ /). */
export function buildCanonical(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${getSiteOrigin()}${path}`
}

/** يقصّ نصاً ويزيل الأسطر الفارغة لاستخدامه في description. */
export function clampDescription(text: string | undefined | null, max = 200): string {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (s.length <= max) return s
  return `${s.slice(0, max - 1).trimEnd()}…`
}

/** هروب JSON-LD: إخفاء `</script` لمنع الكسر إن أُدرج داخل <script> من السيرفر. */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/<\/(script)/gi, '<\\/$1')
}

/** هروب قيم HTML attribute (مكافئ للـ escapeHtmlAttr في الخادم). */
export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// ── مولّدات JSON-LD ────────────────────────────────────────────────────────

export type ProductLDInput = {
  id: string
  slug: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  price: string | number
  images: string[]
  sizes?: string[]
  stock: number
  category?: { slug: string; name: string; nameAr: string } | null
}

/** Schema.org Product مع Offer و(اختياري) AggregateRating من تقييمات الموقع. */
export function productLD(
  p: ProductLDInput,
  opts: {
    isAr: boolean
    canonical: string
    rating?: { value: number; count: number } | null
  },
) {
  const { isAr, canonical, rating } = opts
  const name = isAr ? p.nameAr : p.name
  const altName = isAr ? p.name : p.nameAr
  const description = clampDescription(isAr ? p.descriptionAr : p.description, 500)
  const images = (p.images || []).map((i) => absoluteImageUrl(i)).filter(Boolean)
  const availability =
    p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonical}#product`,
    name,
    alternateName: altName,
    sku: p.id,
    mpn: p.slug,
    description,
    image: images.length ? images : undefined,
    brand: { '@type': 'Brand', name: SITE_NAME },
    category: p.category ? (isAr ? p.category.nameAr : p.category.name) : undefined,
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: CURRENCY,
      price: String(p.price),
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
  }
  if (p.sizes?.length) {
    node.size = p.sizes
  }
  if (rating && rating.count > 0 && rating.value > 0) {
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.value.toFixed(1),
      reviewCount: rating.count,
      bestRating: 5,
      worstRating: 1,
    }
  }
  return node
}

/** Breadcrumbs Schema.org (الأول الرئيسية، الأخير الصفحة الحالية). */
export function breadcrumbLD(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  }
}

/** قائمة منتجات (تصنيف/بحث/رئيسية) كـ ItemList مع روابط مباشرة. */
export function itemListLD(opts: {
  name: string
  url: string
  items: { slug: string; name: string; image?: string; price?: string }[]
}) {
  const origin = getSiteOrigin()
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: opts.name,
    url: opts.url,
    numberOfItems: opts.items.length,
    itemListElement: opts.items.slice(0, 30).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${origin}/product/${p.slug}`,
      name: p.name,
      image: p.image ? absoluteImageUrl(p.image) : undefined,
    })),
  }
}

/** صفحة جمعية لتصنيف. */
export function collectionPageLD(opts: {
  name: string
  description: string
  url: string
  image?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    image: opts.image ? absoluteImageUrl(opts.image) : undefined,
    isPartOf: { '@id': `${getSiteOrigin()}/#website` },
  }
}

/** FAQ schema لصفحة About / مساعدة. */
export function faqLD(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }
}
