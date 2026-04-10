import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Edit3,
  FolderPlus,
  LogOut,
  Package,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import type { Category, Product } from '../types'

const base = import.meta.env.VITE_API_BASE ?? ''

type Tab = 'categories' | 'products' | 'orders'

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
  const { token, email, isAdmin, logout } = useAuth()
  const { isAr } = useLanguage()
  const [tab, setTab] = useState<Tab>('orders')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  const load = useCallback(async () => {
    if (!token) return
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
  }, [token])

  useEffect(() => { load() }, [load])

  if (!isAdmin) return <Navigate to="/login" replace />

  const tabBtn = (t: Tab, icon: React.ReactNode, label: string) => (
    <button type="button" onClick={() => setTab(t)}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${
        tab === t ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
      }`}>
      {icon}{label}
    </button>
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{isAr ? 'لوحة التحكم' : 'Dashboard'}</h1>
          <p className="text-xs text-slate-400">{email}</p>
        </div>
        <button type="button" onClick={logout}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
          <LogOut className="h-4 w-4" />{isAr ? 'خروج' : 'Logout'}
        </button>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {tabBtn('orders', <ClipboardList className="h-4 w-4" />, isAr ? 'الطلبات' : 'Orders')}
        {tabBtn('products', <Package className="h-4 w-4" />, isAr ? 'المنتجات' : 'Products')}
        {tabBtn('categories', <Tag className="h-4 w-4" />, isAr ? 'التصنيفات' : 'Categories')}
      </div>

      {tab === 'categories' && <CategoriesTab token={token!} categories={categories} isAr={isAr} reload={load} />}
      {tab === 'products' && <ProductsTab token={token!} products={products} categories={categories} isAr={isAr} reload={load} />}
      {tab === 'orders' && <OrdersTab token={token!} orders={orders} isAr={isAr} reload={load} />}
    </div>
  )
}

/* ─── Categories ─────────────────────────────────────── */

function CategoriesTab({ token, categories, isAr, reload }: { token: string; categories: Category[]; isAr: boolean; reload: () => void }) {
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [busy, setBusy] = useState(false)
  const inp = 'mt-1 w-full rounded-full border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900'

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true)
    await api('/api/admin/categories', token, { method: 'POST', body: JSON.stringify({ slug, name: name || nameAr, nameAr }) })
    setSlug(''); setName(''); setNameAr(''); await reload(); setBusy(false)
  }

  const del = async (id: string) => {
    if (!confirm('حذف هذا التصنيف؟')) return
    await api(`/api/admin/categories/${id}`, token, { method: 'DELETE' }); reload()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1"><span className="text-xs text-slate-400">الرابط (Slug)</span>
          <input required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="men" className={inp} /></label>
        <label className="flex-1"><span className="text-xs text-slate-400">الاسم بالانجليزية</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Men" className={inp} /></label>
        <label className="flex-1"><span className="text-xs text-slate-400">الاسم بالعربية</span>
          <input required value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="رجال" className={inp} /></label>
        <button type="submit" disabled={busy}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900">
          <FolderPlus className="h-4 w-4" />إضافة</button>
      </form>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-3">
            <div><span className="text-sm font-medium text-slate-900 dark:text-white">{c.nameAr}</span>
              <span className="ms-2 text-xs text-slate-400">{c.slug}</span></div>
            <button type="button" onClick={() => del(c.id)} className="rounded-full p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30">
              <Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
        {categories.length === 0 && <li className="py-8 text-center text-sm text-slate-400">لا توجد تصنيفات</li>}
      </ul>
    </div>
  )
}

/* ─── Products ───────────────────────────────────────── */

function ProductsTab({ token, products, categories, isAr, reload }: { token: string; products: Product[]; categories: Category[]; isAr: boolean; reload: () => void }) {
  const [activeCat, setActiveCat] = useState('')

  const del = async (id: string) => {
    if (!confirm('حذف هذا المنتج؟')) return
    await api(`/api/admin/products/${id}`, token, { method: 'DELETE' }); reload()
  }

  const filtered = activeCat ? products.filter((p) => p.category?.id === activeCat) : products

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button type="button" onClick={() => setActiveCat('')}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${!activeCat ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          الكل</button>
        {categories.map((c) => (
          <button key={c.id} type="button" onClick={() => setActiveCat(c.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${activeCat === c.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
            {c.nameAr}</button>
        ))}
      </div>

      <Link to="/admin/product/new"
        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900">
        <Plus className="h-4 w-4" />إضافة منتج
      </Link>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.map((p) => (
          <div key={p.id} className="flex items-center gap-3 py-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
              {p.images[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{p.nameAr}</p>
              <p className="text-xs text-slate-400">{Number(p.price).toLocaleString()} IQD · {p.category?.nameAr ?? ''}</p>
            </div>
            <Link to={`/admin/product/${p.id}`}
              className="shrink-0 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Edit3 className="h-4 w-4" />
            </Link>
            <button type="button" onClick={() => del(p.id)}
              className="shrink-0 rounded-full p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-400">لا توجد منتجات</p>}
      </div>
    </div>
  )
}

/* ─── Orders ─────────────────────────────────────────── */

const STATUS_OPTIONS = [
  { value: 'pending', label: 'قيد الانتظار', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  { value: 'confirmed', label: 'تم التأكيد', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'shipped', label: 'تم الشحن', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { value: 'delivered', label: 'تم التوصيل', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'cancelled', label: 'ملغي', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' },
]

function OrdersTab({ token, orders, isAr, reload }: { token: string; orders: Order[]; isAr: boolean; reload: () => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const updateStatus = async (orderId: string, status: string) => {
    await api(`/api/admin/orders/${orderId}/status`, token, { method: 'PUT', body: JSON.stringify({ status }) })
    reload()
  }

  if (orders.length === 0) return <p className="py-12 text-center text-sm text-slate-400">لا توجد طلبات</p>

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const expanded = expandedId === o.id
        const statusInfo = STATUS_OPTIONS.find((s) => s.value === o.status) ?? STATUS_OPTIONS[0]
        const date = new Date(o.createdAt)

        return (
          <div key={o.id} className="rounded-2xl border border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setExpandedId(expanded ? null : o.id)}
              className="flex w-full items-center gap-3 px-4 py-4 text-start">
              {o.items[0]?.image && (
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  <img src={o.items[0].image} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{o.customerName}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {date.toLocaleDateString('ar-IQ')} · {Number(o.total).toLocaleString()} IQD</p>
              </div>
              {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />}
            </button>

            {expanded && (
              <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="الهاتف" value={o.phone} dir="ltr" />
                  <Info label="المحافظة" value={o.province} />
                  <Info label="المنطقة" value={o.city} />
                  <Info label="العنوان" value={o.address} />
                  {o.landmark && <Info label="أقرب نقطة دالة" value={o.landmark} />}
                  {o.notes && <Info label="ملاحظات" value={o.notes} />}
                </div>

                <div className="mt-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">المنتجات</p>
                  <div className="space-y-3">
                    {o.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                          {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" />
                          : <div className="flex h-full items-center justify-center text-slate-300"><Package className="h-5 w-5" /></div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{item.productName}</p>
                          <p className="text-xs text-slate-400">{item.size} × {item.quantity}</p>
                        </div>
                        <p className="shrink-0 text-xs font-medium text-slate-500">{Number(item.unitPrice).toLocaleString()} IQD</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button key={s.value} type="button" onClick={() => updateStatus(o.id, s.value)} disabled={o.status === s.value}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        o.status === s.value ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
                      }`}>{s.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Info({ label, value, dir }: { label: string; value: string; dir?: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-slate-900 dark:text-white" dir={dir}>{value || '—'}</p>
    </div>
  )
}
