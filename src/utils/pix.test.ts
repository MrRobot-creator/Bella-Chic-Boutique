import { buildPixPayload, crc16, guessPixKeyType, isValidPixKey, normalizePixKey, pixText } from './pix'

describe('Pix copia e cola', () => {
  it('gera o exemplo oficial do manual do Banco Central', () => {
    expect(buildPixPayload({
      key: '123e4567-e12b-12d1-a456-426655440000',
      name: 'Fulano de Tal',
      city: 'BRASILIA'
    })).toBe('00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D')
  })

  it('inclui o valor e o código do pedido, e o dígito confere', () => {
    const payload = buildPixPayload({ key: '+5591980648559', name: 'Bella Chic Boutique', city: 'Belém', amount: 75, txid: 'BC-7F3A21AA00000000' })
    expect(payload).toContain('540575.00')
    expect(payload).toContain('6005Belem')
    expect(payload).toContain('0518BC7F3A21AA00000000')
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)))
  })

  it('limpa nome e cidade para o padrão dos bancos', () => {
    expect(pixText('Boutique Ação & Cia', 25)).toBe('Boutique Acao Cia')
    expect(pixText('Ananindeua do Pará', 15)).toBe('Ananindeua do P')
  })

  it('normaliza e valida as chaves', () => {
    expect(normalizePixKey('phone', '(91) 98064-8559')).toBe('+5591980648559')
    expect(normalizePixKey('cpf_cnpj', '46.990.343/0001-41')).toBe('46990343000141')
    expect(isValidPixKey('cpf_cnpj', '46990343000141')).toBe(true)
    expect(isValidPixKey('phone', '+5591980648559')).toBe(true)
    expect(isValidPixKey('email', 'loja@exemplo.com')).toBe(true)
    expect(isValidPixKey('random', 'nao-e-chave')).toBe(false)
    expect(guessPixKeyType('+5591980648559')).toBe('phone')
    expect(guessPixKeyType('loja@exemplo.com')).toBe('email')
  })
})
