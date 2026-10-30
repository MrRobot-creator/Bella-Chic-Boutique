import { describe, expect, it } from '@jest/globals'
import { couponDiscount, couponMessage, describeCoupon, legacyCouponCheck, normalizeCouponCode } from './coupon'

describe('Cupons', () => {
  it('calcula desconto em porcentagem e em reais', () => {
    expect(couponDiscount('percent', 10, 350)).toBe(35)
    expect(couponDiscount('percent', 15, 99.9)).toBe(14.99)
    expect(couponDiscount('fixed', 20, 150)).toBe(20)
    expect(couponDiscount('fixed', 50, 30)).toBe(30)
  })

  it('normaliza o código digitado', () => {
    expect(normalizeCouponCode('  bella10 ')).toBe('BELLA10')
  })

  it('mantém a regra antiga do BELLA10 enquanto o banco não é atualizado', () => {
    expect(legacyCouponCheck('Bella10', 300)).toMatchObject({ valid: true, discount: 30, code: 'BELLA10' })
    expect(legacyCouponCheck('Bella10', 250)).toMatchObject({ valid: false, reason: 'min_subtotal' })
    expect(legacyCouponCheck('DESCONTO50', 500)).toMatchObject({ valid: false, reason: 'not_found' })
  })

  it('explica o resultado para a cliente', () => {
    expect(couponMessage({ valid: true, code: 'BELLA10', kind: 'percent', value: 10 }, 'bella10')).toBe('Cupom BELLA10 aplicado: 10% de desconto.')
    expect(couponMessage({ valid: false, reason: 'min_subtotal', minSubtotal: 300 }, 'bella10')).toContain('a partir de R$')
    expect(couponMessage({ valid: false, reason: 'expired' }, 'natal')).toBe('O cupom NATAL já venceu.')
    expect(couponMessage({ valid: false, reason: 'not_found' }, 'xyz')).toContain('não encontrado')
    expect(describeCoupon({ kind: 'fixed', value: 20 })).toContain('20,00')
  })
})
