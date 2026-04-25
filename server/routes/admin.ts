import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requirePermission } from '../lib/auth.js'
import { deleteStoredObjectByUrl, deleteStoredObjectsByUrls } from '../lib/storage.js'

const router = Router()
router.use(requireAdmin)

const MAX_PRODUCT_IMAGES = 4

function parseProductImageUrls(images: unknown): string[] | 'invalid' | 'too_many' {
  if (!Array.isArray(images)) return 'invalid'
  const urls = images.map((u) => String(u).trim()).filter((u) => u.length > 0)
  if (urls.length > MAX_PRODUCT_IMAGES) return 'too_many'
  return urls
}

// ── Categories ──────────────────────────────────────────

router.post('/categories', requirePermission('categories'), async (req, res) => {
  const { slug, name, nameAr, image } = req.body as {
    slug?: string
    name?: string
    nameAr?: string
    image?: string | null
  }
  if (!slug?.trim() || !name?.trim() || !nameAr?.trim()) {
    return res.status(400).json({ error: 'missing_fields' })
  }
  try {
    const row = await prisma.category.create({
      data: {
        slug: slug.trim(),
        name: name.trim(),
        nameAr: nameAr.trim(),
        image: image ? String(image) : null,
      },
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

router.put('/categories/:id', requirePermission('categories'), async (req, res) => {
  const b = req.body as { name?: string; nameAr?: string; image?: string | null; slug?: string }
  try {
    const prev = await prisma.category.findUnique({
      where: { id: req.params.id },
      select: { image: true },
    })
    if (!prev) return res.status(404).json({ error: 'not_found' })

    const row = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(b.slug != null ? { slug: String(b.slug) } : {}),
        ...(b.name != null ? { name: String(b.name) } : {}),
        ...(b.nameAr != null ? { nameAr: String(b.nameAr) } : {}),
        ...(b.image !== undefined ? { image: b.image ? String(b.image) : null } : {}),
      },
    })
    if (prev.image && prev.image !== row.image) {
      await deleteStoredObjectByUrl(prev.image)
    }
    res.json(row)
  } catch {
    res.status(404).json({ error: 'not_found' })
  }
})

router.delete('/categories/:id', requirePermission('categories'), async (req, res) => {
  try {
    const existing = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { products: { select: { images: true } } },
    })
    if (!existing) return res.status(404).json({ error: 'not_found' })

    const urls: string[] = []
    if (existing.image) urls.push(existing.image)
    for (const p of existing.products) urls.push(...p.images)

    await prisma.category.delete({ where: { id: req.params.id } })
    await deleteStoredObjectsByUrls(urls)
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(404).json({ error: 'not_found' })
  }
})

// ── Products ────────────────────────────────────────────

