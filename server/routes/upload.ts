import { Router } from 'express'
import { requireAdmin } from '../lib/auth.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
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

    fs.writeFileSync(path.join(uploadsDir, name), buffer)
    res.json({ url: `/uploads/${name}` })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'upload_failed' })
  }
})

export default router
