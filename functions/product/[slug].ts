/**
 * Cloudflare Pages Function — يحقن ميتا/JSON-LD ديناميكية لروابط /product/:slug
 * يطابق /product/<أي-سلق-بدون-شرطة>. لا يطابق المسارات الأعمق.
 */

import {
  STORE_OG_NAME,
  type SeoEnv,
  absoluteOgImageUrl,
  escapeHtmlAttr,
  readHtmlBody,
  resolveApiBase,
  safeJsonLd,
  stripDuplicateOgImageMeta,
} from '../_lib/seo'

type Category = { slug: string; name: string; nameAr: string }

type ProductJson = {
  id?: string
  slug?: string
  name?: string
  nameAr?: string
  description?: string
  descriptionAr?: string
  price?: string
  salePrice?: string | null
  images?: string[]
  sizes?: string[]
  stock?: number
  category?: Category | null
}

type ReviewsAgg = { count: number; average: number }

export const onRequest: PagesFunction<SeoEnv> = async (context) => {
  const { request, env, next, params } = context
  const slug = decodeURIComponent(String(params.slug || ''))
  if (!slug) return next()

  const apiBase = resolveApiBase(env)
  const url = new URL(request.url)

  // جلب المنتج + ملخص التقييمات بالتوازي
  const [productRes, reviewsRes] = await Promise.all([
    fetch(`${apiBase}/api/products/slug/${encodeURIComponent(slug)}`).catch(() => null),
    fetch(`${apiBase}/api/reviews`).catch(() => null),
  ])

  let product: ProductJson | null = null
  if (productRes?.ok) {
    try { product = (await productRes.json()) as ProductJson } catch { /* ignore */ }
  }
  let reviews: ReviewsAgg | null = null
  if (reviewsRes?.ok) {
    try {
      const j = (await reviewsRes.json()) as { count?: number; average?: number }
      if (j && typeof j.count === 'number' && typeof j.average === 'number') {
        reviews = { count: j.count, average: j.average }
      }
    } catch { /* ignore */ }
  }

  const res = await next()
  if (!product) return res
  const body = await readHtmlBody(res)
  if (!body) return res

  const pageOrigin = url.origin
  const imgUrl = absoluteOgImageUrl(product.images?.[0], pageOrigin, apiBase)
  const canonical = `${pageOrigin}${url.pathname}`
  const titlePlain = String(product.nameAr || product.name || '')
  const titleEn = String(product.name || product.nameAr || '')
  const descPlain = String(product.descriptionAr || product.description || '')
  const originalNum = Number(product.price ?? 0)
  const saleNum = product.salePrice != null ? Number(product.salePrice) : NaN
  const onSale = Number.isFinite(saleNum) && saleNum > 0 && saleNum < originalNum
  const effectiveNum = onSale ? saleNum : originalNum
  const discountPct = onSale ? Math.max(1, Math.round(((originalNum - saleNum) / originalNum) * 100)) : 0
  const priceStr = effectiveNum ? `${effectiveNum.toLocaleString('en-US')} IQD` : ''
  const stock = Number(product.stock ?? 0)
  const availability = stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
  const ogAvailability = stock > 0 ? 'in stock' : 'out of stock'
  const title = escapeHtmlAttr(titlePlain)
  const desc = escapeHtmlAttr(
    `${priceStr ? `${priceStr} — ` : ''}${onSale ? `(خصم ${discountPct}٪) ` : ''}${descPlain}`.slice(0, 300),
  )
  const img = escapeHtmlAttr(imgUrl)
  const canonicalEsc = escapeHtmlAttr(canonical)

  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonical}#product`,
    name: titlePlain,
    alternateName: titleEn,
    sku: product.id ?? product.slug,
    mpn: product.slug,
    description: descPlain,
    image: (product.images || []).map((i) => absoluteOgImageUrl(i, pageOrigin, apiBase)),
    brand: { '@type': 'Brand', name: STORE_OG_NAME },
    category: product.category ? (product.category.nameAr || product.category.name) : undefined,
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'IQD',
      price: String(effectiveNum),
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: STORE_OG_NAME },
      ...(onSale
        ? {
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              priceType: 'https://schema.org/SalePrice',
              price: String(effectiveNum),
              priceCurrency: 'IQD',
              referencePrice: {
                '@type': 'UnitPriceSpecification',
                priceType: 'https://schema.org/ListPrice',
                price: String(originalNum),
                priceCurrency: 'IQD',
              },
            },
          }
        : {}),
    },
  }
  if (product.sizes?.length) productJsonLd.size = product.sizes
  if (reviews && reviews.count > 0 && reviews.average > 0) {
    productJsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: reviews.average.toFixed(1),
      reviewCount: reviews.count,
      bestRating: 5,
      worstRating: 1,
    }
  }

  const breadcrumbsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${pageOrigin}/` },
      { '@type': 'ListItem', position: 2, name: 'المنتجات', item: `${pageOrigin}/products` },
      ...(product.category
        ? [{
            '@type': 'ListItem',
            position: 3,
            name: product.category.nameAr || product.category.name,
            item: `${pageOrigin}/category/${product.category.slug}`,
          }]
        : []),
      {
        '@type': 'ListItem',
        position: product.category ? 4 : 3,
        name: titlePlain,
        item: canonical,
      },
    ],
  }

  const metaTags = `
              <link rel="canonical" href="${canonicalEsc}" data-ssr="1" />
              <link rel="alternate" hreflang="ar" href="${canonicalEsc}" data-ssr="1" />
              <link rel="alternate" hreflang="en" href="${canonicalEsc}?lang=en" data-ssr="1" />
              <link rel="alternate" hreflang="x-default" href="${canonicalEsc}" data-ssr="1" />
              <meta name="description" content="${desc}" data-ssr="1" />
              <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" data-ssr="1" />
              <meta property="og:url" content="${canonicalEsc}" data-ssr="1" />
              <meta property="og:title" content="${title} | ${STORE_OG_NAME}" data-ssr="1" />
              <meta property="og:description" content="${desc}" data-ssr="1" />
              <meta property="og:image" content="${img}" data-ssr="1" />
              <meta property="og:image:alt" content="${title}" data-ssr="1" />
              <meta property="og:type" content="product" data-ssr="1" />
              <meta property="og:site_name" content="${STORE_OG_NAME}" data-ssr="1" />
              <meta property="og:locale" content="ar_IQ" data-ssr="1" />
              <meta property="og:locale:alternate" content="en_US" data-ssr="1" />
              <meta property="product:price:amount" content="${escapeHtmlAttr(String(effectiveNum))}" data-ssr="1" />
              <meta property="product:price:currency" content="IQD" data-ssr="1" />
              <meta property="product:availability" content="${ogAvailability}" data-ssr="1" />
              <meta name="twitter:card" content="summary_large_image" data-ssr="1" />
              <meta name="twitter:title" content="${title} | ${STORE_OG_NAME}" data-ssr="1" />
              <meta name="twitter:description" content="${desc}" data-ssr="1" />
              <meta name="twitter:image" content="${img}" data-ssr="1" />
              <script type="application/ld+json" data-ssr="product">${safeJsonLd(productJsonLd)}</script>
              <script type="application/ld+json" data-ssr="breadcrumbs">${safeJsonLd(breadcrumbsJsonLd)}</script>
            `

  let out = stripDuplicateOgImageMeta(body.html)
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(titlePlain)} | ${STORE_OG_NAME}</title>`)
  out = out.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/i, '')
  out = out.replace('</head>', `${metaTags}</head>`)

  return new Response(out, { status: body.status, headers: body.headers })
}
