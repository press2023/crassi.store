import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

type Theme = 'light' | 'dark'

type Ctx = {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<Ctx | null>(null)

const STORAGE = 'classi-theme'

function getPref(): Theme {
  if (typeof localStorage === 'undefined') return 'light'
  const s = localStorage.getItem(STORAGE) as Theme | null
  if (s === 'dark' || s === 'light') return s
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === 'undefined' ? 'light' : getPref(),
  )

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem(STORAGE, theme)

    const metaTheme = document.getElementById('meta-theme-color') as HTMLMetaElement | null
    if (metaTheme) {
      metaTheme.content = theme === 'dark' ? '#180d07' : '#fbf7f1'
    }
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((x) => (x === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle])

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const c = useContext(ThemeContext)
  if (!c) throw new Error('useTheme outside provider')
  return c
}
