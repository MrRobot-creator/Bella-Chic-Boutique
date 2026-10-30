import { describe, expect, it } from '@jest/globals'
import { buildSalesSummary, ordersToCsv } from './reports'
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
