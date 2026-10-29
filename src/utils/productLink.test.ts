import { describe, expect, it } from '@jest/globals'
import { getProductIdFromPath, getProductPath, slugify } from './productLink'

describe('productLink', () => {
  it('gera slugs sem acentos e símbolos', () => {
    expect(slugify('Conjunto Bata Alfaiataria')).toBe('conjunto-bata-alfaiataria')
    expect(slugify('Blusa Rendada — Coleção Verão!')).toBe('blusa-rendada-colecao-verao')
  })

  it('monta o caminho do produto com id e nome', () => {
    expect(getProductPath({ id: 7, name: 'Conjunto Kimono Listrado' })).toBe('/produto/7-conjunto-kimono-listrado')
    expect(getProductPath({ id: 3, name: '!!!' })).toBe('/produto/3')
  })

  it('lê o id do caminho, mesmo se o nome tiver mudado', () => {
    expect(getProductIdFromPath('/produto/7-conjunto-kimono-listrado')).toBe(7)
    expect(getProductIdFromPath('/produto/7-nome-antigo')).toBe(7)
    expect(getProductIdFromPath('/produto/12')).toBe(12)
    expect(getProductIdFromPath('/produto/12/')).toBe(12)
  })

  it('ignora caminhos que não são de produto', () => {
    expect(getProductIdFromPath('/')).toBeNull()
    expect(getProductIdFromPath('/admin')).toBeNull()
    expect(getProductIdFromPath('/produto/abc')).toBeNull()
    expect(getProductIdFromPath('/produto/0')).toBeNull()
  })
})
