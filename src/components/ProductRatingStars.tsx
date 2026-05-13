import { useEffect, useMemo, useState } from 'react'
import { Star, X } from 'lucide-react'
import {
  AlreadyRatedError,
  fetchProductRatings,
  submitProductRating,
  type ProductRatingSummary,
} from '../api'
import { useLanguage } from '../context/LanguageContext'
import { getOrCreateVisitorId } from '../lib/useVisitorTracking'

type Props = { productId: string }

const EMPTY: ProductRatingSummary = {
  count: 0,
  average: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  mine: null,
}

/**
 * صف مدمج: "تقييم المنتج · ★ 4.5 (12)" — بالضغط على الكلمة/الزر
 * تُفتح نافذة منبثقة في وسط الشاشة لاختيار النجوم.
 * لا يمكن للمستخدم حذف تقييمه (يقدر يعدّله فقط).
 */
export function ProductRatingStars({ productId }: Props) {
  const { isAr } = useLanguage()
  const [summary, setSummary] = useState<ProductRatingSummary>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState(0)

  const visitorId = useMemo(() => getOrCreateVisitorId(), [])

  useEffect(() => {
    let ok = true
    setLoading(true)
    fetchProductRatings(productId, visitorId)
      .then((s) => { if (ok) setSummary(s) })
      .finally(() => { if (ok) setLoading(false) })
    return () => { ok = false }
  }, [productId, visitorId])

  // قفل التمرير + إغلاق بـ Esc
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const submit = async (value: number) => {
    if (!visitorId || busy) return
    if (summary.mine != null) return // مقفل: لا يمكن تعديل التقييم
    setBusy(true)
    setError(null)
    try {
      const next = await submitProductRating(productId, visitorId, value)
      setSummary(next)
      setSavedAt(Date.now())
      // إغلاق تلقائي بعد لحظة قصيرة
      setTimeout(() => setOpen(false), 900)
    } catch (e) {
      if (e instanceof AlreadyRatedError) {
        setSummary(e.summary)
        setError(isAr ? 'لقد قيّمت هذا المنتج مسبقًا.' : 'You have already rated this product.')
      } else {
        setError(isAr ? 'تعذّر حفظ التقييم. حاول مجدّدًا.' : 'Could not save your rating.')
      }
    } finally {
      setBusy(false)
    }
  }

  const avgRounded = Math.round(summary.average * 10) / 10
  const display = hover || summary.mine || 0

  return (
    <>
      {loading ? (
        // Shimmer placeholder بنفس ارتفاع زر النجوم لتفادي قفز التخطيط
        <div
          className="inline-flex items-center gap-2"
          dir={isAr ? 'rtl' : 'ltr'}
          aria-hidden
        >
          <span className="inline-block h-5 w-24 animate-pulse rounded-md bg-victorian-200/70 dark:bg-victorian-800/70" />
          <span className="inline-block h-4 w-10 animate-pulse rounded-md bg-victorian-200/70 dark:bg-victorian-800/70" />
        </div>
      ) : summary.mine != null ? (
        // المستخدم قيّم → نجمة واحدة + تقييمه + العدد (بدون ترشيح للضغط لتغيير، يفتح النافذة لعرض الحالة)
        <button
          type="button"
          onClick={() => { setError(null); setHover(0); setOpen(true) }}
          className="inline-flex items-center gap-1.5 bg-transparent p-0 text-sm transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-500"
          dir={isAr ? 'rtl' : 'ltr'}
          aria-haspopup="dialog"
          aria-label={isAr ? 'عرض تقييمك' : 'View your rating'}
          title={isAr ? 'تقييمك مسجَّل' : 'Your rating is locked'}
        >
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" strokeWidth={1.75} />
          <span className="font-display font-bold tabular-nums text-victorian-900 dark:text-cream-50">
            {avgRounded.toFixed(1)}
          </span>
          <span className="text-victorian-500 dark:text-victorian-400" dir="ltr">
            ({summary.count})
          </span>
        </button>
      ) : (
        // غير مقيّم → 5 نجوم قابلة للضغط لفتح نافذة التقييم
        <button
          type="button"
          onClick={() => { setError(null); setHover(0); setOpen(true) }}
          className="inline-flex items-center gap-1 bg-transparent p-0 text-sm transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-500"
          dir={isAr ? 'rtl' : 'ltr'}
          aria-haspopup="dialog"
          aria-label={isAr ? 'تقييم المنتج' : 'Rate this product'}
          title={isAr ? 'اضغط للتقييم' : 'Tap to rate'}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= Math.round(summary.average)
            return (
              <Star
                key={n}
                className={`h-5 w-5 ${
                  filled
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-victorian-300 dark:text-victorian-700'
                }`}
                strokeWidth={1.75}
              />
            )
          })}
          <span className="ms-1 font-display font-bold tabular-nums text-victorian-900 dark:text-cream-50">
            {avgRounded.toFixed(1)}
          </span>
          <span className="text-victorian-500 dark:text-victorian-400" dir="ltr">
            ({summary.count})
          </span>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label={isAr ? 'تقييم المنتج' : 'Product rating'}
        >
          <div
            className="absolute inset-0 bg-victorian-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative w-full max-w-sm rounded-2xl border border-victorian-200 bg-cream-50 p-6 shadow-2xl dark:border-victorian-700 dark:bg-victorian-950"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute end-3 top-3 rounded-full p-1 text-victorian-500 transition hover:bg-victorian-100 hover:text-victorian-900 dark:text-victorian-400 dark:hover:bg-victorian-900 dark:hover:text-cream-50"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="h-5 w-5" />
            </button>

            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.25em] text-victorian-500 dark:text-victorian-400">
              {isAr ? 'تقييم المنتج' : 'Product rating'}
            </p>
            <h3 className="mt-1 font-display text-xl font-bold text-victorian-900 dark:text-cream-50">
              {isAr ? 'قيّم هذا المنتج' : 'Rate this product'}
            </h3>

            {/* المتوسط الحالي */}
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-display font-bold tabular-nums text-victorian-900 dark:text-cream-50">
                {avgRounded.toFixed(1)}
              </span>
              <span className="text-victorian-500 dark:text-victorian-400" dir="ltr">
                ({summary.count})
              </span>
              {summary.mine != null && (
                <span className="ms-auto text-xs text-victorian-500 dark:text-victorian-400">
                  {isAr ? `تقييمك: ${summary.mine}/5` : `Your rating: ${summary.mine}/5`}
                </span>
              )}
            </div>

            {/* النجوم التفاعلية — تُقفل بعد أول تقييم */}
            {(() => {
              const locked = summary.mine != null
              return (
                <div
                  className={`mt-5 flex items-center justify-center gap-1.5 ${
                    locked ? 'pointer-events-none' : ''
                  }`}
                  onMouseLeave={() => setHover(0)}
                  role="radiogroup"
                  aria-label={isAr ? 'اختر تقييمك بالنجوم' : 'Pick your star rating'}
                  aria-disabled={locked}
                >
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = n <= display
                    return (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={summary.mine === n}
                        aria-label={`${n} ${isAr ? 'نجمة' : 'star'}`}
                        disabled={busy || locked}
                        onMouseEnter={() => { if (!locked) setHover(n) }}
                        onFocus={() => { if (!locked) setHover(n) }}
                        onClick={() => submit(n)}
                        className="rounded-md p-1 transition disabled:cursor-not-allowed hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-500"
                      >
                        <Star
                          className={`h-9 w-9 transition ${
                            active
                              ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                              : 'text-victorian-300 dark:text-victorian-700'
                          }`}
                          strokeWidth={1.5}
                        />
                      </button>
                    )
                  })}
                </div>
              )
            })()}

            <p className="mt-4 text-center text-xs text-victorian-500 dark:text-victorian-400">
              {summary.mine != null
                ? isAr
                  ? 'لقد سجّلت تقييمك مسبقًا — لا يمكن تغييره.'
                  : 'You already submitted your rating — it cannot be changed.'
                : isAr
                  ? 'اضغط على نجمة لتسجيل تقييمك (مرة واحدة فقط، لا يمكن تغييره لاحقًا).'
                  : 'Tap a star to rate (one time only — cannot be changed later).'}
            </p>

            {error && (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                {error}
              </div>
            )}
            {savedAt > 0 && !error && !busy && (
              <div className="mt-3 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {isAr ? 'تم حفظ تقييمك ✓' : 'Saved ✓'}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
