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

const drag = (fromX: number, toX: number, y = 100) => {
  const section = container.querySelector('section') as HTMLElement
  act(() => {
    section.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: fromX, clientY: y, button: 0 }))
    section.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: toX, clientY: y, button: 0 }))
  })
}

it('arrastar para o lado troca o destaque; arrasto curto não', async () => {
  await mount()
  drag(300, 280)
  expect(current()).toBe(0)
  drag(300, 150)
  expect(current()).toBe(1)
  drag(150, 300)
  expect(current()).toBe(0)
})

it('depois de arrastar, o clique que vem junto não abre o link', async () => {
  await mount()
  drag(300, 150)
  const link = banner().querySelector('a') as HTMLAnchorElement
  const click = new MouseEvent('click', { bubbles: true, cancelable: true })
  act(() => { link.dispatchEvent(click) })
  expect(click.defaultPrevented).toBe(true)
})

it('troca sozinho mesmo com o mouse em cima, e a troca à mão recomeça o tempo', async () => {
  await mount()
  const section = container.querySelector('section') as HTMLElement
  act(() => { section.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })) })
  act(() => { jest.advanceTimersByTime(700) })
  act(() => { dots()[1].click() })
  act(() => { jest.advanceTimersByTime(700) })
  expect(current()).toBe(1)
  act(() => { jest.advanceTimersByTime(300) })
  expect(current()).toBe(0)
})

