import { supabase } from './catalog'
import { PaymentMethod } from '../types/store'
import { DeliveryCity } from './delivery'

export type StoreOrderStatus = 'pending' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type StoreOrderChannel = 'site' | 'balcao'

export type StoreOrderItem = {
  productId: number
  name: string
  size: string
  color: string
  sizeFit?: string
  sizes: string[]
  quantity: number
  unitPrice: number
}

export type StoreOrder = {
  id: string
  reference: string
  status: StoreOrderStatus
  channel: StoreOrderChannel
  customer: { name: string; phone: string; email?: string }
  items: StoreOrderItem[]
  unit: { name: string; address: string; attendant: string; storePhone: string }
  /** Loja do pedido (supabase/v5-unidades.sql). */
  unit_id?: string | null
  fulfillment: {
    type: 'Entrega' | 'Retirada na loja'
    street: string
    houseNumber: string
    complement: string
    neighborhood: string
    postalCode: string
    deliveryCity: DeliveryCity | ''
    referencePoint: string
    deliveryNotes: string
    deliveryFee: number | null
  }
  payment: PaymentMethod | 'Cartão de débito'
  subtotal: number
  discount: number
  couponCode: string | null
  created_at: string
  confirmed_at: string | null
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  reserved_until: string | null
  stock_taken: boolean
  review_token: string | null
  note: string | null
}

export type CreateStoreOrderInput = {
  reference: string
  customer: StoreOrder['customer']
  items: Array<Pick<StoreOrderItem, 'productId' | 'size' | 'color' | 'quantity'>>
  unit: StoreOrder['unit']
  fulfillment: StoreOrder['fulfillment']
  payment: PaymentMethod
  couponCode?: string
}

export type CreatedStoreOrder = {
  reference: string
  items: StoreOrderItem[]
  subtotal: number
  discount: number
  couponCode: string | null
  deliveryFee: number | null
  total: number
  reservedUntil: string | null
}

export type StoreSaleInput = {
  unitName: string
  unitAddress: string
  payment: StoreOrder['payment']
  items: Array<Pick<StoreOrderItem, 'productId' | 'size' | 'color' | 'quantity'>>
  discount?: number
  customerName?: string
  customerPhone?: string
  note?: string
}

/** Venda que conta no faturamento (confirmada em diante, sem cancelamento). */
export const isCompletedSale = (status: StoreOrderStatus) =>
  status === 'confirmed' || status === 'paid' || status === 'shipped' || status === 'delivered'

export const orderTotal = (order: Pick<StoreOrder, 'subtotal' | 'discount' | 'fulfillment'>) =>
  Math.max(0, Number(order.subtotal) - Number(order.discount)) + (order.fulfillment.deliveryFee || 0)

export const orderStatusLabel = (order: Pick<StoreOrder, 'status' | 'channel' | 'fulfillment'>) => {
  if (order.status === 'shipped') return order.fulfillment.type === 'Entrega' ? 'Saiu para entrega' : 'Pronto para retirar'
  if (order.status === 'delivered') return order.channel === 'balcao' ? 'Vendido no balcão' : 'Entregue'
  return {
    pending: 'Aguardando confirmação',
    confirmed: 'Confirmado',
    paid: 'Pago',
    cancelled: 'Cancelado'
  }[order.status]
}

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('O Supabase não está configurado para salvar pedidos.')
  }
  return supabase
}

export const orderError = (error: Error) => {
  const message = error.message.toLocaleLowerCase('pt-BR')
  if (message.includes('too many orders from this phone')) {
    return new Error('Já recebemos alguns pedidos deste WhatsApp agora há pouco. Aguarde o contato da loja ou tente novamente em 30 minutos.')
  }
  if (message.includes('too many orders right now')) {
    return new Error('Estamos recebendo muitos pedidos neste momento. Tente novamente em alguns minutos ou chame a loja no WhatsApp.')
  }
  if (message.includes('coupon already used')) {
    return new Error('Este cupom já foi usado por este e-mail ou WhatsApp. Remova o cupom para continuar.')
  }
  if (message.includes('coupon only for first purchase')) {
    return new Error('Este cupom vale só para a primeira compra. Remova o cupom para continuar.')
  }
  if (message.includes('coupon usage limit')) {
    return new Error('Este cupom já atingiu o limite de usos. Remova o cupom para continuar.')
  }
  if (message.includes('invalid or ineligible coupon')) {
    return new Error('O cupom não vale para este pedido (confira o valor mínimo e a validade). Remova o cupom para continuar.')
  }
  if (message.includes('coupon requires email')) {
    return new Error('Informe seu e-mail para usar o cupom.')
  }
  if (message.includes('invalid delivery fee')) {
    return new Error('Não conseguimos validar o frete. Escolha o município de entrega novamente.')
  }
  if (message.includes('invalid store unit')) {
    return new Error('Atualize a página e escolha a unidade e o WhatsApp da loja novamente.')
  }
  if (message.includes('invalid customer phone')) {
    return new Error('Informe seu WhatsApp com DDD, por exemplo (91) 99999-9999.')
  }
  if (message.includes('insufficient stock in this store')) {
    const product = error.message.match(/for product (.+)$/i)?.[1]
    return new Error(product
      ? `A loja escolhida não tem ${product} suficiente nesta variação. Troque a loja ou diminua a quantidade.`
      : 'A loja escolhida não tem estoque suficiente. Troque a loja ou diminua a quantidade.')
  }
  if (message.includes('insufficient stock')) {
    const product = error.message.match(/for product (.+)$/i)?.[1]
    return new Error(product
      ? `Não há estoque suficiente de ${product} nesta variação. Atualize a sacola e tente novamente.`
      : 'O estoque mudou antes de registrar o pedido. Atualize a sacola e tente novamente.')
  }
  if (message.includes('only pending orders')) return new Error('Este pedido já foi confirmado ou cancelado.')
  if (message.includes('confirm the order first')) return new Error('Confirme o pedido antes de avançar a etapa.')
  if (message.includes('order already cancelled')) return new Error('Este pedido já está cancelado.')
  if (message.includes('order already in this step')) return new Error('O pedido já passou desta etapa.')
  if (message.includes('invalid discount')) return new Error('O desconto não pode ser maior que o valor das peças.')
  if (message.includes('not authorized')) return new Error('Sua conta não tem permissão para alterar pedidos.')
  if (message.includes('could not find the function') || message.includes('schema cache')) {
    return new Error('Esta função precisa do banco atualizado: rode supabase/v3-gestao.sql no SQL Editor do Supabase.')
  }
  return error
}

