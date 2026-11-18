import { describe, expect, it } from '@jest/globals'
import {
  buildSalesSummary, changePercent, ordersInRange, ordersOfUnit, ordersToCsv, parseDateInput, periodRange, previousRange,
  startOfWeek, startOfYear, toDateInput
} from './reports'
import type { StoreOrder } from '../services/orders'

const order = (overrides: Partial<StoreOrder>): StoreOrder => ({
  id: 'id',
  reference: 'BC-0000000000000001',
  status: 'confirmed',
  customer: { name: 'Ana', phone: '(91) 99999-9999', email: 'ana@exemplo.com' },
  items: [{ productId: 1, name: 'Vestido Dress', size: 'M', color: 'Rosa', sizes: ['M'], quantity: 2, unitPrice: 100 }],
  unit: { name: 'Cidade Nova 4', address: 'Av.', attendant: 'Atendente 1', storePhone: '5591980408420' },
  fulfillment: {
    type: 'Entrega', street: 'Rua A', houseNumber: '1', complement: '', neighborhood: 'Centro', postalCode: '',
    deliveryCity: 'Ananindeua', referencePoint: '', deliveryNotes: '', deliveryFee: 12
  },
  payment: 'Pix',
  subtotal: 200,
  discount: 20,
  couponCode: 'Bella10',
  created_at: '2026-10-10T12:00:00Z',
  confirmed_at: null,
  channel: 'site',
  paid_at: null,
  shipped_at: null,
  delivered_at: null,
  cancelled_at: null,
  cancel_reason: null,
  reserved_until: null,
  stock_taken: true,
  review_token: null,
  note: null,
  ...overrides
})

describe('buildSalesSummary', () => {
  it('soma só vendas confirmadas do período e ranqueia as peças', () => {
    const summary = buildSalesSummary([
      order({}),
      order({ id: '2', items: [{ productId: 2, name: 'Blusa', size: 'P', color: 'Branco', sizes: ['P'], quantity: 1, unitPrice: 80 }], subtotal: 80, discount: 0 }),
      order({ id: '3', status: 'pending', subtotal: 500, discount: 0 }),
      order({ id: '4', status: 'cancelled' }),
      order({ id: '5', created_at: '2026-09-30T12:00:00Z' })
    ], new Date('2026-10-01T00:00:00Z'))

    expect(summary.confirmedCount).toBe(2)
    expect(summary.pendingCount).toBe(1)
    expect(summary.cancelledCount).toBe(1)
    expect(summary.revenue).toBe(260)
    expect(summary.averageTicket).toBe(130)
    expect(summary.itemsSold).toBe(3)
    expect(summary.topProducts.map((product) => product.name)).toEqual(['Vestido Dress', 'Blusa'])
  })

  it('conta pago, enviado, entregue e balcão como venda, e separa o balcão', () => {
    const summary = buildSalesSummary([
      order({ status: 'paid' }),
      order({ id: '2', status: 'delivered', channel: 'balcao', subtotal: 100, discount: 0 }),
      order({ id: '3', status: 'shipped', subtotal: 50, discount: 0 })
    ], new Date('2026-10-01T00:00:00Z'))
    expect(summary.confirmedCount).toBe(3)
    expect(summary.revenue).toBe(330)
    expect(summary.storeCount).toBe(1)
    expect(summary.storeRevenue).toBe(100)
    expect(summary.siteCount).toBe(2)
    expect(summary.siteRevenue).toBe(230)
  })

  it('separa o faturamento por loja (pelo unit_id ou pelo nome gravado no pedido)', () => {
    const cidade = { name: 'Cidade Nova 4', address: '', attendant: '', storePhone: '' }
    const orders = [
      order({ unit: { name: 'Galeria Portuense', address: '', attendant: '', storePhone: '' } }),
      order({ id: '2', unit_id: 'cidade-nova-4', unit: cidade, subtotal: 100, discount: 0 }),
      order({ id: '3', unit: cidade, channel: 'balcao', status: 'delivered', subtotal: 50, discount: 0 }),
      order({ id: '4', unit: cidade, status: 'cancelled', subtotal: 999, discount: 0 })
    ]
    const summary = buildSalesSummary(orders, new Date('2026-10-01T00:00:00Z'))
    const galeria = summary.byUnit.find((unit) => unit.unitId === 'galeria-portuense')
    const cidadeNova = summary.byUnit.find((unit) => unit.unitId === 'cidade-nova-4')
    expect(galeria?.revenue).toBe(180)
    expect(cidadeNova).toMatchObject({ revenue: 150, count: 2, storeRevenue: 50, storeCount: 1, siteRevenue: 100, siteCount: 1 })
    expect(ordersOfUnit(orders, 'cidade-nova-4').map((item) => item.id)).toEqual(['2', '3', '4'])
    expect(ordersOfUnit(orders, null)).toHaveLength(4)
  })
})

