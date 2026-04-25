import type { Product } from '../types'

/**
 * أدوات حساب السعر الفعّال للمنتج (مع/بدون تخفيض).
 * - `effectivePrice`: السعر الذي يُدفع فعلياً (الـ sale لو موجود وإلا الـ price)
 * - `hasDiscount`: هل المنتج عليه تخفيض ساري (السعر المخفّض موجود وأصغر من الأصلي)
 * - `discountPercent`: نسبة التخفيض المقرّبة لأقرب عدد صحيح
 */

export type PricingInfo = {
  effective: number
  original: number
  hasDiscount: boolean
  discountPercent: number
  effectiveStr: string
  originalStr: string
}

export function getPricing(p: Pick<Product, 'price' | 'salePrice'>): PricingInfo {
  const original = Number(p.price) || 0
  const saleNum = p.salePrice != null && p.salePrice !== '' ? Number(p.salePrice) : NaN
  const hasDiscount = Number.isFinite(saleNum) && saleNum > 0 && saleNum < original
  const effective = hasDiscount ? saleNum : original
  const discountPercent = hasDiscount && original > 0
    ? Math.max(1, Math.round(((original - effective) / original) * 100))
    : 0
  return {
    effective,
    original,
    hasDiscount,
    discountPercent,
    effectiveStr: String(effective),
    originalStr: String(original),
  }
}
