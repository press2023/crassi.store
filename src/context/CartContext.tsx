import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { CartLine } from '../types'

const STORAGE = 'classi-cart'

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE)
    if (!raw) return []
    const p = JSON.parse(raw) as CartLine[]
    return Array.isArray(p) ? p : []
  } catch {
    return []
  }
}

type Ctx = {
  items: CartLine[]
  add: (line: Omit<CartLine, 'quantity'> & { quantity?: number }) => void
  updateQty: (productId: string, size: string, quantity: number) => void
  remove: (productId: string, size: string) => void
  clear: () => void
  count: number
  subtotal: number
}

const CartContext = createContext<Ctx | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() =>
    typeof window === 'undefined' ? [] : load(),
  )

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(items))
  }, [items])

  const add = useCallback(
    (line: Omit<CartLine, 'quantity'> & { quantity?: number }) => {
      const q = Math.max(1, line.quantity ?? 1)
      setItems((prev) => {
        const i = prev.findIndex(
          (x) => x.productId === line.productId && x.size === line.size,
        )
        if (i >= 0) {
          const next = [...prev]
          next[i] = { ...next[i], quantity: next[i].quantity + q }
          return next
        }
        return [...prev, { ...line, quantity: q }]
      })
    },
    [],
  )

  const updateQty = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) =>
        prev.filter((x) => !(x.productId === productId && x.size === size)),
      )
      return
    }
    setItems((prev) =>
      prev.map((x) =>
        x.productId === productId && x.size === size ? { ...x, quantity } : x,
      ),
    )
  }, [])

  const remove = useCallback((productId: string, size: string) => {
    setItems((prev) =>
      prev.filter((x) => !(x.productId === productId && x.size === size)),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = useMemo(
    () => items.reduce((s, x) => s + x.quantity, 0),
    [items],
  )

  const subtotal = useMemo(
    () =>
      items.reduce((s, x) => s + Number(x.price) * x.quantity, 0),
    [items],
  )

  const value = useMemo(
    () => ({ items, add, updateQty, remove, clear, count, subtotal }),
    [items, add, updateQty, remove, clear, count, subtotal],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const c = useContext(CartContext)
  if (!c) throw new Error('useCart outside provider')
  return c
}
