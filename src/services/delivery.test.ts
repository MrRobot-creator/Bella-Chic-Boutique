import { describe, expect, it, jest } from '@jest/globals'
import {
  calculateDeliveryFee,
  identifyDeliveryCity,
  lookupViaCepPostalCode,
  searchViaCepAddresses
} from './delivery'

describe('delivery fee calculation', () => {
  it('charges R$ 12 for deliveries within Belém and Ananindeua', () => {
    expect(calculateDeliveryFee('Belém', 'Belém')).toBe(12)
    expect(calculateDeliveryFee('Ananindeua', 'Ananindeua')).toBe(12)
  })

  it('charges R$ 15 between Belém and Ananindeua in either direction', () => {
    expect(calculateDeliveryFee('Belém', 'Ananindeua')).toBe(15)
    expect(calculateDeliveryFee('Ananindeua', 'Belém')).toBe(15)
  })

  it('charges R$ 20 for Marituba and Icoaraci from either branch', () => {
    expect(calculateDeliveryFee('Belém', 'Marituba')).toBe(20)
    expect(calculateDeliveryFee('Ananindeua', 'Marituba')).toBe(20)
    expect(calculateDeliveryFee('Belém', 'Icoaraci')).toBe(20)
    expect(calculateDeliveryFee('Ananindeua', 'Icoaraci')).toBe(20)
  })

  it('recognizes delivery cities and the Icoaraci region from ViaCEP data', () => {
    expect(identifyDeliveryCity('Belém', 'Icoaraci')).toBe('Icoaraci')
    expect(identifyDeliveryCity('Ananindeua', 'Cidade Nova')).toBe('Ananindeua')
    expect(identifyDeliveryCity('Belém', 'Batista Campos')).toBe('Belém')
  })

  it('returns no city for unsupported or incomplete address results', () => {
    expect(identifyDeliveryCity('Castanhal')).toBeNull()
    expect(identifyDeliveryCity('')).toBeNull()
  })

  it('searches ViaCEP by state, selected city, and street fragment', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [{
        cep: '66023-710',
        logradouro: 'Travessa Padre Eutíquio',
        complemento: '',
        bairro: 'Batista Campos',
        localidade: 'Belém',
        uf: 'PA'
      }]
    } as Response)

    await expect(searchViaCepAddresses('Belém', 'Padre Eutiquio')).resolves.toMatchObject([
      { cep: '66023-710', localidade: 'Belém' }
    ])
    expect(fetchMock).toHaveBeenCalledWith(
      'https://viacep.com.br/ws/PA/Bel%C3%A9m/Padre%20Eutiquio/json/',
      { signal: undefined }
    )
    fetchMock.mockRestore()
  })

  it('uses Belém for Icoaraci logradouro searches', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => []
    } as Response)

    await searchViaCepAddresses('Icoaraci', 'Estrada')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://viacep.com.br/ws/PA/Bel%C3%A9m/Estrada/json/',
      { signal: undefined }
    )
    fetchMock.mockRestore()
  })

  it('looks up an eight-digit CEP and skips invalid CEP values', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        cep: '66023-710',
        logradouro: 'Travessa Padre Eutíquio',
        complemento: '',
        bairro: 'Batista Campos',
        localidade: 'Belém',
        uf: 'PA'
      })
    } as Response)

    await expect(lookupViaCepPostalCode('66023710')).resolves.toMatchObject({ localidade: 'Belém' })
    await expect(lookupViaCepPostalCode('123')).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    fetchMock.mockRestore()
  })

  it('surfaces ViaCEP HTTP errors', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 503
    } as Response)

    await expect(searchViaCepAddresses('Belém', 'Padre')).rejects.toThrow('ViaCEP respondeu com erro 503')
    fetchMock.mockRestore()
  })
})
