import { scryptSync, randomBytes, randomUUID } from 'crypto'
import type { Request, Response, NextFunction } from 'express'
import { prisma } from './prisma.js'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const check = scryptSync(password, salt, 64).toString('hex')
  return hash === check
}

const sessions = new Map<string, { email: string; expiresAt: number }>()

export function createSession(email: string): string {
  const token = randomUUID()
  sessions.set(token, { email, expiresAt: Date.now() + 24 * 60 * 60 * 1000 })
  return token
}

export function getSession(token: string): string | null {
  const s = sessions.get(token)
  if (!s) return null
  if (Date.now() > s.expiresAt) {
    sessions.delete(token)
    return null
  }
  return s.email
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  const email = getSession(header.slice(7))
  if (!email) return res.status(401).json({ error: 'session_expired' })

  try {
    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin) return res.status(401).json({ error: 'invalid_admin' })

    // Attach full admin info
    ;(req as any).adminEmail = admin.email
    ;(req as any).adminUser = admin
    next()
  } catch (e) {
    res.status(503).json({ error: 'auth_db_error' })
  }
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const admin = (req as any).adminUser
  if (!admin || !admin.isSuperAdmin) {
    return res.status(403).json({ error: 'forbidden_superadmin_only' })
  }
  next()
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).adminUser
    if (!admin) return res.status(401).json({ error: 'unauthorized' })
    
    // SuperAdmin has all permissions
    if (admin.isSuperAdmin) return next()
    
    // Check specific permission
    if (admin.permissions && admin.permissions.includes(permission)) {
      return next()
    }
    
    res.status(403).json({ error: 'forbidden_missing_permission' })
  }
}
