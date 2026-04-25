import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requirePermission } from '../lib/auth.js'
import {
  getPublicVapidKey,
  isPushConfigured,
  sendPushToAll,
  type PushPayload,
} from '../lib/push.js'

const router = Router()

/** المفتاح العام مفتوح للمتصفح حتى يستطيع الاشتراك (بعد تسجيل الدخول كمشرف) */
router.get('/public-key', requireAdmin, (_req, res) => {
  res.json({ key: getPublicVapidKey(), configured: isPushConfigured() })
})

/** قائمة اشتراكات المتصفحات الحالية لهذا المشرف */
router.get('/subscriptions', requireAdmin, requirePermission('orders'), async (req, res) => {
  const email = (req as unknown as { adminEmail: string }).adminEmail
  try {
    const rows = await prisma.pushSubscription.findMany({
      where: { adminEmail: email },
      select: { id: true, endpoint: true, userAgent: true, createdAt: true, lastUsedAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(rows)
  } catch {
    res.status(503).json({ error: 'server_error' })
  }
})

/**
 * تسجيل اشتراك جديد للمتصفح الحالي.
 * إن وُجد endpoint نفسه نُحدّث المفاتيح ونعيد ربطه بنفس المشرف.
 */
router.post('/subscribe', requireAdmin, requirePermission('orders'), async (req, res) => {
  const email = (req as unknown as { adminEmail: string }).adminEmail
  const body = req.body as {
    endpoint?: string
    keys?: { p256dh?: string; auth?: string }
    userAgent?: string
  }
  const endpoint = body?.endpoint?.trim()
  const p256dh = body?.keys?.p256dh?.trim()
  const auth = body?.keys?.auth?.trim()
  if (!endpoint || !p256dh || !auth) {
    return res.status(400).json({ error: 'missing_subscription_fields' })
  }
  try {
    const row = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh,
        auth,
        adminEmail: email,
        userAgent: body.userAgent ? String(body.userAgent).slice(0, 255) : null,
      },
      update: {
        p256dh,
        auth,
        adminEmail: email,
        userAgent: body.userAgent ? String(body.userAgent).slice(0, 255) : null,
        lastUsedAt: new Date(),
      },
      select: { id: true, endpoint: true },
    })
    res.status(201).json(row)
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

/** حذف اشتراك بحسب الـ endpoint (يستخدمه المتصفح عند تعطيل الإشعارات) */
router.post('/unsubscribe', requireAdmin, requirePermission('orders'), async (req, res) => {
  const endpoint = (req.body as { endpoint?: string })?.endpoint?.trim()
  if (!endpoint) return res.status(400).json({ error: 'missing_endpoint' })
  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } })
    res.json({ ok: true })
  } catch {
    res.status(503).json({ error: 'server_error' })
  }
})

/** إرسال إشعار اختبار لكل الاشتراكات المسجّلة */
router.post('/test', requireAdmin, requirePermission('orders'), async (_req, res) => {
  if (!isPushConfigured()) {
    return res.status(503).json({ error: 'push_not_configured' })
  }
  const payload: PushPayload = {
    title: 'إشعار اختبار',
    body: 'هذا إشعار تجريبي من لوحة التحكم — الإشعارات تعمل ✅',
    url: '/admin',
    tag: 'test-notification',
  }
  const result = await sendPushToAll(payload)
  res.json({ ok: true, ...result })
})

export default router
