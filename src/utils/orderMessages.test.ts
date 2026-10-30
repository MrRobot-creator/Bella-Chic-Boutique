import { customerWhatsApp, orderStatusMessage, reviewUrl } from './orderMessages'
import type { StoreOrder } from '../services/orders'
import { defaultSettings } from '../services/settings'

const withPix = {
  ...defaultSettings,
  units: [
    { unitId: 'galeria-portuense', name: 'Galeria Portuense', pixKey: '+5591980648559', pixName: 'Bella Chic', pixCity: 'Belem' },
    { unitId: 'cidade-nova-4', name: 'Cidade Nova 4', pixKey: 'cidadenova@exemplo.com', pixName: 'Bella Chic CN', pixCity: 'Ananindeua' }
  ]
}

const order: StoreOrder = {
  id: '1',
  reference: 'BC-0000000000000001',
  status: 'confirmed',
  channel: 'site',
  customer: { name: 'Maria Souza', phone: '(91) 98888-0001' },
  items: [{ productId: 1, name: 'Vestido Dress', size: 'U', color: 'Rosa', sizes: ['U'], quantity: 1, unitPrice: 75 }],
  unit: { name: 'Galeria Portuense', address: 'Tv. Padre Eutíquio, 1055', attendant: 'Galeria', storePhone: '5591980648559' },
  fulfillment: { type: 'Entrega', street: 'Rua A', houseNumber: '1', complement: '', neighborhood: 'Umarizal', postalCode: '', deliveryCity: 'Belém', referencePoint: '', deliveryNotes: '', deliveryFee: 12 },
  payment: 'Pix',
  subtotal: 75,
  discount: 0,
  couponCode: null,
  created_at: '2026-10-30T12:00:00Z',
  confirmed_at: null,
  paid_at: null,
  shipped_at: null,
  delivered_at: null,
  cancelled_at: null,
  cancel_reason: null,
  reserved_until: null,
  stock_taken: true,
  review_token: '11111111-2222-4333-8444-555555555555',
  note: null
}

describe('Mensagens das etapas do pedido', () => {
  it('confirmação com Pix copia e cola quando a loja configurou a chave', () => {
    const message = orderStatusMessage(order, 'confirmed', withPix, 'https://loja.com')
    expect(message).toContain('Oi, Maria!')
    expect(message.replace(/ /g, ' ')).toContain('Total: R$ 87,00 (com entrega)')
    expect(message).toContain('br.gov.bcb.pix')
    expect(message).toContain('+5591980648559')
  })

  it('cada loja usa a sua chave Pix', () => {
    const cidadeNova = orderStatusMessage({ ...order, unit_id: 'cidade-nova-4', unit: { ...order.unit, name: 'Cidade Nova 4' } }, 'confirmed', withPix, '')
    expect(cidadeNova).toContain('cidadenova@exemplo.com')
    expect(cidadeNova).not.toContain('+5591980648559')
    // Pedido antigo, sem unit_id: a loja vem pelo nome.
    expect(orderStatusMessage({ ...order, unit: { ...order.unit, name: 'Cidade Nova 4' } }, 'confirmed', withPix, '')).toContain('cidadenova@exemplo.com')
    const onlyGaleria = { ...defaultSettings, units: withPix.units.map((unit) => (unit.unitId === 'cidade-nova-4' ? { ...unit, pixKey: null } : unit)) }
    expect(orderStatusMessage({ ...order, unit_id: 'cidade-nova-4' }, 'confirmed', onlyGaleria, '')).not.toContain('br.gov.bcb.pix')
  })

  it('confirmação sem Pix configurado não inventa código', () => {
    expect(orderStatusMessage(order, 'confirmed', defaultSettings, 'https://loja.com')).not.toContain('br.gov.bcb.pix')
  })

  it('enviado diferencia entrega de retirada', () => {
    expect(orderStatusMessage(order, 'shipped', defaultSettings, '')).toContain('saiu para entrega')
    expect(orderStatusMessage({ ...order, fulfillment: { ...order.fulfillment, type: 'Retirada na loja' } }, 'shipped', defaultSettings, '')).toContain('pronto para retirar na Galeria Portuense')
  })

  it('entregue leva o link de avaliação', () => {
    expect(orderStatusMessage(order, 'delivered', defaultSettings, 'https://loja.com/')).toContain('https://loja.com/avaliar/11111111-2222-4333-8444-555555555555')
    expect(reviewUrl({ review_token: null }, 'https://loja.com')).toBe('')
  })

  it('cancelado mostra o motivo', () => {
    expect(orderStatusMessage({ ...order, cancel_reason: 'Peça com defeito' }, 'cancelled', defaultSettings, '')).toContain('Motivo: Peça com defeito')
  })

  it('formata o WhatsApp da cliente', () => {
    expect(customerWhatsApp('(91) 98888-0001')).toBe('5591988880001')
    expect(customerWhatsApp('5591988880001')).toBe('5591988880001')
    expect(customerWhatsApp('')).toBe('')
  })
})
