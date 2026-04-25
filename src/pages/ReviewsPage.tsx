import { useCallback, useEffect, useMemo, useState } from 'react'
import { MessageCircle, Send, Star } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { createReview, deleteMyReview, fetchReviews } from '../api'
import type { Review, ReviewCreated, ReviewsResponse } from '../api'
import { ReviewCard, StarsDisplay, StarsInput } from '../components/ReviewsShared'
import { ReviewsFormShimmer, ReviewsListShimmer, ReviewsRatingsShimmer } from '../components/Shimmer'
import { SEO } from '../components/SEO'
import { breadcrumbLD, buildCanonical, SITE_NAME } from '../lib/seo'

const NAME_STORAGE_KEY = 'classi-review-name'
const MY_REVIEW_ID_KEY = 'classi-my-review-id'
const MY_REVIEW_TOKEN_KEY = 'classi-my-review-delete-token'
const LEGACY_DONE_KEY = 'classi-review-done'

function readStorageKeys(): { id: string | null; token: string | null } {
  if (typeof localStorage === 'undefined') return { id: null, token: null }
  const id = localStorage.getItem(MY_REVIEW_ID_KEY)
  let token = localStorage.getItem(MY_REVIEW_TOKEN_KEY)
  if (token === 'undefined' || token === 'null' || !token?.trim()) {
    token = null
    localStorage.removeItem(MY_REVIEW_TOKEN_KEY)
  }
  return { id, token }
}

function clearMyReviewKeys() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(MY_REVIEW_ID_KEY)
  localStorage.removeItem(MY_REVIEW_TOKEN_KEY)
  localStorage.removeItem(LEGACY_DONE_KEY)
}

function readDeleteTokenFromStorage(): string | null {
  const { token } = readStorageKeys()
  return token
}

