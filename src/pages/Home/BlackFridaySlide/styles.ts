import styled from 'styled-components'
import { colors, fonts } from '../../../styles/tokens'
import { HeroSlideFrame } from '../styles'

/* Tons do material da ação: fundo quase preto com rosé dourado. */
const night = '#1E1416'
const roseGold = '#E8B4A0'
const roseGoldSoft = '#F3D6CB'

export const Frame = styled(HeroSlideFrame)`
  background: radial-gradient(circle at 72% 55%, #3A2328 0%, ${night} 62%);
  color: ${roseGoldSoft};
`

export const Inner = styled.div`
  width: min(1240px, calc(100% - 128px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 56px;
  @media (max-width: 900px) {
    width: 100%;
    height: 100%;
    padding: 18px 16px;
    box-sizing: border-box;
    grid-template-columns: minmax(0, 1fr) minmax(0, .72fr);
    gap: 14px;
  }
`

export const Copy = styled.div`
  max-width: 560px;
  .eyebrow {
    display: flex;
    align-items: center;
    gap: 16px;
    color: ${roseGold};
    font-size: 13px;
    font-weight: 600;
    letter-spacing: .42em;
    text-transform: uppercase;
  }
  .eyebrow::after { content: ''; flex: 1; max-width: 96px; height: 1px; background: ${roseGold}; opacity: .6; }
  h2 { margin-top: 16px; color: #FBEDE8; font: 500 clamp(48px, 5vw, 72px)/1 ${fonts.serif}; letter-spacing: -.01em; }
  h2 > span { display: block; font-family: inherit; }
  h2 em { display: block; margin-top: -.05em; color: ${roseGold}; font: 400 1.5em/1 ${fonts.script}; letter-spacing: 0; }
  p { max-width: 460px; margin-top: 18px; color: #E9D3D7; font-size: 18px; line-height: 1.6; }
  p strong { color: #FBEDE8; }
  .cta {
    margin-top: 28px;
    height: 52px;
    display: inline-flex;
    align-items: center;
    padding: 0 28px;
    border-radius: 999px;
    background: ${roseGold};
    color: ${colors.plum};
    font-size: 15px;
    font-weight: 700;
    transition: background .2s;
  }
  .cta:hover { background: ${roseGoldSoft}; }
  @media (max-width: 900px) {
    .eyebrow { gap: 8px; font-size: 9px; letter-spacing: .28em; }
    .eyebrow::after { max-width: 24px; }
    h2 { margin-top: 6px; font-size: clamp(22px, 6.4vw, 44px); }
    p { display: none; }
    .cta { margin-top: 12px; height: 36px; padding: 0 16px; font-size: 12px; }
  }
`

export const Perks = styled.ul`
  margin-top: 24px;
  display: grid;
  gap: 10px;
  list-style: none;
  li { display: flex; align-items: center; gap: 10px; color: #E9D3D7; font-size: 15px; }
  svg { flex: none; color: ${roseGold}; }
  strong { color: #FBEDE8; letter-spacing: .06em; }
  @media (max-width: 900px) {
    margin-top: 8px;
    gap: 5px;
    li { gap: 6px; font-size: 11px; line-height: 1.3; }
    svg { width: 14px; height: 14px; }
  }
`

export const Flyer = styled.img`
  width: auto;
  height: min(540px, calc(100vh - 220px));
  min-height: 380px;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border: 1px solid rgba(232, 180, 160, .35);
  border-radius: 22px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, .45);
  @media (max-width: 1100px) { height: 440px; min-height: 0; }
  @media (max-width: 900px) {
    justify-self: end;
    width: 100%;
    max-width: 300px;
    height: auto;
    min-height: 0;
    border-radius: 14px;
  }
`
