export type Category = {
  id: string
  slug: string
  name: string
  nameAr: string
}

export type Product = {
  id: string
  slug: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  price: string
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
