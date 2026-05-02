import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  BellOff,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Coins,
  Edit3,
  FolderPlus,
  ImagePlus,
  Image as ImageIcon,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Percent,
  Phone,
  Plus,
  Power,
  PowerOff,
  ShoppingBag,
  Square,
  Tag,
  Ticket,
  TrendingUp,
  Trash2,
  Users,
  Shield,
  X,
} from 'lucide-react'
import { SEO } from '../components/SEO'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import {
  formatDateNumeric,
  formatNumberEn,
  formatOrderDateTime,
  formatTimeArabic12Baghdad,
} from '../lib/formatDigits'
import { uploadImageFile } from '../lib/uploadImage'
import { getPricing } from '../lib/price'
import {
  disablePush,
  enablePush,
  getCurrentSubscription,
  isPushSupported,
  sendTestPush,
} from '../lib/pushClient'
import type { Category, Product } from '../types'

const base = import.meta.env.VITE_API_BASE ?? ''

type Tab = 'stats' | 'categories' | 'products' | 'sale' | 'orders' | 'site' | 'reviews' | 'admins' | 'discounts'

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
  const { token, email, isAdmin, isSuperAdmin, permissions, isLoading, logout } = useAuth()
  const { isAr } = useLanguage()
  const [tab, setTab] = useState<Tab>(() => {
    if (isSuperAdmin || permissions.includes('orders')) return 'stats'
    if (permissions.includes('products')) return 'products'
    if (permissions.includes('categories')) return 'categories'
    if (permissions.includes('site_settings')) return 'site'
    if (permissions.includes('reviews')) return 'reviews'
    if (permissions.includes('discounts')) return 'discounts'
    return 'orders'
  })
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
      <SEO title={isAr ? 'لوحة التحكم' : 'Admin Dashboard'} lang={isAr ? 'ar' : 'en'} noindex />
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
        {(isSuperAdmin || permissions.includes('orders')) && tabBtn('stats', <BarChart3 className="h-4 w-4" />, isAr ? 'المبيعات' : 'Sales')}
        {(isSuperAdmin || permissions.includes('orders')) && tabBtn('orders', <ClipboardList className="h-4 w-4" />, isAr ? 'الطلبات' : 'Orders')}
        {(isSuperAdmin || permissions.includes('products')) && tabBtn('products', <Package className="h-4 w-4" />, isAr ? 'المنتجات' : 'Products')}
        {(isSuperAdmin || permissions.includes('products')) && tabBtn('sale', <Percent className="h-4 w-4" />, isAr ? 'التخفيضات' : 'Sale')}
        {(isSuperAdmin || permissions.includes('discounts')) && tabBtn('discounts', <Ticket className="h-4 w-4" />, isAr ? 'أكواد الخصم' : 'Discount Codes')}
        {(isSuperAdmin || permissions.includes('categories')) && tabBtn('categories', <Tag className="h-4 w-4" />, isAr ? 'التصنيفات' : 'Categories')}
        {(isSuperAdmin || permissions.includes('site_settings')) && tabBtn('site', <ImageIcon className="h-4 w-4" />, isAr ? 'إعدادات الموقع' : 'Site')}
        {(isSuperAdmin || permissions.includes('reviews')) && tabBtn('reviews', <MessageCircle className="h-4 w-4" />, isAr ? 'التعليقات' : 'Reviews')}
        {isSuperAdmin && tabBtn('admins', <Users className="h-4 w-4" />, isAr ? 'المشرفون' : 'Admins')}
      </div>

      {(isSuperAdmin || permissions.includes('orders')) && tab === 'stats' && <StatsTab orders={orders} isAr={isAr} />}
      {(isSuperAdmin || permissions.includes('categories')) && tab === 'categories' && <CategoriesTab token={token!} categories={categories} isAr={isAr} reload={load} />}
      {(isSuperAdmin || permissions.includes('products')) && tab === 'products' && <ProductsTab token={token!} products={products} categories={categories} isAr={isAr} reload={load} />}
      {(isSuperAdmin || permissions.includes('products')) && tab === 'sale' && <SaleTab products={products} isAr={isAr} />}
      {(isSuperAdmin || permissions.includes('discounts')) && tab === 'discounts' && <DiscountsTab token={token!} isAr={isAr} />}
      {(isSuperAdmin || permissions.includes('orders')) && tab === 'orders' && <OrdersTab token={token!} orders={orders} isAr={isAr} reload={load} />}
      {(isSuperAdmin || permissions.includes('site_settings')) && tab === 'site' && <SiteTab token={token!} isAr={isAr} />}
      {(isSuperAdmin || permissions.includes('reviews')) && tab === 'reviews' && <ReviewsTab token={token!} isAr={isAr} />}
      {isSuperAdmin && tab === 'admins' && <AdminsTab token={token!} isAr={isAr} />}
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
  const [heroUrl, setHeroUrl] = useState<string>('')
  const [pendingHero, setPendingHero] = useState<{ file: File; preview: string } | null>(null)
  const pendingHeroRef = useRef(pendingHero)
  pendingHeroRef.current = pendingHero
  const [heroTitle, setHeroTitle] = useState<string>('')
  const [aboutTitleAr, setAboutTitleAr] = useState<string>('')
  const [aboutBodyAr, setAboutBodyAr] = useState<string>('')
  const [aboutTitleEn, setAboutTitleEn] = useState<string>('')
  const [aboutBodyEn, setAboutBodyEn] = useState<string>('')
  // ── بانر صفحة التخفيضات ──
  const [saleBannerUrl, setSaleBannerUrl] = useState<string>('')
  const [pendingSaleBanner, setPendingSaleBanner] = useState<{ file: File; preview: string } | null>(null)
  const pendingSaleBannerRef = useRef(pendingSaleBanner)
  pendingSaleBannerRef.current = pendingSaleBanner
  const saleBannerFileRef = useRef<HTMLInputElement>(null)
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
        saleBannerImage?: string
      }) => {
        setHeroUrl(s.heroImage ?? '')
        setHeroTitle(s.heroTitle ?? '')
        setAboutTitleAr(s.aboutTitleAr ?? '')
        setAboutBodyAr(s.aboutBodyAr ?? '')
        setAboutTitleEn(s.aboutTitleEn ?? '')
        setAboutBodyEn(s.aboutBodyEn ?? '')
        setSaleBannerUrl(s.saleBannerImage ?? '')
      })
      .catch(() => { /* ignore */ })
  }, [])

  useEffect(() => {
    return () => {
      const p = pendingHeroRef.current
      if (p) URL.revokeObjectURL(p.preview)
      const sp = pendingSaleBannerRef.current
      if (sp) URL.revokeObjectURL(sp.preview)
    }
  }, [])

  const onPickHero = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (pendingHero) URL.revokeObjectURL(pendingHero.preview)
    setPendingHero({ file: f, preview: URL.createObjectURL(f) })
    if (fileRef.current) fileRef.current.value = ''
  }

  const clearHero = () => {
    if (pendingHero) URL.revokeObjectURL(pendingHero.preview)
    setPendingHero(null)
    setHeroUrl('')
  }

  const onPickSaleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (pendingSaleBanner) URL.revokeObjectURL(pendingSaleBanner.preview)
    setPendingSaleBanner({ file: f, preview: URL.createObjectURL(f) })
    if (saleBannerFileRef.current) saleBannerFileRef.current.value = ''
  }

  const clearSaleBanner = () => {
    if (pendingSaleBanner) URL.revokeObjectURL(pendingSaleBanner.preview)
    setPendingSaleBanner(null)
    setSaleBannerUrl('')
  }

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      let heroImagePayload: string | null = heroUrl || null
      if (pendingHero) {
        const url = await uploadImageFile(base, token, pendingHero.file, `hero-${Date.now()}`)
        if (!url) {
          setMsg(isAr ? '✗ تعذر رفع صورة الهيرو' : '✗ Hero image upload failed')
          setSaving(false)
          return
        }
        URL.revokeObjectURL(pendingHero.preview)
        setPendingHero(null)
        heroImagePayload = url
      }
      let saleBannerPayload: string | null = saleBannerUrl || null
      if (pendingSaleBanner) {
        const url = await uploadImageFile(base, token, pendingSaleBanner.file, `sale-banner-${Date.now()}`)
        if (!url) {
          setMsg(isAr ? '✗ تعذر رفع صورة بانر التخفيضات' : '✗ Sale banner upload failed')
          setSaving(false)
          return
        }
        URL.revokeObjectURL(pendingSaleBanner.preview)
        setPendingSaleBanner(null)
        saleBannerPayload = url
      }
      const res = await api('/api/admin/settings', token, {
        method: 'PUT',
        body: JSON.stringify({
          heroImage: heroImagePayload,
          heroTitle: heroTitle || null,
          aboutTitleAr: aboutTitleAr || null,
          aboutBodyAr: aboutBodyAr || null,
          aboutTitleEn: aboutTitleEn || null,
          aboutBodyEn: aboutBodyEn || null,
          saleBannerImage: saleBannerPayload,
        }),
      })
      if (res.ok) {
        const map = (await res.json()) as Record<string, string>
        setHeroUrl(map.heroImage ?? '')
        setSaleBannerUrl(map.saleBannerImage ?? '')
        setMsg(isAr ? '✓ تم الحفظ' : '✓ Saved')
      } else setMsg(isAr ? '✗ تعذر الحفظ' : '✗ Save failed')
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
            {pendingHero?.preview || heroUrl ? (
              <img src={pendingHero?.preview ?? heroUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-victorian-400">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 border border-victorian-300 px-4 py-2 text-sm text-victorian-700 hover:bg-victorian-100 dark:border-victorian-700 dark:text-cream-200 dark:hover:bg-victorian-900">
              <ImagePlus className="h-4 w-4" />
              {isAr
                ? (pendingHero || heroUrl ? 'تغيير الصورة' : 'اختيار صورة (تُرفع عند الحفظ)')
                : (pendingHero || heroUrl ? 'Change image' : 'Pick image (uploads on save)')}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickHero} />
            </label>
            {pendingHero && (
              <p className="text-xs text-victorian-500">
                {isAr ? 'معاينة محلية — اضغط «حفظ التغييرات» لرفعها إلى التخزين.' : 'Local preview — click Save to upload to storage.'}
              </p>
            )}
            {(heroUrl || pendingHero) && (
              <button
                type="button"
                onClick={clearHero}
                className="inline-flex items-center gap-2 border border-burgundy-300 px-4 py-2 text-sm text-burgundy-700 hover:bg-burgundy-50 dark:border-burgundy-800 dark:text-burgundy-300 dark:hover:bg-burgundy-900/30"
              >
                <Trash2 className="h-4 w-4" />
                {isAr ? 'إزالة الصورة' : 'Remove image'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* بانر صفحة التخفيضات /sale */}
      <div className="border border-rose-200 bg-rose-50/40 p-5 dark:border-rose-900/40 dark:bg-rose-950/20">
        <h2 className="mb-1 font-display text-lg font-bold text-rose-700 dark:text-rose-300">
          {isAr ? 'بانر صفحة التخفيضات' : 'Sale page banner'}
        </h2>
        <p className="mb-4 text-xs text-victorian-600 dark:text-cream-300">
          {isAr
            ? 'الصورة التي تظهر أعلى صفحة /التخفيضات. لو تركتها فارغة، تظهر اللوحة الوردية الافتراضية. أبعاد مقترحة: 1920×600.'
            : 'The image at the top of the /sale page. Leave empty to use the default rose banner. Suggested 1920×600.'}
        </p>

        <div className="flex flex-wrap items-start gap-4">
          <div className="h-36 w-64 shrink-0 overflow-hidden rounded-md border border-victorian-300 bg-victorian-100 dark:border-victorian-700 dark:bg-victorian-900">
            {pendingSaleBanner?.preview || saleBannerUrl ? (
              <img
                src={pendingSaleBanner?.preview ?? saleBannerUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose-700 via-rose-600 to-burgundy-900 text-cream-50">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 border border-victorian-300 px-4 py-2 text-sm text-victorian-700 hover:bg-victorian-100 dark:border-victorian-700 dark:text-cream-200 dark:hover:bg-victorian-900">
              <ImagePlus className="h-4 w-4" />
              {isAr
                ? (pendingSaleBanner || saleBannerUrl ? 'تغيير صورة البانر' : 'اختيار صورة (تُرفع عند الحفظ)')
                : (pendingSaleBanner || saleBannerUrl ? 'Change banner image' : 'Pick image (uploads on save)')}
              <input
                ref={saleBannerFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickSaleBanner}
              />
            </label>
            {pendingSaleBanner && (
              <p className="text-xs text-victorian-500">
                {isAr ? 'معاينة محلية — اضغط «حفظ التغييرات» لرفعها.' : 'Local preview — click Save to upload.'}
              </p>
            )}
            {(saleBannerUrl || pendingSaleBanner) && (
              <button
                type="button"
                onClick={clearSaleBanner}
                className="inline-flex items-center gap-2 border border-burgundy-300 px-4 py-2 text-sm text-burgundy-700 hover:bg-burgundy-50 dark:border-burgundy-800 dark:text-burgundy-300 dark:hover:bg-burgundy-900/30"
              >
                <Trash2 className="h-4 w-4" />
                {isAr ? 'إزالة الصورة (الرجوع للوحة الافتراضية)' : 'Remove image (use default banner)'}
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
  const [newCatImage, setNewCatImage] = useState<{ file: File; preview: string } | null>(null)
  const newCatImageRef = useRef(newCatImage)
  newCatImageRef.current = newCatImage
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const inp = 'mt-1 w-full border border-victorian-300 bg-cream-50 px-4 py-2 text-sm dark:border-victorian-700 dark:bg-victorian-950 dark:text-cream-100'

  useEffect(() => {
    return () => {
      const p = newCatImageRef.current
      if (p) URL.revokeObjectURL(p.preview)
    }
  }, [])

  const onPickNewCategoryImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (newCatImage) URL.revokeObjectURL(newCatImage.preview)
    setNewCatImage({ file: f, preview: URL.createObjectURL(f) })
    if (fileRef.current) fileRef.current.value = ''
  }

  const clearNewCategoryImage = () => {
    if (newCatImage) URL.revokeObjectURL(newCatImage.preview)
    setNewCatImage(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    let imageUrl: string | null = null
    if (newCatImage) {
      const url = await uploadImageFile(base, token, newCatImage.file, newCatImage.file.name)
      URL.revokeObjectURL(newCatImage.preview)
      setNewCatImage(null)
      imageUrl = url
      if (!url) {
        alert(isAr ? 'تعذر رفع صورة التصنيف.' : 'Category image upload failed.')
        setBusy(false)
        return
      }
    }
    await api('/api/admin/categories', token, {
      method: 'POST',
      body: JSON.stringify({ slug, name: name || nameAr, nameAr, image: imageUrl }),
    })
    setSlug('')
    setName('')
    setNameAr('')
    await reload()
    setBusy(false)
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

  const uploadCategoryRowImage = async (file: File) => {
    const url = await uploadImageFile(base, token, file, file.name)
    return url
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
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {newCatImage ? (
              <div className="relative h-16 w-16 overflow-hidden rounded-full border border-victorian-300">
                <img src={newCatImage.preview} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={clearNewCategoryImage}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition hover:opacity-100">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-victorian-300 text-victorian-500 hover:border-burgundy-600">
                <ImagePlus className="h-5 w-5" />
                <input ref={fileRef} type="file" accept="image/*" onChange={onPickNewCategoryImage} className="hidden" />
              </label>
            )}
            <p className="text-xs text-victorian-500">
              {isAr ? 'تُرفع عند إضافة التصنيف — ليست إلى R2 قبل الحفظ.' : 'Uploads when you add the category — not to R2 until submit.'}
            </p>
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
            isAr={isAr}
            onDelete={() => del(c.id)}
            onApplyUpload={async (file) => {
              const url = await uploadCategoryRowImage(file)
              if (url) await updateImage(c.id, url)
              else alert(isAr ? 'تعذر الرفع.' : 'Upload failed.')
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
  isAr,
  onDelete,
  onApplyUpload,
  onRemoveImage,
}: {
  category: Category
  isAr: boolean
  onDelete: () => void
  onApplyUpload: (file: File) => Promise<void>
  onRemoveImage: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<{ file: File; preview: string } | null>(null)
  const pendingRef = useRef(pending)
  pendingRef.current = pending

  useEffect(() => {
    return () => {
      const p = pendingRef.current
      if (p) URL.revokeObjectURL(p.preview)
    }
  }, [])

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (pending) URL.revokeObjectURL(pending.preview)
    setPending({ file: f, preview: URL.createObjectURL(f) })
    if (ref.current) ref.current.value = ''
  }

  const cancelPending = () => {
    if (pending) URL.revokeObjectURL(pending.preview)
    setPending(null)
    if (ref.current) ref.current.value = ''
  }

  const apply = async () => {
    if (!pending) return
    setBusy(true)
    await onApplyUpload(pending.file)
    URL.revokeObjectURL(pending.preview)
    setPending(null)
    setBusy(false)
  }

  const displaySrc = pending?.preview ?? category.image

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-victorian-300 bg-victorian-100 dark:border-victorian-700 dark:bg-victorian-900">
        {displaySrc ? (
          <img src={displaySrc} alt="" className="h-full w-full object-cover" />
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
        {busy ? '…' : (isAr ? (pending ? 'تغيير الاختيار' : (category.image ? 'صورة جديدة' : 'اختيار صورة')) : (pending ? 'Change pick' : (category.image ? 'New image' : 'Pick image')))}
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onPick} disabled={busy} />
      </label>
      {pending && (
        <>
          <button type="button" onClick={apply} disabled={busy}
            className="shrink-0 border-2 border-burgundy-700 bg-burgundy-700 px-3 py-1.5 text-xs font-semibold text-cream-50 hover:bg-burgundy-800 disabled:opacity-50">
            {isAr ? 'تطبيق' : 'Apply'}
          </button>
          <button type="button" onClick={cancelPending}
            className="shrink-0 border border-victorian-300 px-2 py-1.5 text-xs text-victorian-600 dark:border-victorian-700">
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
        </>
      )}
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
                <p className="text-xs text-victorian-500">{formatNumberEn(Number(p.price))} IQD · {p.category?.nameAr ?? ''}</p>
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

/* ─── Sale (discounted products, display order) ─────── */

function SaleTab({ products, isAr }: { products: Product[]; isAr: boolean }) {
  const rows = useMemo(() => {
    const onSale = products.filter((p) => getPricing(p).hasDiscount)
    return [...onSale].sort((a, b) => {
      const da = getPricing(a).discountPercent
      const db = getPricing(b).discountPercent
      if (db !== da) return db - da
      return (isAr ? a.nameAr : a.name).localeCompare(isAr ? b.nameAr : b.name, isAr ? 'ar' : 'en')
    })
  }, [products, isAr])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-victorian-600 dark:text-cream-300">
          {isAr
            ? 'الترتيب من الأعلى خصمًا كما تظهر المنتجات في صفحة التخفيضات للزوار. استخدم تعديل المنتج لتغيير السعر المخفّض.'
            : 'Sorted from highest discount to lowest, same as the public /sale page. Edit a product to change its sale price.'}
        </p>
        <Link
          to="/sale"
          className="shrink-0 text-sm font-semibold text-burgundy-700 underline decoration-burgundy-300 underline-offset-2 hover:text-burgundy-800 dark:text-burgundy-400"
        >
          {isAr ? 'معاينة صفحة التخفيضات ←' : 'View sale page →'}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-victorian-500">
          {isAr ? 'لا يوجد منتج مخفّض حالياً. اضبط سعر تخفيض في «المنتجات» أو عند تعديل منتج.' : 'No discounted products. Set a sale price in Products or when editing a product.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-victorian-200 dark:border-victorian-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-victorian-200 bg-victorian-50 font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-victorian-600 dark:border-victorian-800 dark:bg-victorian-900/50 dark:text-cream-300">
              <tr>
                <th className="w-10 px-3 py-2 text-center">#</th>
                <th className="w-12 px-2 py-2" />
                <th className="px-3 py-2">{isAr ? 'المنتج' : 'Product'}</th>
                <th className="px-3 py-2">{isAr ? 'التصنيف' : 'Category'}</th>
                <th className="px-3 py-2 whitespace-nowrap">{isAr ? 'الأصل' : 'Original'}</th>
                <th className="px-3 py-2 whitespace-nowrap">{isAr ? 'بعد الخصم' : 'Sale'}</th>
                <th className="px-3 py-2 text-center">%</th>
                <th className="w-10 px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-victorian-200 dark:divide-victorian-800">
              {rows.map((p, i) => {
                const pr = getPricing(p)
                return (
                  <tr key={p.id} className="bg-cream-50/30 dark:bg-victorian-950/20">
                    <td className="px-3 py-2 text-center tabular-nums text-victorian-500">{i + 1}</td>
                    <td className="px-2 py-2">
                      <div className="h-11 w-11 overflow-hidden bg-victorian-100 dark:bg-victorian-900">
                        {p.images[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                      </div>
                    </td>
                    <td className="max-w-[200px] px-3 py-2 font-medium text-victorian-900 dark:text-cream-100">
                      {isAr ? p.nameAr : p.name}
                    </td>
                    <td className="px-3 py-2 text-victorian-600 dark:text-cream-300">
                      {p.category?.nameAr ?? '—'}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-victorian-500 line-through">
                      {formatNumberEn(pr.original)} <span className="text-xs">IQD</span>
                    </td>
                    <td className="px-3 py-2 tabular-nums font-semibold text-burgundy-800 dark:text-burgundy-300">
                      {formatNumberEn(pr.effective)} <span className="text-xs">IQD</span>
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums text-burgundy-700 dark:text-burgundy-400">
                      −{pr.discountPercent}%
                    </td>
                    <td className="px-2 py-2">
                      <Link
                        to={`/admin/product/${p.id}`}
                        className="inline-flex border border-victorian-300 p-2 text-victorian-600 hover:bg-victorian-100 dark:border-victorian-700 dark:hover:bg-victorian-900"
                        title={isAr ? 'تعديل' : 'Edit'}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─── Sales Stats ────────────────────────────────────── */

/**
 * يحسب إحصائيات المبيعات من قائمة الطلبات.
 * المبيعات تُحسب فقط من الطلبات التي حالتها `delivered` (تم التوصيل) — الإيراد الفعلي المؤكد.
 * بقية الحالات تُعرض كـعدّادات مساعدة (قيد المعالجة، ملغاة).
 */
function StatsTab({ orders, isAr }: { orders: Order[]; isAr: boolean }) {
  const stats = useMemo(() => {
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    const startOfToday = (() => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })()
    const start7 = now - 7 * day
    const start30 = now - 30 * day

    let revenueAll = 0
    let revenueToday = 0
    let revenue7 = 0
    let revenue30 = 0
    let deliveredCount = 0
    let pieces = 0
    const statusCount: Record<string, number> = {
      pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0,
    }
    const productMap = new Map<string, { name: string; qty: number; revenue: number }>()

    for (const o of orders) {
      const s = (o.status || 'pending').toLowerCase()
      statusCount[s] = (statusCount[s] ?? 0) + 1
      if (s !== 'delivered') continue

      const total = Number(o.total) || 0
      const ts = new Date(o.createdAt).getTime()
      revenueAll += total
      if (ts >= startOfToday) revenueToday += total
      if (ts >= start7) revenue7 += total
      if (ts >= start30) revenue30 += total
      deliveredCount += 1

      for (const it of o.items) {
        pieces += it.quantity
        const key = it.productName
        const prev = productMap.get(key) ?? { name: key, qty: 0, revenue: 0 }
        prev.qty += it.quantity
        prev.revenue += (Number(it.unitPrice) || 0) * it.quantity
        productMap.set(key, prev)
      }
    }

    const inProgress = statusCount.pending + statusCount.confirmed + statusCount.shipped
    const avgOrder = deliveredCount > 0 ? revenueAll / deliveredCount : 0
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    return {
      revenueAll, revenueToday, revenue7, revenue30,
      deliveredCount, pieces, avgOrder, inProgress,
      statusCount, topProducts,
      totalOrders: orders.length,
    }
  }, [orders])

  const fmtIQD = (n: number) =>
    `${formatNumberEn(Math.round(n))} ${isAr ? 'د.ع' : 'IQD'}`

  const STATUS_LABELS: { key: string; ar: string; en: string; cls: string }[] = [
    { key: 'pending',   ar: 'قيد الانتظار', en: 'Pending',   cls: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200' },
    { key: 'confirmed', ar: 'تم التأكيد',   en: 'Confirmed', cls: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200' },
    { key: 'shipped',   ar: 'تم الشحن',     en: 'Shipped',   cls: 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200' },
    { key: 'delivered', ar: 'تم التوصيل',   en: 'Delivered', cls: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200' },
    { key: 'cancelled', ar: 'ملغي',         en: 'Cancelled', cls: 'border-burgundy-300 bg-burgundy-50 text-burgundy-800 dark:border-burgundy-800 dark:bg-burgundy-900/20 dark:text-burgundy-200' },
  ]

  if (orders.length === 0) {
    return (
      <div className="border border-dashed border-victorian-300 p-12 text-center text-sm text-victorian-500 dark:border-victorian-700">
        {isAr ? 'لا توجد طلبات بعد — ستظهر إحصائيات المبيعات هنا تلقائياً عند وصول أول طلب' : 'No orders yet — sales stats will appear here once the first order arrives'}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* بطاقات المؤشرات الرئيسية */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Coins className="h-5 w-5" />}
          label={isAr ? 'إجمالي الإيرادات' : 'Total revenue'}
          value={fmtIQD(stats.revenueAll)}
          hint={isAr ? 'من الطلبات الموصلة فقط' : 'Delivered orders only'}
          tone="emerald"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label={isAr ? 'طلبات موصلة' : 'Delivered orders'}
          value={formatNumberEn(stats.deliveredCount)}
          hint={isAr ? `من أصل ${formatNumberEn(stats.totalOrders)} طلب` : `Out of ${formatNumberEn(stats.totalOrders)} orders`}
          tone="indigo"
        />
        <StatCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label={isAr ? 'قطع مباعة' : 'Pieces sold'}
          value={formatNumberEn(stats.pieces)}
          hint={isAr ? 'اضغط لعرض التفاصيل' : 'Click for full breakdown'}
          tone="amber"
          to="/admin/sales/products"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label={isAr ? 'متوسط قيمة الطلب' : 'Avg order value'}
          value={fmtIQD(stats.avgOrder)}
          hint={isAr ? 'الإيراد ÷ عدد الطلبات الموصلة' : 'Revenue ÷ delivered count'}
          tone="rose"
        />
      </div>

      {/* إيرادات حسب المدة */}
      <section className="border border-victorian-200 bg-cream-50/60 p-6 dark:border-victorian-800 dark:bg-victorian-950/40">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.2em] text-victorian-800 dark:text-cream-200">
          {isAr ? 'الإيراد حسب الفترة' : 'Revenue by period'}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PeriodRow label={isAr ? 'اليوم' : 'Today'} value={fmtIQD(stats.revenueToday)} />
          <PeriodRow label={isAr ? 'آخر 7 أيام' : 'Last 7 days'} value={fmtIQD(stats.revenue7)} />
          <PeriodRow label={isAr ? 'آخر 30 يوم' : 'Last 30 days'} value={fmtIQD(stats.revenue30)} />
        </div>
      </section>

      {/* توزيع حالات الطلبات */}
      <section className="border border-victorian-200 bg-cream-50/60 p-6 dark:border-victorian-800 dark:bg-victorian-950/40">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-victorian-800 dark:text-cream-200">
            {isAr ? 'توزيع الحالات' : 'Status breakdown'}
          </h2>
          <span className="text-xs text-victorian-500">
            {isAr ? `قيد المعالجة: ${formatNumberEn(stats.inProgress)}` : `In progress: ${formatNumberEn(stats.inProgress)}`}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STATUS_LABELS.map((s) => {
            const count = stats.statusCount[s.key] ?? 0
            const pct = stats.totalOrders > 0 ? Math.round((count / stats.totalOrders) * 100) : 0
            return (
              <div key={s.key} className={`border p-3 text-center ${s.cls}`}>
                <div className="font-display text-2xl font-bold leading-none">{formatNumberEn(count)}</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider opacity-80">
                  {isAr ? s.ar : s.en}
                </div>
                <div className="mt-1 text-[10px] opacity-60">{pct}%</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* أعلى المنتجات مبيعاً */}
      <section className="border border-victorian-200 bg-cream-50/60 p-6 dark:border-victorian-800 dark:bg-victorian-950/40">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.2em] text-victorian-800 dark:text-cream-200">
          {isAr ? 'الأكثر مبيعاً' : 'Top sellers'}
        </h2>
        {stats.topProducts.length === 0 ? (
          <p className="py-6 text-center text-xs text-victorian-500">
            {isAr ? 'لم يتم توصيل أي طلب بعد ليتم احتسابه هنا' : 'No delivered orders yet to rank'}
          </p>
        ) : (
          <ol className="space-y-2">
            {stats.topProducts.map((p, idx) => {
              const max = stats.topProducts[0]?.qty || 1
              const pct = Math.max(6, Math.round((p.qty / max) * 100))
              return (
                <li key={p.name} className="border border-victorian-200 bg-cream-50 p-3 dark:border-victorian-800 dark:bg-victorian-950">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="font-display text-xs font-bold text-burgundy-700 dark:text-victorian-300">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="truncate text-sm font-semibold text-victorian-900 dark:text-cream-100">
                        {p.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-victorian-600 dark:text-cream-300">
                      {formatNumberEn(p.qty)} {isAr ? 'قطعة' : 'pcs'} · {fmtIQD(p.revenue)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden bg-victorian-100 dark:bg-victorian-900">
                    <div
                      className="h-full bg-burgundy-600 transition-all dark:bg-victorian-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </div>
  )
}

function StatCard({
  icon, label, value, hint, tone, to,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  tone: 'emerald' | 'indigo' | 'amber' | 'rose'
  to?: string
}) {
  const toneCls: Record<typeof tone, string> = {
    emerald: 'text-emerald-700 dark:text-emerald-300',
    indigo:  'text-indigo-700 dark:text-indigo-300',
    amber:   'text-amber-700 dark:text-amber-300',
    rose:    'text-rose-700 dark:text-rose-300',
  }
  const baseCls = 'block border border-victorian-200 bg-cream-50 p-5 dark:border-victorian-800 dark:bg-victorian-950'
  const interactiveCls = to
    ? ' cursor-pointer transition hover:-translate-y-0.5 hover:border-burgundy-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-burgundy-500 dark:hover:border-victorian-500'
    : ''

  const inner = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-victorian-500">
          {label}
        </p>
        <span className={toneCls[tone]}>{icon}</span>
      </div>
      <p className="mt-3 break-words font-display text-2xl font-bold text-victorian-900 dark:text-cream-50">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-victorian-500">{hint}</p>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={baseCls + interactiveCls}>
        {inner}
      </Link>
    )
  }
  return <div className={baseCls}>{inner}</div>
}

function PeriodRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-victorian-200 bg-cream-50 p-4 text-center dark:border-victorian-800 dark:bg-victorian-950">
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-victorian-500">
        {label}
      </p>
      <p className="mt-2 font-display text-lg font-bold text-victorian-900 dark:text-cream-50">
        {value}
      </p>
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

function PushNotificationsCard({ token, isAr }: { token: string; isAr: boolean }) {
  const [supported] = useState<boolean>(() => isPushSupported())
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  )
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [busy, setBusy] = useState<boolean>(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null)
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null)
  const isProd = import.meta.env.PROD

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!supported) {
        setEnabled(false)
        return
      }
      try {
        const sub = await getCurrentSubscription()
        if (!cancelled) setEnabled(!!sub)
      } catch {
        if (!cancelled) setEnabled(false)
      }
      try {
        const r = await fetch(`${base}/api/admin/push/public-key`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (r.ok) {
          const d = (await r.json()) as { configured: boolean }
          if (!cancelled) setServerConfigured(Boolean(d.configured))
        } else if (!cancelled) {
          setServerConfigured(false)
        }
      } catch {
        if (!cancelled) setServerConfigured(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [supported, token])

  async function onEnable() {
    setBusy(true)
    setMsg(null)
    try {
      await enablePush(token)
      setEnabled(true)
      setPermission(typeof Notification !== 'undefined' ? Notification.permission : 'granted')
      setMsg({
        kind: 'ok',
        text: isAr ? 'تم تفعيل الإشعارات على هذا الجهاز' : 'Notifications enabled on this device',
      })
    } catch (e) {
      const code = (e as Error).message
      const map: Record<string, { ar: string; en: string }> = {
        push_not_supported: {
          ar: 'هذا المتصفح لا يدعم إشعارات الويب',
          en: 'This browser does not support web push',
        },
        permission_denied: {
          ar: 'تم رفض إذن الإشعارات — فعّله من إعدادات الموقع في المتصفح',
          en: 'Permission denied — enable it in your browser site settings',
        },
        push_not_configured: {
          ar: 'لم يضبط مدير النظام مفاتيح VAPID على السيرفر',
          en: 'Server VAPID keys are not configured',
        },
        public_key_failed: {
          ar: 'فشل جلب مفتاح السيرفر العام',
          en: 'Failed to fetch server public key',
        },
        subscribe_failed: {
          ar: 'فشل حفظ الاشتراك على السيرفر',
          en: 'Failed to save subscription on server',
        },
      }
      const m = map[code]
      setMsg({
        kind: 'err',
        text: m ? (isAr ? m.ar : m.en) : isAr ? `حدث خطأ: ${code}` : `Error: ${code}`,
      })
    } finally {
      setBusy(false)
    }
  }

  async function onDisable() {
    setBusy(true)
    setMsg(null)
    try {
      await disablePush(token)
      setEnabled(false)
      setMsg({
        kind: 'info',
        text: isAr ? 'تم تعطيل الإشعارات على هذا الجهاز' : 'Notifications disabled on this device',
      })
    } catch {
      setMsg({ kind: 'err', text: isAr ? 'تعذّر التعطيل' : 'Could not disable' })
    } finally {
      setBusy(false)
    }
  }

  async function onTest() {
    setBusy(true)
    setMsg(null)
    try {
      const r = await sendTestPush(token)
      setMsg({
        kind: 'ok',
        text: isAr
          ? `أُرسل لـ ${r.sent} جهاز${r.removed ? ` — حُذف ${r.removed} منتهٍ` : ''}`
          : `Sent to ${r.sent} device(s)${r.removed ? `, removed ${r.removed} expired` : ''}`,
      })
    } catch (e) {
      const code = (e as Error).message
      setMsg({
        kind: 'err',
        text:
          code === 'push_not_configured'
            ? isAr
              ? 'لم يضبط مدير النظام مفاتيح VAPID'
              : 'Server VAPID keys not configured'
            : isAr
              ? 'فشل إرسال الإشعار التجريبي'
              : 'Failed to send test',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border border-victorian-200 bg-cream-50 p-4 dark:border-victorian-800 dark:bg-victorian-950/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              enabled
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-victorian-100 text-victorian-500 dark:bg-victorian-900 dark:text-victorian-400'
            }`}
          >
            {enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-victorian-900 dark:text-cream-50">
              {isAr ? 'إشعارات الطلبات' : 'Order notifications'}
            </p>
            <p className="mt-1 max-w-prose text-xs leading-relaxed text-victorian-600 dark:text-victorian-300">
              {isAr
                ? 'فعّل الإشعارات لتصلك تنبيهات بالطلبات الجديدة حتى لو كانت لوحة التحكم مغلقة.'
                : 'Enable notifications to get alerts for new orders even when the dashboard is closed.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {enabled ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={onTest}
                className="inline-flex items-center gap-2 border border-victorian-300 px-3 py-1.5 text-xs font-semibold text-victorian-700 hover:bg-victorian-100 disabled:opacity-50 dark:border-victorian-700 dark:text-cream-200 dark:hover:bg-victorian-900"
              >
                <Bell className="h-3.5 w-3.5" />
                {isAr ? 'اختبار' : 'Test'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onDisable}
                className="inline-flex items-center gap-2 border border-burgundy-300 px-3 py-1.5 text-xs font-semibold text-burgundy-700 hover:bg-burgundy-50 disabled:opacity-50 dark:border-burgundy-700 dark:text-burgundy-300 dark:hover:bg-burgundy-900/30"
              >
                <BellOff className="h-3.5 w-3.5" />
                {isAr ? 'تعطيل' : 'Disable'}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy || !supported || serverConfigured === false}
              onClick={onEnable}
              className="inline-flex items-center gap-2 border-2 border-burgundy-700 bg-burgundy-700 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cream-50 transition hover:bg-burgundy-800 disabled:opacity-50"
            >
              <Bell className="h-3.5 w-3.5" />
              {isAr ? 'تفعيل الإشعارات' : 'Enable notifications'}
            </button>
          )}
        </div>
      </div>

      {!supported && (
        <p className="mt-3 text-xs text-burgundy-700 dark:text-burgundy-300">
          {isAr
            ? 'متصفحك لا يدعم إشعارات الويب. على iPhone، ثبّت الموقع كتطبيق من Safari (أيقونة المشاركة → إضافة إلى الشاشة الرئيسية) ثم افتحه من هناك.'
            : 'Your browser does not support web push. On iPhone, install the site as an app from Safari (Share → Add to Home Screen).'}
        </p>
      )}
      {supported && permission === 'denied' && (
        <p className="mt-3 text-xs text-burgundy-700 dark:text-burgundy-300">
          {isAr
            ? 'تم حظر الإشعارات لهذا الموقع — افتح إعدادات الموقع في المتصفح وفعّل الإشعارات.'
            : 'Notifications are blocked — allow them in the browser site settings.'}
        </p>
      )}
      {serverConfigured === false && (
        <p className="mt-3 text-xs text-burgundy-700 dark:text-burgundy-300">
          {isAr
            ? 'مفاتيح VAPID غير مضبوطة على السيرفر — تواصل مع مدير النظام.'
            : 'Server VAPID keys are not set — contact the system administrator.'}
        </p>
      )}
      {!isProd && (
        <p className="mt-3 text-xs text-victorian-500">
          {isAr
            ? 'ملاحظة: في وضع التطوير قد لا يعمل service worker. جرّب بعد build/start.'
            : 'Note: service worker only runs after build/start.'}
        </p>
      )}
      {msg && (
        <p
          className={`mt-3 text-xs ${
            msg.kind === 'ok'
              ? 'text-emerald-700 dark:text-emerald-300'
              : msg.kind === 'err'
                ? 'text-burgundy-700 dark:text-burgundy-300'
                : 'text-victorian-600 dark:text-victorian-300'
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  )
}

function OrdersTab({ token, orders, isAr }: { token: string; orders: Order[]; isAr: boolean; reload: () => void }) {
  const [filter, setFilter] = useState<string>('all')

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  if (orders.length === 0) {
    return (
      <div className="space-y-5">
        <PushNotificationsCard token={token} isAr={isAr} />
        <div className="py-16 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-victorian-300" />
          <p className="mt-4 text-sm text-victorian-400">{isAr ? 'لا توجد طلبات بعد' : 'No orders yet'}</p>
        </div>
      </div>
    )
  }

  // إحصائيات
  const counts: Record<string, number> = { all: orders.length }
  for (const s of STATUS_OPTIONS) counts[s.value] = 0
  for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1

  return (
    <div className="space-y-5">
      <PushNotificationsCard token={token} isAr={isAr} />

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
          const dateStr = formatDateNumeric(date)
          const timeStr = formatTimeArabic12Baghdad(date)
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
                  {formatNumberEn(Number(o.total))} IQD
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

/* ─── Discount codes (admin) ─────────────────────────── */

type AdminDiscount = {
  id: string
  code: string
  nameAr: string
  nameEn: string
  type: 'percent' | 'fixed'
  value: string
  minOrderTotal: string | null
  maxDiscount: string | null
  enabled: boolean
  usageLimit: number | null
  usageCount: number
  expiresAt: string | null
  createdAt: string
}

function emptyDiscountForm() {
  return {
    code: '',
    nameAr: '',
    nameEn: '',
    type: 'percent' as 'percent' | 'fixed',
    value: '',
    minOrderTotal: '',
    maxDiscount: '',
    enabled: true,
    usageLimit: '',
    expiresAt: '',
  }
}

function DiscountsTab({ token, isAr }: { token: string; isAr: boolean }) {
  const [rows, setRows] = useState<AdminDiscount[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminDiscount | null>(null)
  const [form, setForm] = useState(emptyDiscountForm())
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api('/api/discounts/admin', token)
      if (res.ok) {
        const data = (await res.json()) as AdminDiscount[]
        setRows(Array.isArray(data) ? data : [])
      } else {
        setRows([])
      }
    } catch {
      setRows([])
    }
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyDiscountForm())
    setFormOpen(true)
  }

  const openEdit = (d: AdminDiscount) => {
    setEditing(d)
    setForm({
      code: d.code,
      nameAr: d.nameAr,
      nameEn: d.nameEn,
      type: d.type,
      value: d.value,
      minOrderTotal: d.minOrderTotal ?? '',
      maxDiscount: d.maxDiscount ?? '',
      enabled: d.enabled,
      usageLimit: d.usageLimit != null ? String(d.usageLimit) : '',
      expiresAt: d.expiresAt ? d.expiresAt.slice(0, 10) : '',
    })
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
    setForm(emptyDiscountForm())
  }

  const errorMessage = (code: string) => {
    switch (code) {
      case 'code_exists': return isAr ? 'هذا الكود موجود مسبقًا.' : 'Code already exists.'
      case 'missing_code': return isAr ? 'أدخل الكود.' : 'Enter a code.'
      case 'missing_name': return isAr ? 'أدخل اسمًا للخصم.' : 'Enter a name.'
      case 'invalid_type': return isAr ? 'نوع غير صالح.' : 'Invalid type.'
      case 'invalid_value': return isAr ? 'قيمة الخصم غير صالحة.' : 'Invalid value.'
      case 'percent_out_of_range': return isAr ? 'النسبة يجب أن تكون 1 إلى 100.' : 'Percent must be 1-100.'
      default: return isAr ? 'تعذر الحفظ.' : 'Could not save.'
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const payload = {
      code: form.code.trim().toUpperCase().replace(/\s+/g, ''),
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      type: form.type,
      value: Number(form.value),
      minOrderTotal: form.minOrderTotal === '' ? null : Number(form.minOrderTotal),
      maxDiscount: form.maxDiscount === '' ? null : Number(form.maxDiscount),
      enabled: form.enabled,
      usageLimit: form.usageLimit === '' ? null : Math.max(0, Math.floor(Number(form.usageLimit))),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    }
    try {
      const url = editing ? `/api/discounts/admin/${editing.id}` : '/api/discounts/admin'
      const res = await api(url, token, {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        closeForm()
        await load()
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string }
        alert(errorMessage(String(data.error ?? '')))
      }
    } catch {
      alert(isAr ? 'خطأ في الشبكة' : 'Network error')
    }
    setBusy(false)
  }

  const toggleEnabled = async (d: AdminDiscount) => {
    setBusyId(d.id)
    try {
      const res = await api(`/api/discounts/admin/${d.id}/toggle`, token, { method: 'POST' })
      if (res.ok) {
        const updated = (await res.json()) as AdminDiscount
        setRows((prev) => prev.map((r) => (r.id === d.id ? updated : r)))
      } else {
        alert(isAr ? 'تعذر التحديث' : 'Update failed')
      }
    } catch {
      alert(isAr ? 'خطأ في الشبكة' : 'Network error')
    }
    setBusyId(null)
  }

  const del = async (d: AdminDiscount) => {
    if (!confirm(isAr ? `حذف الكود ${d.code} نهائيًا؟` : `Delete ${d.code}?`)) return
    setBusyId(d.id)
    try {
      const res = await api(`/api/discounts/admin/${d.id}`, token, { method: 'DELETE' })
      if (res.ok) await load()
      else alert(isAr ? 'تعذر الحذف' : 'Delete failed')
    } catch {
      alert(isAr ? 'خطأ في الشبكة' : 'Network error')
    }
    setBusyId(null)
  }

  if (loading) {
    return <div className="py-8 text-center text-sm text-victorian-500">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
  }

  const inp = 'mt-1 w-full border border-victorian-300 bg-cream-50 px-4 py-2 text-sm dark:border-victorian-700 dark:bg-victorian-950 dark:text-cream-100'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-victorian-900 dark:text-cream-50">
          {isAr ? 'أكواد الخصم' : 'Discount Codes'}
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 border-2 border-burgundy-700 bg-burgundy-700 px-5 py-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-cream-50 hover:bg-burgundy-800"
        >
          <Plus className="h-4 w-4" />
          {isAr ? 'كود جديد' : 'New code'}
        </button>
      </div>

      <div className="border border-victorian-200 bg-cream-50 dark:border-victorian-800 dark:bg-victorian-950/60">
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-victorian-400">
            {isAr ? 'لا توجد أكواد خصم. أنشئ كودًا جديدًا.' : 'No discount codes yet. Create your first one.'}
          </p>
        ) : (
          <ul className="divide-y divide-victorian-200 dark:divide-victorian-800">
            {rows.map((d) => {
              const isExpired = d.expiresAt && new Date(d.expiresAt).getTime() < Date.now()
              const isExhausted = d.usageLimit != null && d.usageCount >= d.usageLimit
              return (
                <li key={d.id} className="flex flex-wrap items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-bold tracking-wider text-victorian-900 dark:text-cream-50" dir="ltr">
                        {d.code}
                      </span>
                      {!d.enabled && (
                        <span className="rounded bg-victorian-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-victorian-800 dark:bg-victorian-800 dark:text-victorian-200">
                          {isAr ? 'معطَّل' : 'Disabled'}
                        </span>
                      )}
                      {d.enabled && !isExpired && !isExhausted && (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {isAr ? 'فعّال' : 'Active'}
                        </span>
                      )}
                      {isExpired && (
                        <span className="rounded bg-burgundy-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-burgundy-800 dark:bg-burgundy-900/40 dark:text-burgundy-300">
                          {isAr ? 'منتهي' : 'Expired'}
                        </span>
                      )}
                      {isExhausted && !isExpired && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          {isAr ? 'مستنفد' : 'Used up'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-victorian-700 dark:text-cream-200">
                      {isAr ? d.nameAr : (d.nameEn || d.nameAr)}
                    </p>
                    <p className="text-xs text-victorian-500">
                      <span className="font-bold">
                        {d.type === 'percent'
                          ? `${formatNumberEn(Number(d.value))}%`
                          : `${formatNumberEn(Number(d.value))} IQD`}
                      </span>
                      {d.minOrderTotal && (
                        <> · {isAr ? 'حد أدنى' : 'Min'}: {formatNumberEn(Number(d.minOrderTotal))} IQD</>
                      )}
                      {d.type === 'percent' && d.maxDiscount && (
                        <> · {isAr ? 'سقف' : 'Cap'}: {formatNumberEn(Number(d.maxDiscount))} IQD</>
                      )}
                    </p>
                    <p className="text-[10px] text-victorian-400">
                      {isAr ? 'الاستخدام' : 'Used'}: {formatNumberEn(d.usageCount)}
                      {d.usageLimit != null ? ` / ${formatNumberEn(d.usageLimit)}` : ''}
                      {d.expiresAt && (
                        <> · {isAr ? 'ينتهي' : 'Expires'}: {formatDateNumeric(new Date(d.expiresAt))}</>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === d.id}
                      onClick={() => toggleEnabled(d)}
                      title={d.enabled ? (isAr ? 'تعطيل' : 'Disable') : (isAr ? 'تفعيل' : 'Enable')}
                      className={`inline-flex items-center gap-1 border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider disabled:opacity-50 ${
                        d.enabled
                          ? 'border-victorian-300 text-victorian-700 hover:bg-victorian-100 dark:border-victorian-600 dark:text-cream-200 dark:hover:bg-victorian-900'
                          : 'border-emerald-400 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40'
                      }`}
                    >
                      {d.enabled ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                      {d.enabled ? (isAr ? 'تعطيل' : 'Disable') : (isAr ? 'تفعيل' : 'Enable')}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(d)}
                      className="p-2 border border-victorian-300 text-victorian-600 hover:bg-victorian-100 dark:border-victorian-700 dark:hover:bg-victorian-900"
                      aria-label={isAr ? 'تعديل' : 'Edit'}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busyId === d.id}
                      onClick={() => del(d)}
                      className="p-2 border border-burgundy-300 text-burgundy-600 hover:bg-burgundy-50 disabled:opacity-50 dark:border-burgundy-800 dark:hover:bg-burgundy-900/30"
                      aria-label={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form onSubmit={save} className="my-8 w-full max-w-lg border border-victorian-200 bg-cream-50 p-6 shadow-xl dark:border-victorian-800 dark:bg-victorian-950">
            <div className="mb-4 flex items-center justify-between border-b border-victorian-200 pb-3 dark:border-victorian-800">
              <h3 className="text-lg font-bold text-victorian-900 dark:text-cream-50">
                {editing
                  ? (isAr ? 'تعديل كود الخصم' : 'Edit Discount Code')
                  : (isAr ? 'كود خصم جديد' : 'New Discount Code')}
              </h3>
              <button type="button" onClick={closeForm} className="text-victorian-500 hover:text-burgundy-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs text-victorian-500">{isAr ? 'الكود (يحوّل لأحرف كبيرة)' : 'Code (uppercased)'}</span>
                <input
                  required
                  dir="ltr"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  placeholder="WELCOME10"
                  className={inp + ' uppercase'}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-xs text-victorian-500">{isAr ? 'اسم الخصم (عربي)' : 'Name (Arabic)'}</span>
                <input
                  required
                  value={form.nameAr}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  placeholder={isAr ? 'خصم العيد' : 'Eid offer'}
                  className={inp}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-xs text-victorian-500">{isAr ? 'اسم بالإنجليزية (اختياري)' : 'Name (English, optional)'}</span>
                <input
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  placeholder="Eid Offer"
                  className={inp}
                />
              </label>

              <label className="block">
                <span className="text-xs text-victorian-500">{isAr ? 'النوع' : 'Type'}</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })}
                  className={inp + ' appearance-none'}
                >
                  <option value="percent">{isAr ? 'نسبة مئوية ٪' : 'Percent (%)'}</option>
                  <option value="fixed">{isAr ? 'مبلغ ثابت (د.ع)' : 'Fixed amount (IQD)'}</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-victorian-500">
                  {form.type === 'percent'
                    ? (isAr ? 'النسبة (1-100)' : 'Percent (1-100)')
                    : (isAr ? 'المبلغ بالدينار' : 'Amount (IQD)')}
                </span>
                <input
                  required
                  type="number"
                  min={1}
                  step={form.type === 'percent' ? 1 : 100}
                  max={form.type === 'percent' ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className={inp}
                />
              </label>

              <label className="block">
                <span className="text-xs text-victorian-500">
                  {isAr ? 'حد أدنى للمجموع (اختياري)' : 'Min order total (optional)'}
                </span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={form.minOrderTotal}
                  onChange={(e) => setForm({ ...form, minOrderTotal: e.target.value })}
                  placeholder="0"
                  className={inp}
                />
              </label>

              {form.type === 'percent' && (
                <label className="block">
                  <span className="text-xs text-victorian-500">
                    {isAr ? 'سقف مبلغ الخصم (اختياري)' : 'Max discount cap (optional)'}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    className={inp}
                  />
                </label>
              )}

              <label className="block">
                <span className="text-xs text-victorian-500">
                  {isAr ? 'حد أقصى للاستخدام (اختياري)' : 'Usage limit (optional)'}
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder={isAr ? 'بدون حد' : 'Unlimited'}
                  className={inp}
                />
              </label>

              <label className="block">
                <span className="text-xs text-victorian-500">{isAr ? 'تاريخ الانتهاء (اختياري)' : 'Expires at (optional)'}</span>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className={inp}
                />
              </label>

              <label className="flex items-center gap-3 sm:col-span-2 cursor-pointer p-3 border border-victorian-200 dark:border-victorian-800">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-victorian-300 text-burgundy-700 focus:ring-burgundy-700"
                />
                <span className="text-sm text-victorian-700 dark:text-cream-200">
                  {isAr ? 'مفعَّل (يمكن للزبائن استخدامه الآن)' : 'Enabled (customers can use it now)'}
                </span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-victorian-200 pt-4 dark:border-victorian-800">
              <button
                type="button"
                onClick={closeForm}
                className="px-5 py-2 text-sm border font-bold uppercase tracking-[0.1em] border-victorian-300 text-victorian-700 hover:bg-victorian-100 dark:border-victorian-700 dark:text-cream-200 dark:hover:bg-victorian-900"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2 text-sm border-2 font-bold uppercase tracking-[0.1em] border-burgundy-700 bg-burgundy-700 text-cream-50 hover:bg-burgundy-800 disabled:opacity-50"
              >
                {busy ? '...' : (isAr ? 'حفظ الكود' : 'Save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

/* ─── Reviews (moderation) ───────────────────────────── */

type AdminReviewRow = {
  id: string
  name: string
  rating: number
  comment: string
  approved: boolean
  createdAt: string
}

function ReviewsTab({ token, isAr }: { token: string; isAr: boolean }) {
  const [rows, setRows] = useState<AdminReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api('/api/reviews/admin/all', token)
      if (res.ok) {
        const data = (await res.json()) as AdminReviewRow[]
        setRows(Array.isArray(data) ? data : [])
      } else {
        setRows([])
      }
    } catch {
      setRows([])
    }
    setLoading(false)
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const del = async (id: string) => {
    if (!confirm(isAr ? 'حذف هذا التعليق نهائيًا؟' : 'Delete this review permanently?')) return
    setBusyId(id)
    try {
      const res = await api(`/api/reviews/${id}`, token, { method: 'DELETE' })
      if (res.ok) await load()
      else alert(isAr ? 'تعذر الحذف' : 'Could not delete')
    } catch {
      alert(isAr ? 'خطأ في الشبكة' : 'Network error')
    }
    setBusyId(null)
  }

  const toggleApprove = async (id: string, approved: boolean) => {
    setBusyId(id)
    try {
      const res = await api(`/api/reviews/${id}/approve`, token, {
        method: 'PUT',
        body: JSON.stringify({ approved }),
      })
      if (res.ok) {
        const row = (await res.json()) as AdminReviewRow
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, approved: row.approved } : r)))
      } else alert(isAr ? 'تعذر التحديث' : 'Update failed')
    } catch {
      alert(isAr ? 'خطأ في الشبكة' : 'Network error')
    }
    setBusyId(null)
  }

  if (loading) {
    return <div className="py-8 text-center text-sm text-victorian-500">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-victorian-900 dark:text-cream-50">
          {isAr ? 'التعليقات والتقييمات' : 'Reviews & ratings'}
        </h2>
        <button
          type="button"
          onClick={() => load()}
          className="text-xs font-semibold uppercase tracking-wider text-burgundy-700 hover:underline dark:text-victorian-300"
        >
          {isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <div className="divide-y divide-victorian-200 dark:divide-victorian-800 border border-victorian-200 dark:border-victorian-800 bg-cream-50 dark:bg-victorian-950/60">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-victorian-900 dark:text-cream-50">{r.name}</span>
                <span className="text-amber-600 dark:text-amber-400" aria-label={`${r.rating}/5`}>
                  {'★'.repeat(r.rating)}
                  <span className="text-victorian-300 dark:text-victorian-600">{'★'.repeat(5 - r.rating)}</span>
                </span>
                {!r.approved && (
                  <span className="rounded bg-victorian-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-victorian-800 dark:bg-victorian-800 dark:text-victorian-200">
                    {isAr ? 'مخفي' : 'Hidden'}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm text-victorian-700 dark:text-cream-200">{r.comment}</p>
              <p className="text-[10px] text-victorian-400">
                {formatOrderDateTime(r.createdAt)}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => toggleApprove(r.id, !r.approved)}
                className="border border-victorian-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-victorian-700 hover:bg-victorian-100 disabled:opacity-50 dark:border-victorian-600 dark:text-cream-200 dark:hover:bg-victorian-900"
              >
                {r.approved
                  ? isAr
                    ? 'إخفاء عن العامة'
                    : 'Hide from site'
                  : isAr
                    ? 'إظهار للعامة'
                    : 'Show on site'}
              </button>
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => del(r.id)}
                className="inline-flex items-center justify-center gap-1 border border-burgundy-400 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-burgundy-700 hover:bg-burgundy-50 disabled:opacity-50 dark:border-burgundy-800 dark:text-burgundy-300 dark:hover:bg-burgundy-950/40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isAr ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="py-10 text-center text-sm text-victorian-400">
            {isAr ? 'لا توجد تعليقات بعد' : 'No reviews yet'}
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Admins ─────────────────────────────────────────── */

type AdminUser = { id: string; email: string; isSuperAdmin: boolean; permissions: string[]; createdAt: string }

function AdminsTab({ token, isAr }: { token: string; isAr: boolean }) {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [perms, setPerms] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const ALL_PERMS = [
    { id: 'orders', labelAr: 'الطلبات', labelEn: 'Orders' },
    { id: 'products', labelAr: 'المنتجات', labelEn: 'Products' },
    { id: 'categories', labelAr: 'التصنيفات', labelEn: 'Categories' },
    { id: 'discounts', labelAr: 'أكواد الخصم', labelEn: 'Discount codes' },
    { id: 'site_settings', labelAr: 'إعدادات الموقع', labelEn: 'Site Settings' },
    { id: 'reviews', labelAr: 'التعليقات والتقييمات', labelEn: 'Reviews & ratings' },
  ]

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api('/api/auth/admin-users', token)
      if (res.ok) setAdmins(await res.json())
    } catch { /* */ }
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const openForm = (admin?: AdminUser) => {
    setEditing(admin ?? null)
    setEmail(admin?.email ?? '')
    setPassword('')
    setPerms(admin?.permissions ?? [])
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
    setEmail('')
    setPassword('')
    setPerms([])
  }

  const togglePerm = (id: string) => {
    setPerms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (editing) {
        const res = await api(`/api/auth/admin-users/${editing.id}`, token, {
          method: 'PUT',
          body: JSON.stringify({ password: password || undefined, permissions: perms })
        })
        if (res.ok) {
          closeForm()
          load()
        } else {
          alert(isAr ? 'عذرًا، تعذر التحديث' : 'Failed to update')
        }
      } else {
        const res = await api('/api/auth/admin-users', token, {
          method: 'POST',
          body: JSON.stringify({ email, password, permissions: perms })
        })
        if (res.ok) {
          closeForm()
          load()
        } else {
          alert(isAr ? 'البريد الإلكتروني موجود مسبقاً' : 'Email might exist')
        }
      }
    } catch { alert(isAr ? 'خطأ في الشبكة' : 'Network error') }
    setBusy(false)
  }

  const del = async (id: string) => {
    if (!confirm(isAr ? 'قم بتأكيد حذف هذا المشرف.' : 'Delete this admin?')) return
    const res = await api(`/api/auth/admin-users/${id}`, token, { method: 'DELETE' })
    if (res.ok) load()
    else alert(isAr ? 'تعذر الحذف' : 'Cannot delete')
  }

  if (loading) return <div className="py-8 text-center text-sm text-victorian-500">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-victorian-900 dark:text-cream-50">{isAr ? 'المشرفون' : 'Admins'}</h2>
        <button type="button" onClick={() => openForm()} className="inline-flex items-center gap-2 border-2 border-burgundy-700 bg-burgundy-700 px-5 py-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-cream-50 hover:bg-burgundy-800">
          <Shield className="h-4 w-4" /> {isAr ? 'إضافة مشرف' : 'Add Admin'}
        </button>
      </div>

      <div className="divide-y divide-victorian-200 dark:divide-victorian-800 border border-victorian-200 dark:border-victorian-800 bg-cream-50 dark:bg-victorian-950/60 p-4">
        {admins.map(a => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <p className="font-semibold text-victorian-900 dark:text-cream-50 flex items-center gap-2">
                {a.email}
                {a.isSuperAdmin && <span className="bg-burgundy-100 text-burgundy-800 text-[10px] px-2 py-0.5 rounded-full dark:bg-burgundy-900 dark:text-burgundy-200">{isAr ? 'المدير الرئيسي' : 'Super Admin'}</span>}
              </p>
              {!a.isSuperAdmin && (
                <p className="text-xs text-victorian-500 mt-1">
                  {a.permissions.length === 0 ? (isAr ? 'لا توجد صلاحيات' : 'No permissions') : a.permissions.map(p => ALL_PERMS.find(ap => ap.id === p)?.labelAr || p).join('، ')}
                </p>
              )}
            </div>
            {!a.isSuperAdmin && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => openForm(a)} className="p-2 border border-victorian-300 text-victorian-600 hover:bg-victorian-100 dark:border-victorian-700 dark:hover:bg-victorian-900">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => del(a.id)} className="p-2 border border-burgundy-300 text-burgundy-600 hover:bg-burgundy-50 dark:border-burgundy-800 dark:hover:bg-burgundy-900/30">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
            {a.isSuperAdmin && (
              <div className="text-[11px] text-victorian-400">{isAr ? 'المدير الرئيسي مع صلاحيات كاملة' : 'Super admin with full access'}</div>
            )}
          </div>
        ))}
        {admins.length === 0 && <div className="text-center py-4 text-sm text-victorian-500">لا يوجد مشرفون آخرون</div>}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <form onSubmit={save} className="w-full max-w-md bg-cream-50 border border-victorian-200 p-6 shadow-xl dark:bg-victorian-950 dark:border-victorian-800">
            <div className="mb-4 flex items-center justify-between border-b border-victorian-200 pb-3 dark:border-victorian-800">
              <h3 className="text-lg font-bold text-victorian-900 dark:text-cream-50">{editing ? (isAr ? 'تعديل بيانات المشرف' : 'Edit Admin') : (isAr ? 'إضافة مشرف جديد' : 'New Admin')}</h3>
              <button type="button" onClick={closeForm} className="text-victorian-500 hover:text-burgundy-700"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs text-victorian-500">{isAr ? 'البريد الإلكتروني' : 'Email'}</span>
                <input required={!editing} disabled={!!editing} type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full border border-victorian-300 bg-cream-50 px-4 py-2 text-sm dark:border-victorian-700 dark:bg-victorian-900 dark:text-cream-100 disabled:opacity-50" />
              </label>
              <label className="block">
                <span className="text-xs text-victorian-500">{editing ? (isAr ? 'كلمة المرور الجديدة (اختياري للإبقاء دون تغيير)' : 'New Password (Optional)') : (isAr ? 'كلمة المرور' : 'Password')}</span>
                <input required={!editing} type="text" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full border border-victorian-300 bg-cream-50 px-4 py-2 text-sm dark:border-victorian-700 dark:bg-victorian-900 dark:text-cream-100" />
              </label>
              
              <div>
                <span className="text-xs text-victorian-500 mb-3 block">{isAr ? 'الصلاحيات' : 'Permissions'}</span>
                <div className="space-y-2">
                  {ALL_PERMS.map(p => (
                    <label key={p.id} className="flex items-center gap-3 text-sm text-victorian-700 dark:text-cream-200 cursor-pointer p-2 border border-victorian-200 hover:bg-victorian-100 dark:border-victorian-800 dark:hover:bg-victorian-900">
                      <input type="checkbox" checked={perms.includes(p.id)} onChange={() => togglePerm(p.id)} className="rounded border-victorian-300 text-burgundy-700 focus:ring-burgundy-700 h-4 w-4" />
                      {isAr ? p.labelAr : p.labelEn}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-victorian-200 pt-4 dark:border-victorian-800">
              <button type="button" onClick={closeForm} className="px-5 py-2 text-sm border font-bold uppercase tracking-[0.1em] border-victorian-300 text-victorian-700 hover:bg-victorian-100 dark:border-victorian-700 dark:text-cream-200 dark:hover:bg-victorian-900">{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button type="submit" disabled={busy} className="px-5 py-2 text-sm border-2 font-bold uppercase tracking-[0.1em] border-burgundy-700 bg-burgundy-700 text-cream-50 hover:bg-burgundy-800 disabled:opacity-50">{busy ? '...' : (isAr ? 'حفظ الحساب' : 'Save')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
