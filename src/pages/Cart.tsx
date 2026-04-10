import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'

export function Cart() {
  const { t, isAr } = useLanguage()
  const { items, updateQty, remove, subtotal } = useCart()

  if (!items.length) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-lg text-slate-600 dark:text-slate-300">{t('emptyCart')}</p>
        <Link
          to="/products"
          className="mt-6 inline-block text-sm font-semibold text-slate-900 underline underline-offset-4 dark:text-white"
        >
          {t('navShop')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('navCart')}</h1>
      <ul className="mt-8 divide-y divide-slate-200 dark:divide-slate-800">
        {items.map((line) => (
          <li key={`${line.productId}-${line.size}`} className="flex gap-4 py-5">
            <div className="h-24 w-20 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
              {line.image ? (
                <img src={line.image} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {isAr ? line.nameAr : line.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {t('size')}: {line.size}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {Number(line.price).toLocaleString()} IQD
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQty(line.productId, line.size, line.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQty(line.productId, line.size, line.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(line.productId, line.size)}
                  className="ms-auto text-slate-400 hover:text-rose-600"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-800">
        <span className="text-sm font-medium text-slate-500">{t('subtotal')}</span>
        <span className="text-lg font-bold text-slate-900 dark:text-white">{subtotal.toLocaleString()} IQD</span>
      </div>
      <Link
        to="/checkout"
        className="mt-6 block w-full bg-slate-900 py-4 text-center text-sm font-bold uppercase tracking-wider text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
      >
        {t('checkout')}
      </Link>
    </div>
  )
}
