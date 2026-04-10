import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { verifyPassword, createSession, getSession } from '../lib/auth.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) return res.status(400).json({ error: 'missing_fields' })

  try {
    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      return res.status(401).json({ error: 'invalid_credentials' })
    }
    const token = createSession(admin.email)
    res.json({ token, email: admin.email })
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

router.get('/me', (req, res) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' })
  const email = getSession(header.slice(7))
  if (!email) return res.status(401).json({ error: 'session_expired' })
  res.json({ email })
})

export default router
