import { describe, expect, it } from '@jest/globals'
import { availableInUnit, buildVariantStock, getLowStockVariants, getTotalStock, getUnitStock, getUnitTotal, getVariantStock, isLowStock } from './inventory'
import { Product, VariantStock } from '../types/store'

const makeProduct = (overrides: Partial<Product>): Product => ({
  id: 1,
  name: 'Peça',
  category: 'Vestidos',
  description: '',
  price: 100,
  image: '',
  sizes: ['P'],
  colors: [{ name: 'Rosa', hex: '#fc8497' }],
  available: true,
  enabled: true,
  ...overrides
})

describe('estoque por loja', () => {
  const unitStock = [
    { unit: 'galeria-portuense', size: 'P', color: 'Rosa', quantity: 3 },
    { unit: 'cidade-nova-4', size: 'P', color: 'Rosa', quantity: 1 },
    { unit: 'cidade-nova-4', size: 'M', color: 'Rosa', quantity: 2 }
  ]
  const product = makeProduct({ unitStock, variantStock: [{ size: 'P', color: 'Rosa', quantity: 4 }, { size: 'M', color: 'Rosa', quantity: 2 }] })

  it('lê a quantidade de cada loja', () => {
    expect(getUnitStock(unitStock, 'galeria-portuense', 'P', 'Rosa')).toBe(3)
    expect(getUnitStock(unitStock, 'galeria-portuense', 'M', 'Rosa')).toBe(0)
    expect(getUnitTotal(product, 'cidade-nova-4')).toBe(3)
  })

  it('sem estoque por loja (antes da v5), vale o total', () => {
    expect(availableInUnit(product, 'cidade-nova-4', 'P', 'Rosa')).toBe(1)
    expect(availableInUnit(makeProduct({ variantStock: [{ size: 'P', color: 'Rosa', quantity: 4 }] }), 'cidade-nova-4', 'P', 'Rosa')).toBe(4)
  })

  it('estoque baixo olha a loja escolhida', () => {
    expect(getLowStockVariants([product], 'galeria-portuense').map((variant) => `${variant.size} ${variant.quantity}`)).toEqual(['M 0'])
    expect(getLowStockVariants([product], 'cidade-nova-4').map((variant) => `${variant.size} ${variant.quantity}`)).toEqual(['P 1', 'M 2'])
    expect(getLowStockVariants([product]).map((variant) => `${variant.size} ${variant.quantity}`)).toEqual(['M 2'])
  })
})

describe('stock helpers', () => {
  it('soma o estoque total ignorando valores negativos', () => {
    expect(getTotalStock([{ size: 'P', color: 'Rosa', quantity: 2 }, { size: 'M', color: 'Rosa', quantity: -1 }])).toBe(2)
    expect(getTotalStock(undefined)).toBe(0)
  })

  it('marca últimas unidades apenas com 1 ou 2 peças à venda', () => {
    expect(isLowStock(makeProduct({ variantStock: [{ size: 'P', color: 'Rosa', quantity: 2 }] }))).toBe(true)
    expect(isLowStock(makeProduct({ variantStock: [{ size: 'P', color: 'Rosa', quantity: 3 }] }))).toBe(false)
    expect(isLowStock(makeProduct({ variantStock: [{ size: 'P', color: 'Rosa', quantity: 0 }] }))).toBe(false)
    expect(isLowStock(makeProduct({ available: false, variantStock: [{ size: 'P', color: 'Rosa', quantity: 1 }] }))).toBe(false)
  })

  it('lista variações acabando de peças ativas, zeradas primeiro', () => {
    const products = [
      makeProduct({ id: 1, name: 'Vestido', variantStock: [{ size: 'P', color: 'Rosa', quantity: 2 }, { size: 'M', color: 'Rosa', quantity: 9 }] }),
      makeProduct({ id: 2, name: 'Blusa', variantStock: [{ size: 'P', color: 'Rosa', quantity: 0 }] }),
      makeProduct({ id: 3, name: 'Inativa', enabled: false, variantStock: [{ size: 'P', color: 'Rosa', quantity: 0 }] })
    ]
    expect(getLowStockVariants(products).map((variant) => `${variant.productName} ${variant.size} ${variant.quantity}`))
      .toEqual(['Blusa P 0', 'Vestido P 2'])
  })
})

describe('variant inventory', () => {
  const stock: VariantStock[] = [
    { size: 'P', color: 'Rosa', quantity: 3 },
    { size: 'M', color: 'Rosa', quantity: 1 }
  ]

  it('returns zero for variants without a saved quantity', () => {
    expect(getVariantStock(stock, 'G', 'Rosa')).toBe(0)
    expect(getVariantStock(undefined, 'P', 'Rosa')).toBe(0)
  })

  it('preserves matching quantities and initializes new variants at zero', () => {
    expect(buildVariantStock(['P', 'M', 'G'], ['Rosa', 'Preto'], stock)).toEqual([
      { size: 'P', color: 'Rosa', quantity: 3 },
      { size: 'P', color: 'Preto', quantity: 0 },
      { size: 'M', color: 'Rosa', quantity: 1 },
      { size: 'M', color: 'Preto', quantity: 0 },
      { size: 'G', color: 'Rosa', quantity: 0 },
      { size: 'G', color: 'Preto', quantity: 0 }
    ])
  })
})
