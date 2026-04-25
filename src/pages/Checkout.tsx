import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createOrder } from '../api'
import { SEO } from '../components/SEO'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { saveOrderId } from './TrackOrder'

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
  const { items, clear } = useCart()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [doneId, setDoneId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

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
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <SEO title={t('orderThanks')} lang={isAr ? 'ar' : 'en'} noindex />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('orderThanks')}</h1>
        <p className="mt-4 text-slate-500">
          {t('orderId')}: <span className="font-mono font-bold text-slate-900 dark:text-white">{doneId}</span>
        </p>
        <p className="mt-2 text-xs text-slate-400">
          {isAr ? 'احفظ رقم الطلب لتتبع حالته' : 'Save this ID to track your order'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to={`/track?id=${doneId}`}
            className="rounded-full bg-slate-900 px-8 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-900"
          >
            {isAr ? 'تتبع الطلب' : 'Track order'}
          </Link>
          <Link
            to="/"
            className="rounded-full border border-slate-200 px-8 py-3 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400"
          >
            {t('home')}
          </Link>
        </div>
      </div>
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
    } catch {
      setError(isAr ? 'تعذر إرسال الطلب. تحقق من الخادم.' : 'Could not place order.')
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

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-slate-900 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:opacity-40 dark:bg-white dark:text-slate-900"
        >
          {loading ? '…' : t('placeOrder')}
        </button>
      </form>
    </div>
  )
}
