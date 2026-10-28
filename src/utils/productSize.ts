import { Product } from '../types/store'

export const getSizeFitLabel = (product: Pick<Product, 'sizeFit' | 'sizes'>) => {
  if (!product.sizeFit || product.sizes.length !== 1) return ''

  const normalizedSize = product.sizes[0]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
  if (!/^(u|unico|unica|tamanho unico)$/.test(normalizedSize)) return ''

  const fitRange = product.sizeFit.trim().match(/^(\d+)\s*[-–]\s*(\d+)$/)
  return fitRange
    ? `Veste do ${fitRange[1]} ao ${fitRange[2]}`
    : `Veste ${product.sizeFit.trim()}`
}
