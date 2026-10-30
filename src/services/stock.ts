import { supabase } from './catalog'
import { UnitStock } from '../types/store'

export type StockReason = 'entrada' | 'ajuste' | 'reserva' | 'confirmacao' | 'venda_balcao' | 'cancelamento' | 'expiracao' | 'transferencia'

export type StockMovement = {
  id: number
  productId: number | null
  productName: string
  unitId: string | null
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
  ajuste: 'Correção de contagem',
  reserva: 'Reserva de pedido do site',
  confirmacao: 'Pedido confirmado',
  venda_balcao: 'Venda no balcão',
  cancelamento: 'Pedido cancelado (voltou ao estoque)',
  expiracao: 'Reserva vencida (voltou ao estoque)',
  transferencia: 'Transferência entre lojas'
}

type MovementRow = {
  id: number
  product_id: number | null
  product_name: string
  unit_id?: string | null
  size: string
  color: string
  delta: number
  balance_after: number
  reason: StockReason
  order_reference: string | null
  note: string | null
  created_at: string
}

const movementColumns = 'id,product_id,product_name,size,color,delta,balance_after,reason,order_reference,note,created_at'

const requireSupabase = () => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  return supabase
}

/** Histórico de estoque. A dona vê as duas lojas; a atendente, só a dela (regra do banco). */
export const fetchStockMovements = async ({ productId, unitId, limit = 200 }: { productId?: number; unitId?: string; limit?: number } = {}): Promise<StockMovement[]> => {
  const client = requireSupabase()
  const run = (columns: string, withUnit: boolean) => {
    let query = client
      .from('stock_movements')
      .select(columns)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit)
    if (productId) query = query.eq('product_id', productId)
    if (withUnit && unitId) query = query.eq('unit_id', unitId)
    return query
  }
  let { data, error } = await run(`${movementColumns},unit_id`, true)
  if (error && error.message.includes('unit_id')) ({ data, error } = await run(movementColumns, false))
  if (error) {
    if (/stock_movements|schema cache/i.test(error.message)) throw new Error('Rode supabase/v3-gestao.sql no SQL Editor do Supabase para liberar o histórico de estoque.')
    throw new Error(error.message)
  }
  return (data as unknown as MovementRow[]).map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    unitId: row.unit_id ?? null,
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

export const stockError = (message: string) => {
  if (/stock changed meanwhile/i.test(message)) return new Error('O estoque desta peça mudou enquanto você editava (entrou um pedido ou outra pessoa lançou). Recarregue e lance de novo.')
  if (/insufficient stock in this store/i.test(message)) return new Error('A loja de origem não tem essa quantidade. Confira o estoque e tente de novo.')
  if (/not authorized/i.test(message)) return new Error('Sua conta só pode mexer no estoque da sua loja.')
  if (/invalid store unit/i.test(message)) return new Error('Escolha duas lojas diferentes.')
  if (/invalid stock change|invalid transfer/i.test(message)) return new Error('Confira as quantidades (números inteiros, sem negativos) e as variações da peça.')
  if (/could not find the function|schema cache/i.test(message)) return new Error('Rode supabase/v5-unidades.sql no SQL Editor do Supabase para liberar o estoque por loja.')
  return new Error(message)
}

export type StockChange = { size: string; color: string; from: number; to: number }

/** Lança a grade de uma loja. Cada mudança leva o saldo visto (from) para não apagar uma venda feita no meio tempo. */
export const setUnitStock = async (productId: number, unitId: string, changes: StockChange[], reason: 'entrada' | 'ajuste', note?: string): Promise<UnitStock[]> => {
  const { data, error } = await requireSupabase().rpc('set_unit_stock', {
    p_product_id: productId,
    p_unit_id: unitId,
    p_changes: changes,
    p_reason: reason,
    p_note: note?.trim() || null
  })
  if (error) throw stockError(error.message)
  return (data || []) as UnitStock[]
}

export type TransferItem = { productId: number; size: string; color: string; quantity: number }

export const transferStock = async (fromUnit: string, toUnit: string, items: TransferItem[], note?: string): Promise<number> => {
  const { data, error } = await requireSupabase().rpc('transfer_stock', {
    p_from: fromUnit,
    p_to: toUnit,
    p_items: items,
    p_note: note?.trim() || null
  })
  if (error) throw stockError(error.message)
  return Number(data) || 0
}
