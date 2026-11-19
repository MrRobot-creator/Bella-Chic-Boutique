import { describe, expect, it } from '@jest/globals'
import { earnsGift, giftPromo } from './promo'

describe('brinde da Black Friday', () => {
  it('vale a partir do valor mínimo das peças após o desconto', () => {
    const min = giftPromo?.minSubtotal ?? 0
    expect(earnsGift(min)).toBe(true)
    expect(earnsGift(min + 50)).toBe(true)
    expect(earnsGift(min - 0.01)).toBe(false)
  })
})
