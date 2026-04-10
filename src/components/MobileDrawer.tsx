import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  children: React.ReactNode
}

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
      className={`fixed inset-0 z-[100] transition-visibility ${open ? 'visible' : 'invisible'}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Overlay */}
      <button
        type="button"
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-label={closeLabel}
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        className={`absolute inset-y-0 start-0 flex h-full w-[min(22rem,85vw)] flex-col bg-white transition-transform duration-300 ease-out dark:bg-slate-950 ${
          open ? 'translate-x-0 rtl:-translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">{children}</div>
      </aside>
    </div>
  )
}
