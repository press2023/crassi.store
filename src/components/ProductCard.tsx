import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import type { Product } from '../types'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { formatNumberEn } from '../lib/formatDigits'

export function ProductCard({ product }: { product: Product }) {
  const { isAr } = useLanguage()
  const { add } = useCart()
  const title = isAr ? product.nameAr : product.name
  const img = product.images[0] ?? '/placeholder.svg'

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
        price: product.price,
        size: product.sizes?.[0] || 'default',
        quantity: 1,
      })
    }
  }

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
        <img
          src={img}
          alt=""
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {product.featured && (
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
      <div className="mt-3 space-y-2">
        <p className="text-base font-medium text-victorian-900 dark:text-cream-100">{title}</p>
        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-burgundy-700 dark:text-cream-50">
            {formatNumberEn(Number(product.price))}{' '}
            <span className="text-sm font-medium text-victorian-600 dark:text-victorian-300">د.ع</span>
          </p>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-victorian-300 bg-victorian-50 text-burgundy-700 hover:border-burgundy-700 hover:bg-burgundy-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-victorian-600 dark:text-victorian-300 dark:bg-victorian-900 dark:hover:border-victorian-400 dark:hover:bg-victorian-400 dark:hover:text-victorian-950 transition-colors duration-200"
            title={isAr ? 'إضافة للسلة' : 'Add to cart'}
          >
            <ShoppingCart className="h-6 w-6" />
          </button>
        </div>
      </div>
    </Link>
  )
}
