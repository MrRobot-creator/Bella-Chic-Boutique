export type DeliveryCity = 'Belém' | 'Ananindeua' | 'Marituba' | 'Icoaraci'
export type DeliveryOrigin = 'Belém' | 'Ananindeua'

export type ViaCepAddress = {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export const calculateDeliveryFee = (
  origin: DeliveryOrigin,
  destination: DeliveryCity
): number => {
  if (destination === 'Marituba' || destination === 'Icoaraci') return 20
  return origin === destination ? 12 : 15
}

const normalizeName = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')

export const identifyDeliveryCity = (localidade: string, neighborhood = ''): DeliveryCity | null => {
  if (normalizeName(neighborhood).includes('icoaraci')) return 'Icoaraci'
  const city = normalizeName(localidade)

  if (city.includes('ananindeua')) return 'Ananindeua'
  if (city.includes('marituba')) return 'Marituba'
  if (city.includes('belem')) return 'Belém'
  return null
}

const requestViaCep = async (url: string, signal?: AbortSignal): Promise<ViaCepAddress[]> => {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`O ViaCEP respondeu com erro ${response.status}. Tente novamente.`)
  }

  const data: ViaCepAddress | ViaCepAddress[] = await response.json()
  if (!Array.isArray(data)) {
    if (data.erro) return []
    return [data]
  }

  return data.filter((address) => !address.erro)
}

export const searchViaCepAddresses = (
  city: DeliveryCity,
  streetQuery: string,
  signal?: AbortSignal
): Promise<ViaCepAddress[]> => {
  const query = streetQuery.trim()
  if (query.length < 3) return Promise.resolve([])

  const viaCepCity = city === 'Icoaraci' ? 'Belém' : city
  const url = `https://viacep.com.br/ws/PA/${encodeURIComponent(viaCepCity)}/${encodeURIComponent(query)}/json/`
  return requestViaCep(url, signal)
}

export const lookupViaCepPostalCode = async (
  postalCode: string,
  signal?: AbortSignal
): Promise<ViaCepAddress | null> => {
  const digits = postalCode.replace(/\D/g, '')
  if (!/^\d{8}$/.test(digits)) return null

  const addresses = await requestViaCep(`https://viacep.com.br/ws/${digits}/json/`, signal)
  return addresses[0] || null
}
