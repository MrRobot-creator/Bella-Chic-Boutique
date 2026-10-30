import styled, { css, keyframes } from 'styled-components'
import { colors, fonts } from '../../styles/tokens'
import { RoundButton } from '../ui'

const rise = keyframes`from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 }`

/** Altura da foto principal no computador: cabe na tela sem sobrar espaço. */
const photoHeight = 'min(calc(100vh - 80px), 660px)'

export const Dialog = styled.div`
  position: relative;
  width: min(1120px, 100%);
  max-height: calc(100vh - 32px);
  display: grid;
  grid-template-columns: auto minmax(320px, 1fr);
  overflow: hidden;
  border-radius: 24px;
  background: ${colors.white};
  box-shadow: 0 30px 80px rgba(46, 30, 34, .32);
  animation: ${rise} .28s cubic-bezier(.2, .7, .2, 1);
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    max-height: calc(100dvh - 16px);
    overflow-y: auto;
    overscroll-behavior: contain;
    border-radius: 20px;
  }
`

export const Close = styled(RoundButton)`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 6;
  width: 42px;
  height: 42px;
  background: rgba(255, 255, 255, .94);
  box-shadow: 0 4px 14px rgba(62, 42, 46, .12);
  @media (max-width: 900px) {
    position: fixed;
    top: 18px;
    right: 18px;
  }
`

export const Gallery = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: ${colors.photoBg};
  @media (max-width: 900px) {
    flex-direction: column-reverse;
    gap: 10px;
    padding: 0 0 12px;
  }
`

export const Thumbs = styled.div`
  max-height: ${photoHeight};
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  button {
    width: 64px;
    flex: none;
    aspect-ratio: 3 / 4;
    padding: 0;
    overflow: hidden;
    border: 1.5px solid transparent;
    border-radius: 10px;
    background: ${colors.white};
    opacity: .65;
    cursor: pointer;
    transition: opacity .25s, border-color .25s;
  }
  button:hover, button.active { opacity: 1; border-color: ${colors.rose}; }
  img { width: 100%; height: 100%; object-fit: cover; }
  @media (max-width: 900px) {
    width: 100%;
    max-height: none;
    flex-direction: row;
    padding: 0 14px;
    overflow-x: auto;
    button { width: 52px; }
  }
`

export const MainImage = styled.div<{ $zoom: boolean }>`
  position: relative;
  height: ${photoHeight};
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border-radius: 16px;
  background: ${colors.photoBg};
  cursor: ${({ $zoom }) => ($zoom ? 'zoom-out' : 'zoom-in')};
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform .3s ease-out;
    will-change: transform;
    pointer-events: none;
  }
  .tag {
    position: absolute;
    top: 14px;
    left: 14px;
    padding: 5px 11px;
    border-radius: 999px;
    background: ${colors.rose};
    color: ${colors.white};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .4px;
    text-transform: uppercase;
    pointer-events: none;
    transition: opacity .2s;
    ${({ $zoom }) => $zoom && css`opacity: 0;`}
  }
  @media (max-width: 900px) {
    width: 100%;
    height: auto;
    border-radius: 0;
  }
`

export const Arrow = styled.button<{ $side: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $side }) => ($side === 'left' ? 'left: 12px;' : 'right: 12px;')}
  z-index: 2;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, .92);
  color: ${colors.plum};
  box-shadow: 0 4px 14px rgba(62, 42, 46, .12);
  transform: translateY(-50%);
  cursor: pointer;
  transition: background .2s, opacity .2s;
  &:hover { background: ${colors.white}; }
`

export const Details = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 40px 36px 32px;
  overflow-y: auto;
  .category { color: ${colors.rose}; font-size: 11px; font-weight: 600; letter-spacing: 2.4px; text-transform: uppercase; }
  h2 { margin-top: -8px; padding-right: 48px; color: ${colors.plum}; font: 400 clamp(26px, 3vw, 32px)/1.15 ${fonts.serif}; }
  .pay-note { margin-top: -8px; color: ${colors.soft}; font-size: 12px; }
  .description { color: ${colors.muted}; font-size: 14px; line-height: 1.65; white-space: pre-line; }
  @media (max-width: 900px) {
    padding: 20px 18px 28px;
    overflow: visible;
    h2 { padding-right: 0; }
  }
`

export const PriceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
  strong { color: ${colors.plum}; font-size: 26px; font-weight: 700; }
  s { color: ${colors.soft}; font-size: 15px; }
  .off { padding: 3px 9px; border-radius: 999px; background: ${colors.blush}; color: ${colors.roseDark}; font-size: 12px; font-weight: 700; }
`

export const Share = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  button, a {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 14px;
    border: 1px solid ${colors.lineStrong};
    border-radius: 999px;
    background: ${colors.white};
    color: ${colors.plum};
    font: 500 13px ${fonts.sans};
    cursor: pointer;
    transition: border-color .2s, color .2s;
  }
  button:hover, a:hover { border-color: ${colors.rose}; color: ${colors.roseDark}; }
  span[role='status'] { color: ${colors.success}; font-size: 12px; font-weight: 600; word-break: break-all; }
