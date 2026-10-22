import { describe, expect, it, beforeEach } from '@jest/globals'
import { hasUsedCoupon, recordCouponUsage, validateCoupon } from './coupon'

describe('Coupon and Account service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('validates Bella10 coupon successfully for a new email', () => {
    const result = validateCoupon('cliente@teste.com', 'Bella10')
    expect(result.valid).toBe(true)
    expect(result.message).toContain('aplicado com sucesso')
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
    expect(validateCoupon(email, 'Bella10').valid).toBe(true)
    recordCouponUsage(email, 'Bella10')

    const secondTry = validateCoupon(email, 'Bella10')
    expect(secondTry.valid).toBe(false)
    expect(secondTry.message).toContain('já foi utilizado')
  })
})
