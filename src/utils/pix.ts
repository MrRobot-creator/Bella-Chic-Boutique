/*
 * Pix copia e cola (BR Code estático), no formato do manual do Banco Central.
 * O mesmo texto vira o QR Code.
 */

export type PixKeyType = 'cpf_cnpj' | 'phone' | 'email' | 'random'

export type PixPayloadInput = {
  key: string
  name: string
  city: string
  amount?: number
  txid?: string
}

const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`

/** Tira acentos e caracteres fora do padrão aceito pelos bancos. */
export const pixText = (value: string, max: number) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .,\-@/]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)

const utf8Bytes = (text: string) => Array.from(text).flatMap((char) => {
  const code = char.charCodeAt(0)
  if (code < 128) return [code]
  return encodeURIComponent(char).split('%').slice(1).map((hex) => parseInt(hex, 16))
})

export const crc16 = (payload: string) => {
  let crc = 0xffff
  for (const byte of utf8Bytes(payload)) {
    crc ^= byte << 8
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Deixa a chave no formato que o Pix espera (celular com +55, CPF/CNPJ só números, e-mail minúsculo). */
export const normalizePixKey = (type: PixKeyType, value: string) => {
  const trimmed = value.trim()
  if (type === 'cpf_cnpj') return trimmed.replace(/\D/g, '')
  if (type === 'phone') {
    const digits = trimmed.replace(/\D/g, '')
    return `+${digits.startsWith('55') && digits.length > 11 ? digits : `55${digits}`}`
  }
  if (type === 'email') return trimmed.toLowerCase()
  return trimmed.toLowerCase()
}

export const guessPixKeyType = (key: string): PixKeyType => {
  if (key.includes('@')) return 'email'
  if (key.startsWith('+')) return 'phone'
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return 'random'
  return 'cpf_cnpj'
}

export const isValidPixKey = (type: PixKeyType, key: string) => {
  if (type === 'cpf_cnpj') return /^(\d{11}|\d{14})$/.test(key)
  if (type === 'phone') return /^\+55\d{10,11}$/.test(key)
  if (type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key) && key.length <= 77
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(key)
}

/** Monta o Pix copia e cola. Sem valor, a cliente digita o valor no banco. */
export const buildPixPayload = ({ key, name, city, amount, txid }: PixPayloadInput) => {
  const merchantAccount = field('00', 'br.gov.bcb.pix') + field('01', key.trim())
  const reference = (txid || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***'
  const payload = [
    field('00', '01'),
    field('26', merchantAccount),
    field('52', '0000'),
    field('53', '986'),
    amount && amount > 0 ? field('54', amount.toFixed(2)) : '',
    field('58', 'BR'),
    field('59', pixText(name, 25) || 'Loja'),
    field('60', pixText(city, 15) || 'Brasil'),
    field('62', field('05', reference)),
    '6304'
  ].join('')
  return payload + crc16(payload)
}