router.post('/products', requirePermission('products'), async (req, res) => {
  const b = req.body as {
    slug?: string
    name?: string
    nameAr?: string
    description?: string
    descriptionAr?: string
    price?: number
    salePrice?: number | string | null
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
  let productImages: string[] = []
  if (b.images != null) {
    const parsed = parseProductImageUrls(b.images)
    if (parsed === 'invalid') return res.status(400).json({ error: 'invalid_images' })
    if (parsed === 'too_many') return res.status(400).json({ error: 'too_many_images' })
    productImages = parsed
  }
  // sale price: قَبول null لمسح التخفيض، أو رقم موجب < السعر الأصلي
  let salePriceData: number | null | undefined = undefined
  if (b.salePrice !== undefined) {
    if (b.salePrice === null || b.salePrice === '' || Number(b.salePrice) <= 0) {
      salePriceData = null
    } else {
      const sp = Number(b.salePrice)
      if (sp >= Number(b.price)) {
        return res.status(400).json({ error: 'sale_price_must_be_lower' })
      }
      salePriceData = sp
    }
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
        ...(salePriceData !== undefined ? { salePrice: salePriceData } : {}),
        images: productImages,
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

router.put('/products/:id', requirePermission('products'), async (req, res) => {
  const b = req.body as Record<string, unknown>
  try {
    const prev = await prisma.product.findUnique({
      where: { id: req.params.id },
      select: { images: true, price: true },
    })
    if (!prev) return res.status(404).json({ error: 'not_found' })

    let imagesPatch: string[] | undefined
    if (b.images != null) {
      const parsed = parseProductImageUrls(b.images)
      if (parsed === 'invalid') return res.status(400).json({ error: 'invalid_images' })
      if (parsed === 'too_many') return res.status(400).json({ error: 'too_many_images' })
      imagesPatch = parsed
    }

    // Sale price patch: undefined = لا يُلمس، null/'' = إزالة التخفيض، رقم موجب = تعيين
    let salePricePatch: number | null | undefined = undefined
    if ('salePrice' in b) {
      const sp = b.salePrice
      if (sp === null || sp === '' || sp === undefined || Number(sp) <= 0) {
        salePricePatch = null
      } else {
        const spNum = Number(sp)
        const basePrice = b.price != null ? Number(b.price) : Number(prev.price)
        if (spNum >= basePrice) {
          return res.status(400).json({ error: 'sale_price_must_be_lower' })
        }
        salePricePatch = spNum
      }
    }

    const row = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(b.name != null ? { name: String(b.name) } : {}),
        ...(b.nameAr != null ? { nameAr: String(b.nameAr) } : {}),
        ...(b.description != null ? { description: String(b.description) } : {}),
        ...(b.descriptionAr != null ? { descriptionAr: String(b.descriptionAr) } : {}),
        ...(b.price != null ? { price: Number(b.price) } : {}),
        ...(salePricePatch !== undefined ? { salePrice: salePricePatch } : {}),
        ...(imagesPatch != null ? { images: imagesPatch } : {}),
        ...(b.sizes != null ? { sizes: b.sizes as string[] } : {}),
        ...(b.stock != null ? { stock: Number(b.stock) } : {}),
        ...(b.featured != null ? { featured: Boolean(b.featured) } : {}),
        ...(b.categoryId != null ? { categoryId: String(b.categoryId) } : {}),
      },
      include: { category: true },
    })
    const removed = prev.images.filter((u) => !row.images.includes(u))
    await deleteStoredObjectsByUrls(removed)
    res.json(row)
  } catch {
    res.status(404).json({ error: 'not_found' })
  }
})

router.delete('/products/:id', requirePermission('products'), async (req, res) => {
  try {
    const prev = await prisma.product.findUnique({
      where: { id: req.params.id },
      select: { images: true },
    })
    if (!prev) return res.status(404).json({ error: 'not_found' })
    await prisma.product.delete({ where: { id: req.params.id } })
    await deleteStoredObjectsByUrls(prev.images)
    res.json({ ok: true })
  } catch {
    res.status(404).json({ error: 'not_found' })
  }
})

/** حذف جماعي للمنتجات */
router.post('/products/bulk-delete', requirePermission('products'), async (req, res) => {
  const { ids } = req.body as { ids?: string[] }
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'no_ids' })
  }
  try {
    const toRemove = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { images: true },
    })
    const urls = toRemove.flatMap((p) => p.images)
    const result = await prisma.product.deleteMany({ where: { id: { in: ids } } })
    await deleteStoredObjectsByUrls(urls)
    res.json({ ok: true, count: result.count })
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

// ── Orders ──────────────────────────────────────────────

router.get('/orders', requirePermission('orders'), async (_req, res) => {
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

router.get('/orders/:id', requirePermission('orders'), async (req, res) => {
  try {
    const o = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: { product: { select: { images: true, slug: true } } },
        },
      },
    })
    if (!o) return res.status(404).json({ error: 'not_found' })
    res.json({
      ...o,
      total: o.total.toString(),
      items: o.items.map((i) => ({
        ...i,
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

router.put('/orders/:id/status', requirePermission('orders'), async (req, res) => {
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

router.delete('/orders/:id', requirePermission('orders'), async (req, res) => {
  try {
    await prisma.orderItem.deleteMany({ where: { orderId: req.params.id } })
    await prisma.order.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(404).json({ error: 'not_found' })
  }
})

router.post('/orders/bulk-delete', requirePermission('orders'), async (req, res) => {
  const { ids } = req.body as { ids?: string[] }
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'no_ids' })
  }
  try {
    await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } })
    const r = await prisma.order.deleteMany({ where: { id: { in: ids } } })
    res.json({ ok: true, count: r.count })
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

// ── Site settings (hero image, etc.) ────────────────────

router.put('/settings', requirePermission('site_settings'), async (req, res) => {
  const body = req.body as Record<string, string | null | undefined>
  try {
    const oldHero =
      'heroImage' in body
        ? ((await prisma.setting.findUnique({ where: { key: 'heroImage' } }))?.value ?? null)
        : null

    for (const [key, value] of Object.entries(body)) {
      if (value === null || value === undefined || value === '') {
        await prisma.setting.deleteMany({ where: { key } })
      } else {
        await prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      }
    }

    if ('heroImage' in body) {
      const newHero = (await prisma.setting.findUnique({ where: { key: 'heroImage' } }))?.value ?? null
      if (oldHero && oldHero !== newHero) {
        await deleteStoredObjectByUrl(oldHero)
      }
    }

    const rows = await prisma.setting.findMany()
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value
    res.json(map)
  } catch (e) {
    console.error(e)
    res.status(503).json({ error: 'server_error' })
  }
})

export default router


