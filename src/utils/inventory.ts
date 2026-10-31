import { Product, UnitStock, VariantStock } from '../types/store'

/** A partir de quantas unidades (ou menos) a peça mostra "Últimas unidades". */
export const LOW_STOCK_LIMIT = 2
/** Igual ao limite do banco (supabase/v6-limites.sql): mais que isso, a cliente fala com a loja. */
export const MAX_UNITS_PER_ITEM = 5

export const getVariantStock = (
  stock: VariantStock[] | undefined,
  size: string,
  color: string
): number => stock?.find((variant) => variant.size === size && variant.color === color)?.quantity ?? 0

/** Quantidade de uma variação em uma loja. */
export const getUnitStock = (
  stock: UnitStock[] | undefined,
  unitId: string,
  size: string,
  color: string
): number => stock?.find((entry) => entry.unit === unitId && entry.size === size && entry.color === color)?.quantity ?? 0

/** Quanto a loja tem. Antes do estoque por loja (v5), vale o total. */
export const availableInUnit = (
  product: Pick<Product, 'unitStock' | 'variantStock'>,
  unitId: string,
  size: string,
  color: string
): number => product.unitStock
  ? getUnitStock(product.unitStock, unitId, size, color)
  : getVariantStock(product.variantStock, size, color)

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

/** Total de uma loja, somando todas as variações. */
export const getUnitTotal = (product: Pick<Product, 'unitStock'>, unitId: string): number =>
  (product.unitStock || []).filter((entry) => entry.unit === unitId).reduce((total, entry) => total + Math.max(0, entry.quantity), 0)

/** Peça à venda com poucas unidades no total. */
export const isLowStock = (product: Pick<Product, 'available' | 'variantStock'>): boolean => {
  const total = getTotalStock(product.variantStock)
  return product.available !== false && total > 0 && total <= LOW_STOCK_LIMIT
}

export type LowStockVariant = VariantStock & { productId: number; productName: string }

/**
 * Variações de peças ativas que estão acabando ou zeradas, das mais críticas para as menos.
 * Com uma loja escolhida, olha só o estoque daquela loja.
 */
export const getLowStockVariants = (products: Product[], unitId?: string | null): LowStockVariant[] =>
  products
    .filter((product) => product.enabled !== false)
    .flatMap((product) => (product.variantStock || [])
      .map((variant) => ({
        ...variant,
        quantity: unitId && product.unitStock ? getUnitStock(product.unitStock, unitId, variant.size, variant.color) : variant.quantity
      }))
      .filter((variant) => variant.quantity <= LOW_STOCK_LIMIT)
      .map((variant) => ({ ...variant, productId: product.id, productName: product.name })))
    .sort((first, second) => first.quantity - second.quantity || first.productName.localeCompare(second.productName, 'pt-BR'))
