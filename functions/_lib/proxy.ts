/**
 * مساعد عام لتمرير الطلبات إلى Railway API ومنح الزائر استجابة
 * تبدو وكأنها تأتي من نفس النطاق (يحلّ محل [[redirects]] في Netlify).
 */

export interface ProxyEnv {
  PUBLIC_API_ORIGIN?: string
  SHARE_API_ORIGIN?: string
}

export function resolveApiBase(env: ProxyEnv): string {
  const raw = env.PUBLIC_API_ORIGIN || env.SHARE_API_ORIGIN || 'https://crassistore-production.up.railway.app'
  return raw.trim().replace(/\/$/, '')
}

/** يعيد توجيه نفس الطلب (طريقة + هيدرز + جسم) إلى الـ API */
export async function proxyRequest(request: Request, targetUrl: string): Promise<Response> {
  const init: RequestInit = {
    method: request.method,
    headers: stripHopHeaders(request.headers),
    body: hasBody(request.method) ? request.body : undefined,
    redirect: 'manual',
  }
  // تمرير body كستريم (Cloudflare يدعم هذا)
  // @ts-expect-error: duplex مطلوب في Workers عند تمرير ReadableStream
  init.duplex = 'half'

  const res = await fetch(targetUrl, init)
  // ننسخ الردّ بدون حمل أي محتوى ثقيل في الذاكرة (نعيد الاستجابة كما هي)
  const headers = new Headers(res.headers)
  headers.delete('content-encoding')
  headers.delete('content-length')
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}

function hasBody(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD'
}

function stripHopHeaders(h: Headers): Headers {
  const out = new Headers(h)
  // قِم برمي رؤوس Hop-by-Hop التي لا يجب تمريرها عبر الـ proxy
  out.delete('connection')
  out.delete('keep-alive')
  out.delete('proxy-authenticate')
  out.delete('proxy-authorization')
  out.delete('te')
  out.delete('trailer')
  out.delete('transfer-encoding')
  out.delete('upgrade')
  // host يُحدَّد تلقائياً من URL الهدف
  out.delete('host')
  return out
}