type StoreOrderRow = Omit<StoreOrder, 'couponCode' | 'channel' | 'stock_taken'> & {
  coupon_code: string | null
  channel?: StoreOrderChannel
  stock_taken?: boolean
}

const toStoreOrder = ({ coupon_code: couponCode, ...row }: StoreOrderRow): StoreOrder => ({
  ...row,
  channel: row.channel || 'site',
  stock_taken: Boolean(row.stock_taken),
  paid_at: row.paid_at ?? null,
  shipped_at: row.shipped_at ?? null,
  delivered_at: row.delivered_at ?? null,
  cancelled_at: row.cancelled_at ?? null,
  cancel_reason: row.cancel_reason ?? null,
  reserved_until: row.reserved_until ?? null,
  review_token: row.review_token ?? null,
  note: row.note ?? null,
  subtotal: Number(row.subtotal),
  discount: Number(row.discount),
  couponCode
})

export const createStoreOrder = async (order: CreateStoreOrderInput): Promise<CreatedStoreOrder> => {
  const { data, error } = await requireSupabase().rpc('create_store_order', { p_order: order })
  if (error) throw orderError(error)
  const created = data as Partial<CreatedStoreOrder> & Pick<CreatedStoreOrder, 'reference' | 'items' | 'subtotal' | 'discount' | 'couponCode'>
  const subtotal = Number(created.subtotal)
  const discount = Number(created.discount)
  // Antes do v3-gestao.sql o servidor não devolvia frete e total: usa o que foi enviado.
  const deliveryFee = created.deliveryFee === undefined ? order.fulfillment.deliveryFee : created.deliveryFee === null ? null : Number(created.deliveryFee)
  return {
    reference: created.reference,
    items: created.items,
    subtotal,
    discount,
    couponCode: created.couponCode,
    deliveryFee,
    total: created.total === undefined ? subtotal - discount + (deliveryFee || 0) : Number(created.total),
    reservedUntil: created.reservedUntil ?? null
  }
}

export const fetchAdminOrders = async (limit = 150): Promise<StoreOrder[]> => {
  const client = requireSupabase()
  // Libera reservas vencidas antes de listar (ignora se o banco ainda não tem a função).
  await client.rpc('release_expired_reservations').then(() => undefined, () => undefined)
  const { data, error } = await client
    .from('store_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw orderError(error)
  return (data as StoreOrderRow[]).map(toStoreOrder)
}

/** Pedidos a partir de uma data (para o resumo e a exportação). */
export const fetchOrdersSince = async (since: Date | null, limit = 2000): Promise<StoreOrder[]> => {
  let query = requireSupabase()
    .from('store_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (since) query = query.gte('created_at', since.toISOString())
  const { data, error } = await query
  if (error) throw orderError(error)
  return (data as StoreOrderRow[]).map(toStoreOrder)
}

/** Pedidos da cliente logada (a regra de acesso do banco só devolve os dela). */
export const fetchMyOrders = async (userId: string): Promise<StoreOrder[]> => {
  const { data, error } = await requireSupabase()
    .from('store_orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw orderError(error)
  return (data as StoreOrderRow[]).map(toStoreOrder)
}

export const confirmStoreOrder = async (orderId: string): Promise<void> => {
  const { error } = await requireSupabase().rpc('confirm_store_order', { p_order_id: orderId })
  if (error) throw orderError(error)
}

export const updateOrderStatus = async (orderId: string, status: 'paid' | 'shipped' | 'delivered'): Promise<void> => {
  const { error } = await requireSupabase().rpc('update_order_status', { p_order_id: orderId, p_status: status })
  if (error) throw orderError(error)
}

export const cancelStoreOrder = async (orderId: string, reason?: string): Promise<void> => {
  const params = reason?.trim() ? { p_order_id: orderId, p_reason: reason.trim() } : { p_order_id: orderId }
  const { error } = await requireSupabase().rpc('cancel_store_order', params)
  if (error) throw orderError(error)
}

export const registerStoreSale = async (sale: StoreSaleInput): Promise<{ reference: string }> => {
  const { data, error } = await requireSupabase().rpc('register_store_sale', { p_sale: sale })
  if (error) throw orderError(error)
  return data as { reference: string }
}
