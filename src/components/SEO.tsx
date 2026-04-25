import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ALT_LOCALE,
  DEFAULT_LOCALE,
  SITE_NAME,
  absoluteImageUrl,
  buildCanonical,
  clampDescription,
  safeJsonLd,
} from '../lib/seo'

const MANAGED_ATTR = 'data-seo'

/**
 * مدير ميتا/JSON-LD إعلاني للصفحات. لا يستخدم مكتبات خارجية:
 * يحدّث document.head مباشرة ويمسح ما أنشأه عند فك التركيب.
 *
 * - يُحدّث: title, meta name=description/keywords/robots, canonical,
 *   og:*, twitter:*, hreflang ar/en/x-default, JSON-LD متعددة.
 * - يحافظ على ميتا index.html الافتراضية (لا يحذفها) ويستبدل قيمها فقط للحقل
 *   الذي يديره عبر data-seo="managed".
 */
export type SEOProps = {
  title?: string
  description?: string
  keywords?: string | string[]
  /** المسار من جذر الموقع (افتراضياً يستخدم location الحالي). */
  pathname?: string
  image?: string | null
  /** نوع og: website (افتراضي), article, product. */
  type?: 'website' | 'article' | 'product'
  /** اللغة الحالية: ar | en. تؤثر على og:locale و html[lang]/[dir]. */
  lang?: 'ar' | 'en'
  /** noindex للصفحات الخاصة (سلة، دفع، 404...). */
  noindex?: boolean
  /** كائن/كائنات JSON-LD إضافية للصفحة. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
  /** OG type=product: السعر بالدينار العراقي. */
  productPrice?: string | number
  /** OG type=product: in stock / out of stock. */
  productAvailability?: 'in stock' | 'out of stock'
}

function setManagedMeta(selector: string, attrs: Record<string, string>) {
  const head = document.head
  let el = head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(MANAGED_ATTR, 'managed')
    head.appendChild(el)
  } else if (!el.hasAttribute(MANAGED_ATTR)) {
    el.setAttribute(MANAGED_ATTR, 'overridden')
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
}

function setManagedLink(rel: string, href: string, extra: Record<string, string> = {}) {
  const head = document.head
  const key = `link[rel="${rel}"]${
    extra.hreflang ? `[hreflang="${extra.hreflang}"]` : ''
  }`
  let el = head.querySelector<HTMLLinkElement>(key)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    el.setAttribute(MANAGED_ATTR, 'managed')
    head.appendChild(el)
  } else if (!el.hasAttribute(MANAGED_ATTR)) {
    el.setAttribute(MANAGED_ATTR, 'overridden')
  }
  el.href = href
  for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v)
}

function injectJsonLd(id: string, data: unknown) {
  const head = document.head
  let el = head.querySelector<HTMLScriptElement>(`script[type="application/ld+json"][data-seo-id="${id}"]`)
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.setAttribute('data-seo-id', id)
    el.setAttribute(MANAGED_ATTR, 'managed')
    head.appendChild(el)
  }
  el.textContent = safeJsonLd(data)
}

function removeManaged() {
  const head = document.head
  // فقط العناصر التي أنشأناها (managed)؛ الأخرى نُعيد قيمها الأولى ولا نلمسها هنا.
  head.querySelectorAll(`[${MANAGED_ATTR}="managed"]`).forEach((el) => el.remove())
}

export function SEO(props: SEOProps) {
  const location = useLocation()
  const path = props.pathname ?? location.pathname + (location.search || '')
  const lang: 'ar' | 'en' = props.lang ?? 'ar'

  useEffect(() => {
    const canonical = buildCanonical(path)
    const titleFull = props.title
      ? `${props.title} | ${SITE_NAME}`
      : `${SITE_NAME} — دفاتر فيكتورية وأقلام ريش وهدايا`
    const desc = clampDescription(
      props.description ??
        'متجر فيكتوريان عراقي: دفاتر فيكتورية، أقلام ريش، ساعات جيب، ظروف وهدايا كلاسيكية — توصيل لكل العراق.',
      200,
    )
    const image = absoluteImageUrl(props.image ?? undefined)
    const robots = props.noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1'

    // ── أساسيات ──
    document.title = titleFull
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'

    setManagedMeta('meta[name="description"]', { name: 'description', content: desc })
    setManagedMeta('meta[name="robots"]', { name: 'robots', content: robots })
    if (props.keywords) {
      const kw = Array.isArray(props.keywords) ? props.keywords.join(', ') : props.keywords
      setManagedMeta('meta[name="keywords"]', { name: 'keywords', content: kw })
    }

    // ── canonical + hreflang ──
    setManagedLink('canonical', canonical)
    setManagedLink('alternate', canonical, { hreflang: 'ar' })
    setManagedLink('alternate', `${canonical}${canonical.includes('?') ? '&' : '?'}lang=en`, {
      hreflang: 'en',
    })
    setManagedLink('alternate', canonical, { hreflang: 'x-default' })

    // ── Open Graph ──
    setManagedMeta('meta[property="og:url"]', { property: 'og:url', content: canonical })
    setManagedMeta('meta[property="og:title"]', { property: 'og:title', content: titleFull })
    setManagedMeta('meta[property="og:description"]', { property: 'og:description', content: desc })
    setManagedMeta('meta[property="og:image"]', { property: 'og:image', content: image })
    setManagedMeta('meta[property="og:image:alt"]', {
      property: 'og:image:alt',
      content: props.title || SITE_NAME,
    })
    setManagedMeta('meta[property="og:type"]', {
      property: 'og:type',
      content: props.type ?? 'website',
    })
    setManagedMeta('meta[property="og:site_name"]', {
      property: 'og:site_name',
      content: SITE_NAME,
    })
    setManagedMeta('meta[property="og:locale"]', {
      property: 'og:locale',
      content: lang === 'ar' ? DEFAULT_LOCALE : ALT_LOCALE,
    })
    setManagedMeta('meta[property="og:locale:alternate"]', {
      property: 'og:locale:alternate',
      content: lang === 'ar' ? ALT_LOCALE : DEFAULT_LOCALE,
    })

    // ── Twitter ──
    setManagedMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image',
    })
    setManagedMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: titleFull })
    setManagedMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: desc,
    })
    setManagedMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image })

    // ── product OG (لو منتج) ──
    if (props.type === 'product' && props.productPrice != null) {
      setManagedMeta('meta[property="product:price:amount"]', {
        property: 'product:price:amount',
        content: String(props.productPrice),
      })
      setManagedMeta('meta[property="product:price:currency"]', {
        property: 'product:price:currency',
        content: 'IQD',
      })
      if (props.productAvailability) {
        setManagedMeta('meta[property="product:availability"]', {
          property: 'product:availability',
          content: props.productAvailability,
        })
      }
    }

    // ── JSON-LD مخصّص للصفحة (إضافي للموجود في index.html) ──
    if (props.jsonLd) {
      const items = Array.isArray(props.jsonLd) ? props.jsonLd : [props.jsonLd]
      items.forEach((it, i) => injectJsonLd(`page-${i}`, it))
    }

    return () => {
      removeManaged()
    }
    // canonical يتغيّر مع المسار/البحث؛ والوصف/العنوان من props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    path,
    lang,
    props.title,
    props.description,
    props.image,
    props.type,
    props.noindex,
    JSON.stringify(props.keywords ?? null),
    JSON.stringify(props.jsonLd ?? null),
    props.productPrice,
    props.productAvailability,
    // origin معتمد على window — ثابت أثناء الجلسة
  ])

  return null
}

export default SEO
