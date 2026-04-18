import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ImagePlus, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import type { Category, Product } from '../types'

const base = import.meta.env.VITE_API_BASE ?? ''

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
  const [sizes, setSizes] = useState('')
  const [stock, setStock] = useState('10')
  const [imageFiles, setImageFiles] = useState<string[]>([])
  const [catId, setCatId] = useState('')
  const [featured, setFeatured] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
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
          setPrice(String(p.price)); setSizes(p.sizes.join(', ')); setStock(String(p.stock))
          setImageFiles([...p.images]); setCatId(p.category?.id ?? ''); setFeatured(p.featured)
        }
      }
      setLoaded(true)
    }
  }, [token, id])

  useEffect(() => { loadData() }, [loadData])

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-800 dark:border-t-white"></div></div>
  }

  if (!isAdmin) return <Navigate to="/login" replace />

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve) => { reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(file) })
      try {
        const res = await fetch(`${base}/api/upload`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ data: dataUrl, filename: file.name.split('.')[0] }) })
        if (res.ok) { const { url } = await res.json() as { url: string }; setImageFiles((prev) => [...prev, url]) }
      } catch { /* skip */ }
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const removeImg = (idx: number) => setImageFiles((prev) => prev.filter((_, i) => i !== idx))

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true)
    const body = {
      slug, name: nameAr, nameAr, description: descAr, descriptionAr: descAr,
      price: Number(price), sizes: sizes.split(',').map((s) => s.trim()).filter(Boolean),
      stock: Number(stock), images: imageFiles, categoryId: catId, featured,
    }
    if (id) {
      await api(`/api/admin/products/${id}`, token!, { method: 'PUT', body: JSON.stringify(body) })
    } else {
      await api('/api/admin/products', token!, { method: 'POST', body: JSON.stringify(body) })
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
          <span className="text-xs text-slate-400">المقاسات (فاصلة بين كل مقاس)</span>
          <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="S, M, L, XL" className={inp} />
        </label>

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
          <span className="text-xs text-slate-400">صور المنتج</span>
          <div className="mt-2 flex flex-wrap gap-3">
            {imageFiles.map((url, i) => (
              <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeImg(i)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            ))}
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-slate-400 dark:border-slate-700">
              {uploading ? <span className="text-xs">جاري…</span> : <ImagePlus className="h-6 w-6" />}
              <span className="mt-1 text-[10px]">{uploading ? '' : 'إضافة صور'}</span>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" disabled={uploading} />
            </label>
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
