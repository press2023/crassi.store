import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'classi-desktop-sidebar-collapsed'

type Ctx = {
  desktopCollapsed: boolean
  toggleDesktopSidebar: () => void
  expandDesktopSidebar: () => void
  collapseDesktopSidebar: () => void
}

const SidebarLayoutContext = createContext<Ctx | null>(null)

export function SidebarLayoutProvider({ children }: { children: React.ReactNode }) {
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === '1'
  })

  const persist = useCallback((collapsed: boolean) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    }
  }, [])

  const toggleDesktopSidebar = useCallback(() => {
    setDesktopCollapsed((c) => {
      const n = !c
      persist(n)
      return n
    })
  }, [persist])

  const expandDesktopSidebar = useCallback(() => {
    setDesktopCollapsed(false)
    persist(false)
  }, [persist])

  const collapseDesktopSidebar = useCallback(() => {
    setDesktopCollapsed(true)
    persist(true)
  }, [persist])

  const value = useMemo(
    () => ({
      desktopCollapsed,
      toggleDesktopSidebar,
      expandDesktopSidebar,
      collapseDesktopSidebar,
    }),
    [desktopCollapsed, toggleDesktopSidebar, expandDesktopSidebar, collapseDesktopSidebar],
  )

  return (
    <SidebarLayoutContext.Provider value={value}>{children}</SidebarLayoutContext.Provider>
  )
}

export function useSidebarLayout() {
  const c = useContext(SidebarLayoutContext)
  if (!c) throw new Error('useSidebarLayout outside SidebarLayoutProvider')
  return c
}
