import { useState } from 'react'
import { Star, Trash2, User } from 'lucide-react'
import type { Review } from '../api'
import { formatOrderDateTime } from '../lib/formatDigits'

/** تاريخ ووقت التعليق بتوقيت بغداد، مثل الطلبات (DD/MM/YYYY · 12 ساعة عربية بأرقام لاتينية) */
export function formatReviewDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) {
    return '—'
  }
  return formatOrderDateTime(d)
}

export function StarsDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sizeCls = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.round(rating)
        return (
          <Star
            key={i}
            className={`${sizeCls} ${filled ? 'fill-amber-500 text-amber-500' : 'fill-transparent text-victorian-300 dark:text-victorian-700'}`}
            strokeWidth={1.75}
          />
        )
      })}
    </div>
  )
}

export function StarsInput({
  value,
  onChange,
  isAr,
}: {
  value: number
  onChange: (v: number) => void
  isAr: boolean
}) {
  const [hover, setHover] = useState(0)
  const shown = hover || value

  return (
    <div
      className="inline-flex items-center gap-1"
      dir="ltr"
      onMouseLeave={() => setHover(0)}
      role="radiogroup"
      aria-label={isAr ? 'اختر التقييم' : 'Pick a rating'}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= shown
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onClick={() => onChange(n)}
            className="p-1 transition hover:scale-110"
          >
            <Star
              className={`h-7 w-7 transition ${
                active
                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                  : 'fill-transparent text-victorian-300 dark:text-victorian-600'
              }`}
              strokeWidth={1.75}
            />
          </button>
        )
      })}
    </div>
  )
}

export function ReviewCard({
  review,
  isAr,
  onDelete,
  deleteBusy,
  deleteLabel,
}: {
  review: Review
  isAr: boolean
  onDelete?: () => void
  deleteBusy?: boolean
  deleteLabel?: string
}) {
  const initial = review.name.trim().charAt(0).toUpperCase() || '?'
  const label = deleteLabel ?? (isAr ? 'حذف تعليقي' : 'Delete my comment')
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-victorian-200 bg-cream-50/90 p-5 shadow-sm transition hover:border-burgundy-300 hover:shadow-md dark:border-victorian-800 dark:bg-victorian-950/70 dark:hover:border-burgundy-800">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-burgundy-700 to-burgundy-900 font-display text-base font-bold text-cream-50 shadow-sm">
          {initial || <User className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold text-victorian-900 dark:text-cream-50">
            {review.name}
          </p>
          <p className="text-[11px] text-victorian-500">
            {formatReviewDate(review.createdAt)}
          </p>
        </div>
        <StarsDisplay rating={review.rating} />
      </header>
      <p className="whitespace-pre-line text-sm leading-relaxed text-victorian-700 dark:text-cream-200">
        {review.comment}
      </p>
      {onDelete ? (
        <div className="border-t border-victorian-200 pt-3 dark:border-victorian-800">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleteBusy}
            className="inline-flex items-center gap-2 rounded-lg border border-burgundy-300 px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.12em] text-burgundy-700 transition hover:bg-burgundy-50 disabled:opacity-50 dark:border-burgundy-800 dark:text-burgundy-300 dark:hover:bg-burgundy-950/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleteBusy ? (isAr ? 'جارِ الحذف…' : 'Deleting…') : label}
          </button>
        </div>
      ) : null}
    </article>
  )
}
