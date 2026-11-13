import { nearestColorName, rankColors } from './colorDetect'

type Rgb = [number, number, number]
const SIZE = 20

/** Foto falsa: fundo de uma cor e o meio pintado por quem chama. */
const photo = (background: Rgb, paint: (x: number, y: number) => Rgb | null) => {
  const pixels = new Uint8ClampedArray(SIZE * SIZE * 4)
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const [r, g, b] = paint(x, y) || background
      pixels.set([r, g, b, 255], (y * SIZE + x) * 4)
    }
  }
  return pixels
}

const middle = (x: number, y: number) => x >= 7 && x < 13 && y >= 5 && y < 15

describe('Cores automáticas da foto', () => {
  it('acha a cor da roupa no meio da foto e ignora o fundo', () => {
    const pixels = photo([250, 250, 250], (x, y) => (middle(x, y) ? [200, 30, 40] : null))
    expect(rankColors(pixels, SIZE)[0]).toEqual({ name: 'Vermelho', hex: '#c81e28' })
  })

  it('desconta o fundo mesmo quando ele aparece no meio', () => {
    const pixels = photo([245, 214, 222], (x, y) => (middle(x, y) && y > 11 ? [26, 79, 143] : null))
    expect(rankColors(pixels, SIZE).map((color) => color.name)).toEqual(['Azul'])
  })

  it('desconta a pele da modelo quando tem roupa', () => {
    const pixels = photo([250, 250, 250], (x, y) => {
      if (!middle(x, y)) return null
      return y < 11 ? [205, 150, 120] : [61, 15, 26]
    })
    expect(rankColors(pixels, SIZE)[0].name).toBe('Vinho')
  })

  it('peça cor de pele ainda aparece', () => {
    const pixels = photo([250, 250, 250], (x, y) => (middle(x, y) ? [181, 118, 59] : null))
    expect(rankColors(pixels, SIZE)[0].name).toBe('Caramelo')
  })

  it('devolve até 3 cores, sem repetir nome', () => {
    const pixels = photo([250, 250, 250], (x, y) => {
      if (!middle(x, y)) return null
      if (y < 8) return [28, 28, 28]
      if (y < 11) return [30, 30, 30]
      return x < 10 ? [47, 111, 214] : [242, 200, 75]
    })
    const names = rankColors(pixels, SIZE).map((color) => color.name)
    expect(names).toHaveLength(3)
    expect(new Set(names).size).toBe(3)
    expect(names[0]).toBe('Preto')
  })

  it('foto sem pixel visível não sugere nada', () => {
    expect(rankColors(new Uint8ClampedArray(SIZE * SIZE * 4), SIZE)).toEqual([])
  })

  it('dá nome em português ao tom', () => {
    expect(nearestColorName('#c81e28')).toBe('Vermelho')
    expect(nearestColorName('#efb7cf')).toBe('Rosa')
    expect(nearestColorName('#111519')).toBe('Preto')
    expect(nearestColorName('#1e2b47')).toBe('Azul-marinho')
    expect(nearestColorName('#8dcdec')).toBe('Azul-claro')
    expect(nearestColorName('#cb90d0')).toBe('Lilás')
    expect(nearestColorName('#380d17')).toBe('Vinho')
    expect(nearestColorName('#e2d7bb')).toBe('Bege')
  })
})
