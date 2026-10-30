import { supabase } from './catalog'

export type StockReason = 'entrada' | 'ajuste' | 'reserva' | 'confirmacao' | 'venda_balcao' | 'cancelamento' | 'expiracao'

export type StockMovement = {
  id: number
  productId: number | null
  productName: string
  size: string
  color: string
  delta: number
  balanceAfter: number
  reason: StockReason
  orderReference: string | null
  note: string | null
  createdAt: string
}

export const stockReasonLabel: Record<StockReason, string> = {
  entrada: 'Entrada de mercadoria',
  ajuste: 'Ajuste no painel',
  reserva: 'Reserva de pedido do site',
  confirmacao: 'Pedido confirmado',
  venda_balcao: 'Venda no balcão',
  cancelamento: 'Pedido cancelado (voltou ao estoque)',
  expiracao: 'Reserva vencida (voltou ao estoque)'
}

type MovementRow = {
  id: number
  product_id: number | null
  product_name: string
  size: string
  color: string
  delta: number
  balance_after: number
  reason: StockReason
  order_reference: string | null
  note: string | null
  created_at: string
}

export const fetchStockMovements = async ({ productId, limit = 200 }: { productId?: number; limit?: number } = {}): Promise<StockMovement[]> => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  let query = supabase
    .from('stock_movements')
    .select('id,product_id,product_name,size,color,delta,balance_after,reason,order_reference,note,created_at')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)
  if (productId) query = query.eq('product_id', productId)
  const { data, error } = await query
  if (error) {
    if (/stock_movements|schema cache/i.test(error.message)) throw new Error('Rode supabase/v3-gestao.sql no SQL Editor do Supabase para liberar o histórico de estoque.')
    throw new Error(error.message)
  }
  return (data as MovementRow[]).map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    size: row.size,
    color: row.color,
    delta: row.delta,
    balanceAfter: row.balance_after,
    reason: row.reason,
    orderReference: row.order_reference,
    note: row.note,
    createdAt: row.created_at
  }))
}
