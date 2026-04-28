import { useEffect, useState, type ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import { TurnstileWidget } from './TurnstileWidget'

const STORAGE_KEY = 'cf_site_gate_pass_v1'
const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '') as string
const API_BASE = (import.meta.env.VITE_API_BASE ?? '') as string

type Pass = { expiresAt: number }

function readPass(): Pass | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const obj = JSON.parse(raw) as Pass
    if (typeof obj?.expiresAt !== 'number') return null
    if (Date.now() >= obj.expiresAt) return null
    return obj
  } catch {
    return null
  }
}

function writePass(p: Pass) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    /* ignore quota / private mode */
  }
}

/** يكتشف لغة المتصفح بشكل بسيط لاختيار النصوص */
function detectIsArabic(): boolean {
  if (typeof navigator === 'undefined') return true
  const l = (navigator.language || '').toLowerCase()
  return l.startsWith('ar') || l.startsWith('ku')
}

type Props = { children: ReactNode }

/**
 * بوابة حماية تظهر مرة واحدة عند دخول الموقع، تتحقق من الزائر عبر
 * Cloudflare Turnstile ثم تخفي نفسها لمدة 12 ساعة.
 *
 * - إذا لم يُضبط VITE_TURNSTILE_SITE_KEY (التطوير المحلي) تمرّ تلقائياً.
 * - يحفظ الإثبات في localStorage حتى لا تُزعج الزائر بين الصفحات.
 * - الـ token يُتحقق منه على الخادم عبر /api/security/verify.
 */
export function SiteGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (!SITE_KEY) return true // معطّل محلياً
    return readPass() !== null
  })
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isAr = detectIsArabic()

  // إن أُلغي الإثبات بين فتحات الصفحة (انتهاء الصلاحية) ابقَ مغلقاً
  useEffect(() => {
    if (!SITE_KEY) return
    const id = setInterval(() => {
      if (!readPass()) setUnlocked(false)
    }, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const handleVerify = async (token: string) => {
    setVerifying(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/security/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        expiresAt?: number
      }
      if (!res.ok || !data.ok || !data.expiresAt) {
        throw new Error('verification_failed')
      }
      writePass({ expiresAt: data.expiresAt })
      setUnlocked(true)
    } catch {
      setError(
        isAr
          ? 'فشل التحقق. يرجى تحديث الصفحة والمحاولة مرة أخرى.'
          : 'Verification failed. Please refresh and try again.',
      )
    } finally {
      setVerifying(false)
    }
  }

  if (unlocked) return <>{children}</>

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-cream-50 p-6 dark:bg-victorian-950"
    >
      <div className="w-full max-w-md rounded-2xl border-2 border-victorian-300 bg-white p-8 text-center shadow-xl dark:border-victorian-700 dark:bg-slate-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-victorian-100 text-victorian-700 dark:bg-victorian-900/40 dark:text-victorian-300">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <p className="mt-6 font-display text-[11px] uppercase tracking-[0.3em] text-victorian-600 dark:text-victorian-300">
          ◆ {isAr ? 'تحقق أمان' : 'Security check'} ◆
        </p>
        <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
          {isAr ? 'تأكدنا أنك إنسان' : 'Verifying you are human'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {isAr
            ? 'هذا فحص أمان سريع لحماية المتجر من البرامج الآلية. لن يستغرق سوى ثوانٍ.'
            : 'A quick security check to protect the store from bots. It only takes a few seconds.'}
        </p>

        <div className="mt-8 flex justify-center">
          {SITE_KEY ? (
            <TurnstileWidget
              siteKey={SITE_KEY}
              language={isAr ? 'ar' : 'en'}
              onVerify={handleVerify}
              onExpire={() => setUnlocked(false)}
              onError={() =>
                setError(
                  isAr
                    ? 'تعذر تحميل أداة التحقق. تحقق من اتصالك.'
                    : 'Could not load verification widget. Check your connection.',
                )
              }
            />
          ) : null}
        </div>

        {verifying && (
          <p className="mt-4 text-xs text-slate-400">
            {isAr ? 'جاري التحقق…' : 'Verifying…'}
          </p>
        )}
        {error && (
          <p className="mt-4 text-sm text-rose-500">{error}</p>
        )}

        <p className="mt-8 text-[10px] uppercase tracking-widest text-slate-400">
          {isAr ? 'محمي بواسطة Cloudflare' : 'Protected by Cloudflare'}
        </p>
      </div>
    </div>
  )
}
