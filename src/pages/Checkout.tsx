import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { createOrder } from '../api'
import { SEO } from '../components/SEO'
import { OrderInvoice, type InvoiceOrder } from '../components/OrderInvoice'
import { VictorianQR } from '../components/VictorianQR'
import { TurnstileWidget } from '../components/TurnstileWidget'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { saveOrderId } from './TrackOrder'

const base = import.meta.env.VITE_API_BASE ?? ''
const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '') as string

const IRAQ_PROVINCES = [
  { en: 'Baghdad', ar: 'بغداد' },
  { en: 'Basra', ar: 'البصرة' },
  { en: 'Nineveh', ar: 'نينوى' },
  { en: 'Erbil', ar: 'أربيل' },
  { en: 'Sulaymaniyah', ar: 'السليمانية' },
  { en: 'Duhok', ar: 'دهوك' },
  { en: 'Kirkuk', ar: 'كركوك' },
  { en: 'Diyala', ar: 'ديالى' },
  { en: 'Anbar', ar: 'الأنبار' },
  { en: 'Babel', ar: 'بابل' },
  { en: 'Karbala', ar: 'كربلاء' },
  { en: 'Najaf', ar: 'النجف' },
  { en: 'Wasit', ar: 'واسط' },
  { en: 'Maysan', ar: 'ميسان' },
  { en: 'Dhi Qar', ar: 'ذي قار' },
  { en: 'Muthanna', ar: 'المثنى' },
  { en: 'Qadisiyyah', ar: 'القادسية' },
  { en: 'Saladin', ar: 'صلاح الدين' },
]

const inputClass =
  'mt-1 w-full rounded-full border border-slate-200 px-5 py-3 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white'