describe('períodos do resumo', () => {
  it('a semana começa na segunda-feira, à meia-noite', () => {
    expect(startOfWeek(new Date(2026, 10, 18, 15, 30))).toEqual(new Date(2026, 10, 16))
    expect(startOfWeek(new Date(2026, 10, 16, 9))).toEqual(new Date(2026, 10, 16))
    expect(startOfWeek(new Date(2026, 10, 22, 20))).toEqual(new Date(2026, 10, 16))
    expect(startOfWeek(new Date(2026, 11, 2))).toEqual(new Date(2026, 10, 30))
  })

  it('o ano começa em 1º de janeiro', () => {
    expect(startOfYear(new Date(2026, 10, 18))).toEqual(new Date(2026, 0, 1))
  })

  it('datas escolhidas entram inteiras e são recusadas se invertidas ou inválidas', () => {
    expect(periodRange('custom', new Date(), { from: '2026-11-27', to: '2026-11-30' }))
      .toEqual({ since: new Date(2026, 10, 27), until: new Date(2026, 11, 1) })
    expect(periodRange('custom', new Date(), { from: '2026-11-30', to: '2026-11-27' })).toBeNull()
    expect(periodRange('custom', new Date(), { from: '', to: '2026-11-27' })).toBeNull()
    expect(parseDateInput('2026-02-31')).toBeNull()
    expect(toDateInput(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('compara com o mesmo trecho do período anterior', () => {
    const now = new Date(2026, 10, 18, 12, 30)
    const month = periodRange('month', now)!
    expect(previousRange('month', month, now)).toEqual({ since: new Date(2026, 9, 1), until: new Date(2026, 9, 18, 12, 30) })
    const week = periodRange('week', now)!
    expect(previousRange('week', week, now)).toEqual({ since: new Date(2026, 10, 9), until: new Date(2026, 10, 11, 12, 30) })
    const lastMonth = periodRange('last-month', now)!
    expect(previousRange('last-month', lastMonth, now)).toEqual({ since: new Date(2026, 8, 1), until: new Date(2026, 9, 1) })
    const year = periodRange('year', now)!
    expect(previousRange('year', year, now)).toEqual({ since: new Date(2025, 0, 1), until: new Date(2025, 10, 18, 12, 30) })
    const blackFriday = periodRange('custom', now, { from: '2026-11-27', to: '2026-11-30' })!
    expect(previousRange('custom', blackFriday, now)).toEqual({ since: new Date(2026, 10, 23), until: new Date(2026, 10, 27) })
    expect(previousRange('all', periodRange('all', now)!, now)).toBeNull()
  })

  it('31 de março compara com fevereiro inteiro, sem passar para março', () => {
    const now = new Date(2026, 2, 31, 10)
    expect(previousRange('month', periodRange('month', now)!, now)).toEqual({ since: new Date(2026, 1, 1), until: new Date(2026, 2, 1) })
  })

  it('filtra pedidos pelo intervalo e calcula a variação', () => {
    const orders = [order({ id: 'a', created_at: '2026-11-26T23:00:00-03:00' }), order({ id: 'b', created_at: '2026-11-27T00:00:00-03:00' }), order({ id: 'c', created_at: '2026-12-01T00:00:00-03:00' })]
    const range = { since: new Date('2026-11-27T00:00:00-03:00'), until: new Date('2026-12-01T00:00:00-03:00') }
    expect(ordersInRange(orders, range).map((item) => item.id)).toEqual(['b'])
    expect(changePercent(118, 100)).toBe(18)
    expect(changePercent(50, 100)).toBe(-50)
    expect(changePercent(10, 0)).toBeNull()
  })
})

describe('ordersToCsv', () => {
  it('gera CSV com ponto e vírgula, valores em reais e proteção contra fórmulas', () => {
    const csv = ordersToCsv([order({ customer: { name: '=HYPERLINK("x")', phone: '91999999999' } })])
    const [header, row] = csv.replace('﻿', '').split('\r\n')
    expect(header.split(';')[0]).toBe('Pedido')
    expect(row).toContain(`"'=HYPERLINK(""x"")"`)
    expect(row).toContain('200,00')
    expect(row).toContain('192,00')
  })
})
