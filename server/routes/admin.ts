import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAdmin } from '../lib/auth.js'

const router = Router()
router.use(requireAdmin)

// ── Categories ──────────────────────────────────────────

router.post('/categories', async (req, res) => {
  const { slug, name, nameAr } = req.body as {
    slug?: string
    name?: string
    nameAr?: string
  }
  if (!slug?.trim() || !name?.trim() || !nameAr?.trim()) {
    return res.status(400).json({ error: 'missing_fields' })
  }
  try {
    const row = await prisma.category.create({
      data: { slug: slug.trim(), name: name.trim(), nameAr: nameAr.trim() },
    })
    res.status(201).json(row)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return res.status(409).json({ error: 'slug_exists' })
    }
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

router.delete('/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(404).json({ error: 'not_found' })
  }
})

// ── Products ────────────────────────────────────────────

router.post('/products', async (req, res) => {
  const b = req.body as {
    slug?: string
    name?: string
    nameAr?: string
    description?: string
    descriptionAr?: string
    price?: number
    images?: string[]
    sizes?: string[]
    stock?: number
    featured?: boolean
    categoryId?: string
  }
  if (
    !b.slug?.trim() ||
    !b.name?.trim() ||
    !b.nameAr?.trim() ||
    !b.categoryId?.trim() ||
    b.price == null
  ) {
    return res.status(400).json({ error: 'missing_fields' })
  }
  try {
    const row = await prisma.product.create({
      data: {
        slug: b.slug.trim(),
        name: b.name.trim(),
        nameAr: b.nameAr.trim(),
        description: (b.description ?? '').trim(),
        descriptionAr: (b.descriptionAr ?? '').trim(),
        price: b.price,
        images: b.images ?? [],
        sizes: b.sizes ?? [],
        stock: b.stock ?? 0,
        featured: b.featured ?? false,
        categoryId: b.categoryId.trim(),
      },
      include: { category: true },
    })
    res.status(201).json(row)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return res.status(409).json({ error: 'slug_exists' })
    }
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

router.put('/products/:id', async (req, res) => {
  const b = req.body as Record<string, unknown>
  try {
    const row = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(b.name != null ? { name: String(b.name) } : {}),
        ...(b.nameAr != null ? { nameAr: String(b.nameAr) } : {}),
        ...(b.description != null ? { description: String(b.description) } : {}),
        ...(b.descriptionAr != null ? { descriptionAr: String(b.descriptionAr) } : {}),
        ...(b.price != null ? { price: Number(b.price) } : {}),
        ...(b.images != null ? { images: b.images as string[] } : {}),
        ...(b.sizes != null ? { sizes: b.sizes as string[] } : {}),
        ...(b.stock != null ? { stock: Number(b.stock) } : {}),
        ...(b.featured != null ? { featured: Boolean(b.featured) } : {}),
        ...(b.categoryId != null ? { categoryId: String(b.categoryId) } : {}),
      },
      include: { category: true },
    })
    res.json(row)
  } catch {
    res.status(404).json({ error: 'not_found' })
  }
})

router.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(404).json({ error: 'not_found' })
  }
})

// ── Orders ──────────────────────────────────────────────

router.get('/orders', async (_req, res) => {
  try {
    const rows = await prisma.order.findMany({
      include: {
        items: {
          include: { product: { select: { images: true, slug: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    const serialized = rows.map((o) => ({
      ...o,
      total: o.total.toString(),
      items: o.items.map((i) => ({
        ...i,
        unitPrice: i.unitPrice.toString(),
        image: i.product?.images?.[0] ?? null,
        slug: i.product?.slug ?? null,
      })),
    }))
    res.json(serialized)
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body as { status?: string }
  if (!status) return res.status(400).json({ error: 'missing_status' })
  try {
    const row = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    })
    res.json({ id: row.id, status: row.status })
  } catch {
    res.status(404).json({ error: 'not_found' })
  }
})

export default router
