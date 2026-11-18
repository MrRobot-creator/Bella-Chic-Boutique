import type { StoreOrder } from '../services/orders'
import { isCompletedSale, orderStatusLabel } from '../services/orders'
import { storeConfig } from '../config/store'
import { orderUnitId } from './units'

export type UnitSales = {
  unitId: string
  name: string
  revenue: number
  count: number
  storeRevenue: number
  storeCount: number
  siteRevenue: number
  siteCount: number
}

export type SalesSummary = {
  confirmedCount: number
  pendingCount: number
  cancelledCount: number
  revenue: number
  storeRevenue: number
  storeCount: number
  siteRevenue: number
  siteCount: number
  averageTicket: number
  itemsSold: number
  topProducts: { productId: number; name: string; quantity: number; revenue: number }[]
  byUnit: UnitSales[]
}

/** Pedidos de uma loja (ou todos, sem loja escolhida). */
export const ordersOfUnit = <T extends Pick<StoreOrder, 'unit' | 'unit_id'>>(orders: T[], unitId: string | null) =>
  unitId ? orders.filter((order) => orderUnitId(order) === unitId) : orders

/** Valor das peças após desconto (sem frete), usado como faturamento. */
export const orderNetValue = (order: Pick<StoreOrder, 'subtotal' | 'discount'>) =>
  Math.max(0, Number(order.subtotal) - Number(order.discount))

export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

/** Segunda-feira da semana da data, à meia-noite (hora local). */
export const startOfWeek = (date: Date) => {
  const daysSinceMonday = (date.getDay() + 6) % 7
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday)
}

export const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1)

export type SalesPeriod = 'week' | 'month' | 'last-month' | '30d' | '90d' | 'year' | 'custom' | 'all'

/** Intervalo [since, until): since null = desde o início; until null = até agora. */
export type DateRange = { since: Date | null; until: Date | null }

/** Datas escolhidas no painel, no formato do campo de data (AAAA-MM-DD); as duas entram no período. */
export type CustomDates = { from: string; to: string }

const DAY = 86400000

/** Meia-noite (hora local) de uma data AAAA-MM-DD; null se não for uma data válida. */
export const parseDateInput = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

/** Data local no formato do campo de data (AAAA-MM-DD). */
export const toDateInput = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const shift = (date: Date, months: number, days = 0) =>
  new Date(date.getFullYear(), date.getMonth() + months, date.getDate() + days, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())

const earlier = (first: Date, second: Date) => (first < second ? first : second)

/** Intervalo do período; null quando as datas escolhidas estão incompletas ou invertidas. */
export const periodRange = (period: SalesPeriod, now = new Date(), custom?: CustomDates): DateRange | null => {
  switch (period) {
    case 'week': return { since: startOfWeek(now), until: null }
    case 'month': return { since: startOfMonth(now), until: null }
    case 'last-month': return { since: shift(startOfMonth(now), -1), until: startOfMonth(now) }
    case '30d': return { since: new Date(now.getTime() - 30 * DAY), until: null }
    case '90d': return { since: new Date(now.getTime() - 90 * DAY), until: null }
    case 'year': return { since: startOfYear(now), until: null }
    case 'custom': {
      const from = custom ? parseDateInput(custom.from) : null
      const to = custom ? parseDateInput(custom.to) : null
      if (!from || !to || from > to) return null
      return { since: from, until: shift(to, 0, 1) }
    }
    default: return { since: null, until: null }
  }
}

/**
 * Trecho equivalente antes do período, para comparar. Período em andamento compara até o mesmo ponto:
 * 1 a 18 de novembro contra 1 a 18 de outubro; esta semana até hoje contra a semana passada até o mesmo dia e hora.
 */
export const previousRange = (period: SalesPeriod, range: DateRange, now = new Date()): DateRange | null => {
  const { since } = range
  if (!since) return null
  const end = range.until || now
  switch (period) {
    case 'week': return { since: shift(since, 0, -7), until: shift(end, 0, -7) }
    case 'month':
    case 'last-month': return { since: shift(since, -1), until: earlier(shift(end, -1), since) }
    case 'year': return { since: shift(since, -12), until: earlier(shift(end, -12), since) }
    default: return { since: new Date(since.getTime() - (end.getTime() - since.getTime())), until: since }
  }
}

/** Pedidos criados dentro do intervalo. */
export const ordersInRange = <T extends Pick<StoreOrder, 'created_at'>>(orders: T[], { since, until }: DateRange) =>
  orders.filter((order) => {
    const time = new Date(order.created_at).getTime()
    return (!since || time >= since.getTime()) && (!until || time < until.getTime())
  })

/** Variação em % (inteira) em relação ao anterior; null quando o anterior é zero. */
export const changePercent = (current: number, previous: number) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null

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

  const byUnit = storeConfig.units.map((unit) => {
    const sales = confirmed.filter((order) => orderUnitId(order) === unit.id)
    const store = sales.filter((order) => order.channel === 'balcao')
    const round = (value: number) => Math.round(value * 100) / 100
    const unitRevenue = sales.reduce((total, order) => total + orderNetValue(order), 0)
    const unitStoreRevenue = store.reduce((total, order) => total + orderNetValue(order), 0)
    return {
      unitId: unit.id,
      name: unit.name,
      revenue: round(unitRevenue),
      count: sales.length,
      storeRevenue: round(unitStoreRevenue),
      storeCount: store.length,
      siteRevenue: round(unitRevenue - unitStoreRevenue),
      siteCount: sales.length - store.length
    }
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
    siteRevenue: Math.round((revenue - storeRevenue) * 100) / 100,
    siteCount: confirmed.length - storeSales.length,
    averageTicket: confirmed.length ? Math.round((revenue / confirmed.length) * 100) / 100 : 0,
    itemsSold: Array.from(byProduct.values()).reduce((total, product) => total + product.quantity, 0),
    topProducts,
    byUnit
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
