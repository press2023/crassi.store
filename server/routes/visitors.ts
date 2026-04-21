import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

/** رأس IP الحقيقي خلف بروكسي (Railway/Netlify). */
function clientIp(req: import('express').Request): string {
  const fwd = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
  return fwd || req.socket.remoteAddress || ''
}

/**
 * POST /api/visitors
 * body: { visitorId: string }
 * يسجّل زيارة. لو visitorId جديد → يزيد العدّاد، وإلا يحدّث lastSeen فقط.
 * يرجع { total, unique, isNew }
 */
router.post('/', async (req, res) => {
  const body = req.body as { visitorId?: string }
  const visitorId = String(body.visitorId ?? '').trim()
  if (!visitorId || visitorId.length < 8 || visitorId.length > 128) {
    return res.status(400).json({ error: 'invalid_visitor_id' })
  }

  try {
    const ua = String(req.headers['user-agent'] ?? '').slice(0, 512)
    const ip = clientIp(req).slice(0, 64)

    // upsert ذري — يمنع P2002 عند طلبين متزامنين (Strict Mode / شبكة مزدوجة).
    const row = await prisma.visitor.upsert({
      where: { id: visitorId },
      create: { id: visitorId, userAgent: ua || null, ip: ip || null },
      update: {
        lastSeen: new Date(),
        visits: { increment: 1 },
        ...(ua ? { userAgent: ua } : {}),
        ...(ip ? { ip } : {}),
      },
    })
    const isNew = row.visits === 1

    const unique = await prisma.visitor.count()
    const totalAgg = await prisma.visitor.aggregate({ _sum: { visits: true } })
    const total = totalAgg._sum.visits ?? unique

    res.json({ unique, total, isNew })
  } catch (e) {
    console.error('[visitors] track failed', e)
    res.status(503).json({ error: 'server_error' })
  }
})

/**
 * GET /api/visitors/stats
 * يرجع عدد الزوار الفريدين + عدد الزيارات الإجمالي (بدون تسجيل زيارة).
 */
router.get('/stats', async (_req, res) => {
  try {
    const unique = await prisma.visitor.count()
    const totalAgg = await prisma.visitor.aggregate({ _sum: { visits: true } })
    const total = totalAgg._sum.visits ?? unique
    res.json({ unique, total })
  } catch (e) {
    console.error('[visitors] stats failed', e)
    res.status(503).json({ error: 'server_error' })
  }
})

export default router
