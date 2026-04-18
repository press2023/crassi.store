import { Router } from 'express'
import { requireAdmin } from '../lib/auth.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const isR2Enabled = Boolean(
  process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
)

let s3Client: S3Client | null = null
if (isR2Enabled) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    },
  })
  console.log('[classi] Cloudflare R2 object storage enabled.')
}

const router = Router()
router.use(requireAdmin)

router.post('/', async (req, res) => {
  try {
    const { data, filename } = req.body as { data?: string; filename?: string }
    if (!data) return res.status(400).json({ error: 'no_data' })

    const matches = data.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) return res.status(400).json({ error: 'invalid_format' })

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
    const buffer = Buffer.from(matches[2], 'base64')

    const hash = crypto.randomBytes(8).toString('hex')
    const safeName = (filename ?? 'img').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30)
    const name = `${safeName}-${hash}.${ext}`

    if (isR2Enabled && s3Client) {
      try {
        const bucket = process.env.R2_BUCKET_NAME as string
        const publicUrl = process.env.R2_PUBLIC_URL as string
        
        await s3Client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: name,
          Body: buffer,
          ContentType: `image/${ext}`
        }))
        
        const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl
        return res.json({ url: `${baseUrl}/${name}` })
      } catch (cloudErr) {
        console.error('R2 Upload error:', cloudErr)
        return res.status(500).json({ error: 'cloud_upload_failed' })
      }
    } else {
      fs.writeFileSync(path.join(uploadsDir, name), buffer)
      return res.json({ url: `/uploads/${name}` })
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'upload_failed' })
  }
})

export default router
