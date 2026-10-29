import { supabase } from './catalog'
import { PaymentMethod } from '../types/store'
import { DeliveryCity } from './delivery'

export type StoreOrderStatus = 'pending' | 'confirmed' | 'cancelled'

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
  customer: { name: string; phone: string; email?: string }
  items: StoreOrderItem[]
  unit: { name: string; address: string; attendant: string; storePhone: string }
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
  payment: PaymentMethod
  subtotal: number
  discount: number
  couponCode: string | null
  created_at: string
  confirmed_at: string | null
}

export type CreateStoreOrderInput = Omit<StoreOrder, 'id' | 'status' | 'items' | 'subtotal' | 'discount' | 'couponCode' | 'created_at' | 'confirmed_at'> & {
  items: Array<Pick<StoreOrderItem, 'productId' | 'size' | 'color' | 'quantity'>>
  couponCode?: string
}

export type CreatedStoreOrder = {
  reference: string
  items: StoreOrderItem[]
  subtotal: number
  discount: number
  couponCode: string | null
}

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('O Supabase não está configurado para salvar pedidos.')
  }
  return supabase
}

const orderError = (error: Error) => {
  const message = error.message.toLocaleLowerCase('pt-BR')
  if (message.includes('too many orders from this phone')) {
    return new Error('Já recebemos alguns pedidos deste WhatsApp agora há pouco. Aguarde o contato da loja ou tente novamente em 30 minutos.')
  }
  if (message.includes('too many orders right now')) {
    return new Error('Estamos recebendo muitos pedidos neste momento. Tente novamente em alguns minutos ou chame a loja no WhatsApp.')
  }
  if (message.includes('coupon already used')) {
    return new Error('O cupom Bella10 já foi usado por este e-mail ou WhatsApp. Remova o cupom para continuar.')
  }
  if (message.includes('coupon requires email')) {
    return new Error('Informe seu e-mail para usar o cupom Bella10.')
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
  if (message.includes('insufficient stock')) {
    return new Error('O estoque mudou antes de registrar o pedido. Atualize a sacola e tente novamente.')
  }
  if (message.includes('only pending orders')) {
    return new Error('Este pedido já foi confirmado ou cancelado.')
  }
  if (message.includes('not authorized')) {
    return new Error('Sua conta não tem permissão para alterar pedidos.')
  }
  if (message.includes('store_orders') || message.includes('create_store_order') || message.includes('confirm_store_order') || message.includes('cancel_store_order')) {
    return new Error('O registro de pedidos ainda não foi configurado. Execute supabase/order-management.sql no SQL Editor.')
  }
  return error
}

export const createStoreOrder = async (order: CreateStoreOrderInput): Promise<CreatedStoreOrder> => {
  const { data, error } = await requireSupabase().rpc('create_store_order', { p_order: order })
  if (error) throw orderError(error)
  return data as CreatedStoreOrder
}

export const fetchAdminOrders = async (): Promise<StoreOrder[]> => {
  const { data, error } = await requireSupabase()
    .from('store_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw orderError(error)
  return data as StoreOrder[]
}

export const confirmStoreOrder = async (orderId: string): Promise<void> => {
  const { error } = await requireSupabase().rpc('confirm_store_order', { p_order_id: orderId })
  if (error) throw orderError(error)
}

export const cancelStoreOrder = async (orderId: string): Promise<void> => {
  const { error } = await requireSupabase().rpc('cancel_store_order', { p_order_id: orderId })
  if (error) throw orderError(error)
}
