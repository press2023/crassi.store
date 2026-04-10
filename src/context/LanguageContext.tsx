import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Lang } from '../i18n'
import { strings, t as translate } from '../i18n'

type Ctx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: keyof (typeof strings)['ar']) => string
  isAr: boolean
}

const LanguageContext = createContext<Ctx | null>(null)

const STORAGE = 'classi-lang'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof localStorage === 'undefined') return 'ar'
    return (localStorage.getItem(STORAGE) as Lang) || 'ar'
  })

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem(STORAGE, l)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'en'
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  const t = useCallback(
    (key: keyof (typeof strings)['ar']) => translate(lang, key),
    [lang],
  )

  const value = useMemo(
    () => ({ lang, setLang, t, isAr: lang === 'ar' }),
    [lang, setLang, t],
  )

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const c = useContext(LanguageContext)
  if (!c) throw new Error('useLanguage outside provider')
  return c
}
