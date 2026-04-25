import { useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile — تحقق "أنا إنسان" بدون CAPTCHA مزعج.
 * يُحمّل سكربت Cloudflare مرة واحدة ويعرض الودجت داخل div مرجعي.
 * https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
          'timeout-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          language?: string
          size?: 'normal' | 'compact' | 'flexible' | 'invisible'
          appearance?: 'always' | 'execute' | 'interaction-only'
        },
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
      getResponse: (widgetId?: string) => string | undefined
    }
  }
}

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]`,
    )
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('turnstile_load_failed')))
      return
    }
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('turnstile_load_failed'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

type Props = {
  /** Site Key العلني من لوحة Cloudflare Turnstile */
  siteKey: string
  /** يُستدعى عندما يجتاز المستخدم التحقق ويعطي token */
  onVerify: (token: string) => void
  /** عند انتهاء صلاحية الـtoken (5 دقائق افتراضياً) */
  onExpire?: () => void
  /** عند فشل تحميل الودجت أو خطأ شبكة */
  onError?: () => void
  theme?: 'light' | 'dark' | 'auto'
  /** ar | en | ku ... — يُترك فارغاً لاكتشاف لغة المتصفح */
  language?: string
  size?: 'normal' | 'compact' | 'flexible'
  className?: string
}

export function TurnstileWidget({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = 'auto',
  language,
  size = 'flexible',
  className = '',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  // إبقاء أحدث callbacks دون إعادة تركيب الودجت
  const onVerifyRef = useRef(onVerify)
  const onExpireRef = useRef(onExpire)
  const onErrorRef = useRef(onError)
  onVerifyRef.current = onVerify
  onExpireRef.current = onExpire
  onErrorRef.current = onError

  useEffect(() => {
    let cancelled = false
    if (!siteKey) return
    loadScript()
      .then(() => {
        if (cancelled) return
        const ts = window.turnstile
        const el = containerRef.current
        if (!ts || !el) return
        // امسح أي ودجت قديم قبل العرض (StrictMode)
        if (widgetIdRef.current) {
          try { ts.remove(widgetIdRef.current) } catch { /* ignore */ }
          widgetIdRef.current = null
        }
        widgetIdRef.current = ts.render(el, {
          sitekey: siteKey,
          callback: (token) => onVerifyRef.current?.(token),
          'expired-callback': () => onExpireRef.current?.(),
          'error-callback': () => onErrorRef.current?.(),
          theme,
          language,
          size,
        })
      })
      .catch(() => onErrorRef.current?.())
    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current) } catch { /* ignore */ }
        widgetIdRef.current = null
      }
    }
  }, [siteKey, theme, language, size])

  return <div ref={containerRef} className={className} />
}
