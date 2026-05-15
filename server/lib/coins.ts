import { prisma } from './prisma.js'

/**
 * نظام «القطع الذهبية الملكية»
 * — تُكسب عند تسليم الطلب (status = "delivered")
 * — تُستبدل بأكواد خصم تُولَّد على الفور
 */

/** نسبة الكسب: 1.6٪ من المجموع — 50,000 د.ع → 800 قطعة */
export const COINS_EARN_RATE = 0.016

/** مستويات الاستبدال: نسبة الخصم → سعر بالقطع */
export const COIN_TIERS = [
  { percent: 10, price: 1500 },
  { percent: 20, price: 3200 },
  { percent: 30, price: 5500 },
  { percent: 40, price: 8500 },
  { percent: 50, price: 12500 },
] as const

export type CoinTier = (typeof COIN_TIERS)[number]

/** أيام صلاحية كود الخصم المُولَّد من القطع */
export const REDEEM_CODE_VALID_DAYS = 30

/** الحد الأقصى لمبلغ الخصم لكود مُستبدَل (يحمي المتجر) */
export const REDEEM_MAX_DISCOUNT_IQD = 50_000

/**
 * توحيد رقم الهاتف: نأخذ أرقامه فقط، نحوّل الأرقام العربية إلى إنجليزية.
 * نُبقي آخر ١٠ خانات فقط (الجزء الفريد بدون مقدمة الدولة).
 */
export function normalizePhone(raw: unknown): string {
  if (raw == null) return ''
  let s = String(raw).trim()
  // عربي → إنجليزي
  s = s.replace(/[\u0660-\u0669]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
  s = s.replace(/[\u06F0-\u06F9]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
  // أرقام فقط
  const digits = s.replace(/\D+/g, '')
  if (digits.length < 8) return ''
  // آخر ١٠ خانات لتطابق مفاتيح متعددة الصيغ (07XXXXXXXXX، +9647XXXXXXXX)
  return digits.slice(-10)
}

export function calcCoinsForOrder(totalIQD: number): number {
  const t = Math.max(0, Math.floor(Number(totalIQD) || 0))
  return Math.floor(t * COINS_EARN_RATE)
}

/**
 * يمنح القطع الذهبية لطلب تم تسليمه (مرة واحدة فقط).
 * يفشل بصمت إذا كان الهاتف فارغًا أو القطع ٠.
 */
export async function awardCoinsForDelivery(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return
  if (order.status !== 'delivered') return
  if (order.coinsAwarded > 0) return // مُمنوحة مسبقًا

  const phone = normalizePhone(order.phone)
  if (!phone) return

  const total = Number(order.total)
  const coins = calcCoinsForOrder(total)
  if (coins <= 0) return

  await prisma.$transaction(async (tx) => {
    // قد يكون أُعيد التعليم بسرعة — افحص داخل المعاملة لتجنّب المضاعفة
    const fresh = await tx.order.findUnique({ where: { id: orderId } })
    if (!fresh || fresh.coinsAwarded > 0 || fresh.status !== 'delivered') return

    await tx.coinAccount.upsert({
      where: { phone },
      create: { phone, balance: coins, totalEarned: coins },
      update: {
        balance: { increment: coins },
        totalEarned: { increment: coins },
      },
    })

    await tx.coinTransaction.create({
      data: {
        phone,
        amount: coins,
        type: 'earn',
        orderId,
        description: `Order delivered — ${total} IQD`,
      },
    })

    await tx.order.update({
      where: { id: orderId },
      data: { coinsAwarded: coins },
    })
  })
}

/**
 * يلغي منح القطع إذا أُعيدت حالة الطلب إلى غير «delivered»
 * (يحمي من التلاعب بإرجاع الحالة بعد الكسب).
 */
export async function revokeCoinsIfNotDelivered(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return
  if (order.status === 'delivered') return
  if (order.coinsAwarded <= 0) return

  const phone = normalizePhone(order.phone)
  if (!phone) return
  const coins = order.coinsAwarded

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.order.findUnique({ where: { id: orderId } })
    if (!fresh || fresh.coinsAwarded <= 0 || fresh.status === 'delivered') return

    const acc = await tx.coinAccount.findUnique({ where: { phone } })
    if (acc) {
      const newBalance = Math.max(0, acc.balance - coins)
      const newEarned = Math.max(0, acc.totalEarned - coins)
      await tx.coinAccount.update({
        where: { phone },
        data: { balance: newBalance, totalEarned: newEarned },
      })
    }

    await tx.coinTransaction.create({
      data: {
        phone,
        amount: -coins,
        type: 'earn',
        orderId,
        description: 'Reverted: order no longer delivered',
      },
    })

    await tx.order.update({
      where: { id: orderId },
      data: { coinsAwarded: 0 },
    })
  })
}

/** يولّد كود استبدال فريد بطول 10 (ROYAL-XXXXXX) */
export function generateRedeemCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `ROYAL${s}`
}
