import type { StoreOrder } from '../services/orders'
import { orderTotal } from '../services/orders'
import type { StoreSettings } from '../services/settings'
import { buildPixPayload } from './pix'

export type MessageStep = 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || ''

export const reviewUrl = (order: Pick<StoreOrder, 'review_token'>, origin: string) =>
  order.review_token ? `${origin.replace(/\/+$/, '')}/avaliar/${order.review_token}` : ''

export const orderPixPayload = (order: Pick<StoreOrder, 'reference' | 'subtotal' | 'discount' | 'fulfillment'>, settings: StoreSettings) =>
  settings.pixKey && settings.pixName && settings.pixCity
    ? buildPixPayload({ key: settings.pixKey, name: settings.pixName, city: settings.pixCity, amount: orderTotal(order), txid: order.reference })
    : ''

/** Mensagem pronta para mandar à cliente em cada etapa do pedido. */
export const orderStatusMessage = (order: StoreOrder, step: MessageStep, settings: StoreSettings, origin: string) => {
  const name = firstName(order.customer.name)
  const hello = name ? `Oi, ${name}!` : 'Oi!'
  const total = formatPrice(orderTotal(order))
  const items = order.items.map((item) => `• ${item.quantity}x ${item.name} (${item.size}, ${item.color})`).join('\n')

  if (step === 'confirmed') {
    const pix = order.payment === 'Pix' ? orderPixPayload(order, settings) : ''
    return [
      `${hello} Seu pedido ${order.reference} na Bella Chic está confirmado ✨`,
      '',
      items,
      '',
      `Total: ${total}${order.fulfillment.type === 'Entrega' ? ' (com entrega)' : ''}`,
      pix ? '\nPara pagar com Pix, copie o código abaixo e cole no app do seu banco (Pix copia e cola):' : '',
      pix,
      pix ? '\nDepois é só me mandar o comprovante por aqui \u{1F497}' : ''
    ].filter((line) => line !== '').join('\n')
  }
  if (step === 'paid') {
    return `${hello} Recebemos o pagamento do pedido ${order.reference}. Obrigada! Já estamos separando tudo com carinho \u{1F497}`
  }
  if (step === 'shipped') {
    return order.fulfillment.type === 'Entrega'
      ? `${hello} Seu pedido ${order.reference} saiu para entrega \u{1F6F5} Em breve chega aí em ${order.fulfillment.neighborhood || order.fulfillment.deliveryCity}.`
      : `${hello} Seu pedido ${order.reference} está pronto para retirar na ${order.unit.name} (${order.unit.address}). Te esperamos!`
  }
  if (step === 'delivered') {
    const link = reviewUrl(order, origin)
    return [
      `${hello} Esperamos que você ame suas peças \u{1F497}`,
      link ? `Se puder, conta pra gente o que achou (com foto, se quiser): ${link}` : '',
      'Obrigada por comprar na Bella Chic!'
    ].filter(Boolean).join('\n')
  }
  return [
    `${hello} O pedido ${order.reference} foi cancelado.`,
    order.cancel_reason ? `Motivo: ${order.cancel_reason}` : '',
    'Se quiser, posso te ajudar a escolher outra peça.'
  ].filter(Boolean).join('\n')
}

/** Telefone da cliente no formato do WhatsApp (55 + DDD + número). */
export const customerWhatsApp = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`
}
