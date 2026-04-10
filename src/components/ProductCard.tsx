import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { useLanguage } from '../context/LanguageContext'

export function ProductCard({ product }: { product: Product }) {
  const { isAr } = useLanguage()
  const title = isAr ? product.nameAr : product.name
  const img = product.images[0] ?? '/placeholder.svg'

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
      <div className="mt-3 space-y-0.5">
        <p className="text-sm text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {Number(product.price).toLocaleString()}{' '}
          <span className="font-normal text-slate-400">IQD</span>
        </p>
      </div>
    </Link>
  )
}
