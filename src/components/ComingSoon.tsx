import { Lock, Clock } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export function ComingSoon() {
  const { isAr } = useLanguage()

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-cream-50 to-amber-50/80 p-10 text-center shadow-sm dark:border-amber-700/30 dark:from-amber-900/20 dark:via-victorian-950 dark:to-amber-900/20">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-300/60 bg-amber-100/60 dark:border-amber-600/40 dark:bg-amber-900/30">
          <Lock className="h-7 w-7 text-amber-700 dark:text-amber-300" />
        </div>
        <h2 className="font-display text-2xl font-bold text-victorian-900 dark:text-cream-50">
          {isAr ? 'قريبًا' : 'Coming Soon'}
        </h2>
        <div className="mx-auto my-4 h-px w-20 bg-amber-300/50 dark:bg-amber-700/40" />
        <p className="text-sm leading-relaxed text-victorian-600 dark:text-cream-300">
          {isAr
            ? 'هذه الصفحة مغلقة حاليًا. نعمل على إعدادها لك — تابعنا قريبًا!'
            : 'This page is currently locked. We are preparing it for you — stay tuned!'}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50/60 px-5 py-2 text-xs font-semibold text-amber-800 dark:border-amber-600/30 dark:bg-amber-900/20 dark:text-amber-300">
          <Clock className="h-3.5 w-3.5" />
          {isAr ? 'نعود إليك قريباً' : 'We will be back soon'}
        </div>
      </div>
    </div>
  )
}
