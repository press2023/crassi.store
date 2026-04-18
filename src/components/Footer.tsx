import { Crown } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export function Footer() {
  const { isAr, t } = useLanguage()

  return (
    <footer className="mt-12 border-t-2 border-victorian-400/40 bg-cream-100/70 py-10 dark:border-victorian-700 dark:bg-victorian-950/60">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-3 text-victorian-500">
            <span className="h-px w-16 bg-victorian-400/70" />
            <Crown className="h-5 w-5" />
            <span className="h-px w-16 bg-victorian-400/70" />
          </div>

          <div>
            <p className="font-display text-xl font-bold uppercase tracking-[0.3em] text-victorian-900 dark:text-cream-50 sm:text-2xl">
              {t('brand')}
            </p>
            {t('tagline') ? (
              <p className="mt-1 font-body text-sm italic text-victorian-500">{t('tagline')}</p>
            ) : null}
          </div>

          <div className="text-sm text-victorian-600 dark:text-victorian-300">
            <p>© {new Date().getFullYear()} Victorian Store · {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
            <p className="mt-2 font-body italic">
              {isAr ? 'تم التطوير بواسطة' : 'Developed by'}{' '}
              <span className="font-semibold text-victorian-800 dark:text-cream-100">{isAr ? 'حسين سعد' : 'Hussein Saad'}</span>
              {' · '}
              <span className="font-semibold text-victorian-800 dark:text-cream-100">Reno Codes</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
