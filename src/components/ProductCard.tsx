import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import type { Product } from '../types'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { formatNumberEn } from '../lib/formatDigits'
import { getPricing } from '../lib/price'

export function ProductCard({ product }: { product: Product }) {
  const { isAr } = useLanguage()
  const { add } = useCart()
  const title = isAr ? product.nameAr : product.name
  const img = product.images[0] ?? '/placeholder.svg'
  const pricing = getPricing(product)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.stock > 0) {
      add({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        nameAr: product.nameAr,
        image: product.images[0] || '/placeholder.svg',
        price: pricing.effectiveStr,
        size: product.sizes?.[0] || 'default',
        quantity: 1,
      })
    }
  }

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex h-full flex-col"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
        <img
          src={img}
          alt={title}
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          decoding="async"
          width="600"
          height="800"
        />
        {/* الشارات: نُظهر التخفيض أولاً، ثم "مميز" إن لم يكن عليه تخفيض، و"نفد" دائماً عند انعدام المخزون */}
        {pricing.hasDiscount && (
          <span className="absolute start-2 top-2 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
            {isAr ? `خصم ${pricing.discountPercent}٪` : `-${pricing.discountPercent}%`}
          </span>
        )}
        {!pricing.hasDiscount && product.featured && (
          <span className="absolute start-2 top-2 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm dark:bg-white/80 dark:text-slate-900">
            {isAr ? 'مميز' : 'NEW'}
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute end-2 top-2 rounded-full bg-rose-600/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
            {isAr ? 'نفد' : 'SOLD'}
          </span>
        )}
      </div>

      {/* بطاقة الوصف بطول ثابت لتساوي ارتفاع الكروت في الشبكة */}
      <div className="mt-3 flex flex-1 flex-col">
        <p
          className="line-clamp-2 min-h-[2.75rem] text-sm font-medium leading-snug text-victorian-900 dark:text-cream-100 sm:text-base"
          title={title}
        >
          {title}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0 leading-tight">
            {pricing.hasDiscount && (
              <p className="text-xs font-medium text-victorian-500 line-through tabular-nums dark:text-victorian-400 sm:text-sm">
                {formatNumberEn(pricing.original)}{' '}
                <span className="text-[10px] font-medium sm:text-xs">
                  {isAr ? 'د.ع' : 'IQD'}
                </span>
              </p>
            )}
            <p
              className={`tabular-nums font-bold ${
                pricing.hasDiscount
                  ? 'text-rose-600 dark:text-rose-400 text-lg sm:text-xl'
                  : 'text-burgundy-700 dark:text-cream-50 text-lg sm:text-xl'
              }`}
            >
              {formatNumberEn(pricing.effective)}{' '}
              <span className="text-sm font-medium text-victorian-600 dark:text-victorian-300">
                {isAr ? 'د.ع' : 'IQD'}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            aria-label={isAr ? 'إضافة للسلة' : 'Add to cart'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-victorian-300 bg-victorian-50 text-burgundy-700 hover:border-burgundy-700 hover:bg-burgundy-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-victorian-600 dark:text-victorian-300 dark:bg-victorian-900 dark:hover:border-victorian-400 dark:hover:bg-victorian-400 dark:hover:text-victorian-950 transition-colors duration-200"
            title={isAr ? 'إضافة للسلة' : 'Add to cart'}
          >
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
      </div>
    </Link>
  )
}
