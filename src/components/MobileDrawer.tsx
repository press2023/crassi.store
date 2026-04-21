import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  children: React.ReactNode
}

/** درج موبايل/تابلت: لوحة بعرض الشاشة كاملة مع خلفية بنفس ألوان الموقع. */
export function MobileDrawer({ open, onClose, title, closeLabel, children }: Props) {
  const drawerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <div
      className={`fixed inset-0 z-[100] transition-all duration-300 ${open ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label={closeLabel}
      />

      <aside
        ref={drawerRef}
        className={`absolute inset-y-0 start-0 flex h-full w-full max-w-none flex-col border-e-2 border-victorian-300/40 bg-cream-50 shadow-xl transition-opacity duration-300 ease-out dark:border-victorian-800 dark:bg-victorian-950 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-victorian-200 px-4 py-4 dark:border-victorian-800">
          <h2 className="font-display text-lg font-bold uppercase tracking-[0.15em] text-victorian-900 dark:text-cream-50">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2.5 text-victorian-600 hover:bg-victorian-100 dark:text-cream-300 dark:hover:bg-victorian-900"
            aria-label={closeLabel}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
          {children}
        </div>
      </aside>
    </div>
  )
}
