/**
 * تمرير كل /uploads/* إلى Railway (الصور المرفوعة على الخادم).
 * Cloudflare يكاش الردّ تلقائياً عبر CDN لأن الـ headers تضع Cache-Control: immutable.
 */

import { type ProxyEnv, proxyRequest, resolveApiBase } from '../_lib/proxy'

export const onRequest: PagesFunction<ProxyEnv> = async (context) => {
  const { request, env, params } = context
  const apiBase = resolveApiBase(env)
  const subpath = Array.isArray(params.path) ? params.path.join('/') : (params.path ?? '')
  const url = new URL(request.url)
  const target = `${apiBase}/uploads/${subpath}${url.search}`
  return proxyRequest(request, target)
}
