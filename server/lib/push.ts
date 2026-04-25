import webpush from 'web-push'
import { prisma } from './prisma.js'

/**
 * إعداد Web Push (VAPID).
 * يُتوقَّع وجود المتغيرات التالية في البيئة:
 *   VAPID_PUBLIC_KEY   — المفتاح العام (يبدأ بـ B... ، base64url)
 *   VAPID_PRIVATE_KEY  — المفتاح الخاص (سرّي)
 *   VAPID_SUBJECT      — mailto:owner@example.com أو رابط https://
 *
 * لتوليد المفاتيح مرة واحدة:
 *   npx web-push generate-vapid-keys
 */

const PUBLIC_KEY = (process.env.VAPID_PUBLIC_KEY || '').trim()
const PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY || '').trim()
const SUBJECT = (process.env.VAPID_SUBJECT || '').trim() || 'mailto:admin@victorianiraq.com'

let configured = false
if (PUBLIC_KEY && PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY)
    configured = true
  } catch (e) {
    console.error('[push] failed to configure VAPID:', e)
  }
} else {
  console.warn(
    '[push] VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY غير مضبوطة — إشعارات الطلبات لن تُرسَل.',
  )
}

export function isPushConfigured(): boolean {
  return configured
}

export function getPublicVapidKey(): string {
  return PUBLIC_KEY
}

export type PushPayload = {
  title: string
  body: string
  /** يُمرَّر إلى service worker لفتح هذا المسار عند النقر على الإشعار */
  url?: string
  /** علامة لتجميع الإشعارات وتجنّب التكرار */
  tag?: string
}

/**
 * إرسال إشعار لكل الاشتراكات المخزّنة.
 * يحذف تلقائياً الاشتراكات التي رجعت 404/410 (انتهت صلاحيتها).
 */
export async function sendPushToAll(payload: PushPayload): Promise<{
  sent: number
  removed: number
  failed: number
}> {
  if (!configured) return { sent: 0, removed: 0, failed: 0 }

  const subs = await prisma.pushSubscription.findMany()
  if (subs.length === 0) return { sent: 0, removed: 0, failed: 0 }

  const body = JSON.stringify(payload)
  let sent = 0
  let removed = 0
  let failed = 0

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          body,
          { TTL: 60 * 60 * 24 },
        )
        sent += 1
        await prisma.pushSubscription
          .update({ where: { id: s.id }, data: { lastUsedAt: new Date() } })
          .catch(() => undefined)
      } catch (e: unknown) {
        const status = (e as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          removed += 1
          await prisma.pushSubscription
            .delete({ where: { id: s.id } })
            .catch(() => undefined)
        } else {
          failed += 1
          console.error('[push] send failed:', status, (e as Error).message)
        }
      }
    }),
  )

  return { sent, removed, failed }
}
