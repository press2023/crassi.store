import type { Category, Product } from './types'

const base = import.meta.env.VITE_API_BASE ?? ''

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || res.statusText)
  }
  return res.json() as Promise<T>
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${base}/api/categories`)
  return parseJson<Category[]>(res)
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const categories = await fetchCategories()
    return categories.find((c) => c.slug === slug) ?? null
  } catch {
    return null
  }
}

export async function fetchProducts(params?: {
  category?: string
  q?: string
}): Promise<Product[]> {
  const qs = new URLSearchParams()
  if (params?.category) qs.set('category', params.category)
  if (params?.q) qs.set('q', params.q)
  const tail = qs.toString()
  const res = await fetch(`${base}/api/products${tail ? `?${tail}` : ''}`)
  return parseJson<Product[]>(res)
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const res = await fetch(`${base}/api/products/slug/${encodeURIComponent(slug)}`)
  return parseJson<Product>(res)
}

export type SiteSettings = {
  heroImage?: string
  heroTitle?: string
  heroSubtitle?: string
  aboutTitleAr?: string
  aboutBodyAr?: string
  aboutTitleEn?: string
  aboutBodyEn?: string
}

export async function fetchSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${base}/api/settings`)
    if (!res.ok) return {}
    return (await res.json()) as SiteSettings
  } catch {
    return {}
  }
}

// ── زوار الموقع ──────────────────────────────────────

export type VisitorStats = { unique: number; total: number; isNew?: boolean }

export async function trackVisit(visitorId: string): Promise<VisitorStats> {
  const res = await fetch(`${base}/api/visitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId }),
  })
  return parseJson<VisitorStats>(res)
}

export async function fetchVisitorStats(): Promise<VisitorStats> {
  try {
    const res = await fetch(`${base}/api/visitors/stats`)
    if (!res.ok) return { unique: 0, total: 0 }
    return (await res.json()) as VisitorStats
  } catch {
    return { unique: 0, total: 0 }
  }
}

// ── الآراء ───────────────────────────────────────────

export type Review = {
  id: string
  name: string
  rating: number
  comment: string
  createdAt: string
  approved: boolean
}

/** استجابة الإنشاء فقط — تتضمن رمز الحذف (لا يُعاد في قائمة GET). */
export type ReviewCreated = Review & { deleteToken: string }

export type ReviewsResponse = {
  reviews: Review[]
  count: number
  average: number
}

export async function fetchReviews(): Promise<ReviewsResponse> {
  try {
    const res = await fetch(`${base}/api/reviews`)
    if (!res.ok) return { reviews: [], count: 0, average: 0 }
    return (await res.json()) as ReviewsResponse
  } catch {
    return { reviews: [], count: 0, average: 0 }
  }
}

export async function createReview(payload: {
  name: string
  rating: number
  comment: string
}): Promise<ReviewCreated> {
  const res = await fetch(`${base}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseJson<ReviewCreated>(res)
}

export async function deleteMyReview(reviewId: string, deleteToken: string): Promise<void> {
  const res = await fetch(`${base}/api/reviews/self-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewId, deleteToken }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || res.statusText)
  }
}

export async function createOrder(payload: {
  customerName: string
  email?: string
  phone: string
  province: string
  city?: string
  address: string
  landmark?: string
  notes?: string
  items: {
    productId: string
    quantity: number
    size: string
    unitPrice: string
    productName: string
  }[]
}): Promise<{ id: string }> {
  const res = await fetch(`${base}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseJson<{ id: string }>(res)
}
