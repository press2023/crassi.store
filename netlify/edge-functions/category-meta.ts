// Edge function: حقن ميتا/JSON-LD ديناميكية لروابط /category/:slug
const STORE_OG_NAME = 'Victorian Iraq'
const STORE_OG_NAME_AR = 'متجر فيكتوريان'

function escapeHtmlAttr(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/<\/(script)/gi, '<\\/$1')
}

function absoluteOgImageUrl(
  raw: string | undefined,
  pageOrigin: string,
  publicApiOrigin: string | null,
): string {
  const base = pageOrigin.replace(/\/$/, '')
  const fallback = `${base}/site-logo.jpg`
  const img = (raw || '').trim()
  if (!img) return fallback
  if (/^https?:\/\//i.test(img)) return img
  const pathPart = img.startsWith('/') ? img : `/${img}`
  const uploadsOnApi = pathPart.startsWith('/uploads/')
  const assetBase = (uploadsOnApi && publicApiOrigin ? publicApiOrigin : base).replace(/\/$/, '')
  return `${assetBase}${pathPart}`
}

function stripDuplicateOgImageMeta(html: string): string {
  return html
    .replace(/<meta\s+[^>]*property=["']og:image["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+[^>]*name=["']twitter:image["'][^>]*>\s*/gi, '')
}

type Cat = { slug: string; name: string; nameAr: string; image?: string | null }

export default async function categoryMeta(request: Request, context: { next: () => Promise<Response> }) {
  const url = new URL(request.url)
  const m = url.pathname.match(/^\/category\/([^/]+)/)
  if (!m) return context.next()

  const slug = decodeURIComponent(m[1])
  const apiBase = (
    Deno.env.get('PUBLIC_API_ORIGIN') ||
    Deno.env.get('SHARE_API_ORIGIN') ||
    'https://crassistore-production.up.railway.app'
  )
    .trim()
    .replace(/\/$/, '')

  let cat: Cat | null = null
  try {
    const r = await fetch(`${apiBase}/api/categories`)
    if (r.ok) {
      const list = (await r.json()) as Cat[]
      cat = list.find((c) => c.slug === slug) ?? null
    }
  } catch { /* ignore */ }

  const res = await context.next()
  const ct = res.headers.get('content-type') || ''
  if (!cat || !ct.includes('text/html')) return res

  const html = await res.text()
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

  let out = stripDuplicateOgImageMeta(html)
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(titlePlain)} | ${STORE_OG_NAME}</title>`)
  out = out.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/i, '')
  out = out.replace('</head>', `${metaTags}</head>`)

  const headers = new Headers(res.headers)
  headers.delete('content-length')
  return new Response(out, { status: res.status, headers })
}
