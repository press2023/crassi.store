import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type Props = {
  images: string[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

const MIN_SCALE = 1
const MAX_SCALE = 5
const DOUBLE_TAP_MS = 280
const SWIPE_CLOSE_PX = 110
const SWIPE_NAV_PX = 70

type Pt = { x: number; y: number }

function dist(a: Pt, b: Pt) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

function midpoint(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export function ImageViewer({ images, index, onClose, onPrev, onNext }: Props) {
  // مرجع لحاوية العارض ولعنصر الصورة لتعديل التحويلات (transform) مباشرةً للأداء
  const overlayRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // حالة التحويل الحالية
  const stateRef = useRef({
    scale: 1,
    tx: 0,
    ty: 0,
  })

  // مؤشرات اللمس النشطة (لدعم pinch-to-zoom بإصبعين)
  const pointersRef = useRef(new Map<number, Pt>())
  const gestureRef = useRef<{
    mode: 'idle' | 'pan' | 'pinch' | 'swipe-close' | 'swipe-nav'
    startScale: number
    startTx: number
    startTy: number
    startDist: number
    startMid: Pt
    startSinglePt: Pt
    movedPx: number
  }>({
    mode: 'idle',
    startScale: 1,
    startTx: 0,
    startTy: 0,
    startDist: 0,
    startMid: { x: 0, y: 0 },
    startSinglePt: { x: 0, y: 0 },
    movedPx: 0,
  })

  // لتحديد double-tap
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null)

  // قيد لإجبار إعادة الرسم عند الحاجة (المؤشرات تستخدم refs للأداء)
  const [, forceRender] = useState(0)

  // عند تغيّر الصورة الحالية: أعد ضبط التحويل
  const resetTransform = useCallback(() => {
    stateRef.current = { scale: 1, tx: 0, ty: 0 }
    applyTransform()
  }, [])

  useEffect(() => {
    resetTransform()
    forceRender((n) => n + 1)
  }, [index, resetTransform])

  // قفل تمرير الصفحة الخلفية + استعادتها عند الإغلاق
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevBodyOverflow = body.style.overflow
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverscroll = body.style.overscrollBehavior
    const prevHtmlOverscroll = html.style.overscrollBehavior
    const scrollY = window.scrollY

    body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    html.style.overscrollBehavior = 'none'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
    }
    document.addEventListener('keydown', onKey)

    return () => {
      body.style.overflow = prevBodyOverflow
      html.style.overflow = prevHtmlOverflow
      body.style.overscrollBehavior = prevBodyOverscroll
      html.style.overscrollBehavior = prevHtmlOverscroll
      window.scrollTo(0, scrollY)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose, onPrev, onNext])

  // طبّق transform على الصورة من stateRef بدون إعادة رسم React
  function applyTransform() {
    const img = imgRef.current
    if (!img) return
    const { scale, tx, ty } = stateRef.current
    img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`
    img.style.transition = 'none'
  }

  function animateReset() {
    const img = imgRef.current
    if (!img) return
    img.style.transition = 'transform 180ms ease-out'
    stateRef.current = { scale: 1, tx: 0, ty: 0 }
    img.style.transform = 'translate3d(0,0,0) scale(1)'
    const overlay = overlayRef.current
    if (overlay) {
      overlay.style.transition = 'background 180ms ease-out'
      overlay.style.background = 'rgba(0,0,0,0.95)'
      window.setTimeout(() => {
        if (overlay) overlay.style.transition = ''
      }, 220)
    }
  }

  // قصّ الإزاحة بحيث لا تخرج الصورة كثيراً عن الإطار (يعطي إحساس "حدود")
  function clampPan(scale: number, tx: number, ty: number): { tx: number; ty: number } {
    const img = imgRef.current
    if (!img) return { tx, ty }
    const rect = img.getBoundingClientRect()
    // rect ياخذ بحساب التحويل الحالي؛ نحتاج الحجم الأصلي:
    const baseW = rect.width / stateRef.current.scale
    const baseH = rect.height / stateRef.current.scale
    const overflowX = Math.max(0, (baseW * scale - window.innerWidth) / 2)
    const overflowY = Math.max(0, (baseH * scale - window.innerHeight) / 2)
    return {
      tx: Math.max(-overflowX, Math.min(overflowX, tx)),
      ty: Math.max(-overflowY, Math.min(overflowY, ty)),
    }
  }

  // مرجع لمدّة pointer
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const target = overlayRef.current
    if (target) target.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const pts = Array.from(pointersRef.current.values())
    const g = gestureRef.current

    if (pts.length === 1) {
      const now = performance.now()
      const last = lastTapRef.current
      const px = pts[0]
      // double-tap
      if (last && now - last.t < DOUBLE_TAP_MS && Math.hypot(px.x - last.x, px.y - last.y) < 30) {
        lastTapRef.current = null
        toggleZoomAt(px.x, px.y)
        g.mode = 'idle'
        return
      }
      lastTapRef.current = { t: now, x: px.x, y: px.y }

      g.mode = stateRef.current.scale > 1 ? 'pan' : 'idle'
      g.startScale = stateRef.current.scale
      g.startTx = stateRef.current.tx
      g.startTy = stateRef.current.ty
      g.startSinglePt = px
      g.movedPx = 0
    } else if (pts.length >= 2) {
      g.mode = 'pinch'
      g.startScale = stateRef.current.scale
      g.startTx = stateRef.current.tx
      g.startTy = stateRef.current.ty
      g.startDist = dist(pts[0], pts[1])
      g.startMid = midpoint(pts[0], pts[1])
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = Array.from(pointersRef.current.values())
    const g = gestureRef.current

    if (g.mode === 'pinch' && pts.length >= 2) {
      const d = dist(pts[0], pts[1])
      const ratio = d / Math.max(1, g.startDist)
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, g.startScale * ratio))
      // أبقِ النقطة الوسطى للإصبعين ثابتة بصرياً
      const mid = midpoint(pts[0], pts[1])
      const dx = mid.x - g.startMid.x
      const dy = mid.y - g.startMid.y
      const scaleDelta = newScale / g.startScale
      const tx = g.startTx * scaleDelta + dx
      const ty = g.startTy * scaleDelta + dy
      const clamped = clampPan(newScale, tx, ty)
      stateRef.current = { scale: newScale, tx: clamped.tx, ty: clamped.ty }
      applyTransform()
    } else if (pts.length === 1) {
      const p = pts[0]
      const dx = p.x - g.startSinglePt.x
      const dy = p.y - g.startSinglePt.y
      g.movedPx = Math.hypot(dx, dy)

      if (stateRef.current.scale > 1) {
        // pan داخل الصورة المكبّرة
        g.mode = 'pan'
        const tx = g.startTx + dx
        const ty = g.startTy + dy
        const clamped = clampPan(stateRef.current.scale, tx, ty)
        stateRef.current = { ...stateRef.current, tx: clamped.tx, ty: clamped.ty }
        applyTransform()
      } else if (g.mode === 'idle' || g.mode === 'swipe-close' || g.mode === 'swipe-nav') {
        // تحديد نوع الإيماءة بإصبع واحد عند scale = 1
        if (g.mode === 'idle') {
          if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) g.mode = 'swipe-close'
          else if (Math.abs(dx) > 10) g.mode = 'swipe-nav'
        }
        if (g.mode === 'swipe-close') {
          // اسحب الصورة لأسفل/أعلى مع تخفيف الخلفية لإيحاء "إغلاق بالسحب"
          const ty = dy
          const opacity = Math.max(0.45, 0.95 - Math.abs(dy) / 600)
          const img = imgRef.current
          if (img) {
            img.style.transition = 'none'
            img.style.transform = `translate3d(0px, ${ty}px, 0) scale(1)`
          }
          const overlay = overlayRef.current
          if (overlay) overlay.style.background = `rgba(0,0,0,${opacity})`
        } else if (g.mode === 'swipe-nav') {
          // معاينة السحب الأفقي للتنقل بين الصور
          const img = imgRef.current
          if (img && images.length > 1) {
            img.style.transition = 'none'
            img.style.transform = `translate3d(${dx}px, 0px, 0) scale(1)`
          }
        }
      }
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId)
    const g = gestureRef.current

    if (g.mode === 'pinch' && pointersRef.current.size < 2) {
      // انتهت إيماءة الإصبعين: لو رجعنا إلى scale ≈ 1 نعيد الضبط
      if (stateRef.current.scale <= 1.02) {
        animateReset()
      }
      g.mode = stateRef.current.scale > 1 ? 'pan' : 'idle'
    } else if (g.mode === 'swipe-close') {
      // قرّر هل نُغلق أم نرجّع
      const img = imgRef.current
      const dy = img ? new DOMMatrix(getComputedStyle(img).transform).f : 0
      if (Math.abs(dy) > SWIPE_CLOSE_PX) {
        if (img) {
          img.style.transition = 'transform 180ms ease-out, opacity 180ms ease-out'
          img.style.transform = `translate3d(0px, ${dy > 0 ? window.innerHeight : -window.innerHeight}px, 0) scale(1)`
          img.style.opacity = '0'
        }
        const overlay = overlayRef.current
        if (overlay) {
          overlay.style.transition = 'background 180ms ease-out'
          overlay.style.background = 'rgba(0,0,0,0)'
        }
        window.setTimeout(() => onClose(), 170)
      } else {
        animateReset()
      }
      g.mode = 'idle'
    } else if (g.mode === 'swipe-nav') {
      const img = imgRef.current
      const dx = img ? new DOMMatrix(getComputedStyle(img).transform).e : 0
      if (images.length > 1 && Math.abs(dx) > SWIPE_NAV_PX) {
        if (dx > 0) onPrev()
        else onNext()
        // resetTransform يتم عبر useEffect على index
      } else {
        animateReset()
      }
      g.mode = 'idle'
    } else if (g.mode === 'pan' && stateRef.current.scale <= 1.02) {
      animateReset()
      g.mode = 'idle'
    }
  }

  const onPointerCancel = onPointerUp

  function toggleZoomAt(clientX: number, clientY: number) {
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    const cx = clientX - (rect.left + rect.width / 2)
    const cy = clientY - (rect.top + rect.height / 2)
    if (stateRef.current.scale > 1.05) {
      animateReset()
    } else {
      const targetScale = 2.5
      // أزِح الصورة بحيث تكون النقطة المضغوطة قريبة من المركز
      const tx = -cx * (targetScale - 1)
      const ty = -cy * (targetScale - 1)
      const clamped = clampPan(targetScale, tx, ty)
      stateRef.current = { scale: targetScale, tx: clamped.tx, ty: clamped.ty }
      img.style.transition = 'transform 180ms ease-out'
      img.style.transform = `translate3d(${clamped.tx}px, ${clamped.ty}px, 0) scale(${targetScale})`
    }
  }

  // عجلة الفأرة (سطح المكتب)
  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, stateRef.current.scale * factor))
    if (newScale === stateRef.current.scale) return
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    const cx = e.clientX - (rect.left + rect.width / 2)
    const cy = e.clientY - (rect.top + rect.height / 2)
    const scaleDelta = newScale / stateRef.current.scale
    const tx = stateRef.current.tx - cx * (scaleDelta - 1)
    const ty = stateRef.current.ty - cy * (scaleDelta - 1)
    const clamped = clampPan(newScale, tx, ty)
    stateRef.current = { scale: newScale, tx: clamped.tx, ty: clamped.ty }
    if (newScale <= 1.02) animateReset()
    else applyTransform()
  }

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 select-none"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onWheel={onWheel}
      onClick={(e) => {
        // إغلاق فقط لو ضغطنا الخلفية ولم تكن إيماءة سحب أو تكبير
        if (e.target === overlayRef.current && stateRef.current.scale <= 1.02) onClose()
      }}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute end-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20"
        aria-label="إغلاق"
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPrev() }}
            className="absolute start-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20"
            aria-label="السابق"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNext() }}
            className="absolute end-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20"
            aria-label="التالي"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <img
        ref={imgRef}
        src={images[index]}
        alt=""
        draggable={false}
        className="max-h-[90vh] max-w-[92vw] object-contain will-change-transform"
        style={{ touchAction: 'none', userSelect: 'none' } as React.CSSProperties}
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
