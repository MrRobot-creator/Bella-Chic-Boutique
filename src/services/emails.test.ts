import { emailStatus, formatSender, isFreeMailbox, isValidEmail, normalizeSiteUrl, parseSender, SentEmail } from './emails'

const email = (change: Partial<SentEmail>): SentEmail => ({
  id: 1, reference: 'BC-1', event: 'recebido', toEmail: 'a@b.com', subject: 'x', createdAt: '', statusCode: null, error: null, ...change
})

describe('e-mails de pedido', () => {
  it('separa e junta nome e endereço do remetente', () => {
    expect(parseSender('Bella Chic Boutique <pedidos@bellachicboutique.com.br>')).toEqual({ name: 'Bella Chic Boutique', address: 'pedidos@bellachicboutique.com.br' })
    expect(parseSender('pedidos@loja.com.br')).toEqual({ name: '', address: 'pedidos@loja.com.br' })
    expect(parseSender(null)).toEqual({ name: '', address: '' })
    expect(formatSender(' Bella  Chic ', 'Pedidos@Loja.com.br')).toBe('Bella Chic <pedidos@loja.com.br>')
    expect(formatSender('<script>"', 'a@loja.com.br')).toBe('script <a@loja.com.br>')
    expect(formatSender('', 'a@loja.com.br')).toBe('a@loja.com.br')
  })

  it('deixa o endereço do site no formato certo', () => {
    expect(normalizeSiteUrl('bellachicboutique.com.br')).toBe('https://bellachicboutique.com.br')
    expect(normalizeSiteUrl('http://www.BellaChic.com.br/loja/')).toBe('https://www.bellachic.com.br')
    expect(normalizeSiteUrl('https://bella-chic-boutique.vercel.app/')).toBe('https://bella-chic-boutique.vercel.app')
    expect(normalizeSiteUrl('')).toBe('')
  })

  it('reconhece e-mail gratuito e e-mail válido', () => {
    expect(isFreeMailbox('bellachicboutique12@gmail.com')).toBe(true)
    expect(isFreeMailbox('pedidos@bellachicboutique.com.br')).toBe(false)
    expect(isValidEmail('loja@exemplo.com')).toBe(true)
    expect(isValidEmail('loja@exemplo')).toBe(false)
  })

  it('mostra a situação do envio', () => {
    expect(emailStatus(email({ statusCode: 200 }))).toBe('sent')
    expect(emailStatus(email({ statusCode: 422 }))).toBe('error')
    expect(emailStatus(email({ error: 'Chave' }))).toBe('error')
    const now = Date.parse('2026-10-30T12:00:00Z')
    expect(emailStatus(email({ createdAt: '2026-10-30T11:55:00Z' }), now)).toBe('waiting')
    expect(emailStatus(email({ createdAt: '2026-10-30T02:00:00Z' }), now)).toBe('unknown')
  })
})
