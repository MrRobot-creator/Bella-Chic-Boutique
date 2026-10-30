import { supabase } from './catalog'

/** E-mails automáticos de pedido (supabase/v4-emails.sql), enviados pelo Resend. */
export type EmailSettings = {
  enabled: boolean
  senderName: string
  senderAddress: string
  replyTo: string
  siteUrl: string
}

export type SentEmail = {
  id: number
  reference: string | null
  event: string
  toEmail: string
  subject: string
  createdAt: string
  statusCode: number | null
  error: string | null
}

const SETUP_MESSAGE = 'Rode supabase/v4-emails.sql no SQL Editor do Supabase para liberar os e-mails de pedido.'

const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/

export const isValidEmail = (value: string) => EMAIL_PATTERN.test(value.trim())

/** "Bella Chic <pedidos@loja.com.br>" → nome e endereço. */
export const parseSender = (from: string | null) => {
  const text = (from || '').trim()
  const match = text.match(/^(.*?)\s*<([^<>]+)>$/)
  if (match) return { name: match[1].replace(/"/g, '').trim(), address: match[2].trim() }
  return { name: '', address: text }
}

export const formatSender = (name: string, address: string) => {
  const cleanName = name.replace(/[<>"@]/g, '').replace(/\s+/g, ' ').trim()
  const cleanAddress = address.trim().toLowerCase()
  return cleanName ? `${cleanName} <${cleanAddress}>` : cleanAddress
}

/** Deixa o endereço do site como https://dominio, sem barra nem caminho. */
export const normalizeSiteUrl = (value: string) => {
  const text = value.trim()
  if (!text) return ''
  const withProtocol = /^https?:\/\//i.test(text) ? text : `https://${text}`
  try {
    const url = new URL(withProtocol)
    return `https://${url.host.toLowerCase()}`
  } catch {
    return ''
  }
}

/** O Resend só envia de domínio verificado: e-mail gratuito não pode ser o remetente. */
export const isFreeMailbox = (address: string) =>
  /@(gmail|googlemail|hotmail|outlook|live|yahoo|icloud|bol|uol|terra)\.[a-z.]+$/i.test(address.trim())

const eventLabels: Record<string, string> = {
  recebido: 'Pedido recebido',
  confirmed: 'Confirmado',
  paid: 'Pagamento recebido',
  shipped: 'Enviado / pronto para retirar',
  delivered: 'Entregue (avaliação)',
  cancelled: 'Cancelado'
}

export const emailEventLabel = (event: string) => eventLabels[event] || event

/**
 * Situação do envio para mostrar no painel. O Supabase guarda a resposta do Resend por
 * cerca de 6 horas; depois disso o envio aparece como "sem retorno".
 */
export const emailStatus = (email: SentEmail, now = Date.now()): 'sent' | 'waiting' | 'error' | 'unknown' => {
  if (email.error || (email.statusCode !== null && email.statusCode >= 300)) return 'error'
  if (email.statusCode !== null) return 'sent'
  return now - new Date(email.createdAt).getTime() < 15 * 60 * 1000 ? 'waiting' : 'unknown'
}

type SettingsRow = {
  order_emails_enabled: boolean
  email_from: string | null
  email_reply_to: string | null
  site_url: string | null
}

const toSettings = (row: SettingsRow): EmailSettings => {
  const sender = parseSender(row.email_from)
  return {
    enabled: row.order_emails_enabled,
    senderName: sender.name,
    senderAddress: sender.address,
    replyTo: row.email_reply_to || '',
    siteUrl: row.site_url || ''
  }
}

const isMissingSetup = (message: string) => /order_emails_enabled|email_from|recent_order_emails|send_test_order_email|schema cache|does not exist/i.test(message)

/** Volta null quando o banco ainda não tem a v4. */
export const fetchEmailSettings = async (): Promise<EmailSettings | null> => {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('store_settings')
    .select('order_emails_enabled,email_from,email_reply_to,site_url')
    .eq('id', 1)
    .maybeSingle()
  if (error || !data) return null
  return toSettings(data as SettingsRow)
}

export const updateEmailSettings = async (settings: EmailSettings): Promise<EmailSettings> => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  const address = settings.senderAddress.trim()
  const { data, error } = await supabase
    .from('store_settings')
    .update({
      order_emails_enabled: settings.enabled,
      email_from: address ? formatSender(settings.senderName, address) : null,
      email_reply_to: settings.replyTo.trim().toLowerCase() || null,
      site_url: normalizeSiteUrl(settings.siteUrl) || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)
    .select('order_emails_enabled,email_from,email_reply_to,site_url')
    .single()
  if (error) {
    if (/store_settings_email_check/.test(error.message)) throw new Error('Confira o remetente, o e-mail de resposta e o endereço do site.')
    if (isMissingSetup(error.message)) throw new Error(SETUP_MESSAGE)
    throw new Error(error.message)
  }
  return toSettings(data as SettingsRow)
}

export const sendTestEmail = async (to: string) => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  const { error } = await supabase.rpc('send_test_order_email', { p_to: to.trim() })
  if (error) {
    if (/missing resend key/i.test(error.message)) throw new Error('Falta guardar a chave do Resend no cofre do Supabase (passo 4 do guia).')
    if (/missing sender/i.test(error.message)) throw new Error('Salve o remetente antes de mandar o teste.')
    if (/invalid email/i.test(error.message)) throw new Error('Informe um e-mail válido para o teste.')
    if (isMissingSetup(error.message)) throw new Error(SETUP_MESSAGE)
    throw new Error(error.message)
  }
}

type SentEmailRow = {
  id: number
  reference: string | null
  event: string
  to_email: string
  subject: string
  created_at: string
  status_code: number | null
  error: string | null
}

export const fetchRecentEmails = async (limit = 20): Promise<SentEmail[]> => {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('recent_order_emails', { p_limit: limit })
  if (error) {
    if (isMissingSetup(error.message)) return []
    throw new Error(error.message)
  }
  return ((data || []) as SentEmailRow[]).map((row) => ({
    id: row.id,
    reference: row.reference,
    event: row.event,
    toEmail: row.to_email,
    subject: row.subject,
    createdAt: row.created_at,
    statusCode: row.status_code,
    error: row.error
  }))
}
