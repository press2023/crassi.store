/**
 * تمرير كل /api/* إلى Railway (يُكافئ [[redirects]] في netlify.toml).
 */

import { type ProxyEnv, proxyRequest, resolveApiBase } from '../_lib/proxy'

export const onRequest: PagesFunction<ProxyEnv> = async (context) => {
  const { request, env, params } = context
  const apiBase = resolveApiBase(env)
  const subpath = Array.isArray(params.path) ? params.path.join('/') : (params.path ?? '')
  const url = new URL(request.url)
  const target = `${apiBase}/api/${subpath}${url.search}`
  return proxyRequest(request, target)
}
