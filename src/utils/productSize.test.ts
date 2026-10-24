import { Product } from '../types/store'
import { getSizeFitLabel } from './productSize'

const product = (sizes: string[], sizeFit?: string): Product => ({
  id: 1,
  name: 'Peça teste',
  category: 'Conjuntos',
  description: '',
  price: 100,
  image: '/product.jpg',
  sizes,
  sizeFit,
  colors: []
})

describe('getSizeFitLabel', () => {
  it('formats a numeric range for a unique size', () => {
    expect(getSizeFitLabel(product(['U'], '38-42'))).toBe('Veste do 38 ao 42')
  })

  it('supports unique-size labels with accents and range dashes', () => {
    expect(getSizeFitLabel(product(['Único'], '40–44'))).toBe('Veste do 40 ao 44')
  })

  it('does not show the unique-size fit for products with multiple sizes', () => {
    expect(getSizeFitLabel(product(['P', 'M', 'G'], '38-42'))).toBe('')
  })
})
