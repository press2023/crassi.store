/** يرفع ملف صورة إلى الخادم (R2 أو uploads محلي) بعد اختيار المشرف الحفظ/النشر */
export async function uploadImageFile(
  base: string,
  token: string,
  file: File,
  filename?: string,
): Promise<string | null> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read_failed'))
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
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
