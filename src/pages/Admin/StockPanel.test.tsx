import { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import StockPanel from './StockPanel'
import { setUnitStock, transferStock } from '../../services/stock'
import { Product } from '../../types/store'

jest.mock('../../services/stock', () => ({
  setUnitStock: jest.fn(),
  transferStock: jest.fn()
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const product: Product = {
  id: 1,
  name: 'Vestido Dress',
  category: 'Vestidos',
  description: '',
  price: 75,
  image: '',
  sizes: ['P', 'M'],
  colors: [{ name: 'Rosa', hex: '#fc8497' }],
  variantStock: [{ size: 'P', color: 'Rosa', quantity: 4 }, { size: 'M', color: 'Rosa', quantity: 2 }],
  unitStock: [
    { unit: 'galeria-portuense', size: 'P', color: 'Rosa', quantity: 3 },
    { unit: 'cidade-nova-4', size: 'P', color: 'Rosa', quantity: 1 },
    { unit: 'galeria-portuense', size: 'M', color: 'Rosa', quantity: 2 }
  ],
  available: true,
  enabled: true
}

let container: HTMLDivElement
let root: Root

const render = async (unitId: string | null) => {
  // Sem Testing Library no projeto: o act do React é o que espera a tela atualizar.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => {
    root.render(<StockPanel products={[product]} unitId={unitId} focusProductId={1} onChanged={() => undefined} />)
  })
}

const typeInto = async (element: HTMLInputElement | HTMLSelectElement, value: string) => {
  const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
  await act(async () => {
    setter?.call(element, value)
    element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
  })
}

const byLabel = (label: string) => container.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)
const button = (text: string) => Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.includes(text)) as HTMLButtonElement

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  // O Jest do projeto zera os mocks antes de cada teste.
  ;(setUnitStock as jest.Mock).mockResolvedValue([])
  ;(transferStock as jest.Mock).mockResolvedValue(2)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('Estoque por loja no painel', () => {
  it('mostra o estoque de cada loja e o total', async () => {
    await render(null)
    const row = Array.from(container.querySelectorAll('tbody tr'))[0]
    expect(row.textContent).toContain('Vestido Dress')
    expect(Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent)).toEqual(['Vestido Dress', '5', '1', '6', 'Lançando'])
  })

  it('dona lança nas duas lojas e manda só o que mudou, com o saldo que viu', async () => {
    await render(null)
    await typeInto(byLabel('Cidade Nova 4, P Rosa') as HTMLInputElement, '3')
    await typeInto(byLabel('Galeria Portuense, M Rosa') as HTMLInputElement, '0')
    await act(async () => { button('Salvar estoque').click() })
    expect(setUnitStock).toHaveBeenCalledTimes(2)
    expect(setUnitStock).toHaveBeenCalledWith(1, 'galeria-portuense', [{ size: 'M', color: 'Rosa', from: 2, to: 0 }], 'entrada', '')
    expect(setUnitStock).toHaveBeenCalledWith(1, 'cidade-nova-4', [{ size: 'P', color: 'Rosa', from: 1, to: 3 }], 'entrada', '')
    expect(container.textContent).toContain('estoque salvo (+0 peças)')
  })

  it('atendente vê as duas lojas mas só lança na dela', async () => {
    await render('cidade-nova-4')
    expect(byLabel('Galeria Portuense, P Rosa')).toBeNull()
    expect(byLabel('Cidade Nova 4, P Rosa')).not.toBeNull()
    expect(container.textContent).toContain('Você vê o estoque das duas lojas')
    expect((container.querySelector('#transfer-from') as HTMLInputElement).readOnly).toBe(true)
    expect((container.querySelector('#transfer-to') as HTMLInputElement).value).toBe('Galeria Portuense')
  })

  it('não transfere mais do que a loja de origem tem', async () => {
    await render(null)
    const selects = container.querySelectorAll<HTMLSelectElement>('select[aria-label="Peça"]')
    await typeInto(selects[0], '1')
    await typeInto(container.querySelector('select[aria-label="Tamanho"]') as HTMLSelectElement, 'M')
    await typeInto(container.querySelector('input[aria-label="Quantidade"]') as HTMLInputElement, '5')
    await act(async () => { button('Transferir para a Cidade Nova 4').click() })
    expect(transferStock).not.toHaveBeenCalled()
    expect(container.textContent).toContain('tem só 2')
    await typeInto(container.querySelector('input[aria-label="Quantidade"]') as HTMLInputElement, '2')
    await act(async () => { button('Transferir para a Cidade Nova 4').click() })
    expect(transferStock).toHaveBeenCalledWith('galeria-portuense', 'cidade-nova-4', [{ productId: 1, size: 'M', color: 'Rosa', quantity: 2 }], '')
    expect(container.textContent).toContain('2 peças transferidas para a Cidade Nova 4')
  })
})
