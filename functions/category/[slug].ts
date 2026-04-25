/**
 * Cloudflare Pages Function — يحقن ميتا/JSON-LD ديناميكية لروابط /category/:slug
 */

import {
  STORE_OG_NAME,
  STORE_OG_NAME_AR,
  type SeoEnv,
  absoluteOgImageUrl,
  escapeHtmlAttr,
  readHtmlBody,
  resolveApiBase,
  safeJsonLd,
  stripDuplicateOgImageMeta,
} from '../_lib/seo'

type Cat = { slug: string; name: string; nameAr: string; image?: string | null }

export const onRequest: PagesFunction<SeoEnv> = async (context) => {
  const { request, env, next, params } = context
  const slug = decodeURIComponent(String(params.slug || ''))
  if (!slug) return next()

  const apiBase = resolveApiBase(env)
  const url = new URL(request.url)

  let cat: Cat | null = null
  try {
    const r = await fetch(`${apiBase}/api/categories`)
    if (r.ok) {
      const list = (await r.json()) as Cat[]
      cat = list.find((c) => c.slug === slug) ?? null
    }
  } catch { /* ignore */ }

  const res = await next()
  if (!cat) return res
  const body = await readHtmlBody(res)
  if (!body) return res

  const pageOrigin = url.origin
  const titlePlain = String(cat.nameAr || cat.name || '')
  const canonical = `${pageOrigin}${url.pathname}`
  const imgUrl = absoluteOgImageUrl(cat.image ?? '', pageOrigin, apiBase)
  const descPlain = `تشكيلة ${titlePlain} في ${STORE_OG_NAME_AR} — منتجات أصلية بأسعار بالدينار العراقي وتوصيل لكل المحافظات.`
  const desc = escapeHtmlAttr(descPlain.slice(0, 300))
  const title = escapeHtmlAttr(titlePlain)
  const img = escapeHtmlAttr(imgUrl)
  const canonicalEsc = escapeHtmlAttr(canonical)

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: titlePlain,
    description: descPlain,
    url: canonical,
    image: imgUrl,
    isPartOf: { '@id': `${pageOrigin}/#website` },
  }
  const breadcrumbsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${pageOrigin}/` },
      { '@type': 'ListItem', position: 2, name: 'المنتجات', item: `${pageOrigin}/products` },
      { '@type': 'ListItem', position: 3, name: titlePlain, item: canonical },
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
              <meta property="og:type" content="website" data-ssr="1" />
              <meta property="og:site_name" content="${STORE_OG_NAME}" data-ssr="1" />
              <meta property="og:locale" content="ar_IQ" data-ssr="1" />
              <meta property="og:locale:alternate" content="en_US" data-ssr="1" />
              <meta name="twitter:card" content="summary_large_image" data-ssr="1" />
              <meta name="twitter:title" content="${title} | ${STORE_OG_NAME}" data-ssr="1" />
              <meta name="twitter:description" content="${desc}" data-ssr="1" />
              <meta name="twitter:image" content="${img}" data-ssr="1" />
              <script type="application/ld+json" data-ssr="collection">${safeJsonLd(collectionJsonLd)}</script>
              <script type="application/ld+json" data-ssr="breadcrumbs">${safeJsonLd(breadcrumbsJsonLd)}</script>
            `

  let out = stripDuplicateOgImageMeta(body.html)
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(titlePlain)} | ${STORE_OG_NAME}</title>`)
  out = out.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/i, '')
  out = out.replace('</head>', `${metaTags}</head>`)

  return new Response(out, { status: body.status, headers: body.headers })
}
