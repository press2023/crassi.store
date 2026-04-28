import { Router } from 'express'

const router = Router()

/**
 * POST /api/security/verify
 * يتحقق من Cloudflare Turnstile token عند دخول الموقع لأول مرة.
 * في حال نجاح التحقق يُرجِع مدة صلاحية يبني عليها العميل بقاء الحماية.
 *
 * إذا لم تُضبط TURNSTILE_SECRET_KEY في البيئة (تطوير محلي) يُرجَع ok=true
 * مباشرة دون اتصال بـ Cloudflare.
 */
router.post('/verify', async (req, res) => {
  const body = req.body as { token?: string }
  const token = String(body.token ?? '').trim()
  const secret = process.env.TURNSTILE_SECRET_KEY

  // مدة صلاحية البوابة على المتصفح — 12 ساعة
  const ttlMs = 12 * 60 * 60 * 1000

  if (!secret) {
    // التطوير المحلي: مرّر الزائر بدون تحقق
    return res.json({ ok: true, expiresAt: Date.now() + ttlMs, mode: 'dev' })
  }

  if (!token) return res.status(400).json({ error: 'token_missing' })

  try {
    const ip = String(
      req.headers['cf-connecting-ip'] ||
        req.headers['x-forwarded-for'] ||
        req.ip ||
        '',
    )
      .split(',')[0]
      .trim()

    const verifyRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret,
          response: token,
          ...(ip ? { remoteip: ip } : {}),
        }).toString(),
      },
    )
    const verify = (await verifyRes.json()) as {
      success?: boolean
      hostname?: string
      'error-codes'?: string[]
    }
    if (!verify.success) {
      console.warn('[security/verify] failed:', verify['error-codes'])
      return res.status(400).json({ error: 'verification_failed' })
    }
    res.json({ ok: true, expiresAt: Date.now() + ttlMs })
  } catch (e) {
    console.error('[security/verify] request error:', e)
    res.status(503).json({ error: 'verification_unavailable' })
  }
})

export default router
