import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Clock, Package, Truck, XCircle } from 'lucide-react'
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

export function TrackOrder() {
  const { isAr } = useLanguage()
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
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
  }, [])

  const isCancelled = (status: string) => status === 'cancelled'
  const stepIndex = (status: string) => STEPS.findIndex((s) => s.key === status)

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <SEO
        title={isAr ? 'طلباتي' : 'My Orders'}
        description={isAr ? 'تتبع حالة طلباتك في متجر فيكتوريان.' : 'Track your Victorian Store orders.'}
        lang={isAr ? 'ar' : 'en'}
        noindex
      />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        {isAr ? 'طلباتي' : 'My orders'}
      </h1>

      {loading && (
        <div className="mt-8 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-400">{isAr ? 'لا توجد طلبات بعد' : 'No orders yet'}</p>
          <Link to="/products" className="mt-4 inline-block text-sm underline underline-offset-4 text-slate-600 dark:text-slate-300">
            {isAr ? 'تسوق الآن' : 'Shop now'}
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const expanded = expandedId === order.id
            const cancelled = isCancelled(order.status)
            const current = stepIndex(order.status)
            const statusLabel = cancelled
              ? (isAr ? 'ملغي' : 'Cancelled')
              : (STEPS[current]?.ar ?? order.status)

            return (
              <div key={order.id} className="rounded-2xl border border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="flex w-full items-start gap-3 px-4 py-4 text-start">
                  {order.items[0]?.image && (
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                      <img src={order.items[0].image} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        cancelled ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                        : current >= 3 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatOrderDateTime(order.createdAt)} · {formatNumberEn(Number(order.total))} IQD
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {order.items.length} {isAr ? 'منتج' : 'item(s)'}
                    </p>
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
                    {/* Status stepper */}
                    {cancelled ? (
                      <div className="mb-4 flex items-center gap-3 rounded-xl bg-rose-50 p-3 dark:bg-rose-950/20">
                        <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
                        <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{isAr ? 'تم إلغاء الطلب' : 'Order cancelled'}</p>
                      </div>
                    ) : (
                      <div className="mb-5 flex items-center justify-between">
                        {STEPS.map((step, i) => {
                          const done = i <= current
                          const Icon = step.icon
                          return (
                            <div key={step.key} className="flex flex-1 flex-col items-center gap-1">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                                done ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-300 dark:bg-slate-800'
                              }`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className={`text-[9px] font-medium ${done ? 'text-slate-900 dark:text-white' : 'text-slate-300'}`}>
                                {step.ar}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                            {item.image ? (
                              <img src={item.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-slate-300"><Package className="h-4 w-4" /></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            {item.slug ? (
                              <Link to={`/product/${item.slug}`} className="text-sm font-medium text-slate-900 dark:text-white">
                                {item.productName}
                              </Link>
                            ) : (
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{item.productName}</p>
                            )}
                            <p className="text-xs text-slate-400">× {item.quantity}</p>
                          </div>
                          <p className="shrink-0 text-xs font-medium text-slate-500">{formatNumberEn(Number(item.unitPrice))} IQD</p>
                        </div>
                      ))}
                    </div>

                    {order.discountCode && Number(order.discountAmount ?? 0) > 0 && (
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                        <span className="text-xs text-emerald-700 dark:text-emerald-400">
                          {isAr ? `كود (${order.discountCode})` : `Code (${order.discountCode})`}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          − {formatNumberEn(Number(order.discountAmount))} IQD
                        </span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                      <span className="text-xs text-slate-400">{isAr ? 'المجموع' : 'Total'}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatNumberEn(Number(order.total))} IQD</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
