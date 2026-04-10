import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export function NotFound() {
  const { t } = useLanguage()
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white">404</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-300">{t('notFound')}</p>
      <Link to="/" className="mt-8 inline-block rounded-xl bg-classi-600 px-6 py-3 font-semibold text-white">
        {t('home')}
      </Link>
    </div>
  )
}
