import styled, { css, keyframes } from 'styled-components'
import { colors, fonts } from '../../styles/tokens'

const marquee = keyframes`from { transform: translateX(0) } to { transform: translateX(-50%) }`

/** Alinha o texto do banner com a largura do site (1240px), mesmo com a imagem ocupando a tela toda. */
const edgePadding = 'max(96px, calc((100vw - 1240px) / 2 + 40px))'

export const Page = styled.div`
  min-height: 100vh;
  background: ${colors.page};
  color: ${colors.plum};
  section[id], [id='trocas-devolucoes'], [id='pagamentos'] { scroll-margin-top: 96px; }
  @media (max-width: 900px) {
    section[id], [id='trocas-devolucoes'], [id='pagamentos'] { scroll-margin-top: 130px; }
  }
`

export const AnnouncementBar = styled.p`
  padding: 9px 16px;
  background: ${colors.rose};
  color: ${colors.white};
  font-size: 13px;
  text-align: center;
  letter-spacing: .2px;
  strong { letter-spacing: 1px; }
  @media (max-width: 600px) { font-size: 11px; padding: 8px 12px; }
`

export const Alert = styled.p<{ $tone?: 'error' | 'info' }>`
  margin: 0 auto 24px;
  max-width: 720px;
  padding: 12px 16px;
  border-radius: 14px;
  background: ${({ $tone }) => ($tone === 'error' ? '#FFF1F2' : colors.blush)};
  color: ${({ $tone }) => ($tone === 'error' ? '#A12C3B' : colors.plum)};
  font-size: 14px;
  text-align: center;
`

/* ---------- Banner principal ---------- */

export const Hero = styled.section`
  position: relative;
  height: 620px;
  overflow: hidden;
  background: ${colors.blush};
  touch-action: pan-y;
  @media (max-width: 1100px) { height: 520px; }
  @media (max-width: 900px) { height: 440px; }
  @media (max-width: 600px) { height: 340px; }
`

export const HeroSlide = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  visibility: ${({ $active }) => ($active ? 'visible' : 'hidden')};
  z-index: ${({ $active }) => ($active ? 1 : 0)};
  transition: opacity .9s cubic-bezier(.45, 0, .25, 1), visibility .9s;
  > img, > a > img, .photo { width: 100%; height: 100%; object-fit: cover; }
  .cta {
    position: absolute;
    left: 50%;
    bottom: 70px;
    height: 54px;
    padding: 0 36px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border-radius: 999px;
    background: ${colors.rose};
    color: ${colors.white};
    font-size: 15px;
    font-weight: 600;
    letter-spacing: .4px;
    white-space: nowrap;
    box-shadow: 0 12px 30px rgba(167, 47, 72, .3);
    transform: translateX(-50%);
    transition: background .2s;
  }
  a:hover .cta { background: ${colors.roseDark}; }
  > a { position: absolute; inset: 0; display: block; }
  @media (max-width: 600px) {
    .cta { bottom: 40px; height: 46px; padding: 0 26px; font-size: 14px; }
    > a > img { object-position: 45% center; }
  }
`

const heroCopy = css`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  .eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; }
  h2 { max-width: 560px; font: 400 clamp(34px, 4.6vw, 62px)/1.04 ${fonts.serif}; }
  p { max-width: 430px; font-size: 17px; line-height: 1.6; }
  .action {
    align-self: flex-start;
    height: 52px;
    padding: 0 34px;
    display: inline-flex;
    align-items: center;
    border: 0;
    border-radius: 999px;
    font: 600 15px ${fonts.sans};
    cursor: pointer;
    transition: background .2s, color .2s;
  }
  @media (max-width: 600px) {
    gap: 10px;
    h2 { font-size: 30px; }
    p { font-size: 14px; }
    .action { height: 44px; padding: 0 24px; font-size: 14px; }
  }
