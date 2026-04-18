import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Calendar,
  CheckSquare,
  ClipboardList,
  Edit3,
  FolderPlus,
  ImagePlus,
  Image as ImageIcon,
  LogOut,
  MapPin,
  Package,
  Phone,
  Plus,
  Square,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import type { Category, Product } from '../types'

const base = import.meta.env.VITE_API_BASE ?? ''

type Tab = 'categories' | 'products' | 'orders' | 'site'

type OrderItem = {
  id: string
  productName: string
  size: string
  quantity: number
  unitPrice: string
  image: string | null
}

type Order = {
  id: string
  createdAt: string
  customerName: string
  phone: string
  province: string
  city: string
  address: string
  landmark: string
  notes: string | null
  total: string
  status: string
  items: OrderItem[]
}

function api(path: string, token: string, opts?: RequestInit) {
  return fetch(`${base}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
  })
}

export function Admin() {
  const { token, email, isAdmin, isLoading, logout } = useAuth()
  const { isAr } = useLanguage()
  const [tab, setTab] = useState<Tab>('orders')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const load = useCallback(async () => {
    if (!token) return
    setDataLoading(true)
    try {
      const [cr, pr, or] = await Promise.all([
        fetch(`${base}/api/categories`),
        fetch(`${base}/api/products`),
        api('/api/admin/orders', token),
      ])
      if (cr.ok) setCategories(await cr.json())
      if (pr.ok) setProducts(await pr.json())
      if (or.ok) setOrders(await or.json())
    } catch { /* offline */ }
    setDataLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  if (isLoading || (isAdmin && dataLoading && orders.length === 0 && products.length === 0 && categories.length === 0)) {
    return <AdminShimmer isAr={isAr} />
  }

  if (!isAdmin) return <Navigate to="/login" replace />

  const tabBtn = (t: Tab, icon: React.ReactNode, label: string) => (
    <button type="button" onClick={() => setTab(t)}
      className={`inline-flex items-center gap-2 border-2 px-5 py-2 font-display text-xs font-semibold uppercase tracking-[0.2em] transition ${
        tab === t
          ? 'border-burgundy-700 bg-burgundy-700 text-cream-50'
          : 'border-victorian-300 bg-transparent text-victorian-800 hover:bg-victorian-100 dark:border-victorian-700 dark:text-cream-200 dark:hover:bg-victorian-900'
      }`}>
      {icon}{label}
    </button>
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-[0.2em] text-victorian-900 dark:text-cream-50">{isAr ? 'لوحة التحكم' : 'Dashboard'}</h1>
          <p className="text-xs text-victorian-500">{email}</p>
        </div>
        <button type="button" onClick={logout}
          className="inline-flex items-center gap-2 border border-victorian-300 px-4 py-2 text-sm text-victorian-700 hover:bg-victorian-100 dark:border-victorian-700 dark:text-cream-200 dark:hover:bg-victorian-900">
          <LogOut className="h-4 w-4" />{isAr ? 'خروج' : 'Logout'}
        </button>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {tabBtn('orders', <ClipboardList className="h-4 w-4" />, isAr ? 'الطلبات' : 'Orders')}
        {tabBtn('products', <Package className="h-4 w-4" />, isAr ? 'المنتجات' : 'Products')}
        {tabBtn('categories', <Tag className="h-4 w-4" />, isAr ? 'التصنيفات' : 'Categories')}
        {tabBtn('site', <ImageIcon className="h-4 w-4" />, isAr ? 'إعدادات الموقع' : 'Site')}
      </div>

      {tab === 'categories' && <CategoriesTab token={token!} categories={categories} isAr={isAr} reload={load} />}
      {tab === 'products' && <ProductsTab token={token!} products={products} categories={categories} isAr={isAr} reload={load} />}
      {tab === 'orders' && <OrdersTab token={token!} orders={orders} isAr={isAr} reload={load} />}
      {tab === 'site' && <SiteTab token={token!} isAr={isAr} />}
    </div>
  )
}

/* ─── Admin Shimmer ──────────────────────────────────── */

function AdminShimmer({ isAr }: { isAr: boolean }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="h-6 w-40 animate-pulse bg-victorian-100 dark:bg-victorian-900" />
          <div className="mt-2 h-3 w-32 animate-pulse bg-victorian-100 dark:bg-victorian-900" />
        </div>
        <div className="h-10 w-24 animate-pulse bg-victorian-100 dark:bg-victorian-900" />
      </div>
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-32 animate-pulse bg-victorian-100 dark:bg-victorian-900" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border border-victorian-200 p-4 dark:border-victorian-800">
            <div className="h-12 w-12 shrink-0 animate-pulse bg-victorian-100 dark:bg-victorian-900" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse bg-victorian-100 dark:bg-victorian-900" />
              <div className="h-3 w-1/4 animate-pulse bg-victorian-100 dark:bg-victorian-900" />
            </div>
            <div className="h-8 w-24 animate-pulse bg-victorian-100 dark:bg-victorian-900" />
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-victorian-500">
        {isAr ? 'جارِ تحميل لوحة التحكم…' : 'Loading dashboard…'}
      </p>
    </div>
  )
}

/* ─── Site Settings (Hero image) ─────────────────────── */

function SiteTab({ token, isAr }: { token: string; isAr: boolean }) {
  const [heroImage, setHeroImage] = useState<string>('')
  const [heroTitle, setHeroTitle] = useState<string>('')
  const [aboutTitleAr, setAboutTitleAr] = useState<string>('')
  const [aboutBodyAr, setAboutBodyAr] = useState<string>('')
  const [aboutTitleEn, setAboutTitleEn] = useState<string>('')
  const [aboutBodyEn, setAboutBodyEn] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`${base}/api/settings`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((s: {
        heroImage?: string
        heroTitle?: string
        aboutTitleAr?: string
        aboutBodyAr?: string
        aboutTitleEn?: string
        aboutBodyEn?: string
      }) => {
        setHeroImage(s.heroImage ?? '')
        setHeroTitle(s.heroTitle ?? '')
        setAboutTitleAr(s.aboutTitleAr ?? '')
        setAboutBodyAr(s.aboutBodyAr ?? '')
        setAboutTitleEn(s.aboutTitleEn ?? '')
        setAboutBodyEn(s.aboutBodyEn ?? '')
      })
      .catch(() => { /* ignore */ })
  }, [])

  const uploadFile = async (file: File): Promise<string | null> => {
    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
    try {
      const res = await fetch(`${base}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: dataUrl, filename: `hero-${Date.now()}` }),
      })
      if (res.ok) {
        const { url } = (await res.json()) as { url: string }
        return url
      }
    } catch { /* skip */ }
    return null
  }

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    const url = await uploadFile(f)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    if (url) setHeroImage(url)
  }

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const res = await api('/api/admin/settings', token, {
        method: 'PUT',
        body: JSON.stringify({
          heroImage: heroImage || null,
          heroTitle: heroTitle || null,
          aboutTitleAr: aboutTitleAr || null,
          aboutBodyAr: aboutBodyAr || null,
          aboutTitleEn: aboutTitleEn || null,
          aboutBodyEn: aboutBodyEn || null,
        }),
      })
      if (res.ok) setMsg(isAr ? '✓ تم الحفظ' : '✓ Saved')
      else setMsg(isAr ? '✗ تعذر الحفظ' : '✗ Save failed')
    } catch {
      setMsg(isAr ? '✗ خطأ في الشبكة' : '✗ Network error')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="border border-victorian-200 bg-cream-50 p-5 dark:border-victorian-800 dark:bg-victorian-950/60">
        <h2 className="mb-1 font-display text-lg font-bold text-victorian-900 dark:text-cream-50">
          {isAr ? 'صورة الهيرو (Banner الرئيسي)' : 'Hero image (homepage banner)'}
        </h2>
        <p className="mb-4 text-xs text-victorian-500">
          {isAr
            ? 'الصورة الكبيرة التي تظهر أعلى الصفحة الرئيسية. يُنصح بأبعاد أفقية عريضة (1920×1080 مثلاً).'
            : 'The large image at the top of the homepage. A wide 16:9 ratio works best.'}
        </p>

        <div className="flex flex-wrap items-start gap-4">
          <div className="h-36 w-64 shrink-0 overflow-hidden border border-victorian-300 bg-victorian-100 dark:border-victorian-700 dark:bg-victorian-900">
            {heroImage ? (
              <img src={heroImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-victorian-400">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 border border-victorian-300 px-4 py-2 text-sm text-victorian-700 hover:bg-victorian-100 dark:border-victorian-700 dark:text-cream-200 dark:hover:bg-victorian-900">
              <ImagePlus className="h-4 w-4" />
              {uploading ? '…' : (isAr ? (heroImage ? 'تغيير الصورة' : 'رفع صورة') : (heroImage ? 'Change image' : 'Upload image'))}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} disabled={uploading} />
            </label>
            {heroImage && (
              <button
                type="button"
                onClick={() => setHeroImage('')}
                className="inline-flex items-center gap-2 border border-burgundy-300 px-4 py-2 text-sm text-burgundy-700 hover:bg-burgundy-50 dark:border-burgundy-800 dark:text-burgundy-300 dark:hover:bg-burgundy-900/30"
              >
                <Trash2 className="h-4 w-4" />
                {isAr ? 'إزالة الصورة' : 'Remove image'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border border-victorian-200 bg-cream-50 p-5 dark:border-victorian-800 dark:bg-victorian-950/60">
        <label className="block">
          <span className="font-display text-sm font-semibold text-victorian-900 dark:text-cream-50">
            {isAr ? 'عنوان الهيرو (اختياري)' : 'Hero title (optional)'}
          </span>
          <p className="mt-1 mb-2 text-xs text-victorian-500">
            {isAr
              ? 'غير مُستخدم حالياً — الهيرو يظهر بصورة + زر فقط.'
              : 'Currently unused — the hero shows the image + button only.'}
          </p>
          <input
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            placeholder={isAr ? 'مثال: Victorian Store' : 'e.g. Victorian Store'}
            className="mt-1 w-full border border-victorian-300 bg-cream-50 px-4 py-2 text-sm dark:border-victorian-700 dark:bg-victorian-950 dark:text-cream-100"
          />
        </label>
      </div>

      {/* صفحة من نحن */}
      <div className="border border-victorian-200 bg-cream-50 p-5 dark:border-victorian-800 dark:bg-victorian-950/60">
        <h2 className="mb-3 font-display text-lg font-bold text-victorian-900 dark:text-cream-50">
          {isAr ? 'صفحة "من نحن"' : '"About" page'}
        </h2>
        <p className="mb-4 text-xs text-victorian-500">
          {isAr
            ? 'يمكنك تعديل محتوى صفحة من نحن بالعربية والإنجليزية. اترك الحقل فارغاً لاستخدام النص الافتراضي.'
            : 'Edit the About page content in both languages. Leave a field empty to use the default.'}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-victorian-600 dark:text-cream-200">
              العربية
            </p>
            <label className="block">
              <span className="text-xs text-victorian-500">العنوان</span>
              <input
                value={aboutTitleAr}
                onChange={(e) => setAboutTitleAr(e.target.value)}
                placeholder="من نحن"
                dir="rtl"
                className="mt-1 w-full border border-victorian-300 bg-cream-50 px-4 py-2 text-sm dark:border-victorian-700 dark:bg-victorian-950 dark:text-cream-100"
              />
            </label>
            <label className="block">
              <span className="text-xs text-victorian-500">النص</span>
              <textarea
                value={aboutBodyAr}
                onChange={(e) => setAboutBodyAr(e.target.value)}
                rows={6}
                placeholder="أخبرنا قصتك…"
                dir="rtl"
                className="mt-1 w-full border border-victorian-300 bg-cream-50 px-4 py-2 text-sm dark:border-victorian-700 dark:bg-victorian-950 dark:text-cream-100"
              />
            </label>
          </div>

          <div className="space-y-3">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-victorian-600 dark:text-cream-200">
              English
            </p>
            <label className="block">
              <span className="text-xs text-victorian-500">Title</span>
              <input
                value={aboutTitleEn}
                onChange={(e) => setAboutTitleEn(e.target.value)}
                placeholder="About us"
                dir="ltr"
                className="mt-1 w-full border border-victorian-300 bg-cream-50 px-4 py-2 text-sm dark:border-victorian-700 dark:bg-victorian-950 dark:text-cream-100"
              />
            </label>
            <label className="block">
              <span className="text-xs text-victorian-500">Body</span>
              <textarea
                value={aboutBodyEn}
                onChange={(e) => setAboutBodyEn(e.target.value)}
                rows={6}
                placeholder="Tell your story…"
                dir="ltr"
                className="mt-1 w-full border border-victorian-300 bg-cream-50 px-4 py-2 text-sm dark:border-victorian-700 dark:bg-victorian-950 dark:text-cream-100"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center border-2 border-burgundy-700 bg-burgundy-700 px-6 py-2.5 font-display text-sm font-semibold text-cream-50 hover:bg-burgundy-800 disabled:opacity-50"
        >
          {saving ? (isAr ? 'جارِ الحفظ…' : 'Saving…') : (isAr ? 'حفظ التغييرات' : 'Save changes')}
        </button>
        {msg && <span className="text-sm text-victorian-700 dark:text-cream-200">{msg}</span>}
      </div>
    </div>
  )
}

/* ─── Categories ─────────────────────────────────────── */

function CategoriesTab({ token, categories, isAr, reload }: { token: string; categories: Category[]; isAr: boolean; reload: () => void }) {
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [image, setImage] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const inp = 'mt-1 w-full border border-victorian-300 bg-cream-50 px-4 py-2 text-sm dark:border-victorian-700 dark:bg-victorian-950 dark:text-cream-100'

  const uploadFile = async (file: File): Promise<string | null> => {
    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
    try {
      const res = await fetch(`${base}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: dataUrl, filename: file.name.split('.')[0] }),
      })
      if (res.ok) {
        const { url } = (await res.json()) as { url: string }
        return url
      }
    } catch { /* skip */ }
    return null
  }

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setUploading(true)
    const url = await uploadFile(f)
    if (url) setImage(url)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true)
    await api('/api/admin/categories', token, {
      method: 'POST',
      body: JSON.stringify({ slug, name: name || nameAr, nameAr, image: image || null }),
    })
    setSlug(''); setName(''); setNameAr(''); setImage(''); await reload(); setBusy(false)
  }

  const del = async (id: string) => {
    if (!confirm(isAr
      ? 'حذف هذا التصنيف؟ (سيحذف كل المنتجات التابعة له)'
      : 'Delete this category? (All linked products will be deleted)')) return
    const r = await api(`/api/admin/categories/${id}`, token, { method: 'DELETE' })
    if (!r.ok) alert(isAr ? 'تعذر الحذف.' : 'Delete failed.')
    reload()
  }

  const updateImage = async (id: string, url: string | null) => {
    await api(`/api/admin/categories/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify({ image: url }),
    })
    reload()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="grid gap-3 border border-victorian-200 bg-cream-50 p-4 dark:border-victorian-800 dark:bg-victorian-950/60 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-victorian-500">الرابط (Slug)</span>
          <input required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="men" className={inp} />
        </label>
        <label className="block">
          <span className="text-xs text-victorian-500">الاسم بالانجليزية</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Gentlemen" className={inp} />
        </label>
        <label className="block">
          <span className="text-xs text-victorian-500">الاسم بالعربية</span>
          <input required value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="السادة" className={inp} />
        </label>

        <div className="block">
          <span className="text-xs text-victorian-500">{isAr ? 'صورة التصنيف (دائرية)' : 'Category image (circular)'}</span>
          <div className="mt-2 flex items-center gap-3">
            {image ? (
              <div className="relative h-16 w-16 overflow-hidden rounded-full border border-victorian-300">
                <img src={image} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setImage('')}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition hover:opacity-100">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-victorian-300 text-victorian-500 hover:border-burgundy-600">
                {uploading ? <span className="text-[10px]">…</span> : <ImagePlus className="h-5 w-5" />}
                <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" disabled={uploading} />
              </label>
            )}
            <p className="text-xs text-victorian-500">{isAr ? 'PNG/JPG — مربع يُفضل' : 'PNG/JPG — square preferred'}</p>
          </div>
        </div>

        <button type="submit" disabled={busy}
          className="inline-flex items-center justify-center gap-2 border-2 border-burgundy-700 bg-burgundy-700 px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.2em] text-cream-50 hover:bg-burgundy-800 disabled:opacity-50 sm:col-span-2">
          <FolderPlus className="h-4 w-4" />{isAr ? 'إضافة تصنيف' : 'Add category'}
        </button>
      </form>

      <ul className="divide-y divide-victorian-200 dark:divide-victorian-800">
        {categories.map((c) => (
          <CategoryRow
            key={c.id}
            category={c}
            onDelete={() => del(c.id)}
            onUpload={async (file) => {
              setUploading(true)
              const url = await uploadFile(file)
              setUploading(false)
              if (url) await updateImage(c.id, url)
            }}
            onRemoveImage={() => updateImage(c.id, null)}
          />
        ))}
        {categories.length === 0 && <li className="py-8 text-center text-sm text-victorian-400">{isAr ? 'لا توجد تصنيفات' : 'No categories'}</li>}
      </ul>
    </div>
  )
}

function CategoryRow({
  category,
  onDelete,
  onUpload,
  onRemoveImage,
}: {
  category: Category
  onDelete: () => void
  onUpload: (file: File) => Promise<void>
  onRemoveImage: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setBusy(true)
    await onUpload(f)
    setBusy(false)
    if (ref.current) ref.current.value = ''
  }

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-victorian-300 bg-victorian-100 dark:border-victorian-700 dark:bg-victorian-900">
        {category.image ? (
          <img src={category.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-victorian-400">
            <Tag className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-victorian-900 dark:text-cream-100">{category.nameAr}</span>
        <span className="text-xs text-victorian-500">{category.slug} · {category.name}</span>
      </div>
      <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 border border-victorian-300 px-3 py-1.5 text-xs text-victorian-700 hover:bg-victorian-100 dark:border-victorian-700 dark:text-cream-200 dark:hover:bg-victorian-900">
        <ImagePlus className="h-3.5 w-3.5" />
        {busy ? '…' : (category.image ? 'تحديث الصورة' : 'إضافة صورة')}
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle} disabled={busy} />
      </label>
      {category.image && (
        <button type="button" onClick={onRemoveImage}
          className="shrink-0 border border-victorian-300 p-2 text-victorian-500 hover:bg-victorian-100 dark:border-victorian-700 dark:hover:bg-victorian-900">
          <X className="h-4 w-4" />
        </button>
      )}
      <button type="button" onClick={onDelete}
        className="shrink-0 border border-burgundy-300 p-2 text-burgundy-600 hover:bg-burgundy-50 dark:border-burgundy-800 dark:hover:bg-burgundy-900/30">
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  )
}

/* ─── Products ───────────────────────────────────────── */

function ProductsTab({ token, products, categories, isAr, reload }: { token: string; products: Product[]; categories: Category[]; isAr: boolean; reload: () => void }) {
  const [activeCat, setActiveCat] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const filtered = activeCat ? products.filter((p) => p.category?.id === activeCat) : products
  const allVisibleSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id))
  const anySelected = selected.size > 0

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleAllVisible = () => {
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev)
        filtered.forEach((p) => next.delete(p.id))
        return next
      }
      const next = new Set(prev)
      filtered.forEach((p) => next.add(p.id))
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  const del = async (id: string) => {
    if (!confirm(isAr ? 'حذف هذا المنتج؟' : 'Delete this product?')) return
    const r = await api(`/api/admin/products/${id}`, token, { method: 'DELETE' })
    if (!r.ok) alert(isAr ? 'تعذر حذف المنتج.' : 'Delete failed.')
    reload()
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(isAr
      ? `حذف ${selected.size} منتج/منتجات المحددة؟`
      : `Delete ${selected.size} selected product(s)?`)) return
    setBusy(true)
    const r = await api('/api/admin/products/bulk-delete', token, {
      method: 'POST',
      body: JSON.stringify({ ids: Array.from(selected) }),
    })
    setBusy(false)
    if (!r.ok) {
      alert(isAr ? 'تعذر الحذف الجماعي.' : 'Bulk delete failed.')
      return
    }
    clearSelection()
    reload()
  }

  return (
    <div className="space-y-5">
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button type="button" onClick={() => setActiveCat('')}
          className={`shrink-0 border px-4 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.2em] ${!activeCat
            ? 'border-burgundy-700 bg-burgundy-700 text-cream-50'
            : 'border-victorian-300 text-victorian-700 dark:border-victorian-700 dark:text-cream-200'}`}>
          {isAr ? 'الكل' : 'All'}
        </button>
        {categories.map((c) => (
          <button key={c.id} type="button" onClick={() => setActiveCat(c.id)}
            className={`shrink-0 border px-4 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.2em] ${activeCat === c.id
              ? 'border-burgundy-700 bg-burgundy-700 text-cream-50'
              : 'border-victorian-300 text-victorian-700 dark:border-victorian-700 dark:text-cream-200'}`}>
            {c.nameAr}
          </button>
        ))}
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/admin/product/new"
          className="inline-flex items-center gap-2 border-2 border-burgundy-700 bg-burgundy-700 px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.2em] text-cream-50 hover:bg-burgundy-800">
          <Plus className="h-4 w-4" />{isAr ? 'إضافة منتج' : 'New product'}
        </Link>

        <button type="button" onClick={toggleAllVisible}
          className="inline-flex items-center gap-2 border border-victorian-300 px-4 py-2 text-xs text-victorian-700 hover:bg-victorian-100 dark:border-victorian-700 dark:text-cream-200 dark:hover:bg-victorian-900">
          {allVisibleSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          {isAr
            ? (allVisibleSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل الظاهر')
            : (allVisibleSelected ? 'Unselect all' : 'Select all visible')}
        </button>

        {anySelected && (
          <>
            <span className="text-xs text-victorian-500">
              {isAr ? `${selected.size} محدد` : `${selected.size} selected`}
            </span>
            <button type="button" onClick={clearSelection}
              className="inline-flex items-center gap-1 border border-victorian-300 px-3 py-2 text-xs text-victorian-700 hover:bg-victorian-100 dark:border-victorian-700 dark:text-cream-200 dark:hover:bg-victorian-900">
              <X className="h-3.5 w-3.5" />
              {isAr ? 'مسح التحديد' : 'Clear'}
            </button>
            <button type="button" onClick={bulkDelete} disabled={busy}
              className="inline-flex items-center gap-2 border-2 border-burgundy-700 bg-burgundy-700 px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-cream-50 hover:bg-burgundy-800 disabled:opacity-50">
              <Trash2 className="h-4 w-4" />
              {isAr ? `حذف ${selected.size}` : `Delete ${selected.size}`}
            </button>
          </>
        )}
      </div>

      {/* Products list */}
      <div className="divide-y divide-victorian-200 dark:divide-victorian-800">
        {filtered.map((p) => {
          const checked = selected.has(p.id)
          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 py-3 ${checked ? 'bg-burgundy-50/60 dark:bg-burgundy-900/20' : ''}`}
            >
              <button
                type="button"
                onClick={() => toggle(p.id)}
                className="shrink-0 p-1 text-victorian-500"
                aria-label={checked ? 'Unselect' : 'Select'}
              >
                {checked ? <CheckSquare className="h-5 w-5 text-burgundy-700" /> : <Square className="h-5 w-5" />}
              </button>

              <div className="h-14 w-14 shrink-0 overflow-hidden bg-victorian-100 dark:bg-victorian-900">
                {p.images[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-victorian-900 dark:text-cream-100">{p.nameAr}</p>
                <p className="text-xs text-victorian-500">{Number(p.price).toLocaleString()} IQD · {p.category?.nameAr ?? ''}</p>
              </div>
              <Link to={`/admin/product/${p.id}`}
                className="shrink-0 border border-victorian-300 p-2 text-victorian-600 hover:bg-victorian-100 dark:border-victorian-700 dark:hover:bg-victorian-900">
                <Edit3 className="h-4 w-4" />
              </Link>
              <button type="button" onClick={() => del(p.id)}
                className="shrink-0 border border-burgundy-300 p-2 text-burgundy-600 hover:bg-burgundy-50 dark:border-burgundy-800 dark:hover:bg-burgundy-900/30">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-victorian-400">{isAr ? 'لا توجد منتجات' : 'No products'}</p>}
      </div>
    </div>
  )
}

/* ─── Orders ─────────────────────────────────────────── */

const STATUS_OPTIONS = [
  { value: 'pending', label: 'قيد الانتظار', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  { value: 'confirmed', label: 'تم التأكيد', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'shipped', label: 'تم الشحن', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { value: 'delivered', label: 'تم التوصيل', color: 'bg-emeraldv-500/20 text-emeraldv-700 dark:bg-emeraldv-700/20 dark:text-emeraldv-500' },
  { value: 'cancelled', label: 'ملغي', color: 'bg-burgundy-100 text-burgundy-800 dark:bg-burgundy-900/30 dark:text-burgundy-300' },
]

function OrdersTab({ orders, isAr }: { token: string; orders: Order[]; isAr: boolean; reload: () => void }) {
  const [filter, setFilter] = useState<string>('all')

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <ClipboardList className="mx-auto h-12 w-12 text-victorian-300" />
        <p className="mt-4 text-sm text-victorian-400">{isAr ? 'لا توجد طلبات بعد' : 'No orders yet'}</p>
      </div>
    )
  }

  // إحصائيات
  const counts: Record<string, number> = { all: orders.length }
  for (const s of STATUS_OPTIONS) counts[s.value] = 0
  for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1

  return (
    <div className="space-y-5">
      {/* فلتر الحالة */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`shrink-0 border px-4 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.2em] ${
            filter === 'all'
              ? 'border-burgundy-700 bg-burgundy-700 text-cream-50'
              : 'border-victorian-300 text-victorian-700 dark:border-victorian-700 dark:text-cream-200'
          }`}
        >
          {isAr ? 'الكل' : 'All'} ({counts.all})
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setFilter(s.value)}
            className={`shrink-0 border px-4 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.2em] ${
              filter === s.value
                ? 'border-burgundy-700 bg-burgundy-700 text-cream-50'
                : 'border-victorian-300 text-victorian-700 dark:border-victorian-700 dark:text-cream-200'
            }`}
          >
            {s.label} ({counts[s.value] ?? 0})
          </button>
        ))}
      </div>

      {/* قائمة الطلبات */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((o) => {
          const statusInfo = STATUS_OPTIONS.find((s) => s.value === o.status) ?? STATUS_OPTIONS[0]
          const date = new Date(o.createdAt)
          const dateStr = date.toLocaleDateString(isAr ? 'ar-IQ' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
          const timeStr = date.toLocaleTimeString(isAr ? 'ar-IQ' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
          const shortId = o.id.slice(-8).toUpperCase()
          const itemsPreview = o.items.slice(0, 3)
          const extraCount = Math.max(0, o.items.length - 3)

          return (
            <Link
              key={o.id}
              to={`/admin/orders/${o.id}`}
              className="group flex flex-col border border-victorian-200 bg-cream-50 p-4 transition hover:border-burgundy-400 hover:shadow-md dark:border-victorian-800 dark:bg-victorian-950/60 dark:hover:border-burgundy-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] font-bold uppercase text-victorian-500">#{shortId}</p>
                  <p className="mt-1 truncate font-display text-base font-bold text-victorian-900 group-hover:text-burgundy-800 dark:text-cream-100 dark:group-hover:text-victorian-300">
                    {o.customerName}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-xs text-victorian-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>{dateStr} · {timeStr}</span>
              </div>

              <div className="mt-1 flex items-center gap-1.5 text-xs text-victorian-500" dir="ltr">
                <Phone className="h-3.5 w-3.5" />
                <span>{o.phone}</span>
              </div>

              {o.province && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-victorian-500">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{o.province}{o.city ? ` · ${o.city}` : ''}</span>
                </div>
              )}

              {/* Preview images */}
              {itemsPreview.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  {itemsPreview.map((it) => (
                    <div key={it.id} className="h-10 w-10 shrink-0 overflow-hidden border border-victorian-200 bg-victorian-100 dark:border-victorian-800 dark:bg-victorian-900">
                      {it.image ? (
                        <img src={it.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-victorian-300">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {extraCount > 0 && (
                    <span className="text-xs font-semibold text-victorian-500">+{extraCount}</span>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-victorian-200 pt-3 dark:border-victorian-800">
                <span className="text-[10px] uppercase tracking-wider text-victorian-500">
                  {isAr ? 'المجموع' : 'Total'}
                </span>
                <span className="font-display text-base font-bold text-burgundy-700 dark:text-victorian-300">
                  {Number(o.total).toLocaleString()} IQD
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-victorian-400">
          {isAr ? 'لا توجد طلبات بهذه الحالة' : 'No orders with this status'}
        </p>
      )}
    </div>
  )
}
