export type Product = {
  id: number
  name: string
  category: string
  description: string
  price: number
  oldPrice?: number
  image: string
  images?: string[]
  sizes: string[]
  sizeFit?: string
  colors: { name: string; hex: string; image?: string }[]
  tag?: string
  available?: boolean
}

export type CartItem = {
  product: Product
  size: string
  color: string
  quantity: number
}

export type PaymentMethod = 'Pix' | 'Cartão de crédito' | 'Dinheiro' | 'Link de pagamento'
