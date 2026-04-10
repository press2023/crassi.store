import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type Props = {
  images: string[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function ImageViewer({ images, index, onClose, onPrev, onNext }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose, onPrev, onNext])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95" onClick={onClose}>
      <button type="button" onClick={onClose}
        className="absolute end-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20">
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onPrev() }}
            className="absolute start-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onNext() }}
            className="absolute end-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20">
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <img
        src={images[index]}
        alt=""
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2">
          {images.map((_, i) => (
            <div key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
