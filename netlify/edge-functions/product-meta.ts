const STORE_OG_NAME = 'Victorian Store'

function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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

type ProductJson = {
  name?: string
  nameAr?: string
  description?: string
  descriptionAr?: string
  price?: string
  images?: string[]
}

export default async function productMeta(request: Request, context: { next: () => Promise<Response> }) {
  const url = new URL(request.url)
  const m = url.pathname.match(/^\/product\/([^/]+)/)
  if (!m) return context.next()

  const slug = decodeURIComponent(m[1])
  const apiBase = (
    Deno.env.get('PUBLIC_API_ORIGIN') ||
    Deno.env.get('SHARE_API_ORIGIN') ||
    'https://crassistore-production.up.railway.app'
  )
    .trim()
    .replace(/\/$/, '')

  let product: ProductJson | null = null
  try {
    const r = await fetch(`${apiBase}/api/products/slug/${encodeURIComponent(slug)}`)
    if (r.ok) product = (await r.json()) as ProductJson
  } catch {
    /* ignore */
  }

  const res = await context.next()
  const ct = res.headers.get('content-type') || ''
  if (!product || !ct.includes('text/html')) return res

  const html = await res.text()
  const pageOrigin = url.origin
  const imgUrl = absoluteOgImageUrl(product.images?.[0], pageOrigin, apiBase)
  const canonical = `${pageOrigin}${url.pathname}`
  const titlePlain = String(product.nameAr || product.name || '')
  const descPlain = String(product.descriptionAr || product.description || '')
  const priceStr = product.price ? `${Number(product.price).toLocaleString()} IQD` : ''
  const title = escapeHtmlAttr(titlePlain)
  const desc = escapeHtmlAttr(`${priceStr ? `${priceStr} — ` : ''}${descPlain}`.slice(0, 300))
  const img = escapeHtmlAttr(imgUrl)
  const canonicalEsc = escapeHtmlAttr(canonical)

  const metaTags = `
              <meta property="og:url" content="${canonicalEsc}" />
              <meta property="og:title" content="${title} | ${STORE_OG_NAME}" />
              <meta property="og:description" content="${desc}" />
              <meta property="og:image" content="${img}" />
              <meta property="og:type" content="product" />
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content="${title} | ${STORE_OG_NAME}" />
              <meta name="twitter:description" content="${desc}" />
              <meta name="twitter:image" content="${img}" />
            `

  let out = stripDuplicateOgImageMeta(html)
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(titlePlain)} | ${STORE_OG_NAME}</title>`)
  out = out.replace('</head>', `${metaTags}</head>`)

  const headers = new Headers(res.headers)
  headers.delete('content-length')
  return new Response(out, { status: res.status, headers })
}
