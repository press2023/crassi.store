import { Users } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useVisitorStats } from '../context/VisitorContext'
import { formatNumberEn } from '../lib/formatDigits'

export function VisitorCounterCard() {
  const { isAr } = useLanguage()
  const { unique, total } = useVisitorStats()
  if (unique <= 0) return null
  return (
    <div className="mx-auto flex w-full max-w-md items-center gap-4 rounded-2xl border border-victorian-200 bg-gradient-to-br from-cream-50 to-victorian-50/70 p-4 shadow-sm dark:border-victorian-800 dark:from-victorian-950/80 dark:to-victorian-900/60">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-burgundy-700 to-burgundy-900 text-cream-50 shadow-sm">
        <Users className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.25em] text-victorian-500 dark:text-cream-300">
          {isAr ? 'زوار المتجر' : 'Store visitors'}
        </p>
        <p className="mt-0.5 font-display text-2xl font-bold text-victorian-900 dark:text-cream-50">
          {formatNumberEn(unique)}
          <span className="ms-1 text-xs font-normal text-victorian-500">
            {isAr ? 'زائر فريد' : 'unique'}
          </span>
        </p>
        {total > unique && (
          <p className="text-[11px] text-victorian-500">
            {isAr
              ? `${formatNumberEn(total)} زيارة إجمالًا`
              : `${formatNumberEn(total)} total visits`}
          </p>
        )}
      </div>
    </div>
  )
}
