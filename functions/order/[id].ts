/**
 * Cloudflare Pages Function — يحقن Open Graph meta لرابط مشاركة الطلب /order/:id
 * يستخرج بيانات الطلب من /api/orders/:id ويحقن في HTML:
 *   - العنوان: "طلب #ABCD1234 — تم التوصيل"
 *   - الوصف: الحالة + اسم العميل الأول + المحافظة/المدينة + المجموع
 *   - الصورة: أول صورة منتج في الطلب (مع رجوع لشعار الموقع)
 *   - noindex (لخصوصية بيانات الطلب)
 */

import {
  STORE_OG_NAME,
  STORE_OG_NAME_AR,
  type SeoEnv,
  absoluteOgImageUrl,
  escapeHtmlAttr,
  readHtmlBody,
  resolveApiBase,
  stripDuplicateOgImageMeta,
} from '../_lib/seo'

const STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'تم التأكيد',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
}

type OrderJson = {
  id?: string
  status?: string
  customerName?: string
  phone?: string
  province?: string
  city?: string
  total?: string
  items?: Array<{ image?: string | null; productName?: string }>
}

export const onRequest: PagesFunction<SeoEnv> = async (context) => {
  const { request, env, next, params } = context
  const orderId = decodeURIComponent(String(params.id || ''))
  if (!orderId) return next()

  const apiBase = resolveApiBase(env)
  const url = new URL(request.url)

  // اجلب بيانات الطلب من API
  const orderRes = await fetch(
    `${apiBase}/api/orders/${encodeURIComponent(orderId)}`,
  ).catch(() => null)

  let order: OrderJson | null = null
  if (orderRes?.ok) {
    try { order = (await orderRes.json()) as OrderJson } catch { /* ignore */ }
  }

  const res = await next()
  if (!order) return res
  const body = await readHtmlBody(res)
  if (!body) return res

  const pageOrigin = url.origin
  const canonical = `${pageOrigin}${url.pathname}`

  const status = String(order.status || 'pending')
  const statusAr = STATUS_AR[status] || status
  const shortId = String(order.id || orderId).slice(-8).toUpperCase()
  const totalNum = Number(order.total || 0)
  const totalStr = `${totalNum.toLocaleString('en-US')} د.ع`
  const itemImg = order.items?.[0]?.image || ''
  const imgUrl = absoluteOgImageUrl(itemImg, pageOrigin, apiBase)
  const customerFirst = String(order.customerName || '').trim().split(/\s+/)[0] || ''

  const titlePlain = `طلب #${shortId} — ${statusAr}`
  const descPlain = [
    `الحالة: ${statusAr}`,
    customerFirst ? `العميل: ${customerFirst}` : '',
    order.province ? `المحافظة: ${order.province}${order.city ? ' / ' + order.city : ''}` : '',
    `المجموع: ${totalStr}`,
  ]
    .filter(Boolean)
    .join(' · ')
    .slice(0, 300)

  const title = escapeHtmlAttr(titlePlain)
  const desc = escapeHtmlAttr(descPlain)
  const img = escapeHtmlAttr(imgUrl)
  const canonicalEsc = escapeHtmlAttr(canonical)
  const fullTitleTag = escapeHtmlAttr(`${titlePlain} | ${STORE_OG_NAME_AR}`)

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

  let out = stripDuplicateOgImageMeta(body.html)
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${fullTitleTag}</title>`)
  out = out.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/i, '')
  out = out.replace('</head>', `${metaTags}</head>`)

  return new Response(out, { status: body.status, headers: body.headers })
}
