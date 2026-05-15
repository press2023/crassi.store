import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Crown, ShoppingBag, X } from 'lucide-react'
import { fetchRecentPurchases, type RecentPurchase } from '../api'
import { useLanguage } from '../context/LanguageContext'

/**
 * بانر «شخص اشترى للتو X» — يظهر أسفل يسار/يمين الشاشة بنمط فيكتوريّ.
 * • يجلب آخر المشتريات كل ٦٠ ثانية
 * • يدوّر بين النتائج كل ٨ ثوانٍ (٦ ظهور + ٢ انتقال)
 * • يحفظ المعروضة في sessionStorage حتى لا تتكرر بنفس الجلسة
 * • مخفي على صفحات الأدمن والدفع وتأكيد الطلب
 */

const HIDE_ON_PREFIXES = ['/admin', '/checkout', '/cart', '/login', '/track', '/order/']
const STORAGE_SEEN = 'classi-sp-seen-v1'
const STORAGE_DISMISSED = 'classi-sp-dismissed-until'
const TOAST_VISIBLE_MS = 7000
const TOAST_GAP_MS = 2000
const REFETCH_MS = 60_000
const DISMISS_QUIET_MS = 30 * 60 * 1000 // ساعة ربع راحة بعد الإغلاق

function loadSeen(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_SEEN)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function saveSeen(set: Set<string>) {
  try {
    sessionStorage.setItem(STORAGE_SEEN, JSON.stringify([...set].slice(-200)))
  } catch { /* ignore */ }
}

function relativeTime(iso: string, isAr: boolean): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return isAr ? 'قبل لحظات' : 'moments ago'
  if (m < 60) return isAr ? `قبل ${m} دقيقة` : `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return isAr ? `قبل ${h} ساعة` : `${h} h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return isAr ? 'أمس' : 'yesterday'
  return isAr ? `قبل ${d} أيام` : `${d} d ago`
}

