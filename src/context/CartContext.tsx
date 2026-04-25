import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { CartLine } from '../types'
import { DELIVERY_FEE_IQD } from '../lib/deliveryFee'
import { validateDiscount, type DiscountValidation } from '../api'

const STORAGE = 'classi-cart'
const DISCOUNT_STORAGE = 'classi-discount'

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

function loadDiscount(): DiscountValidation | null {
  try {
    const raw = localStorage.getItem(DISCOUNT_STORAGE)
    if (!raw) return null
    return JSON.parse(raw) as DiscountValidation
  } catch {
    return null
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
  deliveryFee: number
  grandTotal: number
  /** الخصم المُطبَّق حاليًا (إن وُجد) */
  discount: DiscountValidation | null
  /** مبلغ الخصم بالدينار، يُعاد حسابه دائمًا على المجموع الحالي */
  discountAmount: number
  /** يطبّق كود الخصم على السلة الحالية. في حالة الخطأ يرمي رسالة خطأ. */
  applyDiscount: (code: string) => Promise<void>
  /** يزيل الخصم المُطبَّق */
  clearDiscount: () => void
  /** آخر خطأ من تحقق الخصم — لعرضه في الواجهة */
  discountError: string | null
  /** هل التحقق جارٍ حاليًا */
  discountBusy: boolean
}

const CartContext = createContext<Ctx | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() =>
    typeof window === 'undefined' ? [] : load(),
  )
  const [discount, setDiscount] = useState<DiscountValidation | null>(() =>
    typeof window === 'undefined' ? null : loadDiscount(),
  )
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [discountBusy, setDiscountBusy] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    if (discount) localStorage.setItem(DISCOUNT_STORAGE, JSON.stringify(discount))
    else localStorage.removeItem(DISCOUNT_STORAGE)
  }, [discount])

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

  const clear = useCallback(() => {
    setItems([])
    setDiscount(null)
    setDiscountError(null)
  }, [])

  const count = useMemo(
    () => items.reduce((s, x) => s + x.quantity, 0),
    [items],
  )

  const subtotal = useMemo(
    () =>
      items.reduce((s, x) => s + Number(x.price) * x.quantity, 0),
    [items],
  )

  // إعادة حساب مبلغ الخصم محليًا على المجموع الحالي حتى لا يفسد إذا تغيرت السلة.
  // الخادم سيعيد التحقق عند الإرسال النهائي.
  const discountAmount = useMemo(() => {
    if (!discount) return 0
    const min = discount.minOrderTotal != null ? Number(discount.minOrderTotal) : 0
    if (subtotal < min) return 0
    let amt = 0
    const value = Number(discount.value)
    if (discount.type === 'percent') {
      amt = (subtotal * value) / 100
      const cap = discount.maxDiscount != null ? Number(discount.maxDiscount) : 0
      if (cap > 0 && amt > cap) amt = cap
    } else {
      amt = value
    }
    if (amt > subtotal) amt = subtotal
    return Math.max(0, Math.round(amt))
  }, [discount, subtotal])

  // تنظيف تلقائي للخصم لو سقطت السلة لما دون الحد الأدنى
  useEffect(() => {
    if (!discount) return
    const min = discount.minOrderTotal != null ? Number(discount.minOrderTotal) : 0
    if (subtotal === 0 || subtotal < min) {
      setDiscount(null)
      setDiscountError(null)
    }
  }, [discount, subtotal])

  const deliveryFee = DELIVERY_FEE_IQD
  const grandTotal = useMemo(
    () => Math.max(0, subtotal - discountAmount) + deliveryFee,
    [subtotal, discountAmount, deliveryFee],
  )

  const applyDiscount = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim().toUpperCase().replace(/\s+/g, '')
      if (!code) {
        setDiscountError('missing_code')
        throw new Error('missing_code')
      }
      setDiscountBusy(true)
      setDiscountError(null)
      try {
        const result = await validateDiscount(code, subtotal)
        setDiscount(result)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'invalid'
        setDiscountError(msg)
        setDiscount(null)
        throw e
      } finally {
        setDiscountBusy(false)
      }
    },
    [subtotal],
  )

  const clearDiscount = useCallback(() => {
    setDiscount(null)
    setDiscountError(null)
  }, [])

  const value = useMemo(
    () => ({
      items,
      add,
      updateQty,
      remove,
      clear,
      count,
      subtotal,
      deliveryFee,
      grandTotal,
      discount,
      discountAmount,
      applyDiscount,
      clearDiscount,
      discountError,
      discountBusy,
    }),
    [
      items,
      add,
      updateQty,
      remove,
      clear,
      count,
      subtotal,
      deliveryFee,
      grandTotal,
      discount,
      discountAmount,
      applyDiscount,
      clearDiscount,
      discountError,
      discountBusy,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const c = useContext(CartContext)
  if (!c) throw new Error('useCart outside provider')
  return c
}
