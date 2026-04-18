import { Crown, Instagram } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export function Footer() {
  const { isAr, t } = useLanguage()

  return (
    <footer className="mt-12 border-t border-victorian-400/40 bg-cream-100/70 py-6 dark:border-victorian-700 dark:bg-victorian-950/60">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 text-victorian-500">
            <span className="h-px w-10 bg-victorian-400/60" />
            <Crown className="h-3.5 w-3.5" />
            <span className="h-px w-10 bg-victorian-400/60" />
          </div>

          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-victorian-900 dark:text-cream-50">
              {t('brand')}
            </p>
            {t('tagline') ? (
              <p className="mt-0.5 font-body text-[11px] italic text-victorian-500">{t('tagline')}</p>
            ) : null}
          </div>

          <a
            href="https://instagram.com/my.victorian.shop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-victorian-300 px-3 py-1 text-xs text-victorian-700 transition hover:border-burgundy-600 hover:bg-burgundy-50 hover:text-burgundy-700 dark:border-victorian-700 dark:text-cream-200 dark:hover:border-victorian-300 dark:hover:bg-victorian-900"
          >
            <Instagram className="h-3.5 w-3.5" />
            <span dir="ltr">@my.victorian.shop</span>
          </a>

          <div className="text-[11px] leading-relaxed text-victorian-500">
            <p>© {new Date().getFullYear()} Victorian Store · {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
            <p className="mt-0.5 font-body italic">
              {isAr ? 'تم التطوير بواسطة' : 'Developed by'}{' '}
              <span className="font-semibold text-victorian-700 dark:text-cream-200">{isAr ? 'حسين سعد' : 'Hussein Saad'}</span>
              {' · '}
              <span className="font-semibold text-victorian-700 dark:text-cream-200">Reno Codes</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
