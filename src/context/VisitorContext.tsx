import { createContext, useContext } from 'react'
import { useVisitorTracking } from '../lib/useVisitorTracking'
import type { VisitorStats } from '../api'

const VisitorContext = createContext<VisitorStats>({ unique: 0, total: 0 })

export function VisitorProvider({ children }: { children: React.ReactNode }) {
  const stats = useVisitorTracking()
  return <VisitorContext.Provider value={stats}>{children}</VisitorContext.Provider>
}

export function useVisitorStats(): VisitorStats {
  return useContext(VisitorContext)
}
