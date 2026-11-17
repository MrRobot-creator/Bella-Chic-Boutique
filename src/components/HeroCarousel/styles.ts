import styled from 'styled-components'
import { colors } from '../../styles/tokens'

/** O primeiro destaque fica no fluxo do banner, como se o embrulho não existisse: o layout dele não muda. */
export const MainSlide = styled.div`
  display: contents;
`

/** Destaque que cobre o banner inteiro quando está na vez dele, com troca suave. */
export const Layer = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 3;
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  visibility: ${({ $active }) => ($active ? 'visible' : 'hidden')};
  transition: opacity .8s ease, visibility .8s;
  @media (prefers-reduced-motion: reduce) { transition: none; }
`

export const Controls = styled.div`
  position: absolute;
  left: 50%;
  bottom: 22px;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .72);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  transform: translateX(-50%);
  button { border: 0; padding: 0; cursor: pointer; }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: ${colors.roseLight};
    transition: width .3s, background .3s;
  }
  .dot[aria-current='true'] { width: 22px; background: ${colors.rose}; }
  .pause {
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    margin-left: 2px;
    border-radius: 50%;
    background: transparent;
    color: ${colors.plum};
  }
  @media (max-width: 600px) { bottom: 10px; }
`
