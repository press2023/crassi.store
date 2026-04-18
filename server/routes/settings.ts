import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

/** GET /api/settings — قراءة عامة لكل الإعدادات */
router.get('/', async (_req, res) => {
  try {
    const rows = await prisma.setting.findMany()
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value
    res.json(map)
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

export default router
