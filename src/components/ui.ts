import styled, { css, keyframes } from 'styled-components'
import { colors, fonts } from '../styles/tokens'

const fadeIn = keyframes`from { opacity: 0 } to { opacity: 1 }`
const slideLeft = keyframes`from { transform: translateX(-24px); opacity: 0 } to { transform: translateX(0); opacity: 1 }`
const slideRight = keyframes`from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 }`
const rise = keyframes`from { transform: translateY(14px); opacity: 0 } to { transform: translateY(0); opacity: 1 }`

/** Fundo escurecido de menus, sacola e janelas. */
export const Backdrop = styled.div<{ $z?: number; $center?: boolean }>`
  position: fixed;
  inset: 0;
  z-index: ${({ $z }) => $z ?? 100};
  background: rgba(46, 30, 34, .45);
  animation: ${fadeIn} .2s ease-out;
  ${({ $center }) => $center && css`
    display: grid;
    place-items: center;
    padding: 16px;
  `}
`

export const SidePanel = styled.aside<{ $side: 'left' | 'right'; $width?: string }>`
  position: fixed;
  top: 0;
  bottom: 0;
  ${({ $side }) => ($side === 'left' ? 'left: 0;' : 'right: 0;')}
  z-index: 101;
  width: ${({ $width }) => $width ?? '360px'};
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  background: ${colors.white};
  box-shadow: ${({ $side }) => ($side === 'left' ? '20px' : '-20px')} 0 50px rgba(46, 30, 34, .2);
  animation: ${({ $side }) => ($side === 'left' ? slideLeft : slideRight)} .28s cubic-bezier(.2, .7, .2, 1);
  overflow-y: auto;
`

export const ModalCard = styled.div<{ $width?: string }>`
  position: relative;
  width: ${({ $width }) => $width ?? '420px'};
  max-width: 100%;
  max-height: calc(100vh - 32px);
  overflow: auto;
  background: ${colors.white};
  border-radius: 24px;
  box-shadow: 0 30px 70px rgba(46, 30, 34, .3);
  animation: ${rise} .25s cubic-bezier(.2, .7, .2, 1);
`

export const RoundButton = styled.button`
  width: 44px;
  height: 44px;
  flex: none;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: ${colors.blushSoft};
  color: ${colors.plum};
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: background .2s;
  &:hover { background: ${colors.blush}; }
`

export const PrimaryButton = styled.button`
  min-height: 50px;
  padding: 0 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 999px;
  background: ${colors.rose};
  color: ${colors.white};
  font: 600 15px ${fonts.sans};
  text-decoration: none;
  cursor: pointer;
  transition: background .2s, transform .2s;
  &:hover:not(:disabled) { background: ${colors.roseDark}; color: ${colors.white}; }
  &:disabled { cursor: not-allowed; background: #E8DEDF; color: #958789; }
`

export const OutlineButton = styled.a`
  min-height: 48px;
  padding: 0 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid ${colors.plum};
  border-radius: 999px;
  color: ${colors.plum};
  font: 600 14px ${fonts.sans};
  text-decoration: none;
  transition: background .2s, color .2s;
  &:hover { background: ${colors.plum}; color: ${colors.white}; }
`

export const SectionTitle = styled.div<{ $light?: boolean; $align?: 'center' | 'left' }>`
  text-align: ${({ $align }) => $align ?? 'center'};
  margin-bottom: 34px;
  .eyebrow { display: block; margin-bottom: 6px; color: ${({ $light }) => ($light ? colors.logoPink : colors.rose)}; font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; }
  h2 { margin: 0; color: ${({ $light }) => ($light ? colors.white : colors.plum)}; font: italic 400 clamp(30px, 4vw, 40px)/1.15 ${fonts.serif}; }
  .line { display: ${({ $align }) => ($align === 'left' ? 'none' : 'block')}; width: 46px; height: 2px; margin: 14px auto 0; border-radius: 2px; background: ${colors.rose}; }
  p { margin: 12px auto 0; max-width: 520px; color: ${({ $light }) => ($light ? '#E2C9CE' : colors.muted)}; font-size: 15px; line-height: 1.6; }
`

export const Wrap = styled.div`
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 40px;
  @media (max-width: 600px) { padding: 0 16px; }
`
