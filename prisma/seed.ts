import { PrismaClient } from '@prisma/client'
import { scryptSync, randomBytes } from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

const categories = [
  {
    slug: 'men',
    name: 'Gentlemen',
    nameAr: 'السادة',
    image:
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80',
  },
  {
    slug: 'women',
    name: 'Ladies',
    nameAr: 'السيدات',
    image:
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80',
  },
  {
    slug: 'kids',
    name: 'Young Heirs',
    nameAr: 'الورثة الصغار',
    image:
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80',
  },
]

async function main() {
  const catMap: Record<string, string> = {}

  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameAr: c.nameAr, image: c.image },
      create: { slug: c.slug, name: c.name, nameAr: c.nameAr, image: c.image },
    })
    catMap[c.slug] = row.id
  }

  const products: {
    slug: string
    name: string
    nameAr: string
    description: string
    descriptionAr: string
    price: number
    images: string[]
    sizes: string[]
    stock: number
    featured: boolean
    categorySlug: keyof typeof catMap
  }[] = [
    {
      slug: 'classic-white-tee',
      name: 'Classic White Tee',
      nameAr: 'تيشيرت أبيض كلاسيكي',
      description: 'Soft cotton crew neck, everyday essential.',
      descriptionAr: 'قطن ناعم برقبة دائرية، أساسي لكل يوم.',
      price: 79,
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      stock: 40,
      featured: true,
      categorySlug: 'men',
    },
    {
      slug: 'slim-fit-jeans',
      name: 'Slim Fit Jeans',
      nameAr: 'جينز ضيق',
      description: 'Stretch denim with modern slim silhouette.',
      descriptionAr: 'دنيم مرن بقصة عصرية ضيقة.',
      price: 189,
      images: [
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
      ],
      sizes: ['30', '32', '34', '36'],
      stock: 25,
      featured: true,
      categorySlug: 'men',
    },
    {
      slug: 'linen-shirt',
      name: 'Linen Shirt',
      nameAr: 'قميص كتان',
      description: 'Breathable linen blend for warm days.',
      descriptionAr: 'مزيج كتان يسمح بالتهوية للأيام الدافئة.',
      price: 149,
      images: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b87?w=800&q=80',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      stock: 18,
      featured: false,
      categorySlug: 'men',
    },
    {
      slug: 'summer-dress',
      name: 'Summer Dress',
      nameAr: 'فستان صيفي',
      description: 'Light floral midi dress with adjustable straps.',
      descriptionAr: 'فستان ميدي خفيف بطبعة زهور وحمالات قابلة للتعديل.',
      price: 219,
      images: [
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
      ],
      sizes: ['S', 'M', 'L'],
      stock: 22,
      featured: true,
      categorySlug: 'women',
    },
    {
      slug: 'wool-coat',
      name: 'Wool Blend Coat',
      nameAr: 'معطف صوف',
      description: 'Tailored coat with hidden pockets.',
      descriptionAr: 'معطف أنيق بجيوب مخفية.',
      price: 459,
      images: [
        'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      stock: 12,
      featured: true,
      categorySlug: 'women',
    },
    {
      slug: 'silk-blouse',
      name: 'Silk Blouse',
      nameAr: 'بلوزة حرير',
      description: 'Minimal silk blouse with mother-of-pearl buttons.',
      descriptionAr: 'بلوزة حرير بسيطة بأزرار من القواقع.',
      price: 279,
      images: [
        'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&q=80',
      ],
      sizes: ['S', 'M', 'L'],
      stock: 15,
      featured: false,
      categorySlug: 'women',
    },
    {
      slug: 'kids-hoodie',
      name: 'Kids Hoodie',
      nameAr: 'هودي أطفال',
      description: 'Cozy fleece hoodie with kangaroo pocket.',
      descriptionAr: 'هودي فليس دافئ بجيب أمامي.',
      price: 99,
      images: [
        'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80',
      ],
      sizes: ['4Y', '6Y', '8Y', '10Y'],
      stock: 30,
      featured: true,
      categorySlug: 'kids',
    },
    {
      slug: 'kids-denim',
      name: 'Kids Denim Jacket',
      nameAr: 'جاكيت جينز أطفال',
      description: 'Durable denim with soft lining.',
      descriptionAr: 'جينز متين بطبقة داخلية ناعمة.',
      price: 129,
      images: [
        'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80',
      ],
      sizes: ['4Y', '6Y', '8Y'],
      stock: 20,
      featured: false,
      categorySlug: 'kids',
    },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        nameAr: p.nameAr,
        description: p.description,
        descriptionAr: p.descriptionAr,
        price: p.price,
        images: p.images,
        sizes: p.sizes,
        stock: p.stock,
        featured: p.featured,
        categoryId: catMap[p.categorySlug],
      },
      create: {
        slug: p.slug,
        name: p.name,
        nameAr: p.nameAr,
        description: p.description,
        descriptionAr: p.descriptionAr,
        price: p.price,
        images: p.images,
        sizes: p.sizes,
        stock: p.stock,
        featured: p.featured,
        categoryId: catMap[p.categorySlug],
      },
    })
  }

  await prisma.admin.upsert({
    where: { email: 'hswnbrys@gmail.com' },
    update: {},
    create: {
      email: 'hswnbrys@gmail.com',
      passwordHash: hashPassword('12341234hh'),
    },
  })

  console.log('Seed OK: categories + products + admin')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
