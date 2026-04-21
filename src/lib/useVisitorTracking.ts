import { useEffect, useState } from 'react'
import { fetchVisitorStats, trackVisit } from '../api'
import type { VisitorStats } from '../api'

const STORAGE_KEY = 'classi-visitor-id'
const SESSION_KEY = 'classi-visitor-sent'

function getOrCreateVisitorId(): string {
  if (typeof localStorage === 'undefined') return ''
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    const cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined
    id =
      cryptoObj && 'randomUUID' in cryptoObj
        ? cryptoObj.randomUUID()
        : `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

export function useVisitorTracking(): VisitorStats {
  const [stats, setStats] = useState<VisitorStats>({ unique: 0, total: 0 })

  useEffect(() => {
    let cancelled = false
    const visitorId = getOrCreateVisitorId()
    if (!visitorId) return

    const alreadySent =
      typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_KEY) : null

    const run = async () => {
      try {
        if (alreadySent) {
          const s = await fetchVisitorStats()
          if (!cancelled) setStats(s)
        } else {
          const s = await trackVisit(visitorId)
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(SESSION_KEY, '1')
          }
          if (!cancelled) setStats(s)
        }
      } catch {
        const s = await fetchVisitorStats()
        if (!cancelled) setStats(s)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return stats
}
