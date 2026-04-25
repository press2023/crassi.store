import 'dotenv/config'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import { Prisma } from '@prisma/client'
import { prisma } from './lib/prisma.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import uploadRoutes from './routes/upload.js'
import settingsRoutes from './routes/settings.js'
import visitorsRoutes from './routes/visitors.js'
import reviewsRoutes from './routes/reviews.js'
import pushRoutes from './routes/push.js'
import discountsRoutes, { evaluateDiscount } from './routes/discounts.js'
import { sendPushToAll } from './lib/push.js'
import { DELIVERY_FEE_IQD } from '../src/lib/deliveryFee.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const isProd = process.env.NODE_ENV === 'production'
const PORT = Number(process.env.PORT) || 3001
const distDir = path.join(__dirname, '..', 'dist')

const STORE_OG_NAME = 'Victorian Iraq'
const STORE_OG_NAME_AR = 'متجر فيكتوريان'

/** Escape text for use inside HTML double-quoted attributes */
function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Escape XML text node */
function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Safe JSON-LD (escape `</` to prevent script breakouts). */
function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/<\/(script)/gi, '<\\/$1')
}

function siteOriginFromReq(req: express.Request): string {
  const fromEnv = (process.env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  const rawProto = req.get('x-forwarded-proto') || req.protocol || 'https'
  const proto = rawProto.split(',')[0].trim() || 'https'
  const rawHost = req.get('x-forwarded-host') || req.get('host') || ''
  const host = rawHost.split(',')[0].trim()
  if (host) return `${proto}://${host}`
  return 'http://localhost:3001'
}

/**
 * Absolute URL for Open Graph images. Relative `/uploads/...` may be served from the API
 * host (e.g. Railway) while the page is on Netlify — use PUBLIC_API_ORIGIN when set.
 */
function absoluteOgImageUrl(raw: string | undefined, pageOrigin: string, publicApiOrigin: string | null): string {
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

app.use(
  cors(
    isProd
      ? { origin: false }
      : {
          origin: (origin, cb) => {
            // اسمح بأي طلب بدون origin (مثل curl) أو من localhost / شبكة محلية (Wi-Fi) أثناء التطوير
            if (!origin) return cb(null, true)
            try {
              const u = new URL(origin)
              const host = u.hostname
              const isLocal =
                host === 'localhost' ||
                host === '127.0.0.1' ||
                host === '::1' ||
                /^10\./.test(host) ||
                /^192\.168\./.test(host) ||
                /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
              return cb(null, isLocal)
            } catch {
              return cb(null, false)
            }
          },
        },
  ),
)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/visitors', visitorsRoutes)
app.use('/api/reviews', reviewsRoutes)
app.use('/api/admin/push', pushRoutes)
app.use('/api/discounts', discountsRoutes)

function serializeProduct(p: {
  price: { toString(): string }
  salePrice?: { toString(): string } | null
  category?: { id: string; slug: string; name: string; nameAr: string }
  [key: string]: unknown
}) {
  const { price, salePrice, category, ...rest } = p
  return {
    ...rest,
    price: price.toString(),
    salePrice: salePrice != null ? salePrice.toString() : null,
    category,
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'victorianiraq.com' })
})

app.get('/api/categories', async (_req, res) => {
  try {
    const rows = await prisma.category.findMany({ orderBy: { name: 'asc' } })
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'database_unavailable' })
  }
})

app.get('/api/products', async (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : undefined
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  const onSaleOnly = req.query.sale === '1' || req.query.sale === 'true'
  try {
    const rows = await prisma.product.findMany({
      where: {
        ...(category ? { category: { slug: category } } : {}),
        ...(onSaleOnly ? { salePrice: { not: null } } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { nameAr: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    })
    // فلترة إضافية: التخفيض الفعّال فقط (salePrice أصغر من price)
    const filtered = onSaleOnly
      ? rows.filter((p) => p.salePrice != null && Number(p.salePrice) > 0 && Number(p.salePrice) < Number(p.price))
      : rows
    res.json(filtered.map(serializeProduct))
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'database_unavailable' })
  }
})

app.get('/api/products/slug/:slug', async (req, res) => {
  try {
    const p = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { category: true },
    })
    if (!p) return res.status(404).json({ error: 'not_found' })
    res.json(serializeProduct(p))
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'database_unavailable' })
  }
})

