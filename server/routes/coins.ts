import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import {
  COIN_TIERS,
  COINS_EARN_RATE,
  REDEEM_CODE_VALID_DAYS,
  REDEEM_MAX_DISCOUNT_IQD,
  generateRedeemCode,
  normalizePhone,
} from '../lib/coins.js'

const router = Router()

/** ميتا — للسعر/المعدل في الـ frontend (يضمن تطابق العرض مع الخادم) */
router.get('/meta', (_req, res) => {
  res.json({
    earnRate: COINS_EARN_RATE,
    tiers: COIN_TIERS,
    maxDiscountIQD: REDEEM_MAX_DISCOUNT_IQD,
    validDays: REDEEM_CODE_VALID_DAYS,
  })
})

/** ملخّص الحساب لرقم هاتف معيَّن */
router.get('/account', async (req, res) => {
  const phone = normalizePhone(req.query.phone)
  if (!phone) return res.status(400).json({ error: 'invalid_phone' })
  try {
    const acc = await prisma.coinAccount.findUnique({ where: { phone } })
    const txs = await prisma.coinTransaction.findMany({
      where: { phone },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    res.json({
      phone,
      balance: acc?.balance ?? 0,
      totalEarned: acc?.totalEarned ?? 0,
      totalSpent: acc?.totalSpent ?? 0,
      transactions: txs.map((t) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        orderId: t.orderId,
        discountCode: t.discountCode,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    console.error('[coins/account]', e)
    res.status(503).json({ error: 'server_error' })
  }
})

/**
 * استبدال قطع ذهبية بكود خصم.
 * Body: { phone, percent }
 * يُولِّد كود خصم single-use بصلاحية محدودة وسقف خصم 50,000 د.ع.
 */
router.post('/redeem', async (req, res) => {
  const phone = normalizePhone((req.body as { phone?: string }).phone)
  const percent = Math.floor(Number((req.body as { percent?: number }).percent) || 0)
  if (!phone) return res.status(400).json({ error: 'invalid_phone' })
  const tier = COIN_TIERS.find((t) => t.percent === percent)
  if (!tier) return res.status(400).json({ error: 'invalid_tier' })

  try {
    const result = await prisma.$transaction(async (tx) => {
      const acc = await tx.coinAccount.findUnique({ where: { phone } })
      if (!acc || acc.balance < tier.price) {
        throw new Error('insufficient_balance')
      }

      // كود فريد — حاول حتى ٥ مرات (الاحتمال شبه معدوم لتصادم)
      let code = ''
      for (let i = 0; i < 5; i++) {
        const candidate = generateRedeemCode()
        const existing = await tx.discount.findUnique({ where: { code: candidate } })
        if (!existing) { code = candidate; break }
      }
      if (!code) throw new Error('code_collision')

      const expiresAt = new Date(Date.now() + REDEEM_CODE_VALID_DAYS * 24 * 60 * 60 * 1000)
      await tx.discount.create({
        data: {
          code,
          nameAr: `كود مستبدَل بالقطع الذهبية — ${tier.percent}٪`,
          nameEn: `Royal coins redeem — ${tier.percent}%`,
          type: 'percent',
          value: new Prisma.Decimal(tier.percent),
          maxDiscount: new Prisma.Decimal(REDEEM_MAX_DISCOUNT_IQD),
          enabled: true,
          usageLimit: 1,
          expiresAt,
        },
      })

      await tx.coinAccount.update({
        where: { phone },
        data: {
          balance: { decrement: tier.price },
          totalSpent: { increment: tier.price },
        },
      })

      await tx.coinTransaction.create({
        data: {
          phone,
          amount: -tier.price,
          type: 'spend',
          discountCode: code,
          description: `Redeemed for ${tier.percent}% discount code`,
        },
      })

      return { code, expiresAt: expiresAt.toISOString() }
    })

    res.json({
      ok: true,
      code: result.code,
      percent: tier.percent,
      coinsSpent: tier.price,
      expiresAt: result.expiresAt,
      maxDiscountIQD: REDEEM_MAX_DISCOUNT_IQD,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'insufficient_balance') return res.status(400).json({ error: 'insufficient_balance' })
    if (msg === 'code_collision') return res.status(503).json({ error: 'code_collision' })
    console.error('[coins/redeem]', e)
    res.status(503).json({ error: 'server_error' })
  }
})

export default router
