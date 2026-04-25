export type Category = {
  id: string
  slug: string
  name: string
  nameAr: string
  image?: string | null
}

export type Product = {
  id: string
  slug: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  /** السعر الأصلي (الكامل) */
  price: string
  /** السعر بعد التخفيض — null/undefined = لا يوجد تخفيض */
  salePrice?: string | null
  images: string[]
  sizes: string[]
  stock: number
  featured: boolean
  categoryId: string
  category?: Category
}

export type CartLine = {
  productId: string
  slug: string
  name: string
  nameAr: string
  image: string
  price: string
  size: string
  quantity: number
}
