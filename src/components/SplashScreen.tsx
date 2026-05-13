import { useEffect, useState } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { useLanguage } from '../context/LanguageContext'
import { SITE_NAME, SITE_NAME_AR } from '../lib/seo'

const SESSION_KEY = 'splash_shown_v1'
const VISIBLE_MS = 2600 // مدة العرض قبل الفيد
const FADE_MS = 700    // مدة الانتقال

/**
 * شاشة بداية (Splash Screen) — تظهر مرة واحدة لكل جلسة عند دخول الموقع.
 * تعرض أنيميشن الحصان مع اسم المتجر، ثم تختفي بسلاسة.
 */
export function SplashScreen() {
  const { isAr } = useLanguage()
  const [show, setShow] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    // إجبار العرض إذا أُضيف ?splash=1 للرابط (مفيد للاختبار)
    const force = new URLSearchParams(window.location.search).get('splash') === '1'
    if (force) return true
    return !sessionStorage.getItem(SESSION_KEY)
  })
  const [fade, setFade] = useState(false)

  useEffect(() => {
    if (!show) return
    sessionStorage.setItem(SESSION_KEY, '1')
    // قفل التمرير أثناء عرض الشاشة
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const fadeT = window.setTimeout(() => setFade(true), VISIBLE_MS)
    const hideT = window.setTimeout(() => setShow(false), VISIBLE_MS + FADE_MS)

    // تخطّي عند الضغط/المسّ
    const skip = () => {
      window.clearTimeout(fadeT)
      window.clearTimeout(hideT)
      setFade(true)
      window.setTimeout(() => setShow(false), FADE_MS)
    }
    window.addEventListener('keydown', skip, { once: true })
    window.addEventListener('pointerdown', skip, { once: true })

    return () => {
      document.body.style.overflow = prev
      window.clearTimeout(fadeT)
      window.clearTimeout(hideT)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [show])

  if (!show) return null

  const name = isAr ? SITE_NAME_AR : SITE_NAME

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={isAr ? 'جارٍ تحميل الموقع' : 'Loading site'}
      className={[
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center',
        'bg-cream-50 dark:bg-victorian-950',
        'transition-opacity ease-out',
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100',
      ].join(' ')}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* خلفية زخرفية فيكتورية ناعمة */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 40%, rgba(176, 122, 56, 0.12) 0%, transparent 55%)",
        }}
      />

      {/* الأنيميشن */}
      <div className="relative h-80 w-80 sm:h-[26rem] sm:w-[26rem] md:h-[32rem] md:w-[32rem]">
        <DotLottieReact
          src="/splash-horse.lottie"
          autoplay
          loop
          renderConfig={{ autoResize: true }}
        />
      </div>

      {/* اسم الموقع */}
      <div className="relative mt-2 flex flex-col items-center px-6 text-center">
        <span
          aria-hidden
          className="mb-3 inline-block h-px w-16 bg-gradient-to-r from-transparent via-burgundy-600 to-transparent dark:via-victorian-300"
        />
        <h1 className="font-display text-3xl font-bold tracking-wide text-victorian-900 dark:text-cream-50 sm:text-4xl">
          {name}
        </h1>
        <p className="mt-2 font-display text-[11px] font-semibold uppercase tracking-[0.45em] text-burgundy-700 dark:text-victorian-300">
          {isAr ? 'أناقة لا تُنسى' : 'Timeless elegance'}
        </p>
        <span
          aria-hidden
          className="mt-3 inline-block h-px w-16 bg-gradient-to-r from-transparent via-burgundy-600 to-transparent dark:via-victorian-300"
        />
      </div>
    </div>
  )
}