`

export const HeroSplit = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  .copy {
    ${heroCopy}
    padding: 0 64px 0 ${edgePadding};
    background: ${colors.blush};
    .eyebrow { color: ${colors.rose}; }
    h2 em { color: ${colors.rose}; }
    p { color: #6B5659; }
    .action { background: ${colors.rose}; color: ${colors.white}; }
    .action:hover { background: ${colors.roseDark}; }
  }
  .photo { object-position: center 30%; }
  @media (max-width: 900px) {
    display: block;
    .photo { position: absolute; inset: 0; }
    .copy {
      position: absolute;
      inset: 0;
      z-index: 1;
      justify-content: flex-end;
      padding: 24px 24px 56px;
      background: linear-gradient(0deg, rgba(46, 30, 34, .82) 0%, rgba(46, 30, 34, .25) 55%, rgba(46, 30, 34, 0) 75%);
      .eyebrow { color: ${colors.logoPink}; }
      h2, h2 em { color: ${colors.white}; }
      p { color: #F3DDE1; }
    }
  }
`

export const HeroStores = styled.div`
  position: absolute;
  inset: 0;
  .photo { position: absolute; inset: 0; object-position: center 40%; }
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(46, 30, 34, .78) 0%, rgba(46, 30, 34, .35) 45%, rgba(46, 30, 34, 0) 70%);
  }
  .copy {
    ${heroCopy}
    position: absolute;
    inset: 0;
    z-index: 1;
    padding: 0 ${edgePadding};
    color: ${colors.white};
    .eyebrow { color: ${colors.logoPink}; }
    p { color: #F3DDE1; }
    .action { background: ${colors.white}; color: ${colors.plum}; }
    .action:hover { background: ${colors.blush}; }
  }
  @media (max-width: 900px) {
    &::after { background: linear-gradient(0deg, rgba(46, 30, 34, .82) 0%, rgba(46, 30, 34, .3) 60%, rgba(46, 30, 34, .1) 100%); }
    .copy { justify-content: flex-end; padding: 24px 24px 56px; }
  }
`

export const HeroArrow = styled.button<{ $side: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $side }) => ($side === 'left' ? 'left: 24px;' : 'right: 24px;')}
  z-index: 3;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, .92);
  color: ${colors.plum};
  box-shadow: 0 6px 18px rgba(62, 42, 46, .15);
  transform: translateY(-50%);
  cursor: pointer;
  transition: background .2s;
  &:hover { background: ${colors.white}; }
  @media (max-width: 600px) { display: none; }
