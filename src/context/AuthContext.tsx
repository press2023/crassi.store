import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

type Ctx = {
  token: string | null
  email: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<Ctx | null>(null)
const STORAGE = 'classi-token'
const base = import.meta.env.VITE_API_BASE ?? ''

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE),
  )
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setEmail(null)
      return
    }
    fetch(`${base}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error()
        const d = (await r.json()) as { email: string }
        setEmail(d.email)
      })
      .catch(() => {
        setToken(null)
        setEmail(null)
        localStorage.removeItem(STORAGE)
      })
  }, [token])

  const login = useCallback(async (em: string, pw: string) => {
    const r = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: em, password: pw }),
    })
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { error?: string }
      throw new Error(err.error ?? 'login_failed')
    }
    const d = (await r.json()) as { token: string; email: string }
    localStorage.setItem(STORAGE, d.token)
    setToken(d.token)
    setEmail(d.email)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE)
    setToken(null)
    setEmail(null)
  }, [])

  const value = useMemo(
    () => ({ token, email, login, logout, isAdmin: !!email }),
    [token, email, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuth outside provider')
  return c
}
