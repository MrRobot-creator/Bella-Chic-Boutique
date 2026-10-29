import { Product, VariantStock } from '../types/store'

/** A partir de quantas unidades (ou menos) a peça mostra "Últimas unidades". */
export const LOW_STOCK_LIMIT = 2

export const getVariantStock = (
  stock: VariantStock[] | undefined,
  size: string,
  color: string
): number => stock?.find((variant) => variant.size === size && variant.color === color)?.quantity ?? 0

export const buildVariantStock = (
  sizes: string[],
  colors: string[],
  currentStock: VariantStock[]
): VariantStock[] => sizes.flatMap((size) =>
  colors.map((color) => ({
    size,
    color,
    quantity: getVariantStock(currentStock, size, color)
  }))
)

export const getTotalStock = (stock: VariantStock[] | undefined): number =>
  (stock || []).reduce((total, variant) => total + Math.max(0, variant.quantity), 0)

/** Peça à venda com poucas unidades no total. */
export const isLowStock = (product: Pick<Product, 'available' | 'variantStock'>): boolean => {
  const total = getTotalStock(product.variantStock)
  return product.available !== false && total > 0 && total <= LOW_STOCK_LIMIT
}

export type LowStockVariant = VariantStock & { productId: number; productName: string }

/** Variações de peças ativas que estão acabando ou zeradas, das mais críticas para as menos. */
export const getLowStockVariants = (products: Product[]): LowStockVariant[] =>
  products
    .filter((product) => product.enabled !== false)
    .flatMap((product) => (product.variantStock || [])
      .filter((variant) => variant.quantity <= LOW_STOCK_LIMIT)
      .map((variant) => ({ ...variant, productId: product.id, productName: product.name })))
    .sort((first, second) => first.quantity - second.quantity || first.productName.localeCompare(second.productName, 'pt-BR'))
