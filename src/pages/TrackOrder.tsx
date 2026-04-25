import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, CheckCircle, ChevronDown, Clock, Copy, MapPin, Package, Phone, Share2, ShoppingBag, Truck, User, XCircle } from 'lucide-react'
import { SEO } from '../components/SEO'
import { useLanguage } from '../context/LanguageContext'
import { formatNumberEn, formatOrderDateTime } from '../lib/formatDigits'

const base = import.meta.env.VITE_API_BASE ?? ''
const STORAGE_KEY = 'classi-orders'

type OrderItem = {
  id: string
  productName: string
  size: string
  quantity: number
  unitPrice: string
  image: string | null
  slug: string | null
}

type OrderData = {
  id: string
  createdAt: string
  customerName: string
  phone: string
  province: string
  city: string
  address: string
  total: string
  status: string
  discountCode?: string | null
  discountAmount?: string | null
  items: OrderItem[]
}

const STEPS = [
  { key: 'pending', ar: 'قيد الانتظار', icon: Clock },
  { key: 'confirmed', ar: 'تم التأكيد', icon: CheckCircle },
  { key: 'shipped', ar: 'تم الشحن', icon: Truck },
  { key: 'delivered', ar: 'تم التوصيل', icon: Package },
]

function getSavedIds(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

export function saveOrderId(id: string) {
  const ids = getSavedIds()
  if (!ids.includes(id)) {
    ids.unshift(id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, 50)))
  }
}

