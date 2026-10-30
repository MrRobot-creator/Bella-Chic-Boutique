import type { StoreOrder } from '../services/orders'
import { isCompletedSale, orderStatusLabel } from '../services/orders'

export type SalesSummary = {
  confirmedCount: number
  pendingCount: number
  cancelledCount: number
  revenue: number
  storeRevenue: number
  storeCount: number
  averageTicket: number
  itemsSold: number
  topProducts: { productId: number; name: string; quantity: number; revenue: number }[]
}

/** Valor das peças após desconto (sem frete), usado como faturamento. */
export const orderNetValue = (order: Pick<StoreOrder, 'subtotal' | 'discount'>) =>
  Math.max(0, Number(order.subtotal) - Number(order.discount))

export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

export const buildSalesSummary = (orders: StoreOrder[], since: Date): SalesSummary => {
  const inPeriod = orders.filter((order) => new Date(order.created_at) >= since)
  const confirmed = inPeriod.filter((order) => isCompletedSale(order.status))
  const storeSales = confirmed.filter((order) => order.channel === 'balcao')
  const storeRevenue = storeSales.reduce((total, order) => total + orderNetValue(order), 0)
  const revenue = confirmed.reduce((total, order) => total + orderNetValue(order), 0)

  const byProduct = new Map<number, { productId: number; name: string; quantity: number; revenue: number }>()
  confirmed.forEach((order) => {
    order.items.forEach((item) => {
      const current = byProduct.get(item.productId) || { productId: item.productId, name: item.name, quantity: 0, revenue: 0 }
      current.quantity += item.quantity
      current.revenue += item.quantity * Number(item.unitPrice)
      byProduct.set(item.productId, current)
    })
  })

  const topProducts = Array.from(byProduct.values())
    .sort((first, second) => second.quantity - first.quantity || second.revenue - first.revenue)
    .slice(0, 5)

  return {
    confirmedCount: confirmed.length,
    pendingCount: inPeriod.filter((order) => order.status === 'pending').length,
    cancelledCount: inPeriod.filter((order) => order.status === 'cancelled').length,
    revenue: Math.round(revenue * 100) / 100,
    storeRevenue: Math.round(storeRevenue * 100) / 100,
    storeCount: storeSales.length,
    averageTicket: confirmed.length ? Math.round((revenue / confirmed.length) * 100) / 100 : 0,
    itemsSold: Array.from(byProduct.values()).reduce((total, product) => total + product.quantity, 0),
    topProducts
  }
}


const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value)
  // Evita que o Excel interprete textos começando com = + - @ como fórmulas.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

const money = (value: number) => value.toFixed(2).replace('.', ',')

/** Planilha CSV (separada por ponto e vírgula, abre direto no Excel em português). */
export const ordersToCsv = (orders: StoreOrder[]) => {
  const header = [
    'Pedido', 'Data', 'Status', 'Canal', 'Cliente', 'WhatsApp', 'E-mail', 'Unidade', 'Atendimento', 'Pagamento',
    'Entrega', 'Cidade', 'Bairro', 'Peças', 'Qtd. peças', 'Subtotal', 'Desconto', 'Cupom', 'Frete', 'Total'
  ]
  const rows = orders.map((order) => {
    const fee = order.fulfillment.deliveryFee
    const total = orderNetValue(order) + (fee || 0)
    return [
      order.reference,
      new Date(order.created_at).toLocaleString('pt-BR'),
      orderStatusLabel(order),
      order.channel === 'balcao' ? 'Balcão' : 'Site',
      order.customer.name,
      order.customer.phone,
      order.customer.email || '',
      order.unit.name,
      order.unit.attendant,
      order.payment,
      order.fulfillment.type,
      order.fulfillment.type === 'Entrega' ? order.fulfillment.deliveryCity : '',
      order.fulfillment.type === 'Entrega' ? order.fulfillment.neighborhood : '',
      order.items.map((item) => `${item.quantity}x ${item.name} (${item.size}, ${item.color})`).join(' | '),
      order.items.reduce((sum, item) => sum + item.quantity, 0),
      money(Number(order.subtotal)),
      money(Number(order.discount)),
      order.couponCode || '',
      fee === null ? 'a combinar' : money(fee),
      money(total)
    ]
  })
  return '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')
}

export const downloadTextFile = (fileName: string, content: string, type = 'text/csv;charset=utf-8') => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
