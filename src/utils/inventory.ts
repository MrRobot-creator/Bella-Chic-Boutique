import { VariantStock } from '../types/store'

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
