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
  /** Total das duas lojas. */
  variantStock?: VariantStock[]
  /** Quantidade em cada loja (depois do supabase/v5-unidades.sql). */
  unitStock?: UnitStock[]
  tag?: string
  available?: boolean
  enabled?: boolean
}

export type VariantStock = {
  size: string
  color: string
  quantity: number
}

export type UnitStock = VariantStock & {
  unit: string
}

export type CartItem = {
  product: Product
  size: string
  color: string
  quantity: number
}

export type PaymentMethod = 'Pix' | 'Cartão de crédito' | 'Dinheiro' | 'Link de pagamento'
