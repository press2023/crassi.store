/** robots.txt مولَّد ديناميكياً من API على Railway */
import { type ProxyEnv, proxyRequest, resolveApiBase } from './_lib/proxy'

export const onRequest: PagesFunction<ProxyEnv> = async (context) => {
  const { request, env } = context
  const apiBase = resolveApiBase(env)
  return proxyRequest(request, `${apiBase}/robots.txt`)
}
