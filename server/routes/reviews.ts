import { randomUUID } from 'crypto'
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requirePermission } from '../lib/auth.js'

const router = Router()

const reviewPublicSelect = {
  id: true,
  name: true,
  rating: true,
  comment: true,
  createdAt: true,
  approved: true,
} as const

/** GET /api/reviews — كل الآراء المعتمدة (للجمهور) — بدون deleteToken */
router.get('/', async (_req, res) => {
  try {
    const rows = await prisma.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: reviewPublicSelect,
    })
    const count = rows.length
    const avg =
      count > 0
        ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
        : 0
    res.json({ reviews: rows, count, average: avg })
  } catch (e) {
    console.error('[reviews] list failed', e)
    res.status(503).json({ error: 'server_error' })
  }
})

/** POST /api/reviews — إضافة رأي */
router.post('/', async (req, res) => {
  const body = req.body as { name?: string; rating?: number; comment?: string }
  const name = String(body.name ?? '').trim().slice(0, 80)
  const rating = Math.round(Number(body.rating))
  const comment = String(body.comment ?? '').trim().slice(0, 1000)

  if (!name || !comment) {
    return res.status(400).json({ error: 'missing_fields' })
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'invalid_rating' })
  }

  try {
    const deleteToken = randomUUID()
    const row = await prisma.review.create({
      data: { name, rating, comment, approved: true, deleteToken },
      select: { ...reviewPublicSelect, deleteToken: true },
    })
    if (!row.deleteToken) {
      console.error('[reviews] create missing deleteToken')
      return res.status(500).json({ error: 'token_not_created' })
    }
    res.status(201).json({
      id: row.id,
      name: row.name,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt,
      approved: row.approved,
      deleteToken: row.deleteToken,
    })
  } catch (e) {
    console.error('[reviews] create failed', e)
    res.status(503).json({ error: 'server_error' })
  }
})

/** POST /api/reviews/self-delete — حذف تعليقك باستخدام الرمز الذي خُزّن عند الإنشاء */
router.post('/self-delete', async (req, res) => {
  const body = req.body as { reviewId?: string; deleteToken?: string }
  const reviewId = String(body.reviewId ?? '').trim()
  const deleteToken = String(body.deleteToken ?? '').trim()
  if (!reviewId || !deleteToken) {
    return res.status(400).json({ error: 'missing_fields' })
  }
  try {
    const row = await prisma.review.findFirst({
      where: { id: reviewId, deleteToken, approved: true },
      select: { id: true, deleteToken: true },
    })
    if (!row) {
      return res.status(404).json({ error: 'not_found_or_forbidden' })
    }
    await prisma.review.delete({ where: { id: row.id } })
    res.json({ ok: true })
  } catch (e) {
    console.error('[reviews] self-delete failed', e)
    res.status(503).json({ error: 'server_error' })
  }
})

// ── تحكم إداري ──────────────────────────────────────────

/** GET /api/reviews/admin — كل الآراء (حتى غير المعتمدة) — يتطلب صلاحية */
router.get('/admin/all', requireAdmin, requirePermission('reviews'), async (_req, res) => {
  try {
    const rows = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

/** DELETE /api/reviews/:id — حذف إداري */
router.delete('/:id', requireAdmin, requirePermission('reviews'), async (req, res) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(404).json({ error: 'not_found' })
  }
})

/** PUT /api/reviews/:id/approve — قلب حالة الاعتماد */
router.put('/:id/approve', requireAdmin, requirePermission('reviews'), async (req, res) => {
  const { approved } = req.body as { approved?: boolean }
  try {
    const row = await prisma.review.update({
      where: { id: req.params.id },
      data: { approved: Boolean(approved) },
    })
    res.json(row)
  } catch {
    res.status(404).json({ error: 'not_found' })
  }
})

export default router
