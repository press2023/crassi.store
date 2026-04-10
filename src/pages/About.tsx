import { useLanguage } from '../context/LanguageContext'

export function About() {
  const { t } = useLanguage()
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{t('aboutTitle')}</h1>
      <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
        {t('aboutBody')}
      </p>
    </div>
  )
}