app.post('/api/orders', async (req, res) => {
  const body = req.body as {
    customerName?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    province?: string
    landmark?: string
    notes?: string
    discountCode?: string | null
    items?: { productId: string; quantity: number; size: string; unitPrice: string; productName: string }[]
  }
  const items = body.items
  if (!items?.length) return res.status(400).json({ error: 'no_items' })
  const customerName = String(body.customerName ?? '').trim()
  const email = String(body.email ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  const address = String(body.address ?? '').trim()
  const city = String(body.city ?? '').trim()
  const province = String(body.province ?? '').trim()
  const landmark = String(body.landmark ?? '').trim()
  const notes = body.notes ? String(body.notes).trim() : null
  const discountCodeRaw = String(body.discountCode ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
  if (!customerName || !phone || !address || !province) {
    return res.status(400).json({ error: 'missing_fields' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let subtotal = new Prisma.Decimal(0)
      const lineData: {
        productId: string
        quantity: number
        size: string
        unitPrice: Prisma.Decimal
        productName: string
      }[] = []

      for (const line of items) {
        const qty = Math.max(1, Math.floor(Number(line.quantity) || 0))
        const product = await tx.product.findUnique({ where: { id: line.productId } })
        if (!product) throw new Error('product_not_found')
        if (product.stock < qty) throw new Error('insufficient_stock')
        // السعر الفعّال = sale لو ساري وأصغر من السعر الأصلي
        const sale = product.salePrice
        const useSale = sale != null && Number(sale) > 0 && Number(sale) < Number(product.price)
        const unitPrice = useSale ? sale : product.price
        subtotal = subtotal.add(unitPrice.mul(qty))
        lineData.push({
          productId: product.id,
          quantity: qty,
          size: String(line.size),
          unitPrice,
          productName: String(line.productName || product.nameAr),
        })
      }

      // كود الخصم — يُحسب على مجموع المنتجات قبل التوصيل
      let discountAmount = new Prisma.Decimal(0)
      let discountId: string | null = null
      let discountCode: string | null = null
      if (discountCodeRaw) {
        const d = await tx.discount.findUnique({ where: { code: discountCodeRaw } })
        if (!d) throw new Error('discount_not_found')
        const evalResult = evaluateDiscount(d, Number(subtotal))
        if (!evalResult.ok) throw new Error(`discount_${evalResult.error}`)
        discountAmount = new Prisma.Decimal(evalResult.amount)
        discountId = d.id
        discountCode = d.code
        await tx.discount.update({
          where: { id: d.id },
          data: { usageCount: { increment: 1 } },
        })
      }

      const total = subtotal.sub(discountAmount).add(new Prisma.Decimal(DELIVERY_FEE_IQD))

      const order = await tx.order.create({
        data: {
          customerName,
          email,
          phone,
          address,
          city,
          province,
          landmark,
          notes,
          total,
          status: 'pending',
          discountId,
          discountCode,
          discountAmount,
          items: {
            create: lineData.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              size: l.size,
              unitPrice: l.unitPrice,
              productName: l.productName,
            })),
          },
        },
      })

      for (const line of lineData) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        })
      }

      return { order, total, itemsCount: lineData.reduce((s, l) => s + l.quantity, 0) }
    })

    // إشعار صاحب المتجر بطلب جديد (لا يفشل الطلب إن فشل الإرسال)
    void sendPushToAll({
      title: 'طلب جديد',
      body: `${customerName} — ${province}${city ? ` / ${city}` : ''} — ${result.total.toString()} د.ع (${result.itemsCount} قطعة)`,
      url: `/admin/orders/${result.order.id}`,
      tag: `order-${result.order.id}`,
    }).catch((e) => console.error('[push] order notify failed:', e))

    res.status(201).json({ id: result.order.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'product_not_found') return res.status(400).json({ error: 'product_not_found' })
    if (msg === 'insufficient_stock') return res.status(400).json({ error: 'insufficient_stock' })
    if (msg === 'discount_not_found') return res.status(400).json({ error: 'discount_not_found' })
    if (msg.startsWith('discount_')) return res.status(400).json({ error: msg })
    console.error(e)
    res.status(503).json({ error: 'order_failed' })
  }
})

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: { product: { select: { images: true, slug: true } } },
        },
      },
    })
    if (!order) return res.status(404).json({ error: 'not_found' })
    res.json({
      id: order.id,
      createdAt: order.createdAt,
      customerName: order.customerName,
      phone: order.phone,
      province: order.province,
      city: order.city,
      address: order.address,
      landmark: order.landmark,
      total: order.total.toString(),
      status: order.status,
      discountCode: order.discountCode ?? null,
      discountAmount: order.discountAmount.toString(),
      items: order.items.map((i) => ({
        id: i.id,
        productName: i.productName,
        size: i.size,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toString(),
        image: i.product?.images?.[0] ?? null,
        slug: i.product?.slug ?? null,
      })),
    })
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

