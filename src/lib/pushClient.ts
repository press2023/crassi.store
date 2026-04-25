const base = import.meta.env.VITE_API_BASE ?? ''

/** هل المتصفح يدعم Web Push (SW + PushManager + Notification) */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** Base64URL → Uint8Array كما تتطلبه applicationServerKey */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const b64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i)
  return out
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  let reg = await navigator.serviceWorker.getRegistration()
  if (!reg) {
    const swBase = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
    reg = await navigator.serviceWorker.register(`${swBase}sw.js`, { scope: swBase })
  }
  await navigator.serviceWorker.ready
  return reg
}

function authHeaders(token: string): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

/** هل يوجد اشتراك مفعَّل حالياً على هذا الجهاز */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) return null
    return await reg.pushManager.getSubscription()
  } catch {
    return null
  }
}

/** تفعيل الإشعارات: يطلب الإذن، يشترك، ثم يحفظ الاشتراك في السيرفر */
export async function enablePush(token: string): Promise<PushSubscription> {
  if (!isPushSupported()) throw new Error('push_not_supported')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('permission_denied')

  const keyRes = await fetch(`${base}/api/admin/push/public-key`, {
    headers: authHeaders(token),
  })
  if (!keyRes.ok) throw new Error('public_key_failed')
  const { key, configured } = (await keyRes.json()) as { key: string; configured: boolean }
  if (!configured || !key) throw new Error('push_not_configured')

  const reg = await getRegistration()
  const existing = await reg.pushManager.getSubscription()
  if (existing) {
    await existing.unsubscribe().catch(() => undefined)
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  })

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
  const res = await fetch(`${base}/api/admin/push/subscribe`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      userAgent: navigator.userAgent,
    }),
  })
  if (!res.ok) {
    await sub.unsubscribe().catch(() => undefined)
    throw new Error('subscribe_failed')
  }
  return sub
}

/** تعطيل الإشعارات على هذا الجهاز وحذف الاشتراك من السيرفر */
export async function disablePush(token: string): Promise<void> {
  const sub = await getCurrentSubscription()
  if (!sub) return
  const endpoint = sub.endpoint
  await sub.unsubscribe().catch(() => undefined)
  await fetch(`${base}/api/admin/push/unsubscribe`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ endpoint }),
  }).catch(() => undefined)
}

/** إرسال إشعار اختبار من السيرفر لكل الاشتراكات المسجَّلة */
export async function sendTestPush(
  token: string,
): Promise<{ sent: number; removed: number; failed: number }> {
  const res = await fetch(`${base}/api/admin/push/test`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error || 'test_failed')
  }
  return (await res.json()) as { sent: number; removed: number; failed: number }
}
