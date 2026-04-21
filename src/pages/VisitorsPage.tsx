import { Users } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useVisitorStats } from '../context/VisitorContext'

function formatNumber(n: number, isAr: boolean): string {
  return n.toLocaleString(isAr ? 'ar-IQ' : 'en-US')
}

const AVATAR_IMAGES = [
  { src: '/visitors-avatar-3.jpg', z: 'z-10' },
  { src: '/visitors-avatar-2.jpg', z: 'z-20' },
  { src: '/visitors-avatar-1.jpg', z: 'z-30' },
] as const

export function VisitorsPage() {
  const { t, isAr } = useLanguage()
  const { unique } = useVisitorStats()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="mb-10 text-center">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.35em] text-burgundy-700 dark:text-victorian-300">
          {t('visitorsPageKicker')}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-victorian-900 dark:text-cream-50 sm:text-3xl">
          {t('visitorsPageTitle')}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-victorian-600 dark:text-cream-300">
          {t('visitorsPageSubtitle')}
        </p>
      </div>

      <div className="mb-12 flex justify-center">
        <div className="flex flex-row items-center justify-center ps-10 sm:ps-12">
          {AVATAR_IMAGES.map(({ src, z }, i) => (
            <img
              key={src}
              src={src}
              alt=""
              width={480}
              height={480}
              className={`relative h-24 w-24 shrink-0 rounded-full border-[3px] border-cream-50 object-cover object-[center_25%] shadow-lg dark:border-victorian-950 sm:h-32 sm:w-32 sm:border-4 ${z} ${
                i > 0 ? '-ms-10 sm:-ms-12' : ''
              }`}
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      </div>

      <section className="rounded-2xl border border-victorian-200 bg-gradient-to-br from-cream-50 via-cream-50 to-victorian-100/40 p-6 text-center shadow-sm dark:border-victorian-800 dark:from-victorian-950/90 dark:via-victorian-950/80 dark:to-victorian-900/60 sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-burgundy-700 to-burgundy-900 text-cream-50 shadow-md">
          <Users className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <p className="font-display text-sm font-semibold uppercase tracking-[0.25em] text-victorian-600 dark:text-cream-300">
          {t('visitorsSiteCountLabel')}
        </p>
        <p className="mt-3 font-display text-4xl font-bold tabular-nums text-victorian-900 dark:text-cream-50 sm:text-5xl">
          {formatNumber(unique, isAr)}
        </p>
        <p className="mt-2 text-xs text-victorian-500 dark:text-victorian-500">
          {t('visitorsUniqueHint')}
        </p>
      </section>
    </div>
  )
}
