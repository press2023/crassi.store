function Bone({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200 dark:bg-slate-800 ${className}`}
    />
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
