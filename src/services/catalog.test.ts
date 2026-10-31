import { describe, expect, it } from '@jest/globals'
import { fitInside } from './catalog'

describe('Redução das fotos no envio', () => {
  it('cabe em 1600 px no lado maior mantendo a proporção', () => {
    expect(fitInside(3000, 4000)).toEqual({ width: 1200, height: 1600 })
    expect(fitInside(4032, 3024)).toEqual({ width: 1600, height: 1200 })
  })

  it('não aumenta foto que já é pequena', () => {
    expect(fitInside(800, 1000)).toEqual({ width: 800, height: 1000 })
  })
})
