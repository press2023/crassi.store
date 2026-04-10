import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Baby, Check, Grid3X3, Shirt, UserRound, UsersRound, X } from 'lucide-react'
import type { Category } from '../types'

export type CategoriesListStatus = 'loading' | 'error' | 'empty' | 'ready'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  allLabel: string
  isAr: boolean
  activeSlug: string
  categories: Category[]
  onSelect: (slug: string) => void
  listStatus: CategoriesListStatus
  msgLoading: string
  msgError: string
  msgEmpty: string
}

function iconForSlug(slug: string) {
  if (slug === 'men') return UserRound
  if (slug === 'women') return UsersRound
  if (slug === 'kids') return Baby
  return Shirt
}

export function CategorySidebar({
  open,
  onClose,
  title,
  closeLabel,
  allLabel,
  isAr,
  activeSlug,
  categories,
  onSelect,
  listStatus,
  msgLoading,
  msgError,
  msgEmpty,
}: Props) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const panel = (
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-sidebar-title"
    >
      {/* خلفية: بدون blur حتى لا تُضبَّب الصفحة بالكامل؛ الطبقة تحت اللوحة فقط */}
      <button
        type="button"
        className="absolute inset-0 z-0 bg-slate-950/55 dark:bg-black/65"
        onClick={onClose}
        aria-label={closeLabel}
      />

      {/* اللوحة فوق الخلفية مباشرة (بدون opacity-0 + animation قد لا تُولَّد في البناء) */}
      <aside
        className={`absolute inset-y-0 start-0 z-10 flex h-full w-[min(100%,22rem)] max-w-[100vw] flex-col bg-white dark:bg-slate-950 ${
          listStatus === 'ready'
            ? 'shadow-2xl shadow-classi-900/20 dark:shadow-black/40'
            : 'shadow-lg shadow-black/10 dark:shadow-black/30'
        }`}
      >
        {/* شريط علوي بتصميم Classi */}
        <div className="relative overflow-hidden bg-gradient-to-br from-classi-600 via-classi-700 to-classi-900 px-5 pb-8 pt-6 text-white">
          <div
            className="pointer-events-none absolute -end-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-classi-200">Classi</p>
              <h2 id="category-sidebar-title" className="mt-1 text-xl font-extrabold leading-tight">
                {title}
              </h2>
              <p className="mt-2 max-w-[16rem] text-sm text-classi-100/90">
                {isAr ? 'اختر التصنيف المناسب لتصفية المنتجات' : 'Pick a category to filter products'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl bg-white/15 p-2.5 text-white ring-1 ring-white/25 transition hover:bg-white/25"
              aria-label={closeLabel}
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* قائمة التصنيفات أو رسالة نصية بسيطة (بدون بطاقة أو ظل) */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-slate-50/90 dark:bg-slate-900/80">
          {listStatus === 'loading' && (
            <p className="px-5 py-12 text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {msgLoading}
            </p>
          )}
          {listStatus === 'error' && (
            <p className="px-5 py-12 text-center text-sm leading-relaxed text-rose-700 dark:text-rose-300">
              {msgError}
            </p>
          )}
          {listStatus === 'empty' && (
            <p className="px-5 py-12 text-center text-sm leading-relaxed text-amber-800 dark:text-amber-200/90">
              {msgEmpty}
            </p>
          )}
          {listStatus === 'ready' && (
            <div className="flex flex-col gap-2 px-3 py-4">
              <button
                type="button"
                onClick={() => onSelect('')}
                className={`group flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-4 text-start transition ${
                  !activeSlug
                    ? 'border-classi-500 bg-white shadow-md shadow-classi-500/15 dark:bg-slate-900'
                    : 'border-transparent bg-white/80 hover:border-classi-200 hover:bg-white dark:bg-slate-900/60 dark:hover:border-classi-800'
                }`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    !activeSlug
                      ? 'bg-classi-600 text-white'
                      : 'bg-classi-100 text-classi-700 dark:bg-classi-950 dark:text-classi-300'
                  }`}
                >
                  <Grid3X3 className="h-6 w-6" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-slate-900 dark:text-white">{allLabel}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'كل المنتجات' : 'All products'}
                  </span>
                </span>
                {!activeSlug ? (
                  <Check className="h-5 w-5 shrink-0 text-classi-600 dark:text-classi-400" strokeWidth={2.5} />
                ) : null}
              </button>

              {categories.map((c) => {
                const Icon = iconForSlug(c.slug)
                const active = activeSlug === c.slug
                const label = isAr ? c.nameAr : c.name
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelect(c.slug)}
                    className={`group flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-4 text-start transition ${
                      active
                        ? 'border-classi-500 bg-white shadow-md shadow-classi-500/15 dark:bg-slate-900'
                        : 'border-transparent bg-white/80 hover:border-classi-200 hover:bg-white dark:bg-slate-900/60 dark:hover:border-classi-800'
                    }`}
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        active
                          ? 'bg-classi-600 text-white'
                          : 'bg-classi-100 text-classi-700 dark:bg-classi-950 dark:text-classi-300'
                      }`}
                    >
                      <Icon className="h-6 w-6" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1 font-bold text-slate-900 dark:text-white">{label}</span>
                    {active ? (
                      <Check className="h-5 w-5 shrink-0 text-classi-600 dark:text-classi-400" strokeWidth={2.5} />
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {listStatus === 'ready' && (
          <div className="border-t border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">Classi · {title}</p>
          </div>
        )}
      </aside>
    </div>
  )

  return createPortal(panel, document.body)
}