export function Checkout() {
  const { t, isAr } = useLanguage()
  const { items, clear, discount } = useCart()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [doneId, setDoneId] = useState<string | null>(null)
  const [doneOrder, setDoneOrder] = useState<InvoiceOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState(false)

  // عند الانتهاء من الطلب نجلب تفاصيله الكاملة لطباعة الفاتورة
  useEffect(() => {
    if (!doneId) return
    fetch(`${base}/api/orders/${encodeURIComponent(doneId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setDoneOrder(d as InvoiceOrder) })
      .catch(() => { /* ignore */ })
  }, [doneId])

  if (!items.length && !doneId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <SEO title={t('checkout')} lang={isAr ? 'ar' : 'en'} noindex />
        <p className="text-slate-500">{t('emptyCart')}</p>
        <Link to="/products" className="mt-4 inline-block text-sm underline underline-offset-4">
          {t('navShop')}
        </Link>
      </div>
    )
  }

  if (doneId) {
    const trackUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/order/${doneId}`
    return (
      <>
        <div className="mx-auto max-w-lg px-4 py-12 text-center print-hide">
          <SEO title={t('orderThanks')} lang={isAr ? 'ar' : 'en'} noindex />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('orderThanks')}</h1>
          <p className="mt-4 text-slate-500">
            {t('orderId')}: <span className="font-mono font-bold text-slate-900 dark:text-white">{doneId}</span>
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {isAr ? 'احفظ رقم الطلب لتتبع حالته' : 'Save this ID to track your order'}
          </p>

          {/* بطاقة QR فيكتوريّة لتتبع الطلب */}
          <div className="mx-auto mt-8 flex max-w-sm flex-col items-center gap-4 border-2 border-victorian-300 bg-cream-50 p-6 dark:border-victorian-700 dark:bg-victorian-950/40">
            <p className="font-display text-[11px] uppercase tracking-[0.25em] text-victorian-600 dark:text-victorian-300">
              {isAr ? '◆ تتبع الطلب ◆' : '◆ Track Order ◆'}
            </p>
            <VictorianQR value={trackUrl} size={170} />
            <p className="text-center text-xs text-victorian-700 dark:text-cream-300">
              {isAr ? 'امسح الرمز لمتابعة طلبك' : 'Scan the code to track your order'}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to={`/track?id=${doneId}`}
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-900"
            >
              {isAr ? 'تتبع الطلب' : 'Track order'}
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!doneOrder}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" />
              {isAr ? 'طباعة الفاتورة' : 'Print invoice'}
            </button>
            <Link
              to="/"
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400"
            >
              {t('home')}
            </Link>
          </div>
        </div>
        {doneOrder ? <OrderInvoice order={doneOrder} isAr={isAr} /> : null}
      </>
    )
  }

  const validatePhone = (v: string) => {
    const digits = v.replace(/\D/g, '')
    if (!digits) return isAr ? 'رقم الهاتف مطلوب' : 'Phone number is required'
    if (!digits.startsWith('07')) return isAr ? 'يجب أن يبدأ بـ 07' : 'Must start with 07'
    if (digits.length !== 11) return isAr ? `يجب أن يكون 11 رقم (حالي: ${digits.length})` : `Must be 11 digits (current: ${digits.length})`
    return null
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pErr = validatePhone(phone)
    setPhoneError(pErr)
    if (pErr) return
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError(isAr ? 'يرجى إكمال التحقق من الحماية أولاً' : 'Please complete the security check first')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const { id } = await createOrder({
        customerName: name,
        email: '',
        phone,
        province,
        city,
        address,
        landmark,
        notes: notes || undefined,
        discountCode: discount?.code ?? undefined,
        turnstileToken: captchaToken ?? undefined,
        items: items.map((x) => ({
          productId: x.productId,
          quantity: x.quantity,
          size: x.size,
          unitPrice: x.price,
          productName: isAr ? x.nameAr : x.name,
        })),
      })
      saveOrderId(id)
      setDoneId(id)
      clear()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('discount_')) {
        setError(isAr ? 'كود الخصم لم يعد ساريًا. أزله من السلة وحاول مرة أخرى.' : 'Discount code is no longer valid. Remove it from the cart and retry.')
      } else if (msg.includes('captcha_') || msg.includes('turnstile')) {
        setError(isAr ? 'فشل التحقق من الحماية. حدّث الصفحة وحاول مرة أخرى.' : 'Security check failed. Refresh and try again.')
        setCaptchaToken(null)
      } else {
        setError(isAr ? 'تعذر إرسال الطلب. تحقق من الخادم.' : 'Could not place order.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <SEO title={t('checkout')} lang={isAr ? 'ar' : 'en'} noindex />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('checkout')}</h1>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {isAr ? 'الاسم الكامل' : 'Full name'}
          </span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {isAr ? 'رقم الهاتف' : 'Phone number'}
          </span>
          <input
            required
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => {
              const v = e.target.value
              setPhone(v)
              setPhoneError(validatePhone(v))
            }}
            placeholder="07xx xxx xxxx"
            maxLength={11}
            className={inputClass + (phoneError ? ' !border-rose-400 dark:!border-rose-500' : phone && !phoneError ? ' !border-green-400 dark:!border-green-500' : '')}
          />
          {phoneError && <p className="mt-1 text-xs text-rose-500">{phoneError}</p>}
          {phone && !phoneError && <p className="mt-1 text-xs text-green-600">{isAr ? 'رقم صحيح ✓' : 'Valid number ✓'}</p>}
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {isAr ? 'المحافظة' : 'Province'}
          </span>
          <select
            required
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className={inputClass + ' appearance-none'}
          >
            <option value="">{isAr ? 'اختر المحافظة' : 'Select province'}</option>
            {IRAQ_PROVINCES.map((p) => (
              <option key={p.en} value={p.en}>
                {isAr ? p.ar : p.en}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {isAr ? 'المنطقة / الحي' : 'District / Area'}
          </span>
          <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {isAr ? 'العنوان التفصيلي' : 'Detailed address'}
          </span>
          <input required value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {isAr ? 'أقرب نقطة دالة' : 'Nearest landmark'}
          </span>
          <input value={landmark} onChange={(e) => setLandmark(e.target.value)} className={inputClass} />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {isAr ? 'ملاحظات' : 'Notes'}
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={inputClass + ' rounded-2xl'}
          />
        </label>

        {/* Cloudflare Turnstile — يُعرض فقط إذا تم ضبط مفتاح الموقع */}
        {TURNSTILE_SITE_KEY ? (
          <div className="mt-2">
            <TurnstileWidget
              siteKey={TURNSTILE_SITE_KEY}
              language={isAr ? 'ar' : 'en'}
              onVerify={(token) => {
                setCaptchaToken(token)
                setCaptchaError(false)
              }}
              onExpire={() => setCaptchaToken(null)}
              onError={() => {
                setCaptchaToken(null)
                setCaptchaError(true)
              }}
            />
            {captchaError && (
              <p className="mt-2 text-xs text-rose-500">
                {isAr ? 'فشل تحميل التحقق. تحقق من الإنترنت.' : 'Security widget failed to load. Check your connection.'}
              </p>
            )}
          </div>
        ) : null}

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || (!!TURNSTILE_SITE_KEY && !captchaToken)}
          className="mt-2 rounded-full bg-slate-900 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:opacity-40 dark:bg-white dark:text-slate-900"
        >
          {loading ? '…' : t('placeOrder')}
        </button>
      </form>
    </div>
  )
}