`

export const HeroDots = styled.div`
  position: absolute;
  left: 50%;
  bottom: 22px;
  z-index: 3;
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .75);
  transform: translateX(-50%);
  button { width: 8px; height: 8px; padding: 0; border: 0; border-radius: 999px; background: #D29AA5; cursor: pointer; transition: width .3s, background .3s; }
  button[aria-current='true'] { width: 26px; background: ${colors.rose}; }
  @media (max-width: 600px) { bottom: 12px; padding: 6px 10px; }
`

/* ---------- Vantagens ---------- */

export const Benefits = styled.section`
  background: ${colors.white};
  border-bottom: 1px solid ${colors.line};
  ul { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; padding: 26px 0; text-align: center; }
  li { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  strong { font-size: 14px; }
  span { color: ${colors.muted}; font-size: 13px; }
  @media (max-width: 900px) {
    ul { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 12px; padding: 20px 0; }
    svg { display: none; }
    strong { font-size: 13px; }
    span { font-size: 12px; }
  }
  @media (max-width: 600px) { li:nth-child(n+3) { display: none; } }
`

/* ---------- Seções ---------- */

export const Block = styled.section<{ $tone?: 'white' | 'blush' | 'dark'; $tight?: boolean }>`
  padding: ${({ $tight }) => ($tight ? '56px 0 24px' : '72px 0 80px')};
  background: ${({ $tone }) => ($tone === 'blush' ? '#FBF4F4' : $tone === 'dark' ? colors.plum : 'transparent')};
  @media (max-width: 600px) { padding: ${({ $tight }) => ($tight ? '28px 0 8px' : '44px 0 52px')}; }
`

export const HeadRow = styled.div<{ $light?: boolean }>`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin-bottom: 34px;
  .eyebrow { display: block; color: ${({ $light }) => ($light ? colors.logoPink : colors.rose)}; font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; }
  h2 { margin-top: 6px; color: ${({ $light }) => ($light ? colors.white : colors.plum)}; font: italic 400 clamp(30px, 4vw, 42px)/1.15 ${fonts.serif}; }
  p { max-width: 380px; color: ${({ $light }) => ($light ? '#E2C9CE' : colors.muted)}; font-size: 15px; line-height: 1.6; }
  .see-all { padding: 0; border: 0; background: none; color: ${colors.roseDark}; font: 600 15px ${fonts.sans}; cursor: pointer; }
  .see-all:hover { color: #7E2236; }
  @media (max-width: 600px) { margin-bottom: 22px; }
`

export const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  /* 4 ou 2 colunas (sem 3): as listas de 4 e 8 peças sempre fecham a fileira. */
  @media (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 760px) { gap: 12px; }
`

/* ---------- Categorias ---------- */

export const Categories = styled.ul`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 36px;
  li { flex: none; }
  button {
    width: 150px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 0;
    border: 0;
    background: none;
    color: ${colors.plum};
    font: 500 15px ${fonts.sans};
    cursor: pointer;
  }
  .photo {
    width: 150px;
    height: 150px;
    overflow: hidden;
    border-radius: 50%;
    background: ${colors.blush};
    box-shadow: 0 0 0 6px ${colors.white}, 0 0 0 7px #F4D7DC;
    transition: box-shadow .3s;
  }
  .photo img { width: 100%; height: 100%; object-fit: cover; object-position: top; transition: transform .6s cubic-bezier(.45, 0, .25, 1); }
  button:hover .photo { box-shadow: 0 0 0 6px ${colors.white}, 0 0 0 8px ${colors.rose}; }
  button:hover .photo img { transform: scale(1.05); }
  small { display: block; margin-top: -10px; color: ${colors.soft}; font-size: 12px; }
  @media (max-width: 760px) {
    justify-content: flex-start;
    flex-wrap: nowrap;
    gap: 16px;
    margin: 0 -16px;
    padding: 6px 16px 10px;
    overflow-x: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
    button { width: 78px; gap: 10px; font-size: 12px; }
    .photo { width: 74px; height: 74px; box-shadow: 0 0 0 3px ${colors.white}, 0 0 0 4px #F4D7DC; }
    small { display: none; }
  }
`

/* ---------- Combos ---------- */

export const ComboGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  @media (max-width: 1000px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`

export const ComboCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px;
  border-radius: 22px;
  background: ${colors.white};
  .photos { position: relative; height: 230px; display: flex; gap: 10px; }
  .photos > button { flex: 1; min-width: 0; padding: 0; overflow: hidden; border: 0; border-radius: 14px; background: ${colors.blushSoft}; cursor: pointer; }
  .photos img { width: 100%; height: 100%; object-fit: cover; object-position: top; transition: transform .6s cubic-bezier(.45, 0, .25, 1); }
  .photos > button:hover img { transform: scale(1.04); }
  .plus { position: absolute; left: 50%; top: 50%; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; background: ${colors.rose}; color: ${colors.white}; font-size: 22px; box-shadow: 0 0 0 5px ${colors.white}; transform: translate(-50%, -50%); pointer-events: none; }
  .badge { position: absolute; top: 10px; left: 10px; padding: 5px 10px; border-radius: 999px; background: ${colors.white}; color: ${colors.roseDark}; font-size: 11px; font-weight: 700; pointer-events: none; }
  h3 { color: ${colors.plum}; font: 400 24px/1.2 ${fonts.serif}; }
  .desc { margin-top: 6px; display: -webkit-box; overflow: hidden; color: ${colors.muted}; font-size: 14px; line-height: 1.5; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .bottom { margin-top: auto; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
  .prices { display: flex; flex-direction: column; gap: 2px; }
  .prices s { color: ${colors.soft}; font-size: 13px; }
  .prices strong { color: ${colors.plum}; font-size: 20px; }
  .bottom button { height: 46px; padding: 0 22px; border: 0; border-radius: 999px; background: ${colors.rose}; color: ${colors.white}; font: 600 14px ${fonts.sans}; cursor: pointer; white-space: nowrap; transition: background .2s; }
  .bottom button:hover { background: ${colors.roseDark}; }
  @media (max-width: 480px) { padding: 16px; .photos { height: 200px; } }
`

/* ---------- Promoções ---------- */

export const Ribbon = styled.div`
  margin: 8px -20px 56px;
  padding: 14px 0;
  overflow: hidden;
  background: ${colors.rose};
  color: ${colors.white};
  box-shadow: 0 10px 24px rgba(167, 47, 72, .22);
  transform: rotate(-1.2deg);
  .track { width: max-content; display: flex; animation: ${marquee} 38s linear infinite; }
  .group { display: flex; gap: 38px; padding-right: 38px; white-space: nowrap; font-size: 15px; font-weight: 700; letter-spacing: 2px; }
  @media (prefers-reduced-motion: reduce) { .track { animation: none; } }
  @media (max-width: 600px) { margin-bottom: 36px; padding: 11px 0; .group { font-size: 12px; gap: 24px; padding-right: 24px; } }
`

export const PromoGrid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: ${({ $columns }) => ($columns === 3 ? '1.05fr 1fr 1fr' : '1fr 1fr')};
  gap: 22px;
  @media (max-width: 1000px) { grid-template-columns: 1fr 1fr; > :first-child { grid-column: 1 / -1; } }
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`

export const DealCard = styled.div`
  position: relative;
  min-height: 460px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 26px;
  padding: 40px 38px;
  overflow: hidden;
  border-radius: 26px;
  background: ${colors.plum};
  color: ${colors.white};
  &::before, &::after { content: ''; position: absolute; border-radius: 50%; pointer-events: none; }
  &::before { right: -70px; top: -70px; width: 260px; height: 260px; background: ${colors.rose}; opacity: .55; }
  &::after { right: 60px; bottom: -90px; width: 200px; height: 200px; border: 2px solid ${colors.logoPink}; opacity: .5; }
  > div { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 14px; }
  .badge { align-self: flex-start; padding: 6px 14px; border-radius: 999px; background: ${colors.logoPink}; color: ${colors.plum}; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; }
  .title { font: 400 54px/1.02 ${fonts.serif}; }
  .title em { color: ${colors.logoPink}; }
  .lead { max-width: 320px; color: #E9D3D7; font-size: 16px; line-height: 1.6; }
  .until { color: #E9D3D7; font-size: 13px; }
  .until strong { color: ${colors.white}; }
  button { align-self: flex-start; height: 52px; padding: 0 30px; display: inline-flex; align-items: center; gap: 10px; border: 0; border-radius: 999px; background: ${colors.white}; color: ${colors.plum}; font: 700 15px ${fonts.sans}; cursor: pointer; transition: background .2s; }
  button:hover { background: ${colors.blush}; }
  @media (max-width: 1000px) { min-height: 0; }
  @media (max-width: 600px) { padding: 30px 24px; .title { font-size: 42px; } }
`

export const OfferCard = styled.article`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid ${colors.line};
  border-radius: 26px;
  background: ${colors.white};
  .photo { position: relative; flex: 1; min-height: 300px; padding: 0; overflow: hidden; border: 0; background: ${colors.blushSoft}; cursor: pointer; }
  .photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top; transition: transform .6s cubic-bezier(.45, 0, .25, 1); }
  .photo:hover img { transform: scale(1.03); }
  .off { position: absolute; top: 16px; left: 16px; width: 74px; height: 74px; display: grid; place-items: center; border-radius: 50%; background: ${colors.rose}; color: ${colors.white}; line-height: 1; text-align: center; box-shadow: 0 8px 20px rgba(167, 47, 72, .35); }
  .off strong { font-size: 24px; }
  .off small { font-size: 10px; letter-spacing: 1px; }
  .info { display: flex; flex-direction: column; gap: 6px; padding: 20px 22px 22px; }
  .category { color: ${colors.soft}; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; }
  h3 { font-size: 18px; font-weight: 600; }
  .prices { display: flex; align-items: baseline; gap: 10px; }
  .prices s { color: ${colors.soft}; font-size: 14px; }
  .prices strong { color: ${colors.roseDark}; font-size: 24px; }
  .save { color: ${colors.success}; font-size: 13px; font-weight: 600; }
  .info > button { margin-top: 8px; height: 46px; border: 0; border-radius: 999px; background: ${colors.rose}; color: ${colors.white}; font: 600 14px ${fonts.sans}; cursor: pointer; transition: background .2s; }
  .info > button:hover { background: ${colors.roseDark}; }
`

export const PromoSide = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

export const Coupon = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 26px 26px 24px;
  border: 2px dashed #E8637C;
  border-radius: 22px;
  background: ${colors.blush};
  &::before, &::after { content: ''; position: absolute; top: 50%; width: 26px; height: 26px; border-radius: 50%; background: ${colors.page}; transform: translateY(-50%); }
  &::before { left: -14px; border-right: 2px dashed #E8637C; }
  &::after { right: -14px; border-left: 2px dashed #E8637C; }
  &:only-child { flex: 1; justify-content: center; }
  .label { color: ${colors.roseDark}; font-size: 12px; font-weight: 700; letter-spacing: 2px; }
  .value { color: ${colors.plum}; font: 400 44px/1 ${fonts.serif}; }
  .value small { font-size: 22px; }
  .rule { color: #6B5659; font-size: 13px; }
  .code { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
  .code span { flex: 1; height: 46px; display: grid; place-items: center; border-radius: 12px; background: ${colors.white}; color: ${colors.plum}; font-size: 18px; font-weight: 700; letter-spacing: 3px; }
  .code button { height: 46px; padding: 0 18px; border: 0; border-radius: 12px; background: ${colors.plum}; color: ${colors.white}; font: 600 13px ${fonts.sans}; cursor: pointer; }
`

export const ComboShortcut = styled.a`
  flex: 1;
  min-height: 150px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  overflow: hidden;
  border-radius: 22px;
  background: ${colors.cream};
  color: ${colors.plum};
  img { width: 104px; height: 120px; flex: none; border-radius: 14px; object-fit: cover; object-position: top; }
  > span { display: flex; flex-direction: column; gap: 6px; }
  .tag { align-self: flex-start; padding: 4px 10px; border-radius: 999px; background: ${colors.plum}; color: ${colors.white}; font-size: 11px; font-weight: 700; letter-spacing: 1px; }
  strong { font: 400 22px/1.2 ${fonts.serif}; }
  .more { color: ${colors.roseDark}; font-size: 14px; font-weight: 600; }
  &:hover .more { text-decoration: underline; }
`

/* ---------- Catálogo ---------- */

export const Tabs = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 22px;
  button {
    height: 42px;
    padding: 0 20px;
    border: 1px solid ${colors.lineStrong};
    border-radius: 999px;
    background: ${colors.white};
    color: ${colors.plum};
    font: 500 14px ${fonts.sans};
    cursor: pointer;
    transition: background .2s, color .2s, border-color .2s;
  }
  button:hover { border-color: ${colors.rose}; }
  button[aria-selected='true'] { border-color: ${colors.plum}; background: ${colors.plum}; color: ${colors.white}; }
  button span { margin-left: 4px; opacity: .6; }
  @media (max-width: 760px) {
    justify-content: flex-start;
    flex-wrap: nowrap;
    margin: 0 -16px 18px;
    padding: 0 16px 4px;
    overflow-x: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
    button { flex: none; height: 38px; padding: 0 16px; font-size: 13px; }
  }
`

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 22px;
  .count { color: ${colors.muted}; font-size: 14px; }
  .search-chip { margin-left: 10px; display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border: 0; border-radius: 999px; background: ${colors.blush}; color: ${colors.roseDark}; font: 600 13px ${fonts.sans}; cursor: pointer; }
  .tools { display: flex; gap: 10px; }
  select, .filters {
    height: 42px;
    padding: 0 16px;
    border: 1px solid ${colors.lineStrong};
    border-radius: 999px;
    background: ${colors.white};
    color: ${colors.plum};
    font: 500 14px ${fonts.sans};
    cursor: pointer;
  }
  .filters { display: inline-flex; align-items: center; gap: 8px; }
  .filters[aria-expanded='true'] { border-color: ${colors.plum}; }
  .badge { min-width: 20px; height: 20px; display: grid; place-items: center; border-radius: 999px; background: ${colors.rose}; color: ${colors.white}; font-size: 11px; font-weight: 700; }
  @media (max-width: 600px) {
    .tools { width: 100%; }
    select { flex: 1; min-width: 0; }
  }
`

export const FilterPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  align-items: end;
  gap: 16px;
  margin-bottom: 26px;
  padding: 20px;
  border: 1px solid ${colors.line};
  border-radius: 18px;
  background: ${colors.white};
  label { display: grid; gap: 8px; color: ${colors.muted}; font-size: 13px; }
  label strong { color: ${colors.plum}; }
  select { height: 44px; padding: 0 12px; border: 1px solid ${colors.lineStrong}; border-radius: 12px; background: ${colors.white}; color: ${colors.plum}; font: 14px ${fonts.sans}; }
  input[type='range'] { height: 44px; accent-color: ${colors.rose}; }
  .clear { height: 44px; padding: 0 18px; border: 0; border-radius: 999px; background: ${colors.blush}; color: ${colors.roseDark}; font: 600 13px ${fonts.sans}; cursor: pointer; }
  .clear:disabled { cursor: not-allowed; opacity: .5; }
  @media (max-width: 800px) { grid-template-columns: 1fr 1fr; .clear { grid-column: 1 / -1; } }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`

export const Empty = styled.div`
  padding: 40px 16px;
  text-align: center;
  color: ${colors.muted};
  font-size: 15px;
  button { margin-top: 16px; height: 44px; padding: 0 24px; border: 1.5px solid ${colors.plum}; border-radius: 999px; background: none; color: ${colors.plum}; font: 600 14px ${fonts.sans}; cursor: pointer; }
`

export const LoadMore = styled.div`
  margin-top: 36px;
  text-align: center;
  button { height: 50px; padding: 0 34px; border: 1.5px solid ${colors.plum}; border-radius: 999px; background: none; color: ${colors.plum}; font: 600 14px ${fonts.sans}; cursor: pointer; transition: background .2s, color .2s; }
  button:hover { background: ${colors.plum}; color: ${colors.white}; }
`

/* ---------- Lojas ---------- */

export const StoresLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 2fr);
  gap: 32px;
  align-items: start;
  .about { position: sticky; top: 110px; display: flex; flex-direction: column; gap: 14px; }
  .about .eyebrow { color: ${colors.rose}; font-size: 12px; font-weight: 600; letter-spacing: 3px; }
  .about h2 { font: 400 clamp(28px, 3.2vw, 38px)/1.15 ${fonts.serif}; }
  .about h2 em { color: ${colors.rose}; }
  .about p { color: ${colors.muted}; font-size: 15px; line-height: 1.7; }
  .units { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
    .about { position: static; }
  }
  @media (max-width: 640px) { .units { grid-template-columns: 1fr; } }
`

export const UnitCard = styled.article`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid ${colors.line};
  border-radius: 22px;
  background: ${colors.white};
  > img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
  .body { flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 20px 22px 22px; }
  .city { color: ${colors.rose}; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; }
  h3 { font: 400 24px ${fonts.serif}; }
  .address, .hours { display: flex; gap: 8px; color: ${colors.muted}; font-size: 14px; line-height: 1.55; }
  .address svg, .hours svg { flex: none; margin-top: 2px; color: ${colors.rose}; }
  .actions { margin-top: auto; padding-top: 6px; display: flex; flex-wrap: wrap; gap: 8px; }
  .actions a { min-height: 42px; padding: 0 16px; display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; font-size: 13px; font-weight: 600; transition: background .2s, border-color .2s; }
  .map { border: 1px solid ${colors.lineStrong}; color: ${colors.plum}; }
  .map:hover { border-color: ${colors.rose}; }
  .whats { background: ${colors.rose}; color: ${colors.white}; }
  .whats:hover { background: ${colors.roseDark}; }
`

/* ---------- Pagamentos e trocas ---------- */

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 22px;
  align-items: start;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`

export const Panel = styled.div`
  padding: 30px;
  border: 1px solid ${colors.line};
  border-radius: 22px;
  background: ${colors.white};
  > h3 { margin-bottom: 6px; font: 400 26px ${fonts.serif}; }
  > .lead { margin-bottom: 20px; color: ${colors.muted}; font-size: 14px; }
  .note { margin-top: 16px; color: ${colors.muted}; font-size: 13px; }
  @media (max-width: 600px) { padding: 22px 18px; }
`

export const PaymentMethods = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  @media (max-width: 600px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`

export const PaymentCard = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 18px 10px;
  border: 1.5px solid ${({ $active }) => ($active ? colors.rose : colors.line)};
  border-radius: 16px;
  background: ${({ $active }) => ($active ? colors.blushSoft : colors.white)};
  color: ${colors.plum};
  font-family: ${fonts.sans};
  text-align: center;
  cursor: pointer;
  transition: border-color .2s, background .2s;
  &:hover { border-color: ${colors.roseLight}; }
  .icon { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 50%; background: ${colors.blush}; color: ${colors.rose}; }
  .icon svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .icon.pix svg { fill: currentColor; stroke: none; }
  strong { font-size: 14px; }
  small { color: ${colors.muted}; font-size: 12px; line-height: 1.4; }
`

export const FeeInfo = styled.div`
  margin-top: 16px;
  padding: 18px;
  border-radius: 16px;
  background: ${colors.blushSoft};
  p { color: #6B5659; font-size: 13px; line-height: 1.6; }
  dl { margin: 12px 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  dl div { padding: 10px; border-radius: 12px; background: ${colors.white}; text-align: center; }
  dt { color: ${colors.muted}; font-size: 12px; }
  dd { margin-top: 2px; color: ${colors.plum}; font-size: 15px; font-weight: 700; }
  @media (max-width: 480px) { dl { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`

export const Policy = styled.div`
  padding: 30px;
  border-radius: 22px;
  background: ${colors.blush};
  outline: none;
  .badge { display: inline-block; margin-bottom: 12px; padding: 5px 12px; border-radius: 999px; background: ${colors.white}; color: ${colors.roseDark}; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  h3 { margin-bottom: 14px; font: 400 26px ${fonts.serif}; }
  ul { display: grid; gap: 10px; }
  li { position: relative; padding-left: 22px; color: #5E474B; font-size: 14px; line-height: 1.55; }
  li::before { content: '♡'; position: absolute; left: 0; color: ${colors.rose}; }
  .note { margin-top: 16px; color: ${colors.muted}; font-size: 13px; }
  .note a { color: ${colors.roseDark}; font-weight: 600; text-decoration: underline; }
  @media (max-width: 600px) { padding: 22px 18px; }
`

/* ---------- Rodapé ---------- */

export const Footer = styled.footer`
  padding: 56px 0 28px;
  border-top: 1px solid ${colors.line};
  background: ${colors.white};
`

export const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr 1.4fr;
  gap: 32px;
  .brand { display: flex; flex-direction: column; gap: 14px; }
  .brand img { width: 76px; height: 76px; border-radius: 50%; object-fit: cover; }
  .brand p { color: #6B5659; font-size: 14px; line-height: 1.6; }
  .social { display: flex; gap: 10px; }
  .social a { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; background: ${colors.blush}; color: ${colors.roseDark}; transition: background .2s; }
  .social a:hover { background: #FBD5DB; }
  nav, .col { display: flex; flex-direction: column; gap: 10px; font-size: 14px; }
  nav strong, .col strong { color: ${colors.plum}; font-size: 13px; letter-spacing: 1.5px; }
  nav a, nav button, .col a { width: fit-content; padding: 0; border: 0; background: none; color: #6B5659; font: 14px ${fonts.sans}; text-align: left; cursor: pointer; }
  nav a:hover, nav button:hover, .col a:hover { color: ${colors.roseDark}; }
  .col span { color: #6B5659; line-height: 1.55; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chips span { padding: 7px 12px; border: 1px solid ${colors.lineStrong}; border-radius: 8px; color: ${colors.plum}; font-size: 12px; font-weight: 600; }
  .secure { display: flex; align-items: center; gap: 8px; color: ${colors.success} !important; font-size: 13px; font-weight: 600; }
  @media (max-width: 1000px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 560px) { grid-template-columns: 1fr; gap: 26px; }
`

export const FooterBottom = styled.div`
  margin-top: 44px;
  padding-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  border-top: 1px solid ${colors.line};
  color: #8D7779;
  font-size: 12px;
`

export const DeveloperCredit = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`

export const PortfolioButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: ${colors.plum};
  color: ${colors.white};
  font-size: 12px;
  font-weight: 600;
  transition: background .2s;
  svg { width: 14px; height: 14px; fill: currentColor; }
  &:hover { background: ${colors.roseDark}; color: ${colors.white}; }
`
