import { describe, expect, it } from '@jest/globals'
import { buildVariantStock, getVariantStock } from './inventory'
import { VariantStock } from '../types/store'

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
