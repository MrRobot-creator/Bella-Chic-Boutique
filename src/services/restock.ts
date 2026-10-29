import { supabase } from './catalog'

export type RestockRequest = {
  id: string
  product_id: number
  product_name: string
  size: string
  color: string
  customer_name: string | null
  phone: string
  phone_digits: string
  status: 'waiting' | 'notified'
  created_at: string
  notified_at: string | null
}

export type RestockRequestInput = {
  productId: number
  size: string
  color: string
  name?: string
  phone: string
}

const requireSupabase = () => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  return supabase
}

const restockError = (error: Error) => {
  const message = error.message.toLowerCase()
  if (message.includes('invalid customer phone')) {
    return new Error('Informe seu WhatsApp com DDD, por exemplo (91) 99999-9999.')
  }
  if (message.includes('too many restock requests')) {
    return new Error('Recebemos muitos pedidos de aviso agora. Tente novamente mais tarde.')
  }
  if (message.includes('invalid restock request')) {
    return new Error('Não conseguimos registrar o aviso para esta peça. Atualize a página e tente de novo.')
  }
  if (message.includes('restock_requests') || message.includes('create_restock_request')) {
    return new Error('O aviso de reposição ainda não foi configurado. Execute supabase/restock-alerts.sql no SQL Editor.')
  }
  return error
}

export const createRestockRequest = async (request: RestockRequestInput): Promise<void> => {
  const { error } = await requireSupabase().rpc('create_restock_request', { p_request: request })
  if (error) throw restockError(error)
}

export const fetchRestockRequests = async (): Promise<RestockRequest[]> => {
  const { data, error } = await requireSupabase()
    .from('restock_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300)
  if (error) throw restockError(error)
  return data as RestockRequest[]
}

export const markRestockNotified = async (id: string): Promise<void> => {
  const { error } = await requireSupabase()
    .from('restock_requests')
    .update({ status: 'notified', notified_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw restockError(error)
}

export const deleteRestockRequest = async (id: string): Promise<void> => {
  const { error } = await requireSupabase().from('restock_requests').delete().eq('id', id)
  if (error) throw restockError(error)
}

export const formatPhoneInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length > 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length > 6) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  if (digits.length > 2) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return digits
}
