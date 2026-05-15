import { createContext, useContext, useEffect, useState } from 'react'

export const LOCKABLE_PAGES = [
  { path: '/products', labelAr: 'المنتجات', labelEn: 'Products' },
  { path: '/sale', labelAr: 'التخفيضات', labelEn: 'Sale' },
  { path: '/search', labelAr: 'البحث', labelEn: 'Search' },
  { path: '/cart', labelAr: 'السلة', labelEn: 'Cart' },
  { path: '/checkout', labelAr: 'الدفع', labelEn: 'Checkout' },
  { path: '/about', labelAr: 'من نحن', labelEn: 'About' },
  { path: '/privacy', labelAr: 'الخصوصية', labelEn: 'Privacy' },
  { path: '/terms', labelAr: 'الشروط', labelEn: 'Terms' },
  { path: '/faq', labelAr: 'الأسئلة', labelEn: 'FAQ' },
  { path: '/visitors', labelAr: 'الزوار', labelEn: 'Visitors' },
  { path: '/coins', labelAr: 'القطع الذهبية', labelEn: 'Royal Coins' },
  { path: '/track', labelAr: 'تتبع الطلب', labelEn: 'Track Order' },
] as const

export type LockablePath = typeof LOCKABLE_PAGES[number]['path']

interface PageLockContextValue {
  lockedPages: Set<string>
  refresh: () => void
}

const PageLockContext = createContext<PageLockContextValue>({
  lockedPages: new Set(),
  refresh: () => {},
})

const base = import.meta.env.VITE_API_BASE ?? ''

export function PageLockProvider({ children }: { children: React.ReactNode }) {
  const [lockedPages, setLockedPages] = useState<Set<string>>(new Set())

  const refresh = () => {
    fetch(`${base}/api/settings`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((s: Record<string, string>) => {
        try {
          const arr = JSON.parse(s.locked_pages ?? '[]') as string[]
          setLockedPages(new Set(arr.filter((p) => typeof p === 'string')))
        } catch {
          setLockedPages(new Set())
        }
      })
      .catch(() => setLockedPages(new Set()))
  }

  useEffect(() => { refresh() }, [])

  return (
    <PageLockContext.Provider value={{ lockedPages, refresh }}>
      {children}
    </PageLockContext.Provider>
  )
}

export function usePageLock() {
  const c = useContext(PageLockContext)
  if (!c) throw new Error('usePageLock outside provider')
  return c
}
