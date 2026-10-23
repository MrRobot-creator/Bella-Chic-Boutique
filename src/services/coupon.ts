const ACCOUNTS_STORAGE_KEY = 'bella_chic_accounts'

type AccountStore = Record<string, { usedCoupons: string[] }>

export const hasUsedCoupon = (emailStr: string, coupon: string): boolean => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    if (!raw) return false
    const accounts: AccountStore = JSON.parse(raw)
    const normalizedEmail = emailStr.trim().toLowerCase()
    const normalizedCoupon = coupon.trim().toLowerCase()
    return accounts[normalizedEmail]?.usedCoupons?.includes(normalizedCoupon) || false
  } catch {
    return false
  }
}

export const recordCouponUsage = (emailStr: string, coupon: string): void => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    const accounts: AccountStore = raw ? JSON.parse(raw) : {}
    const normalizedEmail = emailStr.trim().toLowerCase()
    const normalizedCoupon = coupon.trim().toLowerCase()
    if (!accounts[normalizedEmail]) {
      accounts[normalizedEmail] = { usedCoupons: [] }
    }
    if (!accounts[normalizedEmail].usedCoupons.includes(normalizedCoupon)) {
      accounts[normalizedEmail].usedCoupons.push(normalizedCoupon)
    }
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts))
  } catch {
    // Ignore storage errors
  }
}

export const validateCoupon = (emailStr: string, couponCode: string, cartTotal: number = 0) => {
  const email = emailStr.trim()
  const code = couponCode.trim()

  if (!email || !email.includes('@')) {
    return { valid: false, message: 'Por favor, informe um e-mail válido antes de aplicar o cupom.' }
  }

  if (!code || code.toLowerCase() !== 'bella10') {
    return { valid: false, message: 'Cupom inválido. Utilize o cupom Bella10.' }
  }

  if (cartTotal < 300) {
    return { valid: false, message: 'O cupom Bella10 é válido apenas para compras a partir de R$ 300,00.' }
  }

  if (hasUsedCoupon(email, 'bella10')) {
    return { valid: false, message: 'Este cupom (Bella10) já foi utilizado por esta conta de e-mail.' }
  }

  return { valid: true, message: 'Cupom Bella10 aplicado com sucesso! 10% de desconto.' }
}
