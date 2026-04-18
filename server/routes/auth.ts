import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { verifyPassword, createSession, getSession, requireAdmin, requireSuperAdmin, hashPassword } from '../lib/auth.js'

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
    res.json({ token, email: admin.email, isSuperAdmin: admin.isSuperAdmin, permissions: admin.permissions })
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

router.get('/me', requireAdmin, (req, res) => {
  const admin = (req as any).adminUser
  res.json({ email: admin.email, isSuperAdmin: admin.isSuperAdmin, permissions: admin.permissions })
})

// ── SuperAdmin CRUD for Admins ──

router.get('/admin-users', requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const users = await prisma.admin.findMany({
      select: { id: true, email: true, isSuperAdmin: true, permissions: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    })
    res.json(users)
  } catch (e) {
    res.status(503).json({ error: 'server_error' })
  }
})

router.post('/admin-users', requireAdmin, requireSuperAdmin, async (req, res) => {
  const b = req.body as { email?: string; password?: string; permissions?: string[] }
  if (!b.email?.trim() || !b.password?.trim()) return res.status(400).json({ error: 'missing_fields' })
  try {
    const row = await prisma.admin.create({
      data: {
        email: b.email.trim(),
        passwordHash: hashPassword(b.password.trim()),
        permissions: Array.isArray(b.permissions) ? b.permissions : [],
        isSuperAdmin: false
      },
      select: { id: true, email: true, isSuperAdmin: true, permissions: true, createdAt: true }
    })
    res.status(201).json(row)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') return res.status(409).json({ error: 'email_exists' })
    res.status(503).json({ error: 'server_error' })
  }
})

router.put('/admin-users/:id', requireAdmin, requireSuperAdmin, async (req, res) => {
  const b = req.body as { password?: string; permissions?: string[] }
  try {
    const data: any = {}
    if (b.password?.trim()) data.passwordHash = hashPassword(b.password.trim())
    if (Array.isArray(b.permissions)) data.permissions = b.permissions

    const row = await prisma.admin.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, isSuperAdmin: true, permissions: true, createdAt: true }
    })
    res.json(row)
  } catch (e) {
    res.status(404).json({ error: 'not_found' })
  }
})

router.delete('/admin-users/:id', requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const row = await prisma.admin.findUnique({ where: { id: req.params.id } })
    if (row?.isSuperAdmin) return res.status(403).json({ error: 'cannot_delete_superadmin' })
    
    await prisma.admin.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) {
    res.status(404).json({ error: 'not_found' })
  }
})

export default router
