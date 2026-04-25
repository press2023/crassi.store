/**
 * يرفع ملف صورة إلى الخادم (R2 أو uploads محلي) بعد ضغطها في المتصفح
 * — يقلّل الحجم دون فقد جودة ملحوظة، ويتجنّب أخطاء حدّ Express لرفع الصور الكبيرة.
 */

const COMPRESSION_DEFAULTS = {
  /** أقصى بُعد (عرض/ارتفاع) للصورة بعد التصغير. صور المتجر لا تحتاج أكبر من هذا. */
  maxDimension: 2048,
  /** جودة JPEG/WebP بين 0 و 1. 0.85 توازن ممتاز بين الحجم والجودة. */
  quality: 0.85,
  /** أصغر حجم يستحق الضغط (بايت). أصغر من ذلك نرفعها كما هي. */
  minBytesToCompress: 200 * 1024,
}

type CompressOpts = Partial<typeof COMPRESSION_DEFAULTS>

/**
 * يضغط ملف صورة في المتصفح ويعيده كـ Data URL.
 * - PNG ذو شفافية → يبقى PNG (لا يفقد الشفافية).
 * - بقية الصور → تتحول إلى JPEG بجودة عالية وحجم أصغر بكثير.
 */
async function compressImageToDataUrl(file: File, opts: CompressOpts = {}): Promise<string> {
  const cfg = { ...COMPRESSION_DEFAULTS, ...opts }

  // ملفات صغيرة بالفعل: لا تستحق العناء.
  if (file.size < cfg.minBytesToCompress) {
    return fileToDataUrl(file)
  }

  // GIF/SVG/HEIC وغيرها: لا نحاول معالجتها — نرسلها كما هي.
  const isProcessable =
    file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
  if (!isProcessable) {
    return fileToDataUrl(file)
  }

  // نحاول الفك والتعديل عبر canvas. إن فشل لأي سبب نسقط للأصل بأمان.
  try {
    const dataUrl = await fileToDataUrl(file)
    const img = await loadImage(dataUrl)
    const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, cfg.maxDimension)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: false })
    if (!ctx) return dataUrl
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, width, height)

    // حافظ على PNG لو الأصل PNG وفيه شفافية، وإلا حوّل لـ JPEG (أصغر بكثير).
    const keepPng = file.type === 'image/png' && hasTransparency(ctx, width, height)
    const outType = keepPng ? 'image/png' : 'image/jpeg'
    const out = canvas.toDataURL(outType, keepPng ? undefined : cfg.quality)

    // لو الضغط ما حسّن الحجم (نادر) نُبقي الأصل.
    return out.length < dataUrl.length ? out : dataUrl
  } catch {
    return fileToDataUrl(file)
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read_failed'))
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image_load_failed'))
    img.decoding = 'async'
    img.src = src
  })
}

function fitWithin(srcW: number, srcH: number, maxDim: number) {
  if (srcW <= maxDim && srcH <= maxDim) return { width: srcW, height: srcH }
  const ratio = srcW > srcH ? maxDim / srcW : maxDim / srcH
  return {
    width: Math.round(srcW * ratio),
    height: Math.round(srcH * ratio),
  }
}

/** فحص خفيف (عيّنة من البكسلات) لمعرفة إن كانت الصورة فيها شفافية فعلية */
function hasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  try {
    // عيّنة بدلاً من فحص كل بكسل لتوفير الذاكرة على الصور الكبيرة.
    const sampleSize = Math.min(64, Math.min(w, h))
    const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) return true
    }
  } catch {
    return false
  }
  return false
}

/** يرفع ملف صورة إلى الخادم (R2 أو uploads محلي) بعد اختيار المشرف الحفظ/النشر */
export async function uploadImageFile(
  base: string,
  token: string,
  file: File,
  filename?: string,
): Promise<string | null> {
  const dataUrl = await compressImageToDataUrl(file)
  const safeName = ((filename ?? file.name.replace(/\.[^.]+$/, '')) || 'img').slice(0, 80)
  try {
    const res = await fetch(`${base}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: dataUrl, filename: safeName }),
    })
    if (!res.ok) return null
    const { url } = (await res.json()) as { url: string }
    return url
  } catch {
    return null
  }
}
