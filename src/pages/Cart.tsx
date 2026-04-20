import { Link } from 'react-router-dom'
import { Minus, Plus, Truck, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { DELIVERY_FEE_IQD } from '../lib/deliveryFee'

export function Cart() {
  const { t, isAr } = useLanguage()
  const { items, updateQty, remove, subtotal, deliveryFee, grandTotal } = useCart()

  if (!items.length) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
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

  const notice = t('deliveryFeeNotice').replace(
    '{amount}',
    isAr ? String(DELIVERY_FEE_IQD) : DELIVERY_FEE_IQD.toLocaleString('en-US'),
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
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
                {Number(line.price).toLocaleString()} IQD
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

      <div className="mt-6 space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-900/40">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600 dark:text-slate-400">{t('subtotal')}</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {subtotal.toLocaleString()} IQD
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600 dark:text-slate-400">{t('deliveryFee')}</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {deliveryFee.toLocaleString()} IQD
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200/90 pt-3 dark:border-slate-700">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('grandTotal')}</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {grandTotal.toLocaleString()} IQD
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
