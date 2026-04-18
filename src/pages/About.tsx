import { useEffect, useState } from 'react'
import { fetchSettings } from '../api'
import { useLanguage } from '../context/LanguageContext'

export function About() {
  const { t, isAr } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState<string | null>(null)
  const [body, setBody] = useState<string | null>(null)

  useEffect(() => {
    let ok = true
    setLoading(true)
    fetchSettings()
      .then((s) => {
        if (!ok) return
        const custom = isAr
          ? { title: s.aboutTitleAr, body: s.aboutBodyAr }
          : { title: s.aboutTitleEn, body: s.aboutBodyEn }
        setTitle(custom.title?.trim() || null)
        setBody(custom.body?.trim() || null)
      })
      .catch(() => { /* ignore */ })
      .finally(() => { if (ok) setLoading(false) })
    return () => { ok = false }
  }, [isAr])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-10 w-48 animate-pulse bg-victorian-100 dark:bg-victorian-900" />
        <div className="mt-8 space-y-3">
          <div className="h-4 w-full animate-pulse bg-victorian-100 dark:bg-victorian-900" />
          <div className="h-4 w-[92%] animate-pulse bg-victorian-100 dark:bg-victorian-900" />
          <div className="h-4 w-[85%] animate-pulse bg-victorian-100 dark:bg-victorian-900" />
          <div className="h-4 w-[70%] animate-pulse bg-victorian-100 dark:bg-victorian-900" />
          <div className="h-4 w-[78%] animate-pulse bg-victorian-100 dark:bg-victorian-900" />
        </div>
      </div>
    )
  }

  const finalTitle = title ?? t('aboutTitle')
  const finalBody = body ?? t('aboutBody')

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-victorian-900 dark:text-cream-50 sm:text-4xl">
        {finalTitle}
      </h1>
      <div className="mt-6 whitespace-pre-line text-lg leading-relaxed text-victorian-700 dark:text-cream-200">
        {finalBody}
      </div>
    </div>
  )
}
