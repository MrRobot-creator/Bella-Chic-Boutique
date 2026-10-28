import { describe, expect, it, beforeEach } from '@jest/globals'
import { recordCouponUsage, validateCoupon } from './coupon'

describe('Coupon and Account service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('validates Bella10 coupon successfully for a new email with cart total >= 300', () => {
    const result = validateCoupon('cliente@teste.com', 'Bella10', 300)
    expect(result.valid).toBe(true)
    expect(result.message).toContain('aplicado com sucesso')
  })

  it('rejects Bella10 coupon when cart total is below 300', () => {
    const result = validateCoupon('cliente@teste.com', 'Bella10', 250)
    expect(result.valid).toBe(false)
    expect(result.message).toContain('a partir de R$ 300,00')
  })

  it('rejects invalid coupon codes', () => {
    const result = validateCoupon('cliente@teste.com', 'DESCONTO50')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('Cupom inválido')
  })

  it('rejects empty or invalid emails', () => {
    const result = validateCoupon('invalid-email', 'Bella10')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('e-mail válido')
  })

  it('prevents reusing Bella10 coupon for the same email address', () => {
    const email = 'cliente@teste.com'
    expect(validateCoupon(email, 'Bella10', 300).valid).toBe(true)
    recordCouponUsage(email, 'Bella10')

    const secondTry = validateCoupon(email, 'Bella10', 300)
    expect(secondTry.valid).toBe(false)
    expect(secondTry.message).toContain('já foi utilizado')
  })
})
