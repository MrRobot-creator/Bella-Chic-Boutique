import { supabase } from './catalog'

export const VIP_CONSENT_TEXT = 'Aceito receber mensagens da Bella Chic Boutique no WhatsApp com novidades e cupons. Posso sair da lista quando quiser.'

export type VipSubscriber = {
  id: string
  name: string | null
  phone: string
  createdAt: string
  consentedAt: string
  consentText: string
  unsubscribedAt: string | null
}

export const joinVipList = async (name: string, phone: string, consent: boolean) => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  const { error } = await supabase.rpc('join_vip_list', {
    p_request: { name: name.trim(), phone: phone.trim(), consent, consentText: VIP_CONSENT_TEXT }
  })
  if (error) {
    if (/consent required/i.test(error.message)) throw new Error('Marque a autorização para entrar na lista.')
    if (/invalid customer phone/i.test(error.message)) throw new Error('Informe seu WhatsApp com DDD, por exemplo (91) 99999-9999.')
    if (/too many/i.test(error.message)) throw new Error('Muitos cadastros agora. Tente de novo em alguns minutos.')
    if (/could not find the function|schema cache/i.test(error.message)) throw new Error('A lista VIP ainda não foi ativada pela loja.')
    throw new Error('Não foi possível entrar na lista agora. Tente novamente.')
  }
}

type VipRow = {
  id: string
  name: string | null
  phone: string
  created_at: string
  consented_at: string
  consent_text: string
  unsubscribed_at: string | null
}

export const fetchVipSubscribers = async (): Promise<VipSubscriber[]> => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  const { data, error } = await supabase
    .from('vip_subscribers')
    .select('id,name,phone,created_at,consented_at,consent_text,unsubscribed_at')
    .order('created_at', { ascending: false })
    .limit(5000)
  if (error) {
    if (/vip_subscribers|schema cache/i.test(error.message)) throw new Error('Rode supabase/v3-gestao.sql no SQL Editor do Supabase para liberar a lista VIP.')
    throw new Error(error.message)
  }
  return (data as VipRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    createdAt: row.created_at,
    consentedAt: row.consented_at,
    consentText: row.consent_text,
    unsubscribedAt: row.unsubscribed_at
  }))
}

export const setVipUnsubscribed = async (id: string, unsubscribed: boolean) => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  const { error } = await supabase.from('vip_subscribers').update({ unsubscribed_at: unsubscribed ? new Date().toISOString() : null }).eq('id', id)
  if (error) throw new Error(error.message)
}

export const deleteVipSubscriber = async (id: string) => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  const { error } = await supabase.from('vip_subscribers').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
