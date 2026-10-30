import { PaymentMethod, Product } from '../types/store'
import { storeConfig } from '../config/store'
import { getSizeFitLabel } from '../utils/productSize'

type OrderDetails = {
  reference: string
  name: string
  phone: string
  email?: string
  unitName: string
  unitAddress: string
  attendant: string
  storePhone: string
  fulfillment: string
  street: string
  houseNumber: string
  complement: string
  neighborhood: string
  postalCode: string
  deliveryCity: string
  referencePoint: string
  deliveryNotes: string
  deliveryFee: number | null
  payment: PaymentMethod
  subtotal: number
  discount?: number
  couponCode?: string
  /** Pix copia e cola disponível no site depois do pedido. */
  pixAvailable?: boolean
  /** Até quando as peças ficam separadas. */
  reservedUntil?: string | null
}

export type OrderMessageItem = {
  product: Pick<Product, 'name' | 'sizeFit' | 'sizes'>
  size: string
  color: string
  quantity: number
}

export const createOrderMessage = (items: OrderMessageItem[], order: OrderDetails) => {
  const lines = items.map(
    ({ product, size, color, quantity }) =>
      `${quantity}x ${product.name}\n  Tamanho: ${size}${getSizeFitLabel(product) ? ` (${getSizeFitLabel(product)})` : ''} | Cor: ${color}`
  )

  const deliveryAddress = order.fulfillment === 'Entrega'
    ? [
        `Endereço: ${order.street}, ${order.houseNumber}${order.complement ? `, ${order.complement}` : ''}`,
        `Bairro: ${order.neighborhood}`,
        `Município/região: ${order.deliveryCity}`,
        order.postalCode ? `CEP: ${order.postalCode}` : '',
        order.referencePoint ? `Ponto de referência: ${order.referencePoint}` : '',
        order.deliveryNotes ? `Observação: ${order.deliveryNotes}` : ''
      ]
    : ['Forma de recebimento: Retirada na loja', `Local de retirada: ${order.unitAddress}`]

  const deliveryFee = order.fulfillment === 'Entrega' ? order.deliveryFee : 0
  const separator = '━━━━━━━━━━━━━━━━━━━━'

  return [
    `\u{1F514} *NOVO PEDIDO — ${storeConfig.name.toUpperCase()}!*`,
    `\u{1F4C4} *Código do pedido: ${order.reference}*`,
    separator,
    '*DADOS DO PEDIDO*',
    '',
    '\u{1F464} *DADOS DO CLIENTE*',
    `Nome: ${order.name}`,
    `Telefone: ${order.phone}`,
    order.email ? `E-mail: ${order.email}` : '',
    order.couponCode ? `Cupom aplicado: ${order.couponCode}` : '',
    '',
    separator,
    '\u{1F3E0} *UNIDADE E ATENDIMENTO*',
    `Unidade: ${order.unitName}`,
    `Endereço da unidade: ${order.unitAddress}`,
    `Atendente: ${order.attendant} (+${order.storePhone})`,
    '',
    separator,
    `${order.fulfillment === 'Entrega' ? '\u{1F4CD} *ENDEREÇO DE ENTREGA*' : '\u{1F4E6} *RETIRADA NA LOJA*'}`,
    ...deliveryAddress,
    '',
    separator,
    '\u{1F6CD}\u{FE0F} *ITENS DO PEDIDO*',
    ...lines,
    '',
    separator,
    '\u{1F4B0} *RESUMO DOS VALORES*',
    `Subtotal: ${formatPrice(order.subtotal)}`,
    (order.discount ?? 0) > 0 ? `Desconto (Cupom ${order.couponCode}): -${formatPrice(order.discount!)}` : '',
    `Taxa de entrega: ${deliveryFee === null ? 'a confirmar com a atendente' : formatPrice(deliveryFee)}`,
    `TOTAL: ${deliveryFee === null ? 'a confirmar após calcular o frete' : formatPrice(order.subtotal - (order.discount ?? 0) + deliveryFee)}`,
    '',
    separator,
    '\u{1F4B3} *FORMA DE PAGAMENTO*',
    order.payment === 'Pix'
      ? order.pixAvailable
        ? 'PIX — Vou pagar pelo Pix copia e cola do site e envio o comprovante aqui.'
        : 'PIX — Aguardo as instruções de pagamento Pix da atendente.'
      : order.payment === 'Link de pagamento'
      ? 'Link de pagamento — aguardo o envio do link seguro pela atendente.'
      : `${order.payment} — confirmar detalhes com a atendente`,
    '',
    order.reservedUntil ? `\u{23F3} Peças separadas para mim até ${new Date(order.reservedUntil).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.` : '',
    '_Pedido sujeito à confirmação de disponibilidade, frete e pagamento pela atendente._'
  ]
    .filter(Boolean)
    .join('\n')
}

export const createOrderReference = () => {
  const randomValues = new Uint32Array(2)

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(randomValues)
  } else {
    randomValues[0] = Math.floor(Math.random() * 0xffffffff)
    randomValues[1] = Math.floor(Math.random() * 0xffffffff)
  }

  const code = Array.from(randomValues, (value) => value.toString(16).padStart(8, '0')).join('')
  return `BC-${code.toUpperCase()}`
}

export const createWhatsAppUrl = (message: string, phoneNumber: string) => {
  const destination = phoneNumber.replace(/\D/g, '')
  if (!/^\d{12,13}$/.test(destination)) {
    throw new Error('O número de WhatsApp selecionado é inválido.')
  }

  const parameters = new URLSearchParams({ text: message })
  return `https://api.whatsapp.com/send?phone=${destination}&${parameters.toString()}`
}

const formatPrice = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
