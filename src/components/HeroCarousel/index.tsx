import { ReactNode, TouchEvent, useEffect, useRef, useState } from 'react'
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
 * Banner do início que troca sozinho. Para ao passar o mouse, ao focar com o teclado, no botão de pausa
 * e para quem pediu menos animação no celular ou no computador. No celular, também troca com o dedo.
 */
const HeroCarousel = ({ id, className, label, children, slides, intervalMs = 7000 }: HeroCarouselProps) => {
  const total = slides.length + 1
  const [active, setActive] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [paused, setPaused] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (paused || hovering || total < 2) return undefined
    const timer = window.setInterval(() => setActive((current) => (current + 1) % total), intervalMs)
    return () => window.clearInterval(timer)
  }, [hovering, intervalMs, paused, total])

  const show = (index: number) => setActive((index + total) % total)

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0]
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
  }
  // Só troca no arrasto de lado; rolar a página para baixo não mexe no banner.
  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current
    const end = event.changedTouches[0]
    touchStart.current = null
    if (!start || !end) return
    const dx = end.clientX - start.x
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(end.clientY - start.y)) return
    show(active + (dx < 0 ? 1 : -1))
  }

  return (
    <section
      id={id}
      className={className}
      aria-roledescription="carrossel"
      aria-label={label}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHovering(false) }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
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
