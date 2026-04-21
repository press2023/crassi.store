/** توقيت العراق (بغداد، UTC+3 بدون DST) */
const TZ_BAGHDAD = 'Asia/Baghdad'

function baghdadCalendarParts(iso: string | Date): {
  day: string
  month: string
  year: string
  hour: string
  minute: string
} {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ_BAGHDAD,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(d)
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00'
  return {
    day: pick('day'),
    month: pick('month'),
    year: pick('year'),
    hour: pick('hour'),
    minute: pick('minute'),
  }
}

/** أرقام غربية 0–9 بغض النظر عن لغة الواجهة */
export function formatNumberEn(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString('en-US', options)
}

/** تاريخ ميلادي بأرقام فقط DD/MM/YYYY حسب تقويم بغداد */
export function formatDateNumeric(iso: string | Date): string {
  const p = baghdadCalendarParts(iso)
  return `${p.day}/${p.month}/${p.year}`
}

/** وقت 24 ساعة HH:mm بتوقيت بغداد (أرقام غربية) */
export function formatTimeHm(iso: string | Date): string {
  const p = baghdadCalendarParts(iso)
  return `${p.hour}:${p.minute}`
}

/**
 * وقت الطلبات: 12 ساعة بصيغة عربية (ص/م) بأرقام إنجليزية 0–9، بتوقيت بغداد.
 * مثال: 6:33 م بدل 18:33
 */
export function formatTimeArabic12Baghdad(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return new Intl.DateTimeFormat('ar-IQ-u-nu-latn', {
    timeZone: TZ_BAGHDAD,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

/** للطلبات في التتبع: تاريخ رقمي + وقت عربي 12 ساعة (بغداد) */
export function formatOrderDateTime(iso: string | Date): string {
  return `${formatDateNumeric(iso)} · ${formatTimeArabic12Baghdad(iso)}`
}
