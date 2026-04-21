function Bone({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200 dark:bg-slate-800 ${className}`}
    />
  )
}

/** شريط لامع يمر فوق الخلفية — أوضح من `pulse` وحده */
export function VictorianShimmerBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-victorian-100 dark:bg-victorian-900 ${className}`}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute top-0 bottom-0 left-0 w-[65%] -translate-x-full animate-classi-shimmer bg-gradient-to-r from-transparent via-cream-100/85 to-transparent dark:via-white/[0.09]"
      />
    </div>
  )
}

/** ملخص التقييمات + الأشرطة (صفحة الآراء) */
export function ReviewsRatingsShimmer() {
  return (
    <section className="mb-12">
      <VictorianShimmerBlock className="mb-2 h-3 w-40 rounded-md" />
      <div className="rounded-2xl border border-victorian-200/80 bg-cream-50/50 p-6 dark:border-victorian-800/80 dark:bg-victorian-950/40 sm:p-8">
        <div className="flex flex-col items-center">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <VictorianShimmerBlock key={i} className="h-6 w-6 rounded-sm sm:h-7 sm:w-7" />
            ))}
          </div>
          <VictorianShimmerBlock className="mt-4 h-10 w-24 rounded-lg sm:h-12 sm:w-28" />
          <VictorianShimmerBlock className="mt-3 h-4 w-48 max-w-full rounded-md" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <VictorianShimmerBlock className="h-4 w-8 shrink-0 rounded" />
            <VictorianShimmerBlock className="h-3 min-w-0 flex-1 rounded-full" />
            <VictorianShimmerBlock className="h-4 w-7 shrink-0 rounded" />
          </div>
        ))}
      </div>
    </section>
  )
}

function ReviewCardShimmerInner() {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-victorian-200/80 bg-cream-50/60 p-5 dark:border-victorian-800/80 dark:bg-victorian-950/50">
      <header className="flex items-center gap-3">
        <VictorianShimmerBlock className="h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <VictorianShimmerBlock className="h-4 w-2/5 max-w-[140px] rounded" />
          <VictorianShimmerBlock className="h-3 w-16 rounded" />
        </div>
        <div className="flex shrink-0 gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <VictorianShimmerBlock key={i} className="h-4 w-4 rounded-sm" />
          ))}
        </div>
      </header>
      <div className="space-y-2 pt-1">
        <VictorianShimmerBlock className="h-3 w-full rounded" />
        <VictorianShimmerBlock className="h-3 w-11/12 rounded" />
        <VictorianShimmerBlock className="h-3 w-4/5 rounded" />
      </div>
    </article>
  )
}

/** هيكل نموذج إرسال الرأي (يُعرض أثناء الجلب لتجنب وميض الحقول) */
export function ReviewsFormShimmer() {
  return (
    <div className="rounded-2xl border border-victorian-200/80 bg-cream-50/50 p-5 shadow-sm dark:border-victorian-800/80 dark:bg-victorian-950/50 sm:p-6">
      <VictorianShimmerBlock className="mb-2 h-6 w-48 max-w-[70%] rounded-md" />
      <VictorianShimmerBlock className="mb-6 h-3 w-full max-w-md rounded" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <VictorianShimmerBlock className="h-3 w-20 rounded" />
          <VictorianShimmerBlock className="h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <VictorianShimmerBlock className="h-3 w-24 rounded" />
          <div className="flex gap-1 pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <VictorianShimmerBlock key={i} className="h-8 w-8 rounded-md" />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <VictorianShimmerBlock className="h-3 w-28 rounded" />
        <VictorianShimmerBlock className="h-28 w-full rounded-xl" />
        <VictorianShimmerBlock className="ms-auto h-3 w-14 rounded" />
      </div>
      <div className="mt-4 flex justify-end">
        <VictorianShimmerBlock className="h-11 w-40 rounded-xl" />
      </div>
    </div>
  )
}

/** بطاقات آراء — شبكة مثل القائمة الحقيقية */
export function ReviewsListShimmer({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <ReviewCardShimmerInner key={i} />
      ))}
    </div>
  )
}

export function ProductCardShimmer() {
  return (
    <div>
      <Bone className="aspect-[3/4] w-full rounded-2xl" />
      <div className="mt-3 space-y-2">
        <Bone className="h-3.5 w-3/4 rounded" />
        <Bone className="h-3.5 w-1/3 rounded" />
      </div>
    </div>
  )
}

export function ProductGridShimmer({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardShimmer key={i} />
      ))}
    </div>
  )
}

export function ProductDetailShimmer() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-2">
      <Bone className="aspect-[4/5] w-full rounded-2xl" />
      <div className="space-y-4 py-4">
        <Bone className="h-3 w-1/4 rounded" />
        <Bone className="h-7 w-3/4 rounded" />
        <Bone className="h-3 w-full rounded" />
        <Bone className="h-3 w-5/6 rounded" />
        <Bone className="mt-4 h-8 w-1/3 rounded" />
        <Bone className="h-3 w-1/4 rounded" />
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Bone key={i} className="h-10 w-14 rounded-full" />
          ))}
        </div>
        <Bone className="mt-6 h-14 w-full rounded-full" />
      </div>
    </div>
  )
}

export function HeroShimmer() {
  return (
    <div className="relative flex min-h-[70vh] animate-pulse items-center justify-center bg-slate-200 dark:bg-slate-800 sm:min-h-[80vh]">
      <div className="flex flex-col items-center gap-4">
        <Bone className="h-10 w-64 rounded sm:h-14 sm:w-96" />
        <Bone className="h-12 w-40 rounded-full" />
      </div>
    </div>
  )
}
