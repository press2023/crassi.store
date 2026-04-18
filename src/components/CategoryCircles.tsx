import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import type { Category } from '../types'
import { useLanguage } from '../context/LanguageContext'

type Props = {
  categories: Category[]
  activeSlug?: string
  /** إن تم توفيره: يضغط يستدعي الدالة بدل الرابط */
  onSelect?: (slug: string) => void
  loading?: boolean
  /** عنوان اختياري يعرض فوق الصف */
  title?: string
}

/**
 * شريط تصنيفات أفقي على هيئة دوائر مع صور وأسماء تحتها.
 * مناسب للرئيسية وصفحة المتجر.
 */
export function CategoryCircles({ categories, activeSlug, onSelect, loading, title }: Props) {
  const { isAr, t } = useLanguage()

  if (loading) {
    return (
      <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex shrink-0 flex-col items-center gap-2">
            <div className="h-20 w-20 animate-pulse rounded-full bg-victorian-100 dark:bg-victorian-900" />
            <div className="h-3 w-14 animate-pulse rounded bg-victorian-100 dark:bg-victorian-900" />
          </div>
        ))}
      </div>
    )
  }

  if (!categories.length) return null

  return (
    <div>
      {title ? (
        <h3 className="mb-5 text-center font-display text-lg font-semibold uppercase tracking-[0.3em] text-victorian-700 dark:text-cream-200">
          {title}
        </h3>
      ) : null}

      <div className="flex gap-5 overflow-x-auto px-1 pb-3 scrollbar-none sm:justify-center">
        {onSelect ? (
          <CircleButton
            active={!activeSlug}
            onClick={() => onSelect('')}
            label={t('all')}
            image={null}
          />
        ) : null}

        {categories.map((c) => {
          const label = isAr ? c.nameAr : c.name
          const active = activeSlug === c.slug

          const Inner = (
            <CircleInner active={active} label={label} image={c.image ?? null} />
          )

          if (onSelect) {
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.slug)}
                className="shrink-0"
              >
                {Inner}
              </button>
            )
          }

          return (
            <Link
              key={c.id}
              to={`/category/${encodeURIComponent(c.slug)}`}
              className="shrink-0"
            >
              {Inner}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function CircleButton({
  active,
  onClick,
  label,
  image,
}: {
  active: boolean
  onClick: () => void
  label: string
  image: string | null
}) {
  return (
    <button type="button" onClick={onClick} className="shrink-0">
      <CircleInner active={active} label={label} image={image} />
    </button>
  )
}

function CircleInner({
  active,
  label,
  image,
}: {
  active: boolean
  label: string
  image: string | null
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div
        className={`relative flex h-20 w-20 items-center justify-center rounded-full p-[3px] transition sm:h-24 sm:w-24 ${
          active
            ? 'bg-gradient-to-br from-burgundy-700 via-victorian-500 to-burgundy-900'
            : 'bg-gradient-to-br from-victorian-300 via-victorian-400 to-victorian-600'
        }`}
      >
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-cream-100 bg-cream-50 dark:border-victorian-900 dark:bg-victorian-950">
          {image ? (
            <img
              src={image}
              alt=""
              className="h-full w-full rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <BookOpen
              className={`h-8 w-8 ${
                active
                  ? 'text-burgundy-700 dark:text-victorian-300'
                  : 'text-victorian-600 dark:text-victorian-400'
              }`}
              strokeWidth={1.6}
            />
          )}
        </div>
      </div>
      <span
        className={`max-w-[6rem] truncate text-xs font-semibold uppercase tracking-[0.15em] ${
          active
            ? 'text-burgundy-800 dark:text-victorian-200'
            : 'text-victorian-800 dark:text-cream-200'
        }`}
      >
        {label}
      </span>
    </div>
  )
}
