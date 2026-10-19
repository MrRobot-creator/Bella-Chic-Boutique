import { createOrderMessage, createWhatsAppUrl } from './whatsapp'
import { CartItem } from '../types/store'

const items: CartItem[] = [
  {
    product: {
      id: 1,
      name: 'Vestido Aurora',
      category: 'Vestidos',
      description: 'Vestido midi',
      price: 189.9,
      image: '/vestido.jpg',
      sizes: ['P', 'M', 'G'],
      colors: [{ name: 'Rosa', hex: '#e5a1ad' }]
    },
    size: 'M',
    color: 'Rosa',
    quantity: 2
  }
]

describe('WhatsApp order checkout', () => {
  it('creates a professional order summary with delivery and customer details', () => {
    const message = createOrderMessage(items, {
      reference: 'BELLA123',
      name: 'Ana',
      phone: '91999990000',
      unitName: 'Cidade Nova 04',
      unitAddress: 'Av. Dr. Nonato Sanova, 161A',
      attendant: 'Cidade Nova — atendente 2',
      storePhone: '5591986066894',
      fulfillment: 'Entrega',
      street: 'Rua das Flores',
      houseNumber: '10',
      complement: 'Apto 402',
      neighborhood: 'Centro',
      postalCode: '66050-000',
      referencePoint: 'Praça central',
      deliveryNotes: 'Deixar na portaria',
      deliveryFee: null,
      payment: 'Pix',
      subtotal: 379.8
    })

    const normalizedMessage = message.replace(/\u00a0/g, ' ')

    expect(message).toContain('*Código do pedido: BELLA123*')
    expect(message).toContain('━━━━━━━━━━━━━━━━━━━━')
    expect(message).toContain('\u{1F514} *NOVO PEDIDO')
    expect(message).toContain('\u{1F464} *DADOS DO CLIENTE*')
    expect(message).toContain('\u{1F4CD} *ENDEREÇO DE ENTREGA*')
    expect(message).toContain('\u{1F6CD}\u{FE0F} *ITENS DO PEDIDO*')
    expect(message).toContain('2x Vestido Aurora\n  Tamanho: M | Cor: Rosa')
    expect(message).toContain('Unidade: Cidade Nova 04')
    expect(message).toContain('Endereço da unidade: Av. Dr. Nonato Sanova, 161A')
    expect(message).toContain('Atendente: Cidade Nova — atendente 2 (+5591986066894)')
    expect(message).toContain('Endereço: Rua das Flores, 10')
    expect(message).toContain('Bairro: Centro')
    expect(message).toContain('CEP: 66050-000')
    expect(message).toContain('Apto 402')
    expect(message).toContain('Ponto de referência: Praça central')
    expect(message).toContain('Observação: Deixar na portaria')
    expect(message).toContain('Aguardo as instruções de pagamento Pix da atendente.')
    expect(normalizedMessage).toContain('Subtotal: R$ 379,80')
    expect(normalizedMessage).toContain('Taxa de entrega: a confirmar com a atendente')
    expect(normalizedMessage).toContain('TOTAL: a confirmar após calcular o frete')
    expect(message).not.toContain('E-mail:')
  })

  it('omits delivery address fields for store pickup', () => {
    const message = createOrderMessage(items, {
      reference: 'BELLA456',
      name: 'Ana',
      phone: '91999990000',
      unitName: 'Galeria Portuense',
      unitAddress: 'Tv. Padre Eutíquio, 105',
      attendant: 'Galeria Portuense',
      storePhone: '5591980648559',
      fulfillment: 'Retirada na loja',
      street: '',
      houseNumber: '',
      complement: '',
      neighborhood: '',
      postalCode: '',
      referencePoint: '',
      deliveryNotes: '',
      deliveryFee: 0,
      payment: 'Dinheiro',
      subtotal: 379.8
    })

    expect(message).toContain('Forma de recebimento: Retirada na loja')
    expect(message).not.toContain('Endereço:')
    expect(message).not.toContain('Bairro:')
    expect(message).not.toContain('Ponto de referência:')
  })

  it('routes the message to the selected WhatsApp number', () => {
    const message = '\u{1F514} Olá, quero fazer um pedido.\n\u{1F6CD}\u{FE0F} Vestido'
    const url = createWhatsAppUrl(message, '+55 (91) 98606-6894')
    const parsedUrl = new URL(url)

    expect(parsedUrl.origin + parsedUrl.pathname).toBe('https://api.whatsapp.com/send')
    expect(parsedUrl.searchParams.get('phone')).toBe('5591986066894')
    expect(parsedUrl.searchParams.get('text')).toBe(message)
  })

  it('generates a five-digit numeric order reference', () => {
    const reference = require('./whatsapp').createOrderReference()

    expect(reference).toMatch(/^\d{5}$/)
  })

  it('rejects malformed WhatsApp numbers instead of opening an invalid link', () => {
    expect(() => createWhatsAppUrl('Pedido', 'não é um telefone')).toThrow(
      'O número de WhatsApp selecionado é inválido.'
    )
  })
})
