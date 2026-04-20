import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads')

function normalizedPublicBase(): string | null {
  const u = process.env.R2_PUBLIC_URL?.trim()
  if (!u) return null
  return u.endsWith('/') ? u.slice(0, -1) : u
}

function r2Configured(): boolean {
  return Boolean(
    process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL,
  )
}

let r2Client: S3Client | null | undefined

function getR2Client(): S3Client | null {
  if (r2Client !== undefined) return r2Client
  if (!r2Configured()) {
    r2Client = null
    return r2Client
  }
  r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    },
  })
  return r2Client
}

/** يستخرج مفتاح الكائن من رابط العرض العام لـ R2 */
export function r2ObjectKeyFromPublicUrl(imageUrl: string): string | null {
  const base = normalizedPublicBase()
  if (!base) return null
  const url = imageUrl.trim()
  if (!url.startsWith(base)) return null
  const key = url.slice(base.length).replace(/^\/+/, '')
  if (!key || key.includes('..')) return null
  return key
}

/** يحذف ملفاً من R2 أو من مجلد uploads المحلي حسب شكل الرابط */
export async function deleteStoredObjectByUrl(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl?.trim()) return
  const url = imageUrl.trim()

  const key = r2ObjectKeyFromPublicUrl(url)
  const client = getR2Client()
  if (key && client) {
    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME as string,
          Key: key,
        }),
      )
    } catch (e) {
      console.error('[storage] R2 delete failed', url, e)
    }
    return
  }

  if (url.startsWith('/uploads/')) {
    const name = path.basename(url)
    if (!name || name.includes('..')) return
    const filePath = path.join(uploadsDir, name)
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch (e) {
      console.error('[storage] local delete failed', filePath, e)
    }
  }
}

export async function deleteStoredObjectsByUrls(urls: Iterable<string | null | undefined>): Promise<void> {
  const uniq = [...new Set([...urls].filter(Boolean))] as string[]
  await Promise.all(uniq.map((u) => deleteStoredObjectByUrl(u)))
}
