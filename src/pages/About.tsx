import { useEffect, useState } from 'react'
import { fetchSettings } from '../api'
import { SEO } from '../components/SEO'
import { useLanguage } from '../context/LanguageContext'
import { breadcrumbLD, buildCanonical, faqLD } from '../lib/seo'

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
  const aboutUrl = buildCanonical('/about')

  const faqItems = isAr
    ? [
        {
          q: 'هل التوصيل لكل العراق؟',
          a: 'نعم، نوصل لكل المحافظات العراقية برسوم توصيل ثابتة 5,000 دينار.',
        },
        {
          q: 'كيف يتم الدفع؟',
          a: 'الدفع نقداً عند الاستلام بعد فحص الطلب.',
        },
        {
          q: 'هل يمكن تتبع الطلب؟',
          a: 'نعم، عبر صفحة "تتبع الطلب" برقم الطلب الذي يصلك بعد التأكيد.',
        },
      ]
    : [
        { q: 'Do you deliver across Iraq?', a: 'Yes, with a flat 5,000 IQD delivery fee.' },
        { q: 'What payment methods are accepted?', a: 'Cash on delivery after inspection.' },
        { q: 'Can I track my order?', a: 'Yes, on the Track Order page using your order ID.' },
      ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <SEO
        title={finalTitle}
        description={finalBody.slice(0, 200)}
        lang={isAr ? 'ar' : 'en'}
        jsonLd={[
          breadcrumbLD([
            { name: isAr ? 'الرئيسية' : 'Home', url: buildCanonical('/') },
            { name: isAr ? 'من نحن' : 'About', url: aboutUrl },
          ]),
          faqLD(faqItems),
          {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: finalTitle,
            url: aboutUrl,
            inLanguage: isAr ? 'ar' : 'en',
            isPartOf: { '@id': `${buildCanonical('/')}#website` },
          },
        ]}
      />
      <h1 className="font-display text-3xl font-bold text-victorian-900 dark:text-cream-50 sm:text-4xl">
        {finalTitle}
      </h1>
      <div className="mt-6 whitespace-pre-line text-lg leading-relaxed text-victorian-700 dark:text-cream-200">
        {finalBody}
      </div>
    </div>
  )
}
