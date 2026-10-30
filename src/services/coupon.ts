import { supabase } from './catalog'

export type CouponKind = 'percent' | 'fixed'
export type CouponReason = 'not_found' | 'not_started' | 'expired' | 'limit' | 'min_subtotal'

export type CouponCheck = {
  valid: boolean
  reason?: CouponReason | null
  code?: string
  kind?: CouponKind
  value?: number
  minSubtotal?: number
  discount?: number
  oncePerCustomer?: boolean
  firstPurchaseOnly?: boolean
}

export type StoreCoupon = {
  code: string
  kind: CouponKind
  value: number
  minSubtotal: number
  startsAt: string | null
  endsAt: string | null
  maxUses: number | null
  oncePerCustomer: boolean
  firstPurchaseOnly: boolean
  active: boolean
  description: string | null
}

const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const normalizeCouponCode = (code: string) => code.trim().toUpperCase()

export const couponDiscount = (kind: CouponKind, value: number, subtotal: number) =>
  kind === 'percent'
    ? Math.round(subtotal * value) / 100
    : Math.min(value, subtotal)

export const describeCoupon = (coupon: Pick<StoreCoupon, 'kind' | 'value'>) =>
  coupon.kind === 'percent' ? `${coupon.value}% de desconto` : `${formatPrice(coupon.value)} de desconto`

/** Mensagem para a cliente depois de conferir o cupom. */
export const couponMessage = (check: CouponCheck, code: string) => {
  const label = normalizeCouponCode(code) || 'informado'
  if (check.valid && check.kind && check.value !== undefined) {
    return `Cupom ${check.code || label} aplicado: ${describeCoupon({ kind: check.kind, value: check.value })}.`
  }
  switch (check.reason) {
    case 'min_subtotal':
      return `O cupom ${label} vale para compras a partir de ${formatPrice(check.minSubtotal || 0)}.`
    case 'not_started':
      return `O cupom ${label} ainda não começou a valer.`
    case 'expired':
      return `O cupom ${label} já venceu.`
    case 'limit':
      return `O cupom ${label} já atingiu o limite de usos.`
    default:
      return `Cupom ${label} não encontrado. Confira se digitou certo.`
  }
}

/** Regra antiga (antes do v3-gestao.sql): só o BELLA10, 10% a partir de R$ 300. */
export const legacyCouponCheck = (code: string, subtotal: number): CouponCheck => {
  if (normalizeCouponCode(code) !== 'BELLA10') return { valid: false, reason: 'not_found' }
  return {
    valid: subtotal >= 300,
    reason: subtotal >= 300 ? null : 'min_subtotal',
    code: 'BELLA10',
    kind: 'percent',
    value: 10,
    minSubtotal: 300,
    discount: couponDiscount('percent', 10, subtotal),
    oncePerCustomer: true,
    firstPurchaseOnly: false
  }
}

export const checkCoupon = async (code: string, subtotal: number): Promise<CouponCheck> => {
  if (!supabase) return legacyCouponCheck(code, subtotal)
  const { data, error } = await supabase.rpc('check_coupon', { p_code: normalizeCouponCode(code), p_subtotal: subtotal })
  if (error) {
    if (/could not find the function|schema cache/i.test(error.message)) return legacyCouponCheck(code, subtotal)
    throw new Error('Não foi possível conferir o cupom agora. Tente novamente.')
  }
  const check = data as CouponCheck
  return {
    ...check,
    value: check.value === undefined ? undefined : Number(check.value),
    minSubtotal: check.minSubtotal === undefined ? undefined : Number(check.minSubtotal),
    discount: check.discount === undefined ? undefined : Number(check.discount)
  }
}

/* ---------- Painel ---------- */

type CouponRow = {
  code: string
  kind: CouponKind
  value: number | string
  min_subtotal: number | string
  starts_at: string | null
  ends_at: string | null
  max_uses: number | null
  once_per_customer: boolean
  first_purchase_only: boolean
  active: boolean
  description: string | null
}

const toCoupon = (row: CouponRow): StoreCoupon => ({
  code: row.code,
  kind: row.kind,
  value: Number(row.value),
  minSubtotal: Number(row.min_subtotal),
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  maxUses: row.max_uses,
  oncePerCustomer: row.once_per_customer,
  firstPurchaseOnly: row.first_purchase_only,
  active: row.active,
  description: row.description
})

const toRow = (coupon: StoreCoupon) => ({
  code: normalizeCouponCode(coupon.code),
  kind: coupon.kind,
  value: coupon.value,
  min_subtotal: coupon.minSubtotal,
  starts_at: coupon.startsAt,
  ends_at: coupon.endsAt,
  max_uses: coupon.maxUses,
  once_per_customer: coupon.oncePerCustomer,
  first_purchase_only: coupon.firstPurchaseOnly,
  active: coupon.active,
  description: coupon.description?.trim() || null,
  updated_at: new Date().toISOString()
})

const requireSupabase = () => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  return supabase
}

const couponAdminError = (message: string) => {
  if (/store_coupons|schema cache/i.test(message)) return new Error('Rode supabase/v3-gestao.sql no SQL Editor do Supabase para liberar os cupons.')
  if (/duplicate key/i.test(message)) return new Error('Já existe um cupom com este código.')
  if (/store_coupons_code_check/i.test(message)) return new Error('Use de 3 a 30 letras, números, - ou _ no código.')
  if (/store_coupons_percent_check/i.test(message)) return new Error('O desconto em porcentagem vai até 90%.')
  if (/store_coupons_period_check/i.test(message)) return new Error('A data de fim precisa ser depois da data de início.')
  return new Error(message)
}

export const fetchCoupons = async (): Promise<StoreCoupon[]> => {
  const { data, error } = await requireSupabase().from('store_coupons').select('*').order('created_at', { ascending: false })
  if (error) throw couponAdminError(error.message)
  return (data as CouponRow[]).map(toCoupon)
}

export const saveCoupon = async (coupon: StoreCoupon, isNew: boolean): Promise<StoreCoupon> => {
  const client = requireSupabase()
  const row = toRow(coupon)
  const query = isNew
    ? client.from('store_coupons').insert(row)
    : client.from('store_coupons').update(row).eq('code', row.code)
  const { data, error } = await query.select('*').single()
  if (error) throw couponAdminError(error.message)
  return toCoupon(data as CouponRow)
}

export const deleteCoupon = async (code: string): Promise<void> => {
  const { error } = await requireSupabase().from('store_coupons').delete().eq('code', code)
  if (error) throw couponAdminError(error.message)
}