const uploadsPublic = path.join(__dirname, '..', 'public', 'uploads')
app.use('/uploads', express.static(uploadsPublic))

// ── SEO: robots.txt (ديناميكي حتى يطابق sitemap الأصل الحالي) ─────────────
app.get('/robots.txt', (req, res) => {
  const origin = siteOriginFromReq(req)
  const body = [
    '# Victorian Store — robots.txt',
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /login',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /track',
    'Disallow: /api/',
    'Disallow: /uploads/',
    'Disallow: /search?',
    'Crawl-delay: 1',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n')
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.send(body)
})

// ── SEO: sitemap.xml ديناميكي (المنتجات + التصنيفات + الصفحات الثابتة) ───
app.get('/sitemap.xml', async (req, res) => {
  try {
    const origin = siteOriginFromReq(req)
    const now = new Date().toISOString()
    const staticPages: { path: string; priority: string; changefreq: string }[] = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/products', priority: '0.9', changefreq: 'daily' },
      { path: '/sale', priority: '0.95', changefreq: 'daily' },
      { path: '/about', priority: '0.6', changefreq: 'monthly' },
      { path: '/reviews', priority: '0.7', changefreq: 'weekly' },
    ]

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        select: { slug: true, images: true },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({ select: { slug: true } }),
    ])

    const urls: string[] = []
    for (const sp of staticPages) {
      urls.push(
        `<url><loc>${escapeXml(`${origin}${sp.path}`)}</loc>` +
          `<lastmod>${now}</lastmod>` +
          `<changefreq>${sp.changefreq}</changefreq>` +
          `<priority>${sp.priority}</priority>` +
          `<xhtml:link rel="alternate" hreflang="ar" href="${escapeXml(`${origin}${sp.path}`)}"/>` +
          `<xhtml:link rel="alternate" hreflang="en" href="${escapeXml(`${origin}${sp.path}${sp.path.includes('?') ? '&' : '?'}lang=en`)}"/>` +
          `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${origin}${sp.path}`)}"/>` +
          `</url>`,
      )
    }
    for (const c of categories) {
      const u = `${origin}/category/${encodeURIComponent(c.slug)}`
      urls.push(
        `<url><loc>${escapeXml(u)}</loc><lastmod>${now}</lastmod>` +
          `<changefreq>weekly</changefreq><priority>0.8</priority></url>`,
      )
    }
    for (const p of products) {
      const u = `${origin}/product/${encodeURIComponent(p.slug)}`
      const lastmod = now
      const imageBlock = (p.images || [])
        .slice(0, 5)
        .map((img) => {
          const abs = absoluteOgImageUrl(
            img,
            origin,
            (process.env.PUBLIC_API_ORIGIN || '').trim().replace(/\/$/, '') || null,
          )
          return `<image:image><image:loc>${escapeXml(abs)}</image:loc></image:image>`
        })
        .join('')
      urls.push(
        `<url><loc>${escapeXml(u)}</loc><lastmod>${lastmod}</lastmod>` +
          `<changefreq>weekly</changefreq><priority>0.9</priority>` +
          imageBlock +
          `</url>`,
      )
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls.join('')}</urlset>`
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=600')
    res.send(xml)
  } catch (e) {
    console.error('sitemap error', e)
    res.status(503).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>')
  }
})

if (isProd) {
  app.use(express.static(distDir, { index: false })) // Disable serving index.html natively for root so we can inject meta tags if needed
  
  app.get('*', async (req, res) => {
    try {
      let html = await fs.promises.readFile(path.join(distDir, 'index.html'), 'utf8')

      const pageOrigin = siteOriginFromReq(req)
      const publicApiOrigin = (process.env.PUBLIC_API_ORIGIN || '').trim().replace(/\/$/, '') || null

      // ─── منتج ────────────────────────────────────────────────
      if (req.path.startsWith('/product/')) {
        const slug = req.path.split('/')[2]
        if (slug) {
          const p = await prisma.product.findUnique({
            where: { slug },
            include: { category: true },
          })
          if (p) {
            const imgUrl = absoluteOgImageUrl(p.images[0], pageOrigin, publicApiOrigin)
            const canonical = `${pageOrigin}${req.path}`
            const titlePlain = String(p.nameAr || p.name)
            const titleEn = String(p.name || p.nameAr)
            const descPlain = String(p.descriptionAr || p.description || '')
            const originalNum = Number(p.price)
            // التخفيض إن وُجد ساري (أصغر من السعر الأصلي)
            const saleNum = p.salePrice != null ? Number(p.salePrice) : NaN
            const onSale = Number.isFinite(saleNum) && saleNum > 0 && saleNum < originalNum
            const effectiveNum = onSale ? saleNum : originalNum
            const discountPct = onSale ? Math.max(1, Math.round(((originalNum - saleNum) / originalNum) * 100)) : 0
            const priceStr = `${effectiveNum.toLocaleString('en-US')} IQD`
            const availability = p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
            const ogAvailability = p.stock > 0 ? 'in stock' : 'out of stock'
            const title = escapeHtmlAttr(titlePlain)
            const desc = escapeHtmlAttr(
              `${priceStr}${onSale ? ` (خصم ${discountPct}٪)` : ''} — ${descPlain}`.slice(0, 300),
            )
            const img = escapeHtmlAttr(imgUrl)
            const canonicalEsc = escapeHtmlAttr(canonical)
            const titleTagFull = `${escapeHtmlAttr(titlePlain)} | ${STORE_OG_NAME}`

            // متوسط تقييم الموقع (Aggregate لكل المتجر)
            const ratingAgg = await prisma.review
              .aggregate({
                where: { approved: true },
                _avg: { rating: true },
                _count: { _all: true },
              })
              .catch(() => null)
            const ratingValue = ratingAgg?._avg?.rating ?? 0
            const reviewCount = ratingAgg?._count?._all ?? 0

            // JSON-LD: Product
            const productJsonLd: Record<string, unknown> = {
              '@context': 'https://schema.org',
              '@type': 'Product',
              '@id': `${canonical}#product`,
              name: titlePlain,
              alternateName: titleEn,
              sku: p.id,
              mpn: p.slug,
              description: descPlain,
              image: (p.images || []).map((i) => absoluteOgImageUrl(i, pageOrigin, publicApiOrigin)),
              brand: { '@type': 'Brand', name: STORE_OG_NAME },
              category: p.category ? p.category.nameAr || p.category.name : undefined,
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
            if (p.sizes?.length) (productJsonLd as Record<string, unknown>).size = p.sizes
            if (reviewCount > 0 && ratingValue > 0) {
              ;(productJsonLd as Record<string, unknown>).aggregateRating = {
                '@type': 'AggregateRating',
                ratingValue: Number(ratingValue).toFixed(1),
                reviewCount,
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
                ...(p.category
                  ? [{
                      '@type': 'ListItem',
                      position: 3,
                      name: p.category.nameAr || p.category.name,
                      item: `${pageOrigin}/category/${p.category.slug}`,
                    }]
                  : []),
                {
                  '@type': 'ListItem',
                  position: p.category ? 4 : 3,
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
            html = stripDuplicateOgImageMeta(html)
            html = html.replace(/<title>[^<]*<\/title>/, `<title>${titleTagFull}</title>`)
            html = html.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/i, '')
            html = html.replace('</head>', `${metaTags}</head>`)
          }
        }
      }
      // ─── تصنيف ──────────────────────────────────────────────
      else if (req.path.startsWith('/category/')) {
        const slug = req.path.split('/')[2]
        if (slug) {
          const cat = await prisma.category.findUnique({ where: { slug } })
          if (cat) {
            const titlePlain = String(cat.nameAr || cat.name)
            const canonical = `${pageOrigin}${req.path}`
            const imgUrl = absoluteOgImageUrl(cat.image ?? '', pageOrigin, publicApiOrigin)
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
              <meta name="description" content="${desc}" data-ssr="1" />
              <meta property="og:url" content="${canonicalEsc}" data-ssr="1" />
              <meta property="og:title" content="${title} | ${STORE_OG_NAME}" data-ssr="1" />
              <meta property="og:description" content="${desc}" data-ssr="1" />
              <meta property="og:image" content="${img}" data-ssr="1" />
              <meta property="og:type" content="website" data-ssr="1" />
              <meta name="twitter:card" content="summary_large_image" data-ssr="1" />
              <meta name="twitter:title" content="${title} | ${STORE_OG_NAME}" data-ssr="1" />
              <meta name="twitter:description" content="${desc}" data-ssr="1" />
              <meta name="twitter:image" content="${img}" data-ssr="1" />
              <script type="application/ld+json" data-ssr="collection">${safeJsonLd(collectionJsonLd)}</script>
              <script type="application/ld+json" data-ssr="breadcrumbs">${safeJsonLd(breadcrumbsJsonLd)}</script>
            `
            html = stripDuplicateOgImageMeta(html)
            html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(titlePlain)} | ${STORE_OG_NAME}</title>`)
            html = html.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/i, '')
            html = html.replace('</head>', `${metaTags}</head>`)
          }
        }
      }
      // ─── طلب (رابط مشاركة) ───────────────────────────────────
      else if (req.path.startsWith('/order/')) {
        const orderId = req.path.split('/')[2]
        if (orderId) {
          const ord = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
              items: {
                include: { product: { select: { images: true } } },
                take: 1,
              },
            },
          })
          if (ord) {
            const statusMapAr: Record<string, string> = {
              pending: 'قيد الانتظار',
              confirmed: 'تم التأكيد',
              shipped: 'تم الشحن',
              delivered: 'تم التوصيل',
              cancelled: 'ملغي',
            }
            const statusMapEn: Record<string, string> = {
              pending: 'Pending',
              confirmed: 'Confirmed',
              shipped: 'Shipped',
              delivered: 'Delivered',
              cancelled: 'Cancelled',
            }
            const statusAr = statusMapAr[ord.status] || ord.status
            const statusEn = statusMapEn[ord.status] || ord.status
            const shortId = ord.id.slice(-8).toUpperCase()
            const totalStr = `${Number(ord.total).toLocaleString('en-US')} د.ع`
            const itemImg = ord.items[0]?.product?.images?.[0] || ''
            const imgUrl = absoluteOgImageUrl(itemImg, pageOrigin, publicApiOrigin)
            const canonical = `${pageOrigin}${req.path}`
            const customerFirst = String(ord.customerName || '').split(' ')[0] || ''
            const titlePlain = `طلب #${shortId} — ${statusAr}`
            const descPlain = [
              `الحالة: ${statusAr}`,
              customerFirst ? `العميل: ${customerFirst}` : '',
              `المحافظة: ${ord.province}${ord.city ? ' / ' + ord.city : ''}`,
              `المجموع: ${totalStr}`,
            ].filter(Boolean).join(' · ').slice(0, 300)

            const title = escapeHtmlAttr(titlePlain)
            const desc = escapeHtmlAttr(descPlain)
            const img = escapeHtmlAttr(imgUrl)
            const canonicalEsc = escapeHtmlAttr(canonical)

            const metaTags = `
              <link rel="canonical" href="${canonicalEsc}" data-ssr="1" />
              <meta name="description" content="${desc}" data-ssr="1" />
              <meta name="robots" content="noindex, nofollow" data-ssr="1" />
              <meta property="og:url" content="${canonicalEsc}" data-ssr="1" />
              <meta property="og:title" content="${title} | ${STORE_OG_NAME}" data-ssr="1" />
              <meta property="og:description" content="${desc}" data-ssr="1" />
              <meta property="og:image" content="${img}" data-ssr="1" />
              <meta property="og:image:alt" content="${title}" data-ssr="1" />
              <meta property="og:type" content="website" data-ssr="1" />
              <meta property="og:site_name" content="${STORE_OG_NAME}" data-ssr="1" />
              <meta property="og:locale" content="ar_IQ" data-ssr="1" />
              <meta name="twitter:card" content="summary_large_image" data-ssr="1" />
              <meta name="twitter:title" content="${title} | ${STORE_OG_NAME}" data-ssr="1" />
              <meta name="twitter:description" content="${desc}" data-ssr="1" />
              <meta name="twitter:image" content="${img}" data-ssr="1" />
            `
            html = stripDuplicateOgImageMeta(html)
            html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(`${titlePlain} | ${STORE_OG_NAME_AR}`)} </title>`)
            html = html.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/i, '')
            html = html.replace('</head>', `${metaTags}</head>`)

            // (تنبيه استخدام customerEn لتلافي تحذير unused في حال عدم استخدامه لاحقاً)
            void statusEn
          }
        }
      }
      // ─── canonical افتراضي لباقي الصفحات ────────────────────
      else {
        const canonical = `${pageOrigin}${req.path}`
        html = html.replace(
          /<link\s+rel=["']canonical["'][^>]*>/i,
          `<link rel="canonical" href="${escapeHtmlAttr(canonical)}" />`,
        )
      }

      res.send(html)
    } catch (e) {
      console.error('Error serving index.html', e)
      res.status(500).send('Server Error')
    }
  })
}

const httpServer = app.listen(PORT, '::', () => {
  console.log(`[classi] API ${isProd ? 'production' : 'dev'} on port ${PORT}`)
})

httpServer.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `[classi] المنفذ ${PORT} مستخدم (EADDRINUSE). أوقف العملية الأخرى التي تستخدمه (مثلاً نافذة dev قديمة) أو عيّن PORT=3002 في .env ثم حدّث vite.config proxy إن لزم.`,
    )
  } else {
    console.error('[classi] خطأ في تشغيل الخادم:', err)
  }
  process.exit(1)
})
