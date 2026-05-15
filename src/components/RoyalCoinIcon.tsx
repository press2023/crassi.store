/**
 * صورة القطعة الذهبية الملكية (الملكة فيكتوريا) — من /public/coins.png
 * تستعمل في كل أنحاء الموقع للحفاظ على هوية بصرية واحدة.
 */
export function RoyalCoinIcon({
  className = '',
  size = 24,
}: {
  className?: string
  size?: number
}) {
  return (
    <img
      src="/coins.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`inline-block shrink-0 select-none object-contain drop-shadow-[0_2px_6px_rgba(180,120,30,0.45)] ${className}`}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  )
}
