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
