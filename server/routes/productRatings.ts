import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

type Distribution = { 1: number; 2: number; 3: number; 4: number; 5: number }

async function summarize(productId: string, visitorId?: string) {
  const rows = await prisma.productRating.findMany({
    where: { productId },
    select: { rating: true, visitorId: true },
  })
  const count = rows.length
  const distribution: Distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let sum = 0
  for (const r of rows) {
    sum += r.rating
    const k = r.rating as 1 | 2 | 3 | 4 | 5
    if (k >= 1 && k <= 5) distribution[k] += 1
  }
  const average = count > 0 ? Math.round((sum / count) * 10) / 10 : 0
  let mine: number | null = null
  if (visitorId) {
    const found = rows.find((r) => r.visitorId === visitorId)
    if (found) mine = found.rating
  }
  return { count, average, distribution, mine }
}

/** GET /api/products/:productId/ratings?visitorId=... */
router.get('/:productId/ratings', async (req, res) => {
  const productId = String(req.params.productId || '').trim()
  const visitorId = typeof req.query.visitorId === 'string' ? req.query.visitorId.trim() : ''
  if (!productId) return res.status(400).json({ error: 'missing_product' })
  try {
    const exists = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    })
    if (!exists) return res.status(404).json({ error: 'product_not_found' })
    const data = await summarize(productId, visitorId || undefined)
    res.json(data)
  } catch (e) {
    console.error('[product-ratings] get failed', e)
    res.status(503).json({ error: 'server_error' })
  }
})

/** POST /api/products/:productId/ratings  body: { visitorId, rating } */
router.post('/:productId/ratings', async (req, res) => {
  const productId = String(req.params.productId || '').trim()
  const body = req.body as { visitorId?: string; rating?: number }
  const visitorId = String(body.visitorId ?? '').trim().slice(0, 128)
  const rating = Math.round(Number(body.rating))

  if (!productId) return res.status(400).json({ error: 'missing_product' })
  if (!visitorId) return res.status(400).json({ error: 'missing_visitor' })
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'invalid_rating' })
  }

  try {
    const exists = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    })
    if (!exists) return res.status(404).json({ error: 'product_not_found' })

    // تقييم واحد فقط لكل زائر — لا يمكن تعديله بعد التسجيل.
    const existing = await prisma.productRating.findUnique({
      where: { productId_visitorId: { productId, visitorId } },
      select: { id: true },
    })
    if (existing) {
      const data = await summarize(productId, visitorId)
      return res.status(409).json({ error: 'already_rated', ...data })
    }
    await prisma.productRating.create({ data: { productId, visitorId, rating } })
    const data = await summarize(productId, visitorId)
    res.status(201).json(data)
  } catch (e) {
    console.error('[product-ratings] post failed', e)
    res.status(503).json({ error: 'server_error' })
  }
})

export default router