function RatingsSection({
  data,
  loading,
}: {
  data: ReviewsResponse
  loading: boolean
}) {
  const { t, isAr } = useLanguage()

  const distribution = useMemo(() => {
    const d = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    for (const r of data.reviews) {
      const k = Math.min(5, Math.max(1, Math.round(r.rating))) as keyof typeof d
      d[k] += 1
    }
    return d
  }, [data.reviews])

  const maxBar = useMemo(() => Math.max(...Object.values(distribution), 1), [distribution])

  if (loading) {
    return (
      <div role="status" aria-busy="true" aria-live="polite">
        <span className="sr-only">
          {isAr ? 'جارِ تحميل ملخص التقييمات…' : 'Loading ratings summary…'}
        </span>
        <ReviewsRatingsShimmer />
      </div>
    )
  }

  if (data.count === 0) {
    return (
      <div className="mb-12 rounded-2xl border border-dashed border-victorian-300 bg-cream-50/50 py-10 text-center dark:border-victorian-700 dark:bg-victorian-950/40">
        <Star className="mx-auto h-10 w-10 text-victorian-300" />
        <p className="mt-3 text-sm text-victorian-500">{t('ratingsEmpty')}</p>
      </div>
    )
  }

  return (
    <section className="mb-12">
      <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-victorian-500">
        {t('ratingsBreakdown')}
      </p>
      <div className="flex flex-col items-center rounded-2xl border border-victorian-200 bg-cream-50/90 p-6 dark:border-victorian-800 dark:bg-victorian-950/60 sm:p-8">
        <StarsDisplay rating={data.average} size="lg" />
        <p className="mt-3 font-display text-3xl font-bold text-victorian-900 dark:text-cream-50 sm:text-4xl">
          {data.average.toFixed(1)}
          <span className="ms-1 text-base font-normal text-victorian-500 sm:text-lg">/5</span>
        </p>
        <p className="mt-1 text-sm text-victorian-500">
          {isAr ? `بناءً على ${data.count} تقييم` : `Based on ${data.count} ratings`}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {([5, 4, 3, 2, 1] as const).map((stars) => {
          const n = distribution[stars]
          const pct = Math.round((n / maxBar) * 100)
          return (
            <div key={stars} className="flex items-center gap-3">
              <span className="w-8 shrink-0 text-sm font-semibold tabular-nums text-victorian-700 dark:text-cream-200">
                {stars}★
              </span>
              <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-victorian-100 dark:bg-victorian-900">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-amber-500 to-amber-400 transition-all dark:from-amber-600 dark:to-amber-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-end text-xs tabular-nums text-victorian-500">
                {n}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function ReviewsPage() {
  const { t, isAr } = useLanguage()
  const [data, setData] = useState<ReviewsResponse>({ reviews: [], count: 0, average: 0 })
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(8)

  const [myReviewId, setMyReviewId] = useState<string | null>(() => readStorageKeys().id)
  const [myDeleteToken, setMyDeleteToken] = useState<string | null>(() => readStorageKeys().token)
  const [legacyDoneOnly, setLegacyDoneOnly] = useState(() => {
    if (typeof localStorage === 'undefined') return false
    return (
      localStorage.getItem(LEGACY_DONE_KEY) === '1' &&
      !localStorage.getItem(MY_REVIEW_ID_KEY)
    )
  })

  const myReviewInList = useMemo(
    () => (myReviewId ? data.reviews.some((r) => r.id === myReviewId) : false),
    [myReviewId, data.reviews],
  )

  const alreadySubmitted =
    (Boolean(myReviewId) && myReviewInList) || (legacyDoneOnly && !myReviewId)

  const [name, setName] = useState<string>(() => {
    if (typeof localStorage === 'undefined') return ''
    return localStorage.getItem(NAME_STORAGE_KEY) ?? ''
  })
  const [rating, setRating] = useState<number>(0)
  const [comment, setComment] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetchReviews()
    setData(r)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  /** بعد جلب القائمة: اقرأ التخزين من جديد، وتأكد أن التعليق ما زال موجودًا. */
  useEffect(() => {
    if (loading) return
    const { id, token } = readStorageKeys()
    const legacy =
      typeof localStorage !== 'undefined' &&
      localStorage.getItem(LEGACY_DONE_KEY) === '1' &&
      !localStorage.getItem(MY_REVIEW_ID_KEY)

    setLegacyDoneOnly(Boolean(legacy))

    if (!id) {
      setMyReviewId(null)
      setMyDeleteToken(null)
      return
    }

    const exists = data.reviews.some((r) => r.id === id)
    if (!exists) {
      clearMyReviewKeys()
      setMyReviewId(null)
      setMyDeleteToken(null)
      return
    }

    setMyReviewId(id)
    setMyDeleteToken(token)
  }, [loading, data.reviews])

  const canSubmit =
    !alreadySubmitted && name.trim().length > 0 && comment.trim().length > 0 && rating >= 1

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setMessage(null)
    try {
      const created = await createReview({
        name: name.trim(),
        rating,
        comment: comment.trim(),
      })
      if (!created?.id || !created?.deleteToken?.trim()) {
        setMessage({
          kind: 'err',
          text: isAr
            ? 'استجابة الخادم ناقصة — أعد المحاولة أو حدّث الصفحة.'
            : 'Server response incomplete — retry or refresh.',
        })
        return
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(NAME_STORAGE_KEY, name.trim())
        localStorage.setItem(MY_REVIEW_ID_KEY, created.id)
        localStorage.setItem(MY_REVIEW_TOKEN_KEY, created.deleteToken)
        localStorage.setItem(LEGACY_DONE_KEY, '1')
      }
      setLegacyDoneOnly(false)
      setMyReviewId(created.id)
      setMyDeleteToken(created.deleteToken)
      setData((prev) => {
        const { deleteToken: _t, ...pub } = created as ReviewCreated
        void _t
        const reviews = [pub as Review, ...prev.reviews.filter((x) => x.id !== pub.id)]
        const count = reviews.length
        const average =
          Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
        return { reviews, count, average }
      })
      setComment('')
      setRating(0)
      setMessage({
        kind: 'ok',
        text: isAr ? 'شكرًا! تم نشر رأيك.' : 'Thanks! Your review is posted.',
      })
    } catch {
      setMessage({
        kind: 'err',
        text: isAr ? 'تعذر إرسال الرأي، حاول مجددًا.' : 'Could not submit review, try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteMine = async (reviewId: string) => {
    const token = readDeleteTokenFromStorage() ?? myDeleteToken
    if (!token?.trim()) {
      setMessage({
        kind: 'err',
        text: isAr
          ? 'لا يوجد رمز حذف محفوظ في هذا المتصفح (قد يكون التعليق قديمًا قبل التحديث).'
          : 'No delete key in this browser (older review).',
      })
      return
    }
    if (!confirm(isAr ? 'حذف تعليقك نهائيًا؟' : 'Delete your comment permanently?')) return
    setDeletingId(reviewId)
    setMessage(null)
    try {
      await deleteMyReview(reviewId, token)
      clearMyReviewKeys()
      setMyReviewId(null)
      setMyDeleteToken(null)
      setLegacyDoneOnly(false)
      await load()
      setMessage({
        kind: 'ok',
        text: isAr ? 'تم حذف تعليقك. يمكنك إضافة رأي جديد إن أردت.' : 'Your comment was removed. You can post again.',
      })
    } catch {
      setMessage({
        kind: 'err',
        text: isAr ? 'تعذر الحذف — تأكد من الاتصال أو أعد تحميل الصفحة.' : 'Could not delete — check connection or refresh.',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const visible = useMemo(() => data.reviews.slice(0, visibleCount), [data.reviews, visibleCount])
  const hasMore = visibleCount < data.reviews.length

  const effectiveDeleteToken =
    myDeleteToken?.trim() || readDeleteTokenFromStorage()?.trim() || ''
  const showDeleteOnMyCard = Boolean(
    myReviewId && myReviewInList && effectiveDeleteToken.length > 0,
  )

  const reviewsUrl = buildCanonical('/reviews')
  const reviewsLD = useMemo(() => {
    const blocks: Record<string, unknown>[] = [
      breadcrumbLD([
        { name: isAr ? 'الرئيسية' : 'Home', url: buildCanonical('/') },
        { name: isAr ? 'الآراء' : 'Reviews', url: reviewsUrl },
      ]),
    ]
    if (data.count > 0 && data.average > 0) {
      blocks.push({
        '@context': 'https://schema.org',
        '@type': 'AggregateRating',
        itemReviewed: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: buildCanonical('/'),
        },
        ratingValue: data.average.toFixed(1),
        reviewCount: data.count,
        bestRating: 5,
        worstRating: 1,
      })
    }
    return blocks
  }, [isAr, reviewsUrl, data.count, data.average])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <SEO
        title={isAr ? 'آراء العملاء' : 'Customer Reviews'}
        description={
          isAr
            ? 'اقرأ آراء وتقييمات عملاء متجر فيكتوريان وشاركنا رأيك.'
            : 'Read customer reviews of Victorian Store and share your own.'
        }
        lang={isAr ? 'ar' : 'en'}
        jsonLd={reviewsLD}
      />
      <div className="mb-8 text-center">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.35em] text-burgundy-700 dark:text-victorian-300">
          {t('reviewsPageKicker')}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-victorian-900 dark:text-cream-50 sm:text-3xl">
          {t('reviewsCombinedTitle')}
        </h1>
        <p className="mt-2 text-sm text-victorian-600 dark:text-cream-300">
          {t('reviewsCombinedSubtitle')}
        </p>
      </div>

      <RatingsSection data={data} loading={loading} />

      {loading ? (
        <div role="status" aria-busy="true" aria-live="polite" className="mb-10">
          <span className="sr-only">
            {isAr ? 'جارِ تحميل نموذج الآراء…' : 'Loading review form…'}
          </span>
          <ReviewsFormShimmer />
        </div>
      ) : alreadySubmitted ? null : (
        <form
          onSubmit={onSubmit}
          className="mb-10 rounded-2xl border border-victorian-200 bg-cream-50/80 p-5 shadow-sm dark:border-victorian-800 dark:bg-victorian-950/60 sm:p-6"
        >
          <h2 className="mb-1 font-display text-lg font-bold text-victorian-900 dark:text-cream-50">
            {t('reviewsFormTitle')}
          </h2>
          <p className="mb-4 text-xs text-victorian-500">{t('reviewsFormHint')}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-victorian-500">
                {isAr ? 'اسمك' : 'Your name'}
              </span>
              <input
                type="text"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isAr ? 'مثال: أحمد' : 'e.g. Ahmed'}
                className="w-full rounded-xl border border-victorian-300 bg-cream-50 px-4 py-2.5 text-sm text-victorian-900 outline-none transition focus:border-burgundy-600 dark:border-victorian-700 dark:bg-victorian-950 dark:text-cream-100 dark:focus:border-victorian-300"
              />
            </label>

            <div className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-victorian-500">
                {isAr ? 'تقييمك' : 'Your rating'}
              </span>
              <StarsInput value={rating} onChange={setRating} isAr={isAr} />
            </div>
          </div>

          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-victorian-500">
              {isAr ? 'تعليقك' : 'Your comment'}
            </span>
            <textarea
              required
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isAr ? 'اكتب تجربتك مع المتجر…' : 'Tell us about your experience…'
              }
              className="w-full resize-none rounded-xl border border-victorian-300 bg-cream-50 px-4 py-3 text-sm text-victorian-900 outline-none transition focus:border-burgundy-600 dark:border-victorian-700 dark:bg-victorian-950 dark:text-cream-100 dark:focus:border-victorian-300"
            />
            <div className="mt-1 text-end text-[11px] text-victorian-400">{comment.length}/1000</div>
          </label>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {message ? (
              <p
                className={`text-sm ${
                  message.kind === 'ok'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-burgundy-700 dark:text-burgundy-300'
                }`}
              >
                {message.text}
              </p>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-burgundy-700 bg-burgundy-700 px-6 py-2.5 font-display text-sm font-semibold uppercase tracking-[0.15em] text-cream-50 transition hover:bg-burgundy-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              {submitting
                ? isAr
                  ? 'جارِ الإرسال…'
                  : 'Sending…'
                : isAr
                  ? 'نشر الرأي'
                  : 'Post review'}
            </button>
          </div>
        </form>
      )}

      {!loading && alreadySubmitted && message?.kind === 'err' ? (
        <p className="mb-4 text-center text-sm text-burgundy-700 dark:text-burgundy-300">{message.text}</p>
      ) : null}

      <h2 className="mb-4 font-display text-lg font-bold text-victorian-900 dark:text-cream-50">
        {t('reviewsListHeading')}
      </h2>

      {loading ? (
        <div role="status" aria-busy="true" aria-live="polite">
          <span className="sr-only">
            {isAr ? 'جارِ تحميل قائمة الآراء…' : 'Loading reviews list…'}
          </span>
          <ReviewsListShimmer count={4} />
        </div>
      ) : data.reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-victorian-300 bg-cream-50/50 py-14 text-center dark:border-victorian-700 dark:bg-victorian-950/40">
          <MessageCircle className="mx-auto h-10 w-10 text-victorian-300" />
          <p className="mt-3 text-sm text-victorian-500">{t('reviewsEmpty')}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {visible.map((r: Review) => (
              <ReviewCard
                key={r.id}
                review={r}
                isAr={isAr}
                onDelete={
                  myReviewId === r.id && showDeleteOnMyCard
                    ? () => void onDeleteMine(r.id)
                    : undefined
                }
                deleteBusy={deletingId === r.id}
                deleteLabel={t('reviewDeleteMyComment')}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + 8)}
                className="inline-flex items-center gap-2 rounded-full border border-victorian-300 px-5 py-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-victorian-700 transition hover:bg-victorian-100 dark:border-victorian-700 dark:text-cream-200 dark:hover:bg-victorian-900"
              >
                {isAr ? 'عرض المزيد' : 'Show more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
