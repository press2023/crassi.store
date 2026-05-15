import { useEffect, useMemo, useState } from 'react'
import { Flame, Users } from 'lucide-react'
import { fetchRecentPurchases, type RecentPurchase } from '../api'
import { useLanguage } from '../context/LanguageContext'

/**
 * بانر صغير داخل صفحة المنتج: «اشترى هذا المنتج N أشخاص خلال ٢٤ ساعة»
 * يعرض أيضًا أسماء آخر ٣ مع المحافظات، وعدّاد ساخن إن كان نشاطه عالي.
 */
export function RecentBuyersBadge({ productId }: { productId: string }) {
  const { isAr } = useLanguage()
  const [rows, setRows] = useState<RecentPurchase[] | null>(null)

  useEffect(() => {
    let ok = true
    setRows(null)
    fetchRecentPurchases({ productId, limit: 20 })
      .then((r) => { if (ok) setRows(r) })
      .catch(() => { if (ok) setRows([]) })
    return () => { ok = false }
  }, [productId])

  const stats = useMemo(() => {
    if (!rows) return null
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    const last24 = rows.filter((r) => now - new Date(r.createdAt).getTime() < day)
    const last7 = rows
    const unitsLast24 = last24.reduce((s, r) => s + r.quantity, 0)
    return { last24, last7, unitsLast24 }
  }, [rows])

  if (!stats) return null
  if (stats.last7.length === 0) return null

  const hot = stats.last24.length >= 3
  const totalPeople = stats.last7.length
  const totalUnits = stats.last7.reduce((s, r) => s + r.quantity, 0)

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="mt-4 flex items-center gap-3 rounded-2xl border border-victorian-200/70 bg-gradient-to-l from-cream-100 to-cream-50/60 px-4 py-3 shadow-sm dark:border-victorian-700/60 dark:from-victorian-900/60 dark:to-victorian-950/40"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          hot
            ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300'
            : 'bg-victorian-100 text-burgundy-700 dark:bg-victorian-800 dark:text-victorian-200'
        }`}
      >
        {hot ? <Flame className="h-5 w-5" /> : <Users className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-victorian-900 dark:text-cream-50">
          {hot ? (
            isAr
              ? `🔥 رائج الآن — ${stats.last24.length} طلب خلال ٢٤ ساعة`
              : `🔥 Trending — ${stats.last24.length} orders in 24h`
          ) : (
            isAr
              ? `${totalPeople} ${totalPeople === 1 ? 'شخص اشترى' : 'أشخاص اشتروا'} هذا المنتج`
              : `${totalPeople} ${totalPeople === 1 ? 'person' : 'people'} bought this`
          )}
        </p>
        <p className="mt-0.5 text-xs text-victorian-600 dark:text-victorian-300">
          {isAr
            ? `${totalUnits} قطعة مباعة خلال آخر ٧ أيام`
            : `${totalUnits} units sold in the last 7 days`}
        </p>
      </div>
    </div>
  )
}
