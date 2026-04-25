/**
 * مكتبة مشتركة لحقن ميتا SEO من Cloudflare Pages Functions
 * (نفس منطق netlify/edge-functions/* السابق ولكن بتوقيع Cloudflare).
 */

export const STORE_OG_NAME = 'Victorian Iraq'
export const STORE_OG_NAME_AR = 'متجر فيكتوريان'

export interface SeoEnv {
  PUBLIC_API_ORIGIN?: string
  SHARE_API_ORIGIN?: string
}

/** أصل الـ API على Railway (يمكن تجاوزه عبر متغير بيئة في لوحة Cloudflare) */
export function resolveApiBase(env: SeoEnv): string {
  const raw = env.PUBLIC_API_ORIGIN || env.SHARE_API_ORIGIN || 'https://crassistore-production.up.railway.app'
  return raw.trim().replace(/\/$/, '')
}

export function escapeHtmlAttr(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/<\/(script)/gi, '<\\/$1')
}

export function absoluteOgImageUrl(
  raw: string | undefined | null,
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

export function stripDuplicateOgImageMeta(html: string): string {
  return html
    .replace(/<meta\s+[^>]*property=["']og:image["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+[^>]*name=["']twitter:image["'][^>]*>\s*/gi, '')
}

/** تأخذ استجابة index.html القادمة من next() وتعيد HTML بنصه — مع نسخ headers */
export async function readHtmlBody(res: Response): Promise<{ html: string; headers: Headers; status: number } | null> {
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('text/html')) return null
  const html = await res.text()
  const headers = new Headers(res.headers)
  headers.delete('content-length')
  headers.delete('etag')
  return { html, headers, status: res.status }
}
