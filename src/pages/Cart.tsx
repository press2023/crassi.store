import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Minus, Plus, Truck, Trash2, Tag, Ticket, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { DELIVERY_FEE_IQD } from '../lib/deliveryFee'
import { formatNumberEn } from '../lib/formatDigits'
import { SEO } from '../components/SEO'

function discountErrorMessage(code: string | null, isAr: boolean): string {
  switch (code) {
    case 'not_found':
      return isAr ? 'كود الخصم غير موجود.' : 'Code does not exist.'
    case 'disabled':
      return isAr ? 'هذا الكود معطَّل حاليًا.' : 'This code is disabled.'
    case 'expired':
      return isAr ? 'انتهت صلاحية هذا الكود.' : 'This code has expired.'
    case 'exhausted':
      return isAr ? 'تم استنفاد عدد مرات استخدام هذا الكود.' : 'Usage limit reached.'
    case 'min_total':
      return isAr ? 'مجموع المنتجات أقل من الحد المطلوب لهذا الكود.' : 'Order total below minimum.'
    case 'invalid':
      return isAr ? 'كود غير صالح.' : 'Invalid code.'
    case 'missing_code':
      return isAr ? 'اكتب كود الخصم أولاً.' : 'Enter a code first.'
    default:
      return code ? (isAr ? 'تعذر تطبيق الكود.' : 'Could not apply code.') : ''
  }
}

export function Cart() {
  const { t, isAr } = useLanguage()
  const {
    items,
    updateQty,
    remove,
    subtotal,
    deliveryFee,
    grandTotal,
    discount,
    discountAmount,
    applyDiscount,
    clearDiscount,
    discountError,
    discountBusy,
  } = useCart()
  const [codeInput, setCodeInput] = useState('')
  const [codeOpen, setCodeOpen] = useState(false)
  const codeInputRef = useRef<HTMLInputElement>(null)

  const onApply = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await applyDiscount(codeInput)
      setCodeInput('')
      setCodeOpen(false)
    } catch {
      /* الخطأ يُعرض من discountError */
    }
  }

  useEffect(() => {
    if (codeOpen) {
      // ركّز الحقل بعد الانتهاء من الانميشن لتجربة أنعم
      const id = setTimeout(() => codeInputRef.current?.focus(), 200)
      return () => clearTimeout(id)
    }
  }, [codeOpen])

  // افتح اللوحة تلقائيًا عند ظهور خطأ حتى يراه المستخدم
  useEffect(() => {
    if (discountError) setCodeOpen(true)
  }, [discountError])
  // السلة محتواها متغيّر شخصي — noindex

  if (!items.length) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <SEO title={t('navCart')} lang={isAr ? 'ar' : 'en'} noindex />
        <p className="text-lg text-slate-600 dark:text-slate-300">{t('emptyCart')}</p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          {t('navShop')}
        </Link>
      </div>
    )
  }

  const notice = t('deliveryFeeNotice').replace('{amount}', formatNumberEn(DELIVERY_FEE_IQD))

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <SEO title={t('navCart')} lang={isAr ? 'ar' : 'en'} noindex />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('navCart')}</h1>

      <div
        className="mt-6 flex gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40"
        role="status"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-100">
          <Truck className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">{t('deliveryAddedTitle')}</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/85">{notice}</p>
        </div>
      </div>

      <ul className="mt-8 divide-y divide-slate-200/80 dark:divide-slate-800">
        {items.map((line) => (
          <li key={`${line.productId}-${line.size}`} className="flex gap-4 py-5">
            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-inner ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700/80">
              {line.image ? (
                <img src={line.image} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {isAr ? line.nameAr : line.name}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {formatNumberEn(Number(line.price))} IQD
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQty(line.productId, line.size, line.quantity - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQty(line.productId, line.size, line.quantity + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(line.productId, line.size)}
                  className="ms-auto rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* كود الخصم */}
      {discount ? (
        <div className="mt-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                <Tag className="h-4 w-4" />
                {discount.code}
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                {isAr ? discount.nameAr : (discount.nameEn || discount.nameAr)} —
                {' '}
                {discount.type === 'percent'
                  ? `${formatNumberEn(Number(discount.value))}%`
                  : `${formatNumberEn(Number(discount.value))} IQD`}
              </p>
            </div>
            <button
              type="button"
              onClick={clearDiscount}
              className="rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
              aria-label={isAr ? 'إزالة الكود' : 'Remove code'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setCodeOpen((v) => !v)}
            aria-expanded={codeOpen}
            aria-controls="discount-code-panel"
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-5 py-3 text-start transition hover:bg-slate-100/80 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-800/60"
          >
            <span className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Ticket className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              {isAr ? 'إدخال كود خصم' : 'Enter a discount code'}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-300 ease-out dark:text-slate-400 ${codeOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>

          <div
            id="discount-code-panel"
            className={`grid transition-all duration-300 ease-out ${
              codeOpen ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <form
                onSubmit={onApply}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40"
              >
                <div className="flex gap-2">
                  <input
                    ref={codeInputRef}
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder={isAr ? 'مثال: WELCOME10' : 'e.g. WELCOME10'}
                    dir="ltr"
                    className="flex-1 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm uppercase outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={discountBusy || !codeInput.trim()}
                    className="shrink-0 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-40 dark:bg-white dark:text-slate-900"
                  >
                    {discountBusy ? '…' : (isAr ? 'تطبيق' : 'Apply')}
                  </button>
                </div>
                {discountError && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {discountErrorMessage(discountError, isAr)}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-900/40">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600 dark:text-slate-400">{t('subtotal')}</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {formatNumberEn(subtotal)} IQD
          </span>
        </div>
        {discount && discountAmount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              {isAr ? `خصم (${discount.code})` : `Discount (${discount.code})`}
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              − {formatNumberEn(discountAmount)} IQD
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600 dark:text-slate-400">{t('deliveryFee')}</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {formatNumberEn(deliveryFee)} IQD
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200/90 pt-3 dark:border-slate-700">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('grandTotal')}</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {formatNumberEn(grandTotal)} IQD
          </span>
        </div>
      </div>

      <Link
        to="/checkout"
        className="mt-6 block w-full rounded-2xl bg-slate-900 py-4 text-center text-sm font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
      >
        {t('checkout')}
      </Link>
    </div>
  )
}