`

export const VariantGroup = styled.div`
  display: grid;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid ${colors.line};
  .label { color: ${colors.muted}; font-size: 13px; }
  .label strong { color: ${colors.plum}; }
  .label em { color: ${colors.soft}; font-style: normal; }
`

export const Swatches = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  button {
    width: 34px;
    height: 34px;
    border: 3px solid ${colors.white};
    border-radius: 50%;
    box-shadow: 0 0 0 1px ${colors.lineStrong};
    cursor: pointer;
    transition: box-shadow .2s;
  }
  button.active { box-shadow: 0 0 0 2px ${colors.rose}; }
`

export const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  button {
    min-width: 48px;
    height: 44px;
    padding: 0 14px;
    border: 1px solid ${colors.lineStrong};
    border-radius: 12px;
    background: ${colors.white};
    color: ${colors.plum};
    font: 600 14px ${fonts.sans};
    cursor: pointer;
    transition: border-color .2s, background .2s, color .2s;
  }
  button:hover { border-color: ${colors.rose}; }
  button.active { border-color: ${colors.plum}; background: ${colors.plum}; color: ${colors.white}; }
  button.empty { color: ${colors.soft}; text-decoration: line-through; }
  button.empty.active { color: ${colors.white}; background: #8C7A7C; border-color: #8C7A7C; }
`

export const SizeGuide = styled.details`
  summary {
    width: fit-content;
    color: ${colors.roseDark};
    font-size: 13px;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  > div { display: grid; gap: 10px; margin-top: 12px; padding: 14px; border-radius: 14px; background: ${colors.blushSoft}; }
  p { color: ${colors.muted}; font-size: 12px; line-height: 1.5; }
  .table-scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 8px 6px; border-bottom: 1px solid ${colors.line}; text-align: center; color: ${colors.plum}; }
  thead th { color: ${colors.muted}; font-weight: 600; font-size: 12px; }
  .note { font-size: 11px; }
`

export const StockNote = styled.p<{ $tone: 'ok' | 'low' | 'out' }>`
  color: ${({ $tone }) => ($tone === 'ok' ? colors.muted : colors.roseDark)};
  font-size: 13px;
  font-weight: ${({ $tone }) => ($tone === 'ok' ? 400 : 600)};
`

export const AddRow = styled.div`
  display: flex;
  gap: 10px;
  .add {
    flex: 1;
    min-height: 52px;
    border: 0;
    border-radius: 999px;
    background: ${colors.rose};
    color: ${colors.white};
    font: 600 14px ${fonts.sans};
    letter-spacing: .6px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background .2s;
  }
  .add:hover:not(:disabled) { background: ${colors.roseDark}; }
  .add:disabled { cursor: not-allowed; background: #EEE9E8; color: #918787; }
`

export const Quantity = styled.div`
  height: 52px;
  display: flex;
  align-items: center;
  border: 1px solid ${colors.lineStrong};
  border-radius: 999px;
  button { width: 44px; height: 100%; border: 0; background: none; color: ${colors.plum}; font-size: 18px; cursor: pointer; }
  button:disabled { color: #CDBFC1; cursor: not-allowed; }
  span { min-width: 22px; text-align: center; color: ${colors.plum}; font-weight: 700; }
`

export const FavoriteToggle = styled.button`
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: none;
  color: ${colors.roseDark};
  font: 600 13px ${fonts.sans};
  cursor: pointer;
`

export const Look = styled.section`
  display: grid;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid ${colors.line};
  h3 { color: ${colors.plum}; font: italic 400 20px ${fonts.serif}; }
  > div { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
  button {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border: 1px solid ${colors.line};
    border-radius: 14px;
    background: ${colors.white};
    text-align: left;
    cursor: pointer;
    transition: border-color .2s;
  }
  button:hover { border-color: ${colors.roseLight}; }
  img { width: 46px; aspect-ratio: 3 / 4; flex: none; border-radius: 8px; object-fit: cover; }
  span { min-width: 0; display: grid; gap: 2px; }
  strong { overflow: hidden; color: ${colors.plum}; font-size: 12px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  small { color: ${colors.muted}; font-size: 12px; }
`

export const RatingLink = styled.a`
  width: fit-content;
  margin-top: -6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${colors.muted};
  font-size: 13px;
  .stars { color: #D9A21B; letter-spacing: 1px; }
  &:hover { color: ${colors.roseDark}; }
`

export const Reviews = styled.section`
  display: grid;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid ${colors.line};
  scroll-margin-top: 16px;
  h3 { color: ${colors.plum}; font: italic 400 20px ${fonts.serif}; }
  article { display: grid; gap: 6px; padding: 12px 14px; border-radius: 14px; background: ${colors.blushSoft}; }
  .head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px; }
  .stars { color: #D9A21B; letter-spacing: 1px; font-size: 14px; }
  .who { color: ${colors.soft}; font-size: 12px; }
  p { color: ${colors.plum}; font-size: 14px; line-height: 1.55; }
  .photos { display: flex; gap: 8px; }
  .photos img { width: 64px; height: 80px; border-radius: 10px; object-fit: cover; }
`
