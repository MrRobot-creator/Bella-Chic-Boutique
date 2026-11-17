import { describe, expect, it } from '@jest/globals'
import { categoryKind } from '.'

describe('categoryKind', () => {
  it('reconhece as categorias da loja, no singular ou no plural, com ou sem acento', () => {
    expect(categoryKind('Blusa')).toBe('blusa')
    expect(categoryKind('Blusas')).toBe('blusa')
    expect(categoryKind('Calça')).toBe('calca')
    expect(categoryKind('Calcas')).toBe('calca')
    expect(categoryKind('Vestidos')).toBe('vestido')
    expect(categoryKind('Macacão')).toBe('macacao')
    expect(categoryKind('Conjuntos')).toBe('conjunto')
    expect(categoryKind('Combo')).toBe('combo')
    expect(categoryKind('Body')).toBe('body')
  })

  it('categoria desconhecida fica sem desenho (a bolinha usa a foto da peça)', () => {
    expect(categoryKind('Acessórios')).toBeUndefined()
  })
})
