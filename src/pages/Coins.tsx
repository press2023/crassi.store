import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  ChevronRight,
  Copy,
  Home,
  Phone,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import {
  fetchCoinAccount,
  fetchCoinsMeta,
  redeemCoins,
  type CoinAccount,
  type CoinRedeemResult,
  type CoinsMeta,
  type CoinTier,
} from '../api'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import { RoyalCoinIcon } from '../components/RoyalCoinIcon'
import { SEO } from '../components/SEO'
import { formatNumberEn } from '../lib/formatDigits'

const PHONE_KEY = 'classi-coins-phone'

function isValidPhoneInput(s: string): boolean {
  return s.replace(/\D+/g, '').length >= 8
}

function relativeTime(iso: string, isAr: boolean): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return isAr ? 'قبل لحظات' : 'moments ago'
  if (m < 60) return isAr ? `قبل ${m} دقيقة` : `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return isAr ? `قبل ${h} ساعة` : `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return isAr ? `قبل ${d} يوم` : `${d}d ago`
  return new Date(iso).toLocaleDateString(isAr ? 'ar-IQ' : 'en-US')
}

export function Coins() {
  const { isAr } = useLanguage()
  const { count: cartCount, applyDiscount } = useCart()
  const [phoneInput, setPhoneInput] = useState('')
  const [activePhone, setActivePhone] = useState<string | null>(null)
  const [meta, setMeta] = useState<CoinsMeta | null>(null)
  const [account, setAccount] = useState<CoinAccount | null>(null)
  const [loading, setLoading] = useState(false)
  const [redeeming, setRedeeming] = useState<number | null>(null)
  const [redeemResult, setRedeemResult] = useState<CoinRedeemResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // الميتا (المستويات) — تُحمَّل مرة واحدة
  useEffect(() => {
    fetchCoinsMeta().then(setMeta).catch(() => setMeta(null))
  }, [])

  // الهاتف المحفوظ
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PHONE_KEY)
      if (saved) {
        setPhoneInput(saved)
        setActivePhone(saved)
      }
    } catch { /* ignore */ }
  }, [])

  const reload = useCallback(async (phone: string) => {
    setLoading(true)
    setError(null)
    try {
      const acc = await fetchCoinAccount(phone)
      setAccount(acc)
    } catch (e) {
      console.error(e)
      setError(isAr ? 'تعذّر جلب الحساب' : 'Failed to fetch account')
      setAccount(null)
    } finally {
      setLoading(false)
    }
  }, [isAr])

  useEffect(() => {
    if (activePhone) void reload(activePhone)
  }, [activePhone, reload])

  const handleSubmitPhone = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = phoneInput.trim()
    if (!isValidPhoneInput(trimmed)) {
      setError(isAr ? 'رقم هاتف غير صالح' : 'Invalid phone number')
      return
    }
    try {
      localStorage.setItem(PHONE_KEY, trimmed)
    } catch { /* ignore */ }
    setActivePhone(trimmed)
    setRedeemResult(null)
  }

  const handleSignOut = () => {
    try {
      localStorage.removeItem(PHONE_KEY)
    } catch { /* ignore */ }
    setActivePhone(null)
    setAccount(null)
    setRedeemResult(null)
    setPhoneInput('')
  }

  const handleRedeem = async (tier: CoinTier) => {
    if (!activePhone) return
    setRedeeming(tier.percent)
    setError(null)
    setRedeemResult(null)
    try {
      const r = await redeemCoins(activePhone, tier.percent)
      setRedeemResult(r)
      await reload(activePhone)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown'
      if (msg === 'insufficient_balance') {
        setError(isAr ? 'رصيدك غير كافٍ لهذا المستوى' : 'Insufficient balance for this tier')
      } else if (msg === 'invalid_phone') {
        setError(isAr ? 'رقم هاتف غير صالح' : 'Invalid phone number')
      } else {
        setError(isAr ? 'فشل الاستبدال — حاول لاحقًا' : 'Redeem failed — try again later')
      }
    } finally {
      setRedeeming(null)
    }
  }

  const copyCode = async () => {
    if (!redeemResult) return
    try {
      await navigator.clipboard.writeText(redeemResult.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const applyToCart = async () => {
    if (!redeemResult) return
    try {
      await applyDiscount(redeemResult.code)
      setApplied(true)
      setTimeout(() => setApplied(false), 3000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'invalid'
      setError(
        msg === 'min_total'
          ? isAr ? 'مجموع السلة لا يبلغ الحد الأدنى لهذا الكود' : 'Cart subtotal is below the code minimum'
          : isAr ? 'تعذّر تطبيق الكود على السلة' : 'Could not apply the code to the cart',
      )
    }
  }

  const balance = account?.balance ?? 0

  const sortedTiers = useMemo(() => {
    return meta ? [...meta.tiers].sort((a, b) => a.percent - b.percent) : []
  }, [meta])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10" dir={isAr ? 'rtl' : 'ltr'}>
      <SEO
        title={isAr ? 'القطع الذهبية الملكية ومتجر الأكواد' : 'Royal Coins & Coupons Store'}
        description={
          isAr
            ? 'اكسب قطعًا ذهبية ملكية مع كل طلب توصيل، واستبدلها بأكواد خصم تصل إلى ٥٠٪.'
            : 'Earn royal gold coins on every delivered order and redeem them for discount codes up to 50% off.'
        }
        lang={isAr ? 'ar' : 'en'}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-victorian-500 dark:text-cream-300">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-burgundy-700 dark:hover:text-victorian-300">
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isAr ? 'الرئيسية' : 'Home'}</span>
        </Link>
        <ChevronRight className={`h-3.5 w-3.5 ${isAr ? 'rotate-180' : ''}`} />
        <span className="font-medium text-victorian-900 dark:text-cream-50">
          {isAr ? 'القطع الذهبية الملكية' : 'Royal Coins'}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-victorian-900 dark:text-cream-50 sm:text-4xl">
          {isAr ? 'القطع الذهبية الملكية' : 'Royal Gold Coins'}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-victorian-600 dark:text-cream-300">
          {isAr
            ? 'مع كل طلب يصلك، تربح قطعًا ذهبية ملكية. استبدلها متى شئت بكود خصم في متجر الأكواد.'
            : 'Earn royal gold coins on every delivered order, then redeem them for discount codes anytime.'}
        </p>
      </div>

      {/* لو ما عنده طلب سابق محفوظ */}
      {!activePhone && (
        <div className="mx-auto mb-8 max-w-lg rounded-3xl border border-amber-300/50 bg-gradient-to-br from-amber-50 via-cream-50 to-amber-50 p-8 text-center shadow-sm dark:border-amber-500/20 dark:from-amber-900/20 dark:via-victorian-950 dark:to-amber-950/20">
          <div className="mx-auto mb-4 flex justify-center">
            <RoyalCoinIcon size={160} className="animate-pulse" />
          </div>
          <h2 className="font-display text-xl font-bold text-victorian-900 dark:text-cream-50">
            {isAr ? 'لا توجد لديك قطع ذهبية بعد' : "You don't have any coins yet"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-victorian-600 dark:text-cream-300">
            {isAr
              ? 'مع كل طلب يصلك من المتجر، تُمنح قطعًا ذهبية ملكية تلقائيًا. كل ما عليك هو الطلب وانتظار وصوله — وستظهر قطعك هنا فور تأكيد التسليم.'
              : 'Every delivered order automatically earns you royal gold coins. Just place an order — your coins will appear here once it is delivered.'}
          </p>
          <Link
            to="/products"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-burgundy-700 px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.15em] text-cream-50 transition hover:bg-burgundy-800"
          >
            {isAr ? 'تسوّق الآن وابدأ بكسب القطع' : 'Shop now & start earning'}
          </Link>

          {/* خيار متقدم: استرجاع برقم الهاتف (لمن طلب من جهاز آخر) */}
          <details className="group mt-6 text-start">
            <summary className="cursor-pointer text-center text-xs font-semibold text-victorian-500 transition hover:text-burgundy-700 dark:text-victorian-400 dark:hover:text-victorian-200">
              {isAr ? 'طلبت من جهاز آخر؟ استعد قطعك بالهاتف' : 'Ordered from another device? Recover by phone'}
            </summary>
            <form onSubmit={handleSubmitPhone} className="mt-4">
              <div className="flex items-center gap-2 rounded-xl border border-victorian-300 bg-white px-3 py-2.5 dark:border-victorian-700 dark:bg-victorian-900">
                <Phone className="h-4 w-4 text-victorian-400" />
                <input
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="07XX XXX XXXX"
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-victorian-400 dark:text-cream-50"
                />
              </div>
              <button
                type="submit"
                className="mt-3 w-full rounded-xl bg-victorian-800 px-4 py-2.5 font-display text-xs font-bold uppercase tracking-[0.18em] text-cream-50 transition hover:bg-victorian-900 dark:bg-victorian-700 dark:hover:bg-victorian-600"
              >
                {isAr ? 'استعد رصيدي' : 'Recover my balance'}
              </button>
              {error && (
                <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                  {error}
                </p>
              )}
            </form>
          </details>
        </div>
      )}

      {/* الحساب */}
      {activePhone && (
        <>
          {/* بطاقة الرصيد */}
          <section className="relative mb-8 overflow-hidden rounded-3xl border border-amber-300/40 bg-gradient-to-br from-amber-100 via-cream-50 to-amber-50 p-6 shadow-[0_8px_30px_-12px_rgba(180,120,30,0.35)] dark:border-amber-500/20 dark:from-amber-900/30 dark:via-victorian-950/80 dark:to-amber-950/30">
            <div className="absolute -end-16 -top-16 opacity-25 dark:opacity-15">
              <RoyalCoinIcon size={320} />
            </div>
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-800 dark:text-amber-200">
                  {isAr ? 'رصيدك الملكي' : 'Royal Balance'}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <RoyalCoinIcon size={72} />
                  <span className="font-display text-5xl font-bold tabular-nums leading-none text-victorian-900 dark:text-cream-50">
                    {formatNumberEn(balance)}
                  </span>
                  <span className="font-display text-sm font-semibold uppercase tracking-widest text-amber-800 dark:text-amber-200">
                    {isAr ? 'قطعة' : 'coins'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-victorian-600 dark:text-cream-300" dir="ltr">
                  📱 {activePhone}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => activePhone && reload(activePhone)}
                  disabled={loading}
                  className="rounded-xl border border-victorian-300 bg-white/70 px-3 py-2 text-xs font-semibold text-victorian-700 transition hover:bg-white disabled:opacity-50 dark:border-victorian-700 dark:bg-victorian-900/50 dark:text-cream-200"
                  title={isAr ? 'تحديث' : 'Refresh'}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-xl border border-victorian-300 bg-white/70 px-3 py-2 text-xs font-semibold text-victorian-700 transition hover:bg-white dark:border-victorian-700 dark:bg-victorian-900/50 dark:text-cream-200"
                >
                  {isAr ? 'تبديل الرقم' : 'Change phone'}
                </button>
              </div>
            </div>

            {account && (
              <div className="relative mt-5 grid grid-cols-2 gap-3">
                {/* بطاقة الكسب */}
                <div className="overflow-hidden rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-4 py-4 shadow-sm dark:border-emerald-600/60 dark:bg-emerald-900/30">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                    <span className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-200">
                      {isAr ? 'إجمالي المكسوب' : 'Total earned'}
                    </span>
                  </div>
                  <p className="mt-2 font-display text-2xl font-bold tabular-nums text-emerald-900 dark:text-emerald-100 sm:text-3xl">
                    {formatNumberEn(account.totalEarned)}
                    <span className="ms-1 text-xs font-semibold text-emerald-700/80 dark:text-emerald-300/80">
                      {isAr ? 'قطعة' : 'coins'}
                    </span>
                  </p>
                </div>

                {/* بطاقة الاستبدال */}
                <div className="overflow-hidden rounded-2xl border-2 border-rose-300 bg-rose-50 px-4 py-4 shadow-sm dark:border-rose-600/60 dark:bg-rose-900/30">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm">
                      <TrendingDown className="h-4 w-4" />
                    </span>
                    <span className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-rose-800 dark:text-rose-200">
                      {isAr ? 'إجمالي المُستبدل' : 'Total spent'}
                    </span>
                  </div>
                  <p className="mt-2 font-display text-2xl font-bold tabular-nums text-rose-900 dark:text-rose-100 sm:text-3xl">
                    {formatNumberEn(account.totalSpent)}
                    <span className="ms-1 text-xs font-semibold text-rose-700/80 dark:text-rose-300/80">
                      {isAr ? 'قطعة' : 'coins'}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* نتيجة الاستبدال */}
          {redeemResult && (
            <section className="mb-6 rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-5 shadow-sm dark:border-emerald-600 dark:bg-emerald-900/20">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <Sparkles className="h-5 w-5" />
                <p className="font-display text-sm font-bold uppercase tracking-[0.18em]">
                  {isAr ? `تم استبدال ${redeemResult.percent}٪ — كودك جاهز` : `${redeemResult.percent}% redeemed — your code is ready`}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <code
                  className="select-all rounded-xl border-2 border-dashed border-emerald-400 bg-white px-4 py-2.5 font-mono text-xl font-bold tracking-widest text-emerald-900 dark:border-emerald-500 dark:bg-victorian-950 dark:text-emerald-200"
                  dir="ltr"
                >
                  {redeemResult.code}
                </code>
                <button
                  type="button"
                  onClick={copyCode}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الكود' : 'Copy code')}
                </button>
                {cartCount > 0 && (
                  <button
                    type="button"
                    onClick={applyToCart}
                    disabled={applied}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-burgundy-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-burgundy-800 disabled:opacity-60"
                  >
                    {applied ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {applied
                      ? isAr ? 'تم التطبيق على السلة' : 'Applied to cart'
                      : isAr ? 'طبّقه على سلتي الآن' : 'Apply to my cart'}
                  </button>
                )}
                <Link
                  to="/cart"
                  className="text-xs font-semibold text-emerald-700 underline underline-offset-4 hover:text-emerald-900 dark:text-emerald-300"
                >
                  {isAr ? 'افتح السلة ↗' : 'Open cart ↗'}
                </Link>
              </div>
              <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-300">
                {isAr
                  ? `صالح حتى ${new Date(redeemResult.expiresAt).toLocaleDateString('ar-IQ')} — استخدام واحد فقط — حد أقصى ${formatNumberEn(redeemResult.maxDiscountIQD)} د.ع.`
                  : `Valid until ${new Date(redeemResult.expiresAt).toLocaleDateString('en-US')} — single use — max ${formatNumberEn(redeemResult.maxDiscountIQD)} IQD off.`}
              </p>
              <p className="mt-1 text-[11px] text-victorian-500 dark:text-victorian-400">
                {isAr
                  ? '💡 الصق الكود في خانة «كود الخصم» داخل السلة، أو اضغط زر التطبيق المباشر.'
                  : '💡 Paste the code into the "Discount code" field in your cart, or use the apply button.'}
              </p>
            </section>
          )}

          {error && (
            <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
              {error}
            </p>
          )}

          {/* متجر الأكواد */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-victorian-900 dark:text-cream-50">
                {isAr ? 'متجر الأكواد' : 'Coupons Store'}
              </h2>
              {meta && (
                <span className="text-xs text-victorian-500 dark:text-victorian-400">
                  {isAr
                    ? `تكسب ١.٦٪ قطعة ذهبية من كل طلب يصلك`
                    : 'You earn 1.6% in coins on every delivered order'}
                </span>
              )}
            </div>

            {!meta && (
              <p className="text-center text-sm text-victorian-500">
                {isAr ? 'جاري تحميل المستويات…' : 'Loading tiers…'}
              </p>
            )}

            {meta && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sortedTiers.map((tier) => {
                  const canAfford = balance >= tier.price
                  const progress = Math.min(100, Math.round((balance / tier.price) * 100))
                  const isProcessing = redeeming === tier.percent
                  return (
                    <div
                      key={tier.percent}
                      className={`relative overflow-hidden rounded-2xl border-2 p-4 transition ${
                        canAfford
                          ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-cream-50 shadow-md dark:border-amber-500/50 dark:from-amber-900/20 dark:to-victorian-950'
                          : 'border-victorian-200 bg-cream-50/60 dark:border-victorian-800 dark:bg-victorian-900/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-burgundy-700 dark:text-victorian-300">
                            {isAr ? 'كوبون خصم' : 'Discount'}
                          </p>
                          <p className="mt-1 font-display text-4xl font-bold text-victorian-900 dark:text-cream-50">
                            {tier.percent}
                            <span className="text-2xl">٪</span>
                          </p>
                        </div>
                        <RoyalCoinIcon size={64} className={canAfford ? '' : 'opacity-50 grayscale'} />
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-victorian-700 dark:text-cream-200">
                        <RoyalCoinIcon size={22} />
                        <span className="tabular-nums">{formatNumberEn(tier.price)}</span>
                        <span className="text-xs text-victorian-500 dark:text-victorian-400">
                          {isAr ? 'قطعة' : 'coins'}
                        </span>
                      </div>

                      {/* شريط تقدّم */}
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-victorian-200/70 dark:bg-victorian-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            canAfford ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-victorian-400'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] tabular-nums text-victorian-500 dark:text-victorian-400">
                        {canAfford
                          ? isAr ? 'متاح للاستبدال الآن' : 'Ready to redeem'
                          : isAr
                            ? `ينقصك ${formatNumberEn(tier.price - balance)} قطعة`
                            : `${formatNumberEn(tier.price - balance)} coins to go`}
                      </p>

                      <button
                        type="button"
                        disabled={!canAfford || isProcessing}
                        onClick={() => handleRedeem(tier)}
                        className={`mt-3 w-full rounded-xl py-2.5 font-display text-xs font-bold uppercase tracking-[0.15em] transition disabled:cursor-not-allowed ${
                          canAfford
                            ? 'bg-burgundy-700 text-cream-50 hover:bg-burgundy-800 disabled:opacity-50'
                            : 'bg-victorian-200 text-victorian-500 dark:bg-victorian-800 dark:text-victorian-500'
                        }`}
                      >
                        {isProcessing
                          ? isAr ? '… جاري الاستبدال' : '… redeeming'
                          : canAfford
                            ? isAr ? 'استبدل الآن' : 'Redeem now'
                            : isAr ? 'مقفل' : 'Locked'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* السجل */}
          {account && account.transactions.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 font-display text-lg font-bold text-victorian-900 dark:text-cream-50">
                {isAr ? 'سجل العمليات' : 'History'}
              </h2>
              <ul className="divide-y divide-victorian-200 overflow-hidden rounded-2xl border border-victorian-200 bg-cream-50/60 dark:divide-victorian-800 dark:border-victorian-800 dark:bg-victorian-900/30">
                {account.transactions.map((tx) => {
                  const positive = tx.amount > 0
                  return (
                    <li key={tx.id} className="flex items-center gap-3 px-4 py-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          positive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                        }`}
                      >
                        {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-victorian-900 dark:text-cream-50">
                          {positive
                            ? isAr ? 'كسبت قطعًا ذهبية' : 'Earned coins'
                            : isAr ? `استبدال — كود ${tx.discountCode ?? ''}` : `Redeem — code ${tx.discountCode ?? ''}`}
                        </p>
                        <p className="text-xs text-victorian-500 dark:text-victorian-400">
                          {relativeTime(tx.createdAt, isAr)}
                        </p>
                      </div>
                      <span
                        className={`font-display text-base font-bold tabular-nums ${
                          positive ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {positive ? '+' : ''}
                        {formatNumberEn(tx.amount)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
