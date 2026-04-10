import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import { Prisma } from '@prisma/client'
import { prisma } from './lib/prisma.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import uploadRoutes from './routes/upload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const isProd = process.env.NODE_ENV === 'production'
const PORT = Number(process.env.PORT) || 3001
const distDir = path.join(__dirname, '..', 'dist')

app.use(
  cors(
    isProd
      ? { origin: false }
      : { origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'] },
  ),
)
app.use(express.json({ limit: '10mb' }))
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/upload', uploadRoutes)

function serializeProduct(p: {
  price: { toString(): string }
  category?: { id: string; slug: string; name: string; nameAr: string }
  [key: string]: unknown
}) {
  const { price, category, ...rest } = p
  return {
    ...rest,
    price: price.toString(),
    category,
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'classi.store' })
})

app.get('/api/categories', async (_req, res) => {
  try {
    const rows = await prisma.category.findMany({ orderBy: { name: 'asc' } })
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'database_unavailable' })
  }
})

app.get('/api/products', async (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : undefined
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  try {
    const rows = await prisma.product.findMany({
      where: {
        ...(category ? { category: { slug: category } } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { nameAr: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    })
    res.json(rows.map(serializeProduct))
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'database_unavailable' })
  }
})

app.get('/api/products/slug/:slug', async (req, res) => {
  try {
    const p = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { category: true },
    })
    if (!p) return res.status(404).json({ error: 'not_found' })
    res.json(serializeProduct(p))
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'database_unavailable' })
  }
})

app.post('/api/orders', async (req, res) => {
  const body = req.body as {
    customerName?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    province?: string
    landmark?: string
    notes?: string
    items?: { productId: string; quantity: number; size: string; unitPrice: string; productName: string }[]
  }
  const items = body.items
  if (!items?.length) return res.status(400).json({ error: 'no_items' })
  const customerName = String(body.customerName ?? '').trim()
  const email = String(body.email ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  const address = String(body.address ?? '').trim()
  const city = String(body.city ?? '').trim()
  const province = String(body.province ?? '').trim()
  const landmark = String(body.landmark ?? '').trim()
  const notes = body.notes ? String(body.notes).trim() : null
  if (!customerName || !phone || !address || !province) {
    return res.status(400).json({ error: 'missing_fields' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let total = new Prisma.Decimal(0)
      const lineData: {
        productId: string
        quantity: number
        size: string
        unitPrice: Prisma.Decimal
        productName: string
      }[] = []

      for (const line of items) {
        const qty = Math.max(1, Math.floor(Number(line.quantity) || 0))
        const product = await tx.product.findUnique({ where: { id: line.productId } })
        if (!product) throw new Error('product_not_found')
        if (product.stock < qty) throw new Error('insufficient_stock')
        const unitPrice = product.price
        total = total.add(unitPrice.mul(qty))
        lineData.push({
          productId: product.id,
          quantity: qty,
          size: String(line.size),
          unitPrice,
          productName: String(line.productName || product.nameAr),
        })
      }

      const order = await tx.order.create({
        data: {
          customerName,
          email,
          phone,
          address,
          city,
          province,
          landmark,
          notes,
          total,
          status: 'pending',
          items: {
            create: lineData.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              size: l.size,
              unitPrice: l.unitPrice,
              productName: l.productName,
            })),
          },
        },
      })

      for (const line of lineData) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        })
      }

      return order
    })

    res.status(201).json({ id: result.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'product_not_found') return res.status(400).json({ error: 'product_not_found' })
    if (msg === 'insufficient_stock') return res.status(400).json({ error: 'insufficient_stock' })
    console.error(e)
    res.status(503).json({ error: 'order_failed' })
  }
})

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: { product: { select: { images: true, slug: true } } },
        },
      },
    })
    if (!order) return res.status(404).json({ error: 'not_found' })
    res.json({
      id: order.id,
      createdAt: order.createdAt,
      customerName: order.customerName,
      phone: order.phone,
      province: order.province,
      city: order.city,
      address: order.address,
      landmark: order.landmark,
      total: order.total.toString(),
      status: order.status,
      items: order.items.map((i) => ({
        id: i.id,
        productName: i.productName,
        size: i.size,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toString(),
        image: i.product?.images?.[0] ?? null,
        slug: i.product?.slug ?? null,
      })),
    })
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

const uploadsPublic = path.join(__dirname, '..', 'public', 'uploads')
app.use('/uploads', express.static(uploadsPublic))

if (isProd) {
  app.use(express.static(distDir))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[classi] API ${isProd ? 'production' : 'dev'} on port ${PORT}`)
})
