import { QRCodeSVG } from 'qrcode.react'

/**
 * شيفرة QR بطابع فيكتوري:
 *  - ألوان: عنّابي عميق على كريمي (تباين عالٍ يضمن المسح)
 *  - إطار مزدوج بخط عنّابي خارجي وذهبي داخلي
 *  - معينات ذهبية في الزوايا الأربع
 *  - شعار المتجر في المنتصف (بمستوى تصحيح أخطاء H = 30%)
 */

const FG = '#401414'      // burgundy-800 — لوح QR
const BG = '#fdfbf5'      // cream-50 — الخلفية
const OUTER = '#5e1e1e'   // burgundy-700 — الإطار الخارجي
const GOLD = '#c89a55'    // victorian-400 — الإطار الذهبي
const CORNER = '#8c5a28'  // victorian-600 — معين الزوايا

type Props = {
  value: string
  /** حجم مربع QR الفعلي بالبكسل (دون احتساب الإطار) */
  size?: number
  /** هل يدمج شعار المتجر في المنتصف */
  withLogo?: boolean
  className?: string
}

export function VictorianQR({
  value,
  size = 160,
  withLogo = true,
  className = '',
}: Props) {
  const logoSize = Math.round(size * 0.18)

  return (
    <div className={`relative inline-block ${className}`} style={{ background: BG }}>
      {/* إطار خارجي عنّابي */}
      <div className="border-2 p-1.5" style={{ borderColor: OUTER }}>
        {/* إطار داخلي ذهبي */}
        <div
          className="border p-2.5"
          style={{ borderColor: GOLD, background: BG }}
        >
          <QRCodeSVG
            value={value}
            size={size}
            level="H"
            fgColor={FG}
            bgColor={BG}
            includeMargin={false}
            imageSettings={
              withLogo
                ? {
                    src: '/site-logo.jpg',
                    height: logoSize,
                    width: logoSize,
                    excavate: true,
                  }
                : undefined
            }
          />
        </div>
      </div>

      {/* معينات الزوايا الأربع */}
      <CornerDiamond pos="top-left" />
      <CornerDiamond pos="top-right" />
      <CornerDiamond pos="bottom-left" />
      <CornerDiamond pos="bottom-right" />
    </div>
  )
}

function CornerDiamond({ pos }: { pos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const offsets: Record<typeof pos, React.CSSProperties> = {
    'top-left':     { top: -5, left: -5 },
    'top-right':    { top: -5, right: -5 },
    'bottom-left':  { bottom: -5, left: -5 },
    'bottom-right': { bottom: -5, right: -5 },
  }
  return (
    <span
      aria-hidden
      className="absolute h-2.5 w-2.5 rotate-45"
      style={{
        ...offsets[pos],
        background: CORNER,
        boxShadow: `0 0 0 1.5px ${BG}, 0 0 0 2.5px ${GOLD}`,
      }}
    />
  )
}
