import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ImagePlus, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { uploadImageFile } from '../lib/uploadImage'
import type { Category, Product } from '../types'

type ImageSlot = { kind: 'remote'; url: string } | { kind: 'local'; file: File; preview: string }

const base = import.meta.env.VITE_API_BASE ?? ''
const MAX_PRODUCT_IMAGES = 4

function api(path: string, token: string, opts?: RequestInit) {
  return fetch(`${base}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
  })
}

export function AdminEditProduct() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const { token, isAdmin, isLoading } = useAuth()
  const { isAr } = useLanguage()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[]>([])
  const [slug, setSlug] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [descAr, setDescAr] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('10')
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([])
  const imageSlotsRef = useRef<ImageSlot[]>([])
  imageSlotsRef.current = imageSlots
  const [catId, setCatId] = useState('')
  const [featured, setFeatured] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(isNew)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    if (!token) return
    const cr = await fetch(`${base}/api/categories`)
    if (cr.ok) setCategories(await cr.json())
    if (id) {
      const pr = await fetch(`${base}/api/products`)
      if (pr.ok) {
        const all = (await pr.json()) as Product[]
        const p = all.find((x) => x.id === id)
        if (p) {
          setSlug(p.slug); setNameAr(p.nameAr); setDescAr(p.descriptionAr)
          setPrice(String(p.price)); setStock(String(p.stock))
          setImageSlots(
            p.images.slice(0, MAX_PRODUCT_IMAGES).map((url) => ({ kind: 'remote' as const, url })),
          )
          setCatId(p.category?.id ?? ''); setFeatured(p.featured)
        }
      }
      setLoaded(true)
    }
  }, [token, id])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    return () => {
      for (const s of imageSlotsRef.current) {
        if (s.kind === 'local') URL.revokeObjectURL(s.preview)
      }
    }
  }, [])

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-800 dark:border-t-white"></div></div>
  }

  if (!isAdmin) return <Navigate to="/login" replace />

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const list = Array.from(files)
    setImageSlots((prev) => {
      const room = MAX_PRODUCT_IMAGES - prev.length
      if (room <= 0) {
        alert(isAr ? `يمكن رفع ${MAX_PRODUCT_IMAGES} صور كحد أقصى لكل منتج.` : `You can add at most ${MAX_PRODUCT_IMAGES} images per product.`)
        return prev
      }
      if (list.length > room) {
        alert(
          isAr
            ? `يُسمح بـ ${MAX_PRODUCT_IMAGES} صور فقط. تمت إضافة أول ${room} صورة/صور من اختيارك.`
            : `Only ${MAX_PRODUCT_IMAGES} images allowed. Added the first ${room} from your selection.`,
        )
      }
      const toAdd = list.slice(0, room)
      return [
        ...prev,
        ...toAdd.map((file) => ({ kind: 'local' as const, file, preview: URL.createObjectURL(file) })),
      ]
    })
    if (fileRef.current) fileRef.current.value = ''
  }

  const removeImg = (idx: number) => {
    setImageSlots((prev) => {
      const slot = prev[idx]
      if (slot?.kind === 'local') URL.revokeObjectURL(slot.preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setBusy(true)
    const nextSlots: ImageSlot[] = []
    let uploadError = false
    for (const slot of imageSlots) {
      if (slot.kind === 'remote') {
        nextSlots.push(slot)
        continue
      }
      const url = await uploadImageFile(base, token, slot.file, slot.file.name)
      if (!url) {
        uploadError = true
        nextSlots.push(slot)
        continue
      }
      URL.revokeObjectURL(slot.preview)
      nextSlots.push({ kind: 'remote', url })
    }
    if (uploadError) {
      setImageSlots(nextSlots)
      setBusy(false)
      alert(isAr ? 'تعذر رفع بعض الصور. تحقق من الاتصال وحاول مجدداً.' : 'Some images failed to upload. Check your connection and try again.')
      return
    }
    const uploaded = nextSlots
      .filter((s): s is { kind: 'remote'; url: string } => s.kind === 'remote')
      .map((s) => s.url)
      .slice(0, MAX_PRODUCT_IMAGES)
    const body = {
      slug, name: nameAr, nameAr, description: descAr, descriptionAr: descAr,
      price: Number(price), sizes: [],
      stock: Number(stock), images: uploaded, categoryId: catId, featured,
    }
    if (id) {
      await api(`/api/admin/products/${id}`, token, { method: 'PUT', body: JSON.stringify(body) })
    } else {
      await api('/api/admin/products', token, { method: 'POST', body: JSON.stringify(body) })
    }
    setBusy(false)
    navigate('/admin')
  }

  if (!loaded) {
    return <div className="mx-auto max-w-lg px-4 py-20"><div className="h-8 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></div>
  }

  const inp = 'mt-1 w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900'
  const ta = 'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900'

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <button type="button" onClick={() => navigate('/admin')}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
        <ArrowRight className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {isAr ? 'العودة للوحة التحكم' : 'Back to dashboard'}
      </button>

      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
        {id ? (isAr ? 'تعديل المنتج' : 'Edit Product') : (isAr ? 'منتج جديد' : 'New Product')}
      </h1>

      <form onSubmit={save} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs text-slate-400">رابط المنتج (Slug)</span>
          <input required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="cool-jacket" className={inp} />
        </label>

        <label className="block">
          <span className="text-xs text-slate-400">اسم المنتج</span>
          <input required value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={inp} />
        </label>

        <label className="block">
          <span className="text-xs text-slate-400">وصف المنتج</span>
          <textarea value={descAr} onChange={(e) => setDescAr(e.target.value)} rows={3} className={ta} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-slate-400">السعر (IQD)</span>
            <input required type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inp} />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">المخزون</span>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className={inp} />
          </label>
        </div>

        <label className="block">
          <span className="text-xs text-slate-400">التصنيف</span>
          <select required value={catId} onChange={(e) => setCatId(e.target.value)} className={inp}>
            <option value="">اختر التصنيف</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
          </select>
        </label>

        <label className="flex items-center gap-2 py-1">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-slate-900" />
          <span className="text-sm">مميز (يظهر بالصفحة الرئيسية)</span>
        </label>

        {/* Images */}
        <div>
          <span className="text-xs text-slate-400">
            {isAr ? `صور المنتج (حد أقصى ${MAX_PRODUCT_IMAGES})` : `Product images (max ${MAX_PRODUCT_IMAGES})`}
          </span>
          <div className="mt-2 flex flex-wrap gap-3">
            {imageSlots.map((slot, i) => (
              <div key={slot.kind === 'local' ? slot.preview : `${slot.url}-${i}`} className="group relative h-24 w-24 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                <img src={slot.kind === 'remote' ? slot.url : slot.preview} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeImg(i)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            ))}
            {imageSlots.length < MAX_PRODUCT_IMAGES && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-slate-400 dark:border-slate-700">
                <ImagePlus className="h-6 w-6" />
                <span className="mt-1 text-[10px]">{isAr ? 'إضافة صور' : 'Add images'}</span>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={busy}
            className="flex-1 rounded-full bg-slate-900 py-3.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900">
            {busy ? '…' : id ? 'تحديث المنتج' : 'إضافة المنتج'}
          </button>
          <button type="button" onClick={() => navigate('/admin')}
            className="rounded-full border border-slate-200 px-6 py-3.5 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}