/** قطعة شيمر صغيرة مع تدرّج لامع يمر فوق العنصر */
function ShimmerBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200/80 dark:bg-slate-800 ${className}`}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-classi-shimmer
                   bg-gradient-to-r from-transparent
                   via-white/60 to-transparent
                   dark:via-white/10"
      />
    </div>
  )
}

/** سكلتون يحاكي بطاقة الطلب أثناء التحميل */
function OrderShimmerCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <ShimmerBlock className="h-16 w-16 shrink-0 rounded-xl sm:h-20 sm:w-20" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <ShimmerBlock className="h-5 w-24 rounded-full" />
            <ShimmerBlock className="h-3 w-16 rounded" />
          </div>
          <ShimmerBlock className="h-4 w-2/3 rounded" />
          <ShimmerBlock className="h-3 w-1/2 rounded" />
          <ShimmerBlock className="h-3 w-1/3 rounded" />
        </div>
        <ShimmerBlock className="hidden h-8 w-20 rounded-lg sm:block" />
      </div>
    </div>
  )
}

/** أنماط شارة الحالة */
function statusBadgeClasses(cancelled: boolean, current: number): string {
  if (cancelled) return 'bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800/50'
  if (current >= 3) return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/50'
  if (current >= 1) return 'bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800/50'
  return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/50'
}

export function TrackOrder() {
  const { isAr } = useLanguage()
  const { id: routeId } = useParams<{ id: string }>()
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(routeId ?? null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    // إن جاء معرّف الطلب من الرابط /order/:id فاحفظه أولاً ليُحضر مع الباقي
    if (routeId) {
      saveOrderId(routeId)
      setExpandedId(routeId)
    }
    const ids = getSavedIds()
    if (!ids.length) { setLoading(false); return }
    Promise.all(
      ids.map((id) =>
        fetch(`${base}/api/orders/${encodeURIComponent(id)}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      setOrders(results.filter(Boolean) as OrderData[])
      setLoading(false)
    })
  }, [routeId])

  /** يفتح قائمة المشاركة الافتراضية للجهاز (Web Share API)، مع رجوع إلى نسخ الرابط */
  const shareOrder = async (orderId: string) => {
    const url = `${window.location.origin}/order/${orderId}`
    const title = isAr ? `طلب #${orderId.slice(-8).toUpperCase()}` : `Order #${orderId.slice(-8).toUpperCase()}`
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
    } catch { /* المستخدم ألغى أو فشلت العملية — نتابع للـ clipboard */ }
    try {
      await navigator.clipboard?.writeText(url)
      setCopiedId(orderId)
      setTimeout(() => setCopiedId((c) => (c === orderId ? null : c)), 1800)
    } catch {
      window.prompt(isAr ? 'انسخ الرابط:' : 'Copy link:', url)
    }
  }

  const isCancelled = (status: string) => status === 'cancelled'
  const stepIndex = (status: string) => STEPS.findIndex((s) => s.key === status)

  type FilterKey = 'all' | 'active' | 'delivered' | 'cancelled'
  const [filter, setFilter] = useState<FilterKey>('all')

  const stats = useMemo(() => {
    const total = orders.length
    const delivered = orders.filter((o) => o.status === 'delivered').length
    const cancelledN = orders.filter((o) => o.status === 'cancelled').length
    const active = total - delivered - cancelledN
    return { total, delivered, active, cancelled: cancelledN }
  }, [orders])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'active':
        return orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
      case 'delivered':
        return orders.filter((o) => o.status === 'delivered')
      case 'cancelled':
        return orders.filter((o) => o.status === 'cancelled')
      default:
        return orders
    }
  }, [orders, filter])

  const filterChips: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: isAr ? 'الكل' : 'All', count: stats.total },
    { key: 'active', label: isAr ? 'قيد التنفيذ' : 'Active', count: stats.active },
    { key: 'delivered', label: isAr ? 'تم التوصيل' : 'Delivered', count: stats.delivered },
    { key: 'cancelled', label: isAr ? 'ملغية' : 'Cancelled', count: stats.cancelled },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <SEO
        title={isAr ? 'طلباتي' : 'My Orders'}
        description={isAr ? 'تتبع حالة طلباتك في متجر فيكتوريان.' : 'Track your Victorian Store orders.'}
        lang={isAr ? 'ar' : 'en'}
        noindex
      />

      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {isAr ? 'طلباتي' : 'My orders'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isAr ? 'تتبّع حالة جميع طلباتك في مكان واحد.' : 'Track all your orders in one place.'}
          </p>
        </div>
        {!loading && orders.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <StatPill label={isAr ? 'إجمالي' : 'Total'} value={stats.total} tone="slate" />
            <StatPill label={isAr ? 'نشط' : 'Active'} value={stats.active} tone="sky" />
            <StatPill label={isAr ? 'تم التوصيل' : 'Delivered'} value={stats.delivered} tone="emerald" />
            {stats.cancelled > 0 && <StatPill label={isAr ? 'ملغي' : 'Cancelled'} value={stats.cancelled} tone="rose" />}
          </div>
        )}
      </header>

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-6 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <OrderShimmerCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && orders.length === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            {isAr ? 'لا توجد طلبات بعد' : 'No orders yet'}
          </h2>
          <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            {isAr ? 'بمجرد إتمام أول طلب ستظهر تفاصيله هنا.' : 'Once you place your first order, it will appear here.'}
          </p>
          <Link
            to="/products"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {isAr ? 'ابدأ التسوق' : 'Start shopping'}
          </Link>
        </div>
      )}

      {/* Filter chips */}
      {!loading && orders.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2 overflow-x-auto">
          {filterChips.map((chip) => {
            const active = filter === chip.key
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilter(chip.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <span>{chip.label}</span>
                <span className={`rounded-full px-1.5 text-[10px] font-bold sm:text-xs ${
                  active ? 'bg-white/15 text-white dark:bg-slate-900/15 dark:text-slate-900' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                }`}>{chip.count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Orders grid */}
      {!loading && filtered.length > 0 && (
        <div className="mt-5 grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-2">
          {filtered.map((order) => {
            const expanded = expandedId === order.id
            const cancelled = isCancelled(order.status)
            const current = stepIndex(order.status)
            const statusLabel = cancelled
              ? (isAr ? 'ملغي' : 'Cancelled')
              : (STEPS[current]?.ar ?? order.status)
            const progressPct = cancelled ? 0 : Math.max(0, Math.min(100, ((current + 1) / STEPS.length) * 100))

            return (
              <article
                key={order.id}
                className={`group rounded-2xl border bg-white shadow-sm transition dark:bg-slate-900/40 ${
                  expanded
                    ? 'border-slate-300 shadow-md dark:border-slate-700 md:col-span-2'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full text-start"
                  aria-expanded={expanded}
                >
                  <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
                    {/* Thumbnails stack */}
                    <div className="relative shrink-0">
                      <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 sm:h-20 sm:w-20">
                        {order.items[0]?.image ? (
                          <img src={order.items[0].image} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-300"><Package className="h-6 w-6" /></div>
                        )}
                      </div>
                      {order.items.length > 1 && (
                        <span className="absolute -bottom-1 -end-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white shadow ring-2 ring-white dark:bg-white dark:text-slate-900 dark:ring-slate-900">
                          +{order.items.length - 1}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusBadgeClasses(cancelled, current)}`}>
                          {cancelled ? <XCircle className="h-3 w-3" /> : (() => { const Icon = STEPS[current]?.icon ?? Clock; return <Icon className="h-3 w-3" /> })()}
                          <span>{statusLabel}</span>
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">#{order.id.slice(0, 8)}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                        {formatOrderDateTime(order.createdAt)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">
                        {order.items.length} {isAr ? 'قطعة' : 'item(s)'}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                        {formatNumberEn(Number(order.total))}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 sm:text-xs">IQD</span>
                      <ChevronDown className={`mt-1 h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Mini progress bar */}
                  {!expanded && (
                    <div className="px-4 pb-4 sm:px-5">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            cancelled
                              ? 'bg-rose-400'
                              : current >= 3
                              ? 'bg-emerald-500'
                              : 'bg-sky-500'
                          }`}
                          style={{ width: `${cancelled ? 100 : progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="border-t border-slate-100 px-4 py-5 dark:border-slate-800 sm:px-6">
                    {/* Stepper */}
                    {cancelled ? (
                      <div className="mb-6 flex items-center gap-3 rounded-xl bg-rose-50 p-4 dark:bg-rose-950/20">
                        <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
                        <div>
                          <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{isAr ? 'تم إلغاء الطلب' : 'Order cancelled'}</p>
                          <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
                            {isAr ? 'لمزيد من التفاصيل تواصل مع الدعم.' : 'Contact support for details.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative mb-6">
                        {/* connecting line — تمتد بين مركز الدائرة الأولى والأخيرة بالضبط */}
                        {(() => {
                          const colPct = 100 / STEPS.length // عرض كل عمود
                          const startPct = colPct / 2        // مركز أول دائرة
                          const endPct = 100 - startPct      // مركز آخر دائرة
                          const fullSpan = endPct - startPct  // المسافة بين أول وآخر مركز
                          const progressWidth = STEPS.length > 1 ? (current / (STEPS.length - 1)) * fullSpan : 0
                          return (
                            <>
                              <div
                                className="pointer-events-none absolute top-5 z-0 h-0.5 -translate-y-1/2 bg-slate-200 dark:bg-slate-700"
                                style={{ insetInlineStart: `${startPct}%`, width: `${fullSpan}%` }}
                              />
                              <div
                                className="pointer-events-none absolute top-5 z-0 h-0.5 -translate-y-1/2 bg-slate-900 transition-all dark:bg-white"
                                style={{ insetInlineStart: `${startPct}%`, width: `${Math.max(0, progressWidth)}%` }}
                              />
                            </>
                          )
                        })()}

                        <div className="relative z-10 flex items-start justify-between">
                          {STEPS.map((step, i) => {
                            const done = i <= current
                            const isCurrent = i === current
                            const Icon = step.icon
                            return (
                              <div key={step.key} className="flex flex-1 flex-col items-center gap-2">
                                <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition ${
                                  done
                                    ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900'
                                    : 'bg-white text-slate-300 ring-2 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700'
                                }`}>
                                  <Icon className="h-4 w-4" />
                                  {isCurrent && !cancelled && (
                                    <span className="absolute inset-0 -z-10 rounded-full bg-slate-900/20 animate-ping dark:bg-white/30" />
                                  )}
                                </div>
                                <span className={`text-center text-[10px] font-semibold leading-tight sm:text-xs ${
                                  done ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                                }`}>
                                  {step.ar}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Two-column layout on desktop */}
                    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                      {/* Items */}
                      <div>
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                          {isAr ? 'المنتجات' : 'Items'}
                        </h3>
                        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex items-center gap-3 p-3">
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                                {item.image ? (
                                  <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-slate-300"><Package className="h-4 w-4" /></div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                {item.slug ? (
                                  <Link to={`/product/${item.slug}`} className="block truncate text-sm font-semibold text-slate-900 hover:underline dark:text-white">
                                    {item.productName}
                                  </Link>
                                ) : (
                                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.productName}</p>
                                )}
                                <p className="mt-0.5 text-xs text-slate-400">
                                  {item.size && <span className="me-2">{isAr ? 'القياس:' : 'Size:'} {item.size}</span>}
                                  <span>× {formatNumberEn(item.quantity)}</span>
                                </p>
                              </div>
                              <p className="shrink-0 text-sm font-bold text-slate-700 dark:text-slate-200">
                                {formatNumberEn(Number(item.unitPrice) * item.quantity)} <span className="text-[10px] text-slate-400">IQD</span>
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Summary + delivery */}
                      <aside className="space-y-4">
                        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                            {isAr ? 'ملخص الطلب' : 'Summary'}
                          </h3>
                          {order.discountCode && Number(order.discountAmount ?? 0) > 0 && (
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                              <span className="text-xs text-emerald-700 dark:text-emerald-400">
                                {isAr ? `كود (${order.discountCode})` : `Code (${order.discountCode})`}
                              </span>
                              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                − {formatNumberEn(Number(order.discountAmount))} IQD
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2.5">
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{isAr ? 'المجموع' : 'Total'}</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white">
                              {formatNumberEn(Number(order.total))} <span className="text-xs text-slate-400">IQD</span>
                            </span>
                          </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                              {isAr ? 'بيانات التوصيل' : 'Delivery details'}
                            </h3>
                          </div>
                          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            <DeliveryRow
                              icon={User}
                              label={isAr ? 'الاسم' : 'Name'}
                              value={order.customerName}
                            />
                            <DeliveryRow
                              icon={Phone}
                              label={isAr ? 'الهاتف' : 'Phone'}
                              value={order.phone}
                              dir="ltr"
                              actions={
                                <>
                                  <a
                                    href={`tel:${order.phone}`}
                                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    aria-label="call"
                                  >
                                    <Phone className="h-3.5 w-3.5" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => navigator.clipboard?.writeText(order.phone).catch(() => {})}
                                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    aria-label="copy"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              }
                            />
                            <DeliveryRow
                              icon={MapPin}
                              label={isAr ? 'المحافظة' : 'Province'}
                              value={`${order.province}${order.city ? ` / ${order.city}` : ''}`}
                            />
                            {order.address && (
                              <DeliveryRow
                                icon={Package}
                                label={isAr ? 'العنوان' : 'Address'}
                                value={order.address}
                                multiline
                              />
                            )}
                          </ul>
                        </div>
                      </aside>
                    </div>

                    {/* Footer: order id + actions */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-slate-800">
                      <span className="font-mono truncate" dir="ltr">#{order.id}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => shareOrder(order.id)}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          title={isAr ? 'مشاركة رابط الطلب' : 'Share order link'}
                        >
                          {copiedId === order.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="h-3.5 w-3.5" />
                              <span>{isAr ? 'مشاركة' : 'Share'}</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedId(null)}
                          className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {isAr ? 'إغلاق' : 'Close'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </article>
            )
          })}
        </div>
      )}

      {/* No results inside filter */}
      {!loading && orders.length > 0 && filtered.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAr ? 'لا توجد طلبات ضمن هذا التصنيف.' : 'No orders match this filter.'}
          </p>
        </div>
      )}
    </div>
  )
}

/** صف داخل بطاقة بيانات التوصيل */
function DeliveryRow({
  icon: Icon,
  label,
  value,
  dir,
  actions,
  multiline = false,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  dir?: 'ltr' | 'rtl'
  actions?: ReactNode
  multiline?: boolean
}) {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p
          className={`mt-0.5 text-sm font-semibold text-slate-900 dark:text-white ${
            multiline ? 'leading-relaxed' : 'truncate'
          }`}
          dir={dir}
        >
          {value}
        </p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </li>
  )
}

/** شارة إحصائية صغيرة في الهيدر */
function StatPill({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'sky' | 'emerald' | 'rose' }) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${tones[tone]}`}>
      <span className="text-[10px] uppercase tracking-wide opacity-70 sm:text-xs">{label}</span>
      <span className="text-sm font-bold sm:text-base">{value}</span>
    </span>
  )
}
