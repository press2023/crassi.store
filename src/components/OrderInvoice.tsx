import { CURRENCY } from '../i18n'
import { formatNumberEn } from '../lib/formatDigits'
import { VictorianQR } from './VictorianQR'

/** معلومات الطلب اللازمة لتركيب الفاتورة (يدعم كلاً من الواجهة العامة وواجهة المشرف) */
export type InvoiceOrder = {
  id: string
  createdAt: string
  customerName: string
  phone: string
  province: string
  city: string
  address: string
  landmark?: string | null
  notes?: string | null
  total: string
  status: string
  discountCode?: string | null
  discountAmount?: string | null
  items: Array<{
    id: string
    productName: string
    size: string
    quantity: number
    unitPrice: string
    image?: string | null
  }>
}

const STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'تم التأكيد',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
}

const STATUS_EN: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

/**
 * فاتورة قابلة للطباعة بواسطة window.print().
 * تُعرض دائماً في DOM لكن مخفية بصرياً (`hidden print:block`) — تظهر فقط في PDF/الطباعة
 * بفضل القواعد في src/index.css (.print-area).
 */
export function OrderInvoice({ order, isAr = true }: { order: InvoiceOrder; isAr?: boolean }) {
  const date = new Date(order.createdAt)
  const dateStr = date.toLocaleDateString(isAr ? 'ar-IQ' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const timeStr = date.toLocaleTimeString(isAr ? 'ar-IQ' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const shortId = order.id.slice(-8).toUpperCase()
  const subtotal = order.items.reduce(
    (sum, it) => sum + Number(it.unitPrice) * it.quantity,
    0,
  )
  const discount = Number(order.discountAmount ?? 0)
  const total = Number(order.total)

  // رابط /order/:id (يستخدم في QR)
  const trackUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/order/${order.id}`
      : `/order/${order.id}`

  const statusLabel = isAr
    ? STATUS_AR[order.status] || order.status
    : STATUS_EN[order.status] || order.status

  return (
    <div
      className="print-area hidden bg-white p-8 text-black print:block"
      dir={isAr ? 'rtl' : 'ltr'}
      lang={isAr ? 'ar' : 'en'}
      style={{ fontFamily: 'Tajawal, system-ui, sans-serif' }}
    >
      {/* رأس الفاتورة */}
      <div className="flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isAr ? 'متجر فيكتوريان' : 'Victorian Iraq'}
          </h1>
          <p className="mt-1 text-xs text-gray-600">
            {isAr ? 'فاتورة طلب' : 'Order Invoice'}
          </p>
        </div>
        <div className="text-end">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            {isAr ? 'رقم الطلب' : 'Order #'}
          </p>
          <p className="font-mono text-lg font-bold">#{shortId}</p>
          <p className="mt-1 text-xs text-gray-500">
            {dateStr} · {timeStr}
          </p>
        </div>
      </div>

      {/* الحالة */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm">
          <span className="font-semibold">{isAr ? 'الحالة:' : 'Status:'}</span>{' '}
          <span>{statusLabel}</span>
        </p>
        <p className="font-mono text-[10px] text-gray-400" dir="ltr">
          {order.id}
        </p>
      </div>

      {/* بيانات العميل + التوصيل */}
      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            {isAr ? 'بيانات العميل' : 'Customer'}
          </p>
          <p className="font-semibold">{order.customerName}</p>
          <p className="mt-1" dir="ltr">{order.phone}</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            {isAr ? 'عنوان التوصيل' : 'Delivery'}
          </p>
          <p>{order.province}{order.city ? ` / ${order.city}` : ''}</p>
          <p className="mt-1">{order.address}</p>
          {order.landmark ? (
            <p className="mt-1 text-xs text-gray-600">
              {isAr ? 'نقطة دالة: ' : 'Landmark: '}{order.landmark}
            </p>
          ) : null}
        </div>
      </div>

      {order.notes ? (
        <div className="mt-4 border-t border-gray-200 pt-3 text-sm">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">
            {isAr ? 'ملاحظات' : 'Notes'}
          </p>
          <p className="whitespace-pre-line">{order.notes}</p>
        </div>
      ) : null}

      {/* جدول المنتجات */}
      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-2 text-start font-bold">
              {isAr ? 'المنتج' : 'Item'}
            </th>
            <th className="py-2 text-center font-bold">
              {isAr ? 'المقاس' : 'Size'}
            </th>
            <th className="py-2 text-center font-bold">
              {isAr ? 'الكمية' : 'Qty'}
            </th>
            <th className="py-2 text-end font-bold">
              {isAr ? 'السعر' : 'Price'}
            </th>
            <th className="py-2 text-end font-bold">
              {isAr ? 'الإجمالي' : 'Total'}
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it) => {
            const line = Number(it.unitPrice) * it.quantity
            return (
              <tr key={it.id} className="border-b border-gray-200">
                <td className="py-2">{it.productName}</td>
                <td className="py-2 text-center">{it.size || '—'}</td>
                <td className="py-2 text-center">{it.quantity}</td>
                <td className="py-2 text-end font-mono">
                  {formatNumberEn(Number(it.unitPrice))}
                </td>
                <td className="py-2 text-end font-mono font-semibold">
                  {formatNumberEn(line)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* الإجماليات */}
      <div className="mt-4 ms-auto w-full max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">
            {isAr ? 'المجموع الفرعي' : 'Subtotal'}
          </span>
          <span className="font-mono">
            {formatNumberEn(subtotal)} {CURRENCY}
          </span>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between text-green-700">
            <span>
              {isAr ? 'الخصم' : 'Discount'}
              {order.discountCode ? ` (${order.discountCode})` : ''}
            </span>
            <span className="font-mono">
              − {formatNumberEn(discount)} {CURRENCY}
            </span>
          </div>
        ) : null}
        <div className="mt-2 flex justify-between border-t-2 border-black pt-2 text-base font-bold">
          <span>{isAr ? 'المجموع الكلي' : 'Grand total'}</span>
          <span className="font-mono">
            {formatNumberEn(total)} {CURRENCY}
          </span>
        </div>
      </div>

      {/* QR + شكر */}
      <div className="mt-8 flex items-end justify-between border-t border-gray-300 pt-6">
        <div className="text-xs text-gray-600">
          <p className="mb-1 font-semibold text-black">
            {isAr ? 'شكراً لتسوقك من فيكتوريان' : 'Thank you for shopping with us'}
          </p>
          <p>
            {isAr
              ? 'امسح الرمز لمتابعة حالة الطلب أونلاين'
              : 'Scan the QR code to track your order online'}
          </p>
          <p className="mt-1 break-all" dir="ltr">{trackUrl}</p>
        </div>
        <div className="shrink-0">
          <VictorianQR value={trackUrl} size={104} />
        </div>
      </div>

      {/* شعار المتجر — يظهر في أسفل الفاتورة بحجم كبير نسبياً */}
      <div className="mt-10 flex flex-col items-center gap-2 border-t-2 border-double border-gray-400 pt-6">
        <img
          src="/site-logo.jpg"
          alt={isAr ? 'متجر فيكتوريان' : 'Victorian Iraq'}
          className="h-32 w-auto object-contain"
          style={{ maxWidth: '220px' }}
        />
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-gray-500">
          {isAr ? '◆ متجر فيكتوريان ◆' : '◆ Victorian Iraq ◆'}
        </p>
      </div>
    </div>
  )
}
