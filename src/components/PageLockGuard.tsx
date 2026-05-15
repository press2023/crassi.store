import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { usePageLock } from '../context/PageLockContext'
import { ComingSoon } from './ComingSoon'

interface PageLockGuardProps {
  children: ReactNode
  path?: string
}

export function PageLockGuard({ children, path }: PageLockGuardProps) {
  const { lockedPages } = usePageLock()
  const location = useLocation()
  const currentPath = path ?? location.pathname

  const isLocked =
    lockedPages.has(currentPath) ||
    Array.from(lockedPages).some((lp) => lp !== '/' && currentPath.startsWith(lp))

  if (isLocked) {
    return <ComingSoon />
  }

  return <>{children}</>
}
