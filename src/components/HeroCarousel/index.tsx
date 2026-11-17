import { MouseEvent, PointerEvent, ReactNode, useEffect, useRef, useState } from 'react'
import { Controls, Layer, MainSlide } from './styles'

/** Destaque que se reveza com o primeiro: qualquer conteúdo (texto, fotos, botões). */
export type HeroSlide = {
  key: string
  /** Nome do destaque para leitor de tela. */
  label: string
  content: ReactNode
}

type HeroCarouselProps = {
  id?: string
  /** Visual do banner (fundo, altura): vem de quem usa, com styled(HeroCarousel). */
  className?: string
  label: string
  /** Primeiro destaque (texto e foto do banner principal), no fluxo da página: dá a altura do carrossel. */
  children: ReactNode
  /** Destaques que se revezam com o primeiro. */
  slides: HeroSlide[]
  intervalMs?: number
}

const SWIPE_PX = 50

/** Esconde um destaque do teclado e do leitor de tela enquanto ele não está na frente. */
const inert = (hidden: boolean) => (hidden ? ({ inert: '' } as object) : {})

/**
 * Banner do início que troca sozinho e também arrastando para o lado (dedo no celular, mouse no computador).
 * Depois de uma troca feita à mão, o tempo recomeça. Só para no botão de pausa.
 */
const HeroCarousel = ({ id, className, label, children, slides, intervalMs = 7000 }: HeroCarouselProps) => {
  const total = slides.length + 1
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  /** Arrastou de verdade: o clique que vem junto ao soltar não abre link nem aperta botão. */
  const dragged = useRef(false)

  // Um tempo por destaque: trocar à mão (bolinha ou arrasto) recomeça a contagem.
  useEffect(() => {
    if (paused || total < 2) return undefined
    const timer = window.setTimeout(() => setActive((current) => (current + 1) % total), intervalMs)
    return () => window.clearTimeout(timer)
  }, [active, intervalMs, paused, total])

  const show = (index: number) => setActive((index + total) % total)

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    dragStart.current = { x: event.clientX, y: event.clientY }
    dragged.current = false
  }
  // Só troca no arrasto de lado; rolar a página para baixo não mexe no banner.
  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = dragStart.current
    dragStart.current = null
    if (!start) return
    const dx = event.clientX - start.x
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(event.clientY - start.y)) return
    dragged.current = true
    show(active + (dx < 0 ? 1 : -1))
  }
  const onClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!dragged.current) return
    dragged.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <section
      id={id}
      className={className}
      aria-roledescription="carrossel"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { dragStart.current = null }}
      onClickCapture={onClickCapture}
      // Sem o "fantasma" de arrastar link ou foto, e sem selecionar o texto ao arrastar com o mouse.
      onDragStart={(event) => event.preventDefault()}
      style={{ touchAction: 'pan-y', userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <MainSlide role="group" aria-roledescription="destaque" aria-label={`1 de ${total}`} {...inert(active !== 0)}>
        {children}
      </MainSlide>
      {slides.map((slide, index) => (
        <Layer
          key={slide.key}
          $active={active === index + 1}
          role="group"
          aria-roledescription="destaque"
          aria-label={`${index + 2} de ${total}: ${slide.label}`}
          {...inert(active !== index + 1)}
        >
          {slide.content}
        </Layer>
      ))}
      {total > 1 && (
        <Controls>
          {Array.from({ length: total }, (_item, index) => (
            <button
              key={index}
              type="button"
              className="dot"
              aria-label={`Mostrar destaque ${index + 1}`}
              aria-current={active === index}
              onClick={() => show(index)}
            />
          ))}
          <button type="button" className="pause" aria-label={paused ? 'Continuar a troca dos destaques' : 'Pausar a troca dos destaques'} onClick={() => setPaused((value) => !value)}>
            {paused
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>}
          </button>
        </Controls>
      )}
    </section>
  )
}

export default HeroCarousel
