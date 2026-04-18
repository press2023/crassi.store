import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  ClipboardCopy,
  MapPin,
  Package,
  Phone,
  StickyNote,
  Trash2,
  User,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { CURRENCY } from '../i18n'

const base = import.meta.env.VITE_API_BASE ?? ''

type OrderItem = {
  id: string
  productName: string
  size: string
  quantity: number
  unitPrice: string
  image: string | null
  slug: string | null
}

type Order = {
  id: string
  createdAt: string
  customerName: string
  email: string
  phone: string
  province: string
  city: string
  address: string
  landmark: string
  notes: string | null
  total: string
  status: string
  items: OrderItem[]
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'قيد الانتظار', labelEn: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  { value: 'confirmed', label: 'تم التأكيد', labelEn: 'Confirmed', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'shipped', label: 'تم الشحن', labelEn: 'Shipped', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { value: 'delivered', label: 'تم التوصيل', labelEn: 'Delivered', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'cancelled', label: 'ملغي', labelEn: 'Cancelled', color: 'bg-burgundy-100 text-burgundy-800 dark:bg-burgundy-900/30 dark:text-burgundy-300' },
]

export function AdminOrder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token, isAdmin, isLoading } = useAuth()
  const { isAr } = useLanguage()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingStatus, setSavingStatus] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    if (!token || !id) return
    setLoading(true)
    try {
      const res = await fetch(`${base}/api/admin/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 404) {
        setNotFound(true)
      } else if (res.ok) {
        const data = await res.json()
        setOrder(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [token, id])

  useEffect(() => { load() }, [load])

  if (isLoading) {
    return <Shimmer />
  }
  if (!isAdmin) return <Navigate to="/login" replace />

  if (loading) return <Shimmer />

  if (notFound || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg text-victorian-700 dark:text-cream-200">
          {isAr ? 'الطلب غير موجود.' : 'Order not found.'}
        </p>
        <Link to="/admin" className="mt-4 inline-flex items-center gap-2 text-burgundy-700 underline underline-offset-4 hover:text-burgundy-900">
          <ArrowLeft className="h-4 w-4" />
          {isAr ? 'العودة إلى لوحة التحكم' : 'Back to dashboard'}
        </Link>
      </div>
    )
  }

  const updateStatus = async (status: string) => {
    setSavingStatus(status)
    try {
      await fetch(`${base}/api/admin/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      setOrder((prev) => (prev ? { ...prev, status } : prev))
    } catch { /* ignore */ }
    setSavingStatus(null)
  }

  const copyId = () => {
    navigator.clipboard?.writeText(order.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const deleteOrder = async () => {
    const ok = window.confirm(
      isAr
        ? 'هل أنت متأكد من حذف هذا الطلب نهائياً؟ لا يمكن التراجع.'
        : 'Delete this order permanently? This cannot be undone.'
    )
    if (!ok) return
    setDeleting(true)
    try {
      const res = await fetch(`${base}/api/admin/orders/${order.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        navigate('/admin', { replace: true })
        return
      }
      alert(isAr ? 'تعذر الحذف' : 'Delete failed')
    } catch {
      alert(isAr ? 'خطأ في الشبكة' : 'Network error')
    }
    setDeleting(false)
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === order.status) ?? STATUS_OPTIONS[0]
  const date = new Date(order.createdAt)
  const dateStr = date.toLocaleDateString(isAr ? 'ar-IQ' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = date.toLocaleTimeString(isAr ? 'ar-IQ' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
  const shortId = order.id.slice(-8).toUpperCase()

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      {/* Back + delete */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-victorian-600 hover:text-burgundy-700 dark:text-cream-300"
        >
          <ArrowLeft className="h-4 w-4" />
          {isAr ? 'العودة إلى الطلبات' : 'Back to orders'}
        </Link>
        <button
          type="button"
          onClick={deleteOrder}
          disabled={deleting}
          className="inline-flex items-center gap-2 border border-burgundy-300 bg-burgundy-50 px-4 py-2 text-sm font-semibold text-burgundy-700 transition hover:bg-burgundy-100 disabled:opacity-50 dark:border-burgundy-800 dark:bg-burgundy-900/30 dark:text-burgundy-300 dark:hover:bg-burgundy-900/50"
        >
          <Trash2 className="h-4 w-4" />
          {deleting
            ? (isAr ? 'جارِ الحذف…' : 'Deleting…')
            : (isAr ? 'حذف الطلب' : 'Delete order')}
        </button>
      </div>

      {/* Header card */}
      <div className="mb-6 border border-victorian-200 bg-cream-50 p-5 dark:border-victorian-800 dark:bg-victorian-950/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-xl font-bold text-victorian-900 dark:text-cream-50 sm:text-2xl">
                {isAr ? 'طلب رقم' : 'Order'} #{shortId}
              </h1>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${currentStatus.color}`}>
                {isAr ? currentStatus.label : currentStatus.labelEn}
              </span>
            </div>
            <button
              type="button"
              onClick={copyId}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-victorian-500 hover:text-burgundy-700"
              title={isAr ? 'نسخ رقم الطلب الكامل' : 'Copy full ID'}
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
              <span className="font-mono">{order.id}</span>
              {copied && <span className="text-green-600">✓</span>}
            </button>
            <p className="mt-3 flex items-center gap-2 text-sm text-victorian-600 dark:text-cream-300">
              <Calendar className="h-4 w-4" />
              {dateStr} · {timeStr}
            </p>
          </div>

          <div className="text-end">
            <p className="text-xs uppercase tracking-wider text-victorian-500">
              {isAr ? 'المجموع' : 'Total'}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-burgundy-700 dark:text-victorian-300 sm:text-3xl">
              {Number(order.total).toLocaleString()} {CURRENCY}
            </p>
          </div>
        </div>
      </div>

      {/* Status actions */}
      <div className="mb-6 border border-victorian-200 bg-cream-50 p-4 dark:border-victorian-800 dark:bg-victorian-950/60">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-victorian-500">
          {isAr ? 'تحديث حالة الطلب' : 'Update status'}
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => {
            const active = order.status === s.value
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => !active && updateStatus(s.value)}
                disabled={active || savingStatus !== null}
                className={`px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.15em] transition disabled:cursor-not-allowed ${
                  active
                    ? 'bg-burgundy-700 text-cream-50'
                    : 'border border-victorian-300 text-victorian-700 hover:bg-victorian-100 dark:border-victorian-700 dark:text-cream-200 dark:hover:bg-victorian-900'
                } ${savingStatus === s.value ? 'opacity-60' : ''}`}
              >
                {isAr ? s.label : s.labelEn}
                {savingStatus === s.value && '…'}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer + Delivery */}
        <div className="space-y-6 lg:col-span-1">
          <InfoCard
            icon={<User className="h-4 w-4" />}
            title={isAr ? 'بيانات العميل' : 'Customer'}
          >
            <InfoRow label={isAr ? 'الاسم' : 'Name'} value={order.customerName} />
            <InfoRow
              label={isAr ? 'الهاتف' : 'Phone'}
              value={order.phone}
              dir="ltr"
              href={`tel:${order.phone}`}
              icon={<Phone className="h-3.5 w-3.5" />}
            />
            {order.email ? (
              <InfoRow label={isAr ? 'البريد' : 'Email'} value={order.email} dir="ltr" />
            ) : null}
          </InfoCard>

          <InfoCard
            icon={<MapPin className="h-4 w-4" />}
            title={isAr ? 'عنوان التوصيل' : 'Delivery'}
          >
            <InfoRow label={isAr ? 'المحافظة' : 'Province'} value={order.province} />
            {order.city ? (
              <InfoRow label={isAr ? 'المدينة / المنطقة' : 'City'} value={order.city} />
            ) : null}
            <InfoRow label={isAr ? 'العنوان' : 'Address'} value={order.address} multiline />
            {order.landmark ? (
              <InfoRow label={isAr ? 'أقرب نقطة دالة' : 'Landmark'} value={order.landmark} />
            ) : null}
          </InfoCard>

          {order.notes ? (
            <InfoCard
              icon={<StickyNote className="h-4 w-4" />}
              title={isAr ? 'ملاحظات العميل' : 'Notes'}
            >
              <p className="whitespace-pre-line text-sm text-victorian-800 dark:text-cream-100">
                {order.notes}
              </p>
            </InfoCard>
          ) : null}
        </div>

        {/* Items */}
        <div className="lg:col-span-2">
          <InfoCard
            icon={<Package className="h-4 w-4" />}
            title={`${isAr ? 'المنتجات' : 'Items'} (${order.items.length})`}
          >
            <ul className="divide-y divide-victorian-200 dark:divide-victorian-800">
              {order.items.map((it) => {
                const line = Number(it.unitPrice) * it.quantity
                return (
                  <li key={it.id} className="flex items-center gap-3 py-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden bg-victorian-100 dark:bg-victorian-900 sm:h-20 sm:w-20">
                      {it.image ? (
                        <img src={it.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-victorian-300">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {it.slug ? (
                        <Link
                          to={`/product/${it.slug}`}
                          className="block truncate text-sm font-semibold text-victorian-900 hover:text-burgundy-700 dark:text-cream-100 sm:text-base"
                        >
                          {it.productName}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-semibold text-victorian-900 dark:text-cream-100 sm:text-base">
                          {it.productName}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-victorian-500">
                        {isAr ? 'الكمية' : 'Qty'}: <span className="font-semibold">{it.quantity}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-victorian-500">
                        {Number(it.unitPrice).toLocaleString()} × {it.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-victorian-900 dark:text-cream-100 sm:text-base">
                      {line.toLocaleString()} {CURRENCY}
                    </p>
                  </li>
                )
              })}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t-2 border-victorian-300 pt-4 dark:border-victorian-700">
              <span className="font-display text-sm uppercase tracking-wider text-victorian-700 dark:text-cream-200">
                {isAr ? 'المجموع الكلي' : 'Grand total'}
              </span>
              <span className="font-display text-xl font-bold text-burgundy-700 dark:text-victorian-300 sm:text-2xl">
                {Number(order.total).toLocaleString()} {CURRENCY}
              </span>
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  )
}

/* ─── Sub components ─── */

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-victorian-200 bg-cream-50 p-4 dark:border-victorian-800 dark:bg-victorian-950/60 sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-victorian-600 dark:text-cream-300">
        {icon}
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em]">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  dir,
  href,
  icon,
  multiline,
}: {
  label: string
  value: string
  dir?: string
  href?: string
  icon?: React.ReactNode
  multiline?: boolean
}) {
  const content = (
    <span className={`${multiline ? 'whitespace-pre-line' : 'truncate'} text-sm text-victorian-900 dark:text-cream-100`} dir={dir}>
      {value || '—'}
    </span>
  )
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-victorian-500">
        {label}
      </p>
      {href ? (
        <a href={href} className="inline-flex items-center gap-1.5 text-sm text-burgundy-700 hover:underline dark:text-victorian-300" dir={dir}>
          {icon}
          {value}
        </a>
      ) : (
        <div className="flex items-center gap-2">{icon}{content}</div>
      )}
    </div>
  )
}

function Shimmer() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="h-5 w-32 animate-pulse bg-victorian-100 dark:bg-victorian-900" />
      <div className="mt-6 h-28 animate-pulse bg-victorian-100 dark:bg-victorian-900" />
      <div className="mt-4 h-14 animate-pulse bg-victorian-100 dark:bg-victorian-900" />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="h-40 animate-pulse bg-victorian-100 dark:bg-victorian-900" />
        <div className="h-64 animate-pulse bg-victorian-100 dark:bg-victorian-900 lg:col-span-2" />
      </div>
    </div>
  )
}
