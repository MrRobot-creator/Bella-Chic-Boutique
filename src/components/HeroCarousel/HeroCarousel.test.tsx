import { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import HeroCarousel from '.'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const slides = [{ key: 'lojas', label: 'Nossas lojas', content: <a href="#lojas">Conheça as lojas</a> }]

let container: HTMLDivElement
let root: Root

const mount = async () => {
  // Sem Testing Library no projeto: o act do React é o que espera a tela atualizar.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => {
    root.render(<HeroCarousel label="Destaques" slides={slides} intervalMs={1000}><h2>Elegância</h2></HeroCarousel>)
  })
}
const dots = () => Array.from(container.querySelectorAll<HTMLButtonElement>('.dot'))
const current = () => dots().findIndex((dot) => dot.getAttribute('aria-current') === 'true')
const banner = () => container.querySelectorAll('[role="group"]')[1]

beforeEach(() => {
  jest.useFakeTimers()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  jest.useRealTimers()
})

it('troca sozinho e volta ao primeiro destaque', async () => {
  await mount()
  expect(dots()).toHaveLength(2)
  expect(current()).toBe(0)
  expect(banner().hasAttribute('inert')).toBe(true)
  act(() => { jest.advanceTimersByTime(1000) })
  expect(current()).toBe(1)
  expect(banner().hasAttribute('inert')).toBe(false)
  act(() => { jest.advanceTimersByTime(1000) })
  expect(current()).toBe(0)
})

it('o botão de pausa para a troca e a bolinha leva direto ao destaque', async () => {
  await mount()
  act(() => { container.querySelector<HTMLButtonElement>('.pause')?.click() })
  act(() => { jest.advanceTimersByTime(5000) })
  expect(current()).toBe(0)
  act(() => { dots()[1].click() })
  expect(current()).toBe(1)
  expect(banner().querySelector('a')?.getAttribute('href')).toBe('#lojas')
})
