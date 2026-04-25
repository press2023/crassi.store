import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requirePermission } from '../lib/auth.js'

const router = Router()

const VALID_TYPES = new Set(['percent', 'fixed'])

function normalizeCode(s: unknown): string {
  return String(s ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

function serialize(d: {
  value: { toString(): string }
  minOrderTotal?: { toString(): string } | null
  maxDiscount?: { toString(): string } | null
  [k: string]: unknown
}) {
  const { value, minOrderTotal, maxDiscount, ...rest } = d
  return {
    ...rest,
    value: value.toString(),
    minOrderTotal: minOrderTotal != null ? minOrderTotal.toString() : null,
    maxDiscount: maxDiscount != null ? maxDiscount.toString() : null,
  }
}

/**
 * يحسب مبلغ الخصم على مجموع المنتجات (قبل التوصيل) مع التحقق من القواعد.
 * يعيد { ok, amount } عند النجاح أو { ok:false, error } مع كود خطأ.
 */
export function evaluateDiscount(
  d: {
    type: string
    value: Prisma.Decimal
    minOrderTotal: Prisma.Decimal | null
    maxDiscount: Prisma.Decimal | null
    enabled: boolean
    usageLimit: number | null
    usageCount: number
    expiresAt: Date | null
  },
  subtotal: number,
):
  | { ok: true; amount: number }
  | { ok: false; error: 'disabled' | 'expired' | 'exhausted' | 'min_total' | 'invalid' } {
  if (!d.enabled) return { ok: false, error: 'disabled' }
  if (d.expiresAt && d.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: 'expired' }
  }
  if (d.usageLimit != null && d.usageCount >= d.usageLimit) {
    return { ok: false, error: 'exhausted' }
  }
  const min = d.minOrderTotal != null ? Number(d.minOrderTotal) : 0
  if (subtotal < min) return { ok: false, error: 'min_total' }

  let amount = 0
  const value = Number(d.value)
  if (d.type === 'percent') {
    if (!(value > 0) || value > 100) return { ok: false, error: 'invalid' }
    amount = (subtotal * value) / 100
    if (d.maxDiscount != null) {
      const cap = Number(d.maxDiscount)
      if (cap > 0 && amount > cap) amount = cap
    }
  } else if (d.type === 'fixed') {
    if (!(value > 0)) return { ok: false, error: 'invalid' }
    amount = value
  } else {
    return { ok: false, error: 'invalid' }
  }
  if (amount > subtotal) amount = subtotal
  amount = Math.round(amount)
  if (amount <= 0) return { ok: false, error: 'invalid' }
  return { ok: true, amount }
}

// ── Public: التحقق من كود الخصم قبل الإرسال ──────────────

router.post('/validate', async (req, res) => {
  const code = normalizeCode((req.body as { code?: string }).code)
  const subtotalNum = Math.max(0, Math.floor(Number((req.body as { subtotal?: number }).subtotal) || 0))
  if (!code) return res.status(400).json({ error: 'missing_code' })
  try {
    const d = await prisma.discount.findUnique({ where: { code } })
    if (!d) return res.status(404).json({ error: 'not_found' })
    const result = evaluateDiscount(d, subtotalNum)
    if (!result.ok) return res.status(400).json({ error: result.error })
    res.json({
      code: d.code,
      nameAr: d.nameAr,
      nameEn: d.nameEn,
      type: d.type,
      value: d.value.toString(),
      amount: result.amount,
      minOrderTotal: d.minOrderTotal != null ? d.minOrderTotal.toString() : null,
      maxDiscount: d.maxDiscount != null ? d.maxDiscount.toString() : null,
    })
  } catch (e) {
    console.error('[discounts/validate]', e)
    res.status(503).json({ error: 'server_error' })
  }
})

// ── Admin CRUD (يحتاج صلاحية discounts) ──────────────────

router.use('/admin', requireAdmin)

router.get('/admin', requirePermission('discounts'), async (_req, res) => {
  try {
    const rows = await prisma.discount.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(rows.map(serialize))
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

router.post('/admin', requirePermission('discounts'), async (req, res) => {
  const b = req.body as {
    code?: string
    nameAr?: string
    nameEn?: string
    type?: string
    value?: number | string
    minOrderTotal?: number | string | null
    maxDiscount?: number | string | null
    enabled?: boolean
    usageLimit?: number | string | null
    expiresAt?: string | null
  }
  const code = normalizeCode(b.code)
  const nameAr = String(b.nameAr ?? '').trim()
  const type = String(b.type ?? 'percent')
  const value = Number(b.value)
  if (!code) return res.status(400).json({ error: 'missing_code' })
  if (!nameAr) return res.status(400).json({ error: 'missing_name' })
  if (!VALID_TYPES.has(type)) return res.status(400).json({ error: 'invalid_type' })
  if (!(value > 0)) return res.status(400).json({ error: 'invalid_value' })
  if (type === 'percent' && value > 100) return res.status(400).json({ error: 'percent_out_of_range' })

  try {
    const row = await prisma.discount.create({
      data: {
        code,
        nameAr,
        nameEn: String(b.nameEn ?? '').trim(),
        type,
        value,
        minOrderTotal:
          b.minOrderTotal == null || b.minOrderTotal === '' ? null : Number(b.minOrderTotal),
        maxDiscount:
          b.maxDiscount == null || b.maxDiscount === '' ? null : Number(b.maxDiscount),
        enabled: b.enabled !== false,
        usageLimit:
          b.usageLimit == null || b.usageLimit === '' ? null : Math.max(0, Math.floor(Number(b.usageLimit))),
        expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
      },
    })
    res.status(201).json(serialize(row))
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return res.status(409).json({ error: 'code_exists' })
    }
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

router.put('/admin/:id', requirePermission('discounts'), async (req, res) => {
  const b = req.body as Record<string, unknown>
  const data: Prisma.DiscountUpdateInput = {}
  if (b.code != null) {
    const code = normalizeCode(b.code)
    if (!code) return res.status(400).json({ error: 'missing_code' })
    data.code = code
  }
  if (b.nameAr != null) {
    const v = String(b.nameAr).trim()
    if (!v) return res.status(400).json({ error: 'missing_name' })
    data.nameAr = v
  }
  if (b.nameEn != null) data.nameEn = String(b.nameEn).trim()
  if (b.type != null) {
    const t = String(b.type)
    if (!VALID_TYPES.has(t)) return res.status(400).json({ error: 'invalid_type' })
    data.type = t
  }
  if (b.value != null) {
    const v = Number(b.value)
    if (!(v > 0)) return res.status(400).json({ error: 'invalid_value' })
    data.value = new Prisma.Decimal(v)
  }
  if ('minOrderTotal' in b) {
    data.minOrderTotal =
      b.minOrderTotal == null || b.minOrderTotal === '' ? null : new Prisma.Decimal(Number(b.minOrderTotal))
  }
  if ('maxDiscount' in b) {
    data.maxDiscount =
      b.maxDiscount == null || b.maxDiscount === '' ? null : new Prisma.Decimal(Number(b.maxDiscount))
  }
  if ('usageLimit' in b) {
    data.usageLimit =
      b.usageLimit == null || b.usageLimit === ''
        ? null
        : Math.max(0, Math.floor(Number(b.usageLimit)))
  }
  if ('expiresAt' in b) {
    data.expiresAt = b.expiresAt ? new Date(String(b.expiresAt)) : null
  }
  if (b.enabled != null) data.enabled = Boolean(b.enabled)

  try {
    const row = await prisma.discount.update({ where: { id: req.params.id }, data })
    res.json(serialize(row))
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return res.status(409).json({ error: 'code_exists' })
    }
    res.status(404).json({ error: 'not_found' })
  }
})

/** تبديل سريع للحالة (تفعيل / تعطيل) */
router.post('/admin/:id/toggle', requirePermission('discounts'), async (req, res) => {
  try {
    const cur = await prisma.discount.findUnique({ where: { id: req.params.id } })
    if (!cur) return res.status(404).json({ error: 'not_found' })
    const row = await prisma.discount.update({
      where: { id: req.params.id },
      data: { enabled: !cur.enabled },
    })
    res.json(serialize(row))
  } catch (e) {
    res.status(404).json({ error: 'not_found' })
  }
})

router.delete('/admin/:id', requirePermission('discounts'), async (req, res) => {
  try {
    await prisma.discount.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(404).json({ error: 'not_found' })
  }
})

export default router
