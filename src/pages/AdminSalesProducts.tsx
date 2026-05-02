import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, Package, ShoppingBag } from 'lucide-react'
import { SEO } from '../components/SEO'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { formatNumberEn, formatOrderDateTime } from '../lib/formatDigits'

const base = import.meta.env.VITE_API_BASE ?? ''

type OrderItem = {
  id: string
  productName: string
  size: string
  quantity: number
  unitPrice: string
  image: string | null
}

type Order = {
  id: string
  createdAt: string
  customerName: string
  status: string
  total: string
  items: OrderItem[]
}

type ProductRow = {
  name: string
  image: string | null
  qty: number
  revenue: number
  sizes: Map<string, number>
  orders: { id: string; createdAt: string; customerName: string; qty: number; total: string }[]
}

export function AdminSalesProducts() {
  const { token, isAdmin, isSuperAdmin, permissions, isLoading } = useAuth()
  const { isAr } = useLanguage()
  const [orders, setOrders] = useState<Order[]>([])
  const [fetched, setFetched] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setFetched(false)
    fetch(`${base}/api/admin/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Order[]) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setFetched(true))
  }, [token])

  // التحميل = إما الـauth لسّه يتحقق من التوكن (عند الـrefresh) أو الطلبات لسّه ما رجعت
  const loading = isLoading || !fetched

  const { rows, totals } = useMemo(() => {
    const map = new Map<string, ProductRow>()
    let totalQty = 0
    let totalRevenue = 0
    let deliveredOrders = 0

    for (const o of orders) {
      if ((o.status || '').toLowerCase() !== 'delivered') continue
      deliveredOrders += 1

      for (const it of o.items) {
        const key = it.productName
        let row = map.get(key)
        if (!row) {
          row = {
            name: it.productName,
            image: it.image,
            qty: 0,
            revenue: 0,
            sizes: new Map(),
            orders: [],
          }
          map.set(key, row)
        }
        if (!row.image && it.image) row.image = it.image
        row.qty += it.quantity
        const rev = (Number(it.unitPrice) || 0) * it.quantity
        row.revenue += rev
        if (it.size) {
          row.sizes.set(it.size, (row.sizes.get(it.size) ?? 0) + it.quantity)
        }
        row.orders.push({
          id: o.id,
          createdAt: o.createdAt,
          customerName: o.customerName,
          qty: it.quantity,
          total: o.total,
        })

        totalQty += it.quantity
        totalRevenue += rev
      }
    }

    const rows = Array.from(map.values()).sort((a, b) => b.qty - a.qty)
    return {
      rows,
      totals: {
        products: rows.length,
        pieces: totalQty,
        revenue: totalRevenue,
        deliveredOrders,
      },
    }
  }, [orders])

  // لو الـauth خلص التحقق وطلع المستخدم مو أدمن → ارجع لصفحة الدخول
  if (!isLoading && !isAdmin) return <Navigate to="/login" replace />
  if (!isLoading && isAdmin && !isSuperAdmin && !permissions.includes('orders')) {
    return <Navigate to="/admin" replace />
  }

  const fmtIQD = (n: number) => `${formatNumberEn(Math.round(n))} ${isAr ? 'د.ع' : 'IQD'}`

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <SEO title={isAr ? 'تفاصيل المبيعات' : 'Sales details'} lang={isAr ? 'ar' : 'en'} noindex />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-victorian-500 hover:text-burgundy-700 dark:hover:text-cream-100"
          >
            <ArrowLeft className={`h-3.5 w-3.5 ${isAr ? 'scale-x-[-1]' : ''}`} />
            {isAr ? 'رجوع للوحة' : 'Back to dashboard'}
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold uppercase tracking-[0.2em] text-victorian-900 dark:text-cream-50">
            {isAr ? 'القطع المباعة' : 'Pieces sold'}
          </h1>
          <p className="mt-1 text-xs text-victorian-500">
            {isAr
              ? 'تفصيل كامل لكل ما تم بيعه فعلياً ضمن الطلبات الموصلة'
              : 'Full breakdown of every piece sold across delivered orders'}
          </p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCell label={isAr ? 'منتجات مختلفة' : 'Distinct products'} value={formatNumberEn(totals.products)} loading={loading} />
        <SummaryCell label={isAr ? 'مجموع القطع' : 'Total pieces'} value={formatNumberEn(totals.pieces)} loading={loading} />
        <SummaryCell label={isAr ? 'الإيراد' : 'Revenue'} value={fmtIQD(totals.revenue)} loading={loading} />
        <SummaryCell label={isAr ? 'طلبات موصلة' : 'Delivered orders'} value={formatNumberEn(totals.deliveredOrders)} loading={loading} />
      </div>

      {loading ? (
        <SalesProductsShimmer isAr={isAr} />
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-victorian-300 p-16 text-center text-sm text-victorian-500 dark:border-victorian-700">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 opacity-40" />
          {isAr
            ? 'لا توجد قطع مباعة بعد — راح تظهر هنا بعد أول طلب يتم توصيله'
            : 'No pieces sold yet — items appear here after the first delivered order'}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          {rows.map((row, idx) => {
            const isOpen = expanded === row.name
            const sizesList = Array.from(row.sizes.entries())
            return (
              <li
                key={row.name}
                className="overflow-hidden border border-victorian-200 bg-cream-50 dark:border-victorian-800 dark:bg-victorian-950"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : row.name)}
                  className="flex w-full items-stretch gap-4 p-3 text-start transition hover:bg-victorian-100/50 dark:hover:bg-victorian-900/40"
                >
                  <div className="flex shrink-0 items-center">
                    <span className="font-display text-sm font-bold text-burgundy-700/70 dark:text-victorian-300/70">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="h-20 w-20 shrink-0 overflow-hidden bg-victorian-100 dark:bg-victorian-900 sm:h-24 sm:w-24">
                    {row.image ? (
                      <img src={row.image} alt={row.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-victorian-300">
                        <Package className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                    <p className="truncate font-display text-base font-bold text-victorian-900 dark:text-cream-50 sm:text-lg">
                      {row.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-victorian-600 dark:text-cream-300">
                      <span className="inline-flex items-center gap-1 rounded-full bg-burgundy-100 px-2 py-0.5 font-bold text-burgundy-800 dark:bg-burgundy-900/40 dark:text-burgundy-200">
                        {formatNumberEn(row.qty)} {isAr ? 'قطعة' : 'pcs'}
                      </span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {fmtIQD(row.revenue)}
                      </span>
                      <span className="text-victorian-500">
                        {formatNumberEn(row.orders.length)} {isAr ? 'طلب' : 'orders'}
                      </span>
                    </div>
                    {sizesList.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-[11px]">
                        {sizesList.map(([size, q]) => (
                          <span
                            key={size}
                            className="border border-victorian-300 px-1.5 py-0.5 text-victorian-700 dark:border-victorian-700 dark:text-cream-200"
                          >
                            {size}: <strong>{formatNumberEn(q)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center text-victorian-400">
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-victorian-200 bg-cream-100/60 px-4 py-3 dark:border-victorian-800 dark:bg-victorian-900/30">
                    <p className="mb-2 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-victorian-500">
                      {isAr ? 'الطلبات اللي تحتوي هذه القطعة' : 'Orders containing this item'}
                    </p>
                    <ul className="divide-y divide-victorian-200 dark:divide-victorian-800">
                      {row.orders.map((o, i) => {
                        const shortId = o.id.slice(0, 8).toUpperCase()
                        return (
                          <li key={`${o.id}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                            <Link
                              to={`/admin/orders/${o.id}`}
                              className="font-semibold text-burgundy-700 hover:underline dark:text-victorian-300"
                            >
                              #{shortId}
                            </Link>
                            <span className="truncate text-victorian-700 dark:text-cream-200">
                              {o.customerName}
                            </span>
                            <span className="text-victorian-500">{formatOrderDateTime(o.createdAt)}</span>
                            <span className="font-bold text-victorian-900 dark:text-cream-100">
                              ×{formatNumberEn(o.qty)}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ─── Shimmer ─────────────────────────────────────────── */

/** كتلة شيمر فيكتورية بتدرّج لامع يمر على العنصر */
function ShimmerBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-victorian-200/70 dark:bg-victorian-800/70 ${className}`}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-classi-shimmer
                   bg-gradient-to-r from-transparent
                   via-cream-50/70 to-transparent
                   dark:via-cream-100/10"
      />
    </div>
  )
}

/** سكلتون يحاكي بطاقة المنتج المباع */
function ProductRowShimmer() {
  return (
    <div className="flex items-stretch gap-4 border border-victorian-200 bg-cream-50 p-3 dark:border-victorian-800 dark:bg-victorian-950">
      <div className="flex shrink-0 items-center">
        <ShimmerBlock className="h-4 w-6" />
      </div>
      <ShimmerBlock className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <ShimmerBlock className="h-5 w-3/5" />
        <div className="flex flex-wrap items-center gap-2">
          <ShimmerBlock className="h-5 w-20 rounded-full" />
          <ShimmerBlock className="h-4 w-24" />
          <ShimmerBlock className="h-3 w-16" />
        </div>
        <div className="flex flex-wrap gap-1">
          <ShimmerBlock className="h-5 w-14" />
          <ShimmerBlock className="h-5 w-12" />
          <ShimmerBlock className="h-5 w-16" />
        </div>
      </div>
      <div className="flex shrink-0 items-center">
        <ShimmerBlock className="h-5 w-5 rounded-full" />
      </div>
    </div>
  )
}

function SalesProductsShimmer({ isAr }: { isAr: boolean }) {
  return (
    <div
      className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">
        {isAr ? 'جارِ تحميل تفاصيل المبيعات…' : 'Loading sales details…'}
      </span>
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductRowShimmer key={i} />
      ))}
    </div>
  )
}

function SummaryCell({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <div className="border border-victorian-200 bg-cream-50 p-3 text-center dark:border-victorian-800 dark:bg-victorian-950">
      <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-victorian-500">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 flex justify-center">
          <ShimmerBlock className="h-5 w-16 sm:h-6 sm:w-20" />
        </div>
      ) : (
        <p className="mt-1 font-display text-base font-bold text-victorian-900 dark:text-cream-50 sm:text-lg">
          {value}
        </p>
      )}
    </div>
  )
}