export function SocialProofToast() {
  const { isAr } = useLanguage()
  const location = useLocation()
  const [queue, setQueue] = useState<RecentPurchase[]>([])
  const [current, setCurrent] = useState<RecentPurchase | null>(null)
  const [phase, setPhase] = useState<'enter' | 'show' | 'leave'>('enter')
  const seenRef = useRef<Set<string>>(new Set())
  const cycleTimer = useRef<number | null>(null)
  const enterTimer = useRef<number | null>(null)
  const leaveTimer = useRef<number | null>(null)

  const hidden = useMemo(() => {
    return HIDE_ON_PREFIXES.some((p) => location.pathname.startsWith(p))
  }, [location.pathname])

  const dismissedUntil = useMemo(() => {
    try {
      const v = Number(sessionStorage.getItem(STORAGE_DISMISSED) || '0')
      return Number.isFinite(v) ? v : 0
    } catch {
      return 0
    }
  }, [])

  const isQuiet = Date.now() < dismissedUntil

  // تحميل seen مرة واحدة
  useEffect(() => {
    seenRef.current = loadSeen()
  }, [])

  // جلب البيانات
  const load = useCallback(async () => {
    const rows = await fetchRecentPurchases({ limit: 30 })
    setQueue((prev) => {
      const seen = seenRef.current
      // أبق العناصر غير المعروضة + الجديدة
      const map = new Map<string, RecentPurchase>()
      for (const r of prev) if (!seen.has(r.id)) map.set(r.id, r)
      for (const r of rows) if (!seen.has(r.id) && !map.has(r.id)) map.set(r.id, r)
      // فلتر ذاتي: لا تعرض اسم «زبون» العام لو فيه أسماء حقيقية
      const items = [...map.values()]
      const real = items.filter((r) => r.firstName && r.firstName !== 'زبون')
      return real.length > 0 ? real : items
    })
  }, [])

  useEffect(() => {
    if (hidden || isQuiet) return
    void load()
    const id = window.setInterval(load, REFETCH_MS)
    return () => window.clearInterval(id)
  }, [hidden, isQuiet, load])

  // دورة العرض
  useEffect(() => {
    if (hidden || isQuiet) return
    if (current || queue.length === 0) return
    const next = queue[0]
    setQueue((q) => q.slice(1))
    seenRef.current.add(next.id)
    saveSeen(seenRef.current)
    setCurrent(next)
    setPhase('enter')
    enterTimer.current = window.setTimeout(() => setPhase('show'), 50)
    leaveTimer.current = window.setTimeout(() => setPhase('leave'), TOAST_VISIBLE_MS)
    cycleTimer.current = window.setTimeout(() => {
      setCurrent(null)
      setPhase('enter')
    }, TOAST_VISIBLE_MS + TOAST_GAP_MS)
    return () => {
      if (enterTimer.current) window.clearTimeout(enterTimer.current)
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current)
      if (cycleTimer.current) window.clearTimeout(cycleTimer.current)
    }
  }, [queue, current, hidden, isQuiet])

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_DISMISSED, String(Date.now() + DISMISS_QUIET_MS))
    } catch { /* ignore */ }
    setCurrent(null)
    setQueue([])
  }, [])

  if (hidden || isQuiet || !current) return null

  const productName = isAr ? current.product.nameAr : current.product.name
  const when = relativeTime(current.createdAt, isAr)

  // RTL: bottom-right ; LTR: bottom-left
  const sideClass = isAr ? 'right-3 sm:right-6' : 'left-3 sm:left-6'
  const slideHidden = isAr ? 'translate-x-6 opacity-0' : '-translate-x-6 opacity-0'
  const slideVisible = 'translate-x-0 opacity-100'

  const slideClass =
    phase === 'show' ? slideVisible : slideHidden

  return (
    <div
      className={`pointer-events-none fixed bottom-3 z-[60] sm:bottom-6 ${sideClass}`}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto flex w-[19rem] max-w-[calc(100vw-1.5rem)] items-stretch gap-3 overflow-hidden rounded-2xl border border-victorian-200/80 bg-cream-50/95 p-2.5 shadow-[0_10px_40px_-12px_rgba(60,20,30,0.35)] ring-1 ring-black/5 backdrop-blur-md transition-all duration-500 ease-out dark:border-victorian-700/60 dark:bg-victorian-950/90 dark:ring-white/5 sm:w-[22rem] ${slideClass}`}
      >
        {/* صورة المنتج */}
        <Link
          to={`/product/${current.product.slug}`}
          className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-victorian-100 dark:bg-victorian-900"
          aria-label={productName}
        >
          {current.product.image ? (
            <img
              src={current.product.image}
              alt={productName}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-victorian-400">
              <ShoppingBag className="h-6 w-6" />
            </div>
          )}
          <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-t from-black/30 to-transparent" />
        </Link>

        {/* المحتوى */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-burgundy-700 dark:text-victorian-300">
            <Crown className="h-3 w-3" />
            <span>{isAr ? 'طلب جديد' : 'New order'}</span>
            <span className="mx-1 h-1 w-1 rounded-full bg-victorian-300 dark:bg-victorian-600" />
            <span className="font-medium normal-case tracking-normal text-victorian-500 dark:text-victorian-400">
              {when}
            </span>
          </div>

          <p className="mt-1 font-display text-sm font-bold text-victorian-900 dark:text-cream-50">
            {isAr ? 'تم اقتناء قطعة فيكتورية للتو' : 'A Victorian piece just sold'}
          </p>

          <Link
            to={`/product/${current.product.slug}`}
            className="mt-0.5 line-clamp-1 text-xs text-victorian-700 transition hover:text-burgundy-700 dark:text-cream-200 dark:hover:text-victorian-200"
            title={productName}
          >
            <span className="font-semibold">{productName}</span>
            {current.quantity > 1 && (
              <span className="ms-1 text-victorian-500">{`× ${current.quantity}`}</span>
            )}
          </Link>
        </div>

        {/* زر الإغلاق */}
        <button
          type="button"
          onClick={dismiss}
          aria-label={isAr ? 'إخفاء الإشعارات' : 'Dismiss'}
          className="self-start rounded-full p-1 text-victorian-400 transition hover:bg-victorian-100 hover:text-victorian-700 dark:hover:bg-victorian-800 dark:hover:text-cream-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
