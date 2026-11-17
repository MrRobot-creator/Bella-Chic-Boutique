import styled from 'styled-components'
import { colors, fonts } from '../../../styles/tokens'
import { HeroSlideFrame } from '../styles'

/** Foto à esquerda, sumindo no rosa do fundo; em cima, some sob a barra do cabeçalho (como no primeiro banner). */
const photoMask = 'linear-gradient(270deg, transparent 0%, transparent 8%, #000 44%), linear-gradient(180deg, transparent 0, #000 72px)'
const photoMaskMobile = 'linear-gradient(270deg, transparent 0%, transparent 6%, #000 42%)'

export const Frame = styled(HeroSlideFrame)`
  justify-content: flex-end;
`

export const Photo = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 57%;
  height: 100%;
  object-fit: cover;
  /* Modelo na esquerda da foto; o letreiro "bc" aparece logo abaixo do cabeçalho. */
  object-position: 0% 45%;
  -webkit-mask-image: ${photoMask};
  -webkit-mask-composite: source-in;
  mask-image: ${photoMask};
  mask-composite: intersect;
  @media (max-width: 900px) {
    width: 62%;
    object-position: 0% 30%;
    -webkit-mask-image: ${photoMaskMobile};
    mask-image: ${photoMaskMobile};
  }
`

export const Copy = styled.div`
  position: relative;
  z-index: 1;
  width: min(560px, 44vw);
  margin-right: max(64px, calc((100vw - 1240px) / 2 + 24px));
  color: ${colors.plum};
  text-align: center;
  .eyebrow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    color: ${colors.gold};
    font-size: 13px;
    font-weight: 600;
    letter-spacing: .42em;
    text-transform: uppercase;
  }
  .eyebrow::before, .eyebrow::after { content: ''; flex: 1; max-width: 96px; height: 1px; background: ${colors.goldLight}; }
  h2 { margin-top: 18px; font: 500 clamp(64px, 7vw, 108px)/.95 ${fonts.serif}; letter-spacing: -.02em; }
  h2 > span { display: block; font-family: inherit; }
  h2 em { display: block; margin-top: -.12em; color: ${colors.rose}; font: 400 .62em/1 ${fonts.script}; letter-spacing: 0; }
  p { max-width: 430px; margin: 22px auto 0; color: #6B5659; font-size: 18px; line-height: 1.6; }
  @media (max-width: 900px) {
    width: 46%;
    margin-right: 12px;
    .eyebrow { gap: 8px; font-size: 9px; letter-spacing: .28em; }
    .eyebrow::before, .eyebrow::after { max-width: 18px; }
    h2 { margin-top: 8px; font-size: clamp(30px, 8.6vw, 60px); }
    p { display: none; }
  }
`

export const Pills = styled.div`
  margin-top: 30px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  a {
    height: 50px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 0 24px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    transition: background .2s;
  }
  svg { flex: none; }
  .place { background: ${colors.roseDark}; color: ${colors.white}; box-shadow: 0 12px 26px rgba(167, 47, 72, .25); }
  .place:hover { background: ${colors.plum}; }
  .instagram { border: 1px solid ${colors.lineStrong}; background: rgba(255, 255, 255, .65); color: ${colors.plum}; }
  .instagram:hover { background: ${colors.white}; }
  @media (max-width: 900px) {
    margin-top: 14px;
    a { height: 38px; gap: 6px; padding: 0 12px; font-size: 12px; }
    svg { width: 15px; height: 15px; }
    a.instagram, .state { display: none; }
  }
`
