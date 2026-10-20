import styled from 'styled-components'

export const Main = styled.main`
  .no-products { padding: 50px 0; color: #867778; text-align: center; font-size: 14px; }
`

export const Hero = styled.section`
  position: relative;
  overflow: hidden;
  background: #fbf7f4;
  scroll-margin-top: 82px;
`

export const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  width: min(1240px, calc(100% - 64px));
  min-height: 500px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: .72fr 1.28fr;
  align-items: center;
  gap: clamp(32px, 5vw, 72px);
  padding: 38px 0;
  @media (max-width: 760px) {
    grid-template-columns: .75fr 1.25fr;
    gap: 20px;
    min-height: 430px;
    padding: 28px 0;
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 18px;
    min-height: 0;
    padding: 30px 0 26px;
  }
  @media (max-width: 600px) { width: calc(100% - 36px); }
`

export const HeroText = styled.div`
  .eyebrow { color: #a47479; font-size: 8px; font-weight: 600; letter-spacing: 1.6px; }
  h1 { max-width: 420px; margin: 13px 0 0; color: #503b3f; font: clamp(32px, 3.8vw, 48px)/1.08 Georgia, serif; letter-spacing: -1.2px; }
  h1 em { color: #b77c85; font-weight: 400; }
  .primary-link { display: inline-flex; align-items: center; gap: 22px; margin-top: 19px; padding: 11px 15px; border-radius: 2px; background: #78535a; color: #fff; text-decoration: none; font-size: 10px; transition: background .2s; }
  .primary-link:hover { background: #60434a; }
  .primary-link span { font-size: 14px; }
  @media (max-width: 760px) {
    text-align: left;
    h1 { max-width: 100%; margin: 8px 0 0; font-size: clamp(24px, 6vw, 34px); }
    .primary-link { gap: 8px; margin-top: 13px; padding: 9px 10px; font-size: 9px; white-space: nowrap; }
  }
  @media (max-width: 400px) { .eyebrow { font-size: 7px; letter-spacing: 1.2px; } }
`

export const HeroShowcase = styled.div`
  display: grid;
  gap: 0;
  width: min(100%, 570px);
  justify-self: end;
  @media (max-width: 760px) { width: 100%; justify-self: center; }
`

export const ShowcaseViewport = styled.div`
  width: 100%;
  overflow: hidden;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
  &:active { cursor: grabbing; }
  &:focus-visible { outline: 2px solid #8c6066; outline-offset: 3px; }
`

export const ShowcaseTrack = styled.div<{
  $position: number
  $dragOffset: number
  $transitionEnabled: boolean
}>`
  display: flex;
  width: 100%;
  transform: translate3d(calc(${({ $position }) => -$position * 100}% + ${({ $dragOffset }) => $dragOffset}px), 0, 0);
  transition: ${({ $transitionEnabled }) => $transitionEnabled ? 'transform .58s cubic-bezier(.22,.72,.25,1)' : 'none'};
  will-change: transform;
`

export const ShowcaseImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .45s;
`

export const ShowcaseLink = styled.a`
  position: relative;
  flex: 0 0 100%;
  width: 100%;
  display: block;
  aspect-ratio: 1.16 / 1;
  overflow: hidden;
  border: 1px solid #f0e4e2;
  background: #f5eeee;
  color: #634b4f;
  text-decoration: none;
  box-shadow: inset 0 0 0 1px #ffffff18;
  &:hover ${ShowcaseImage} { transform: scale(1.025); }
  .showcase-label { position: absolute; top: 10px; left: 10px; padding: 5px 8px; background: #fffdfb; color: #8e6269; font-size: 7px; letter-spacing: 1.2px; }
  .showcase-product { position: absolute; right: 0; bottom: 0; left: 0; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; padding: 44px 20px 18px; background: linear-gradient(transparent, #332628b8); color: #fff; }
  .showcase-product strong { font: 20px Georgia, serif; }
  .showcase-product > span { flex: 0 0 auto; font-size: 12px; }
  @media (max-width: 760px) { aspect-ratio: 1.05 / 1; .showcase-product { padding: 36px 14px 13px; } }
  @media (max-width: 400px) {
    aspect-ratio: 1.08 / 1;
    .showcase-product strong { font-size: 17px; }
    .showcase-product { align-items: flex-end; flex-direction: row; gap: 8px; padding: 30px 11px 10px; }
    .showcase-product > span { font-size: 10px; }
  }
`

export const Contact = styled.section`
  padding: 68px 24px 72px;
  background: #f8eeee;
  scroll-margin-top: 82px;
  @media (max-width: 600px) { padding: 48px 18px 54px; }
`

export const ContactContent = styled.div`
  width: min(950px, 100%);
  margin: 0 auto;
  > .social-links { display: flex; margin-top: 17px; }
  .payments { margin-top: 42px; padding-top: 30px; border-top: 1px solid #eadbdc; }
  .payments h3 { margin-bottom: 15px; color: #5a4347; font: 22px Georgia, serif; }
  .payments > p { margin-top: 12px; color: #8c7c7d; font-size: 11px; }
`

export const ContactHeader = styled.div`
  .eyebrow { color: #a47479; font-size: 9px; letter-spacing: 1.8px; }
  h2 { margin-top: 8px; color: #533f42; font: 35px/1.2 Georgia, serif; }
  h2 em { color: #b77c85; font-weight: 400; }
  @media (max-width: 500px) { h2 { font-size: 30px; } }
`

export const ContactUnits = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin: 23px 0 15px;
`

export const ContactUnitButton = styled.button<{ $active: boolean }>`
  padding: 10px 16px;
  border: 1px solid ${({ $active }) => ($active ? '#76535a' : '#e7d7d8')};
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#76535a' : '#fff')};
  color: ${({ $active }) => ($active ? '#fff' : '#776566')};
  font-size: 11px;
  transition: background .2s, color .2s;
  &:hover { border-color: #ab7d84; }
`

export const ContactUnit = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px;
  border: 1px solid #eadbdc;
  background: #fffdfb;
  h3 { color: #584246; font: 20px Georgia, serif; }
  p { margin-top: 7px; color: #877779; font-size: 12px; line-height: 1.6; }
  .contact-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
  @media (max-width: 700px) { align-items: flex-start; flex-direction: column; .contact-actions { justify-content: flex-start; } }
  @media (max-width: 420px) { padding: 17px; }
`

export const ContactLink = styled.a<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 10px 14px;
  border: 1px solid ${({ $primary }) => ($primary ? '#76535a' : '#ead8d9')};
  border-radius: 999px;
  background: ${({ $primary }) => ($primary ? '#76535a' : '#fff')};
  color: ${({ $primary }) => ($primary ? '#fff' : '#684b50')};
  font-size: 10px;
  text-decoration: none;
  transition: background .2s, color .2s;
  &:hover { background: ${({ $primary }) => ($primary ? '#60434a' : '#fcf4f4')}; }
  .contact-icon { flex: 0 0 18px; width: 18px; height: 18px; fill: currentColor; }
  .instagram-icon { fill: none; stroke: currentColor; stroke-width: 1.8; }
  .instagram-icon .instagram-dot { fill: currentColor; stroke: none; }
`

export const PaymentMethods = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  @media (max-width: 500px) { gap: 7px; }
`

export const PaymentCard = styled.a`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 7px;
  min-height: 132px;
  padding: 12px;
  border: 1px solid #eadbdc;
  background: #fffdfb;
  color: #604a4e;
  text-decoration: none;
  transition: transform .2s, border-color .2s, box-shadow .2s;
  &:hover { transform: translateY(-2px); border-color: #cba9ad; box-shadow: 0 6px 18px #79575912; }
  .payment-visual {
    display: grid;
    place-items: center;
    width: 100%;
    height: 56px;
    border-radius: 3px;
    background: #f8eeee;
    color: #9d6c74;
  }
  .payment-visual svg { display: block; width: 38px; height: 38px; fill: currentColor; }
  .payment-visual.card { background: #f4e4e5; }
  .payment-visual.card svg { width: 54px; height: 38px; filter: drop-shadow(0 3px 4px #503b3f35); }
  .payment-visual.card svg > rect:first-child { fill: #79565d; }
  .payment-visual.card .card-stripe { fill: #c99ba1; }
  .payment-visual.card .card-chip { fill: #e6c991; }
  .payment-visual.card .card-contactless { fill: none; stroke: #fff; stroke-linecap: round; stroke-width: 2; }
  .payment-visual.cash svg { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
  strong { font: 13px Georgia, serif; }
  .payment-action { margin-top: auto; color: #98777c; font-size: 8px; }
  @media (max-width: 500px) {
    align-items: center;
    min-height: 120px;
    padding: 8px 5px;
    gap: 6px;
    .payment-visual { height: 48px; }
    .payment-visual svg { width: 32px; height: 32px; }
    .payment-visual.card svg { width: 46px; height: 33px; }
    strong { font-size: 11px; text-align: center; }
    .payment-action { font-size: 7px; text-align: center; }
  }
`

export const Catalog = styled.section`
  width: min(1240px, calc(100% - 64px));
  margin: 0 auto;
  padding: 54px 0 76px;
  scroll-margin-top: 90px;
  @media (max-width: 700px) { width: calc(100% - 36px); padding: 55px 0 64px; }
`

export const CatalogHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  .eyebrow { color: #a47479; font-size: 9px; letter-spacing: 1.8px; }
  h2 { margin-top: 8px; color: #533f42; font: 38px Georgia, serif; }
  h2 em { color: #b77c85; font-weight: 400; }
  @media (max-width: 760px) { align-items: flex-start; flex-direction: column; gap: 20px; h2 { font-size: 36px; } }
`

export const CatalogTools = styled.div`
  @media (max-width: 760px) { width: 100%; }
`

export const SearchInput = styled.input`
  width: 250px;
  padding: 13px 15px;
  border: 1px solid #ebdfdf;
  border-radius: 999px;
  background: #fff;
  color: #584648;
  font-size: 12px;
  outline-color: #c39198;
  &::placeholder { color: #a49595; }
  @media (max-width: 760px) { width: 100%; }
`

export const CategoryMenu = styled.div`
  position: relative;
  width: fit-content;
  margin: 24px 0 21px;
`

export const CategoryMenuButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 11px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid #ead8d9;
  border-radius: 2px;
  background: #fff;
  color: #684b50;
  font-size: 12px;
  transition: border-color .2s, background .2s;
  &:hover, &[aria-expanded="true"] { border-color: #b98b91; background: #fffafa; }
  .hamburger { display: grid; gap: 4px; width: 17px; }
  .hamburger i { display: block; width: 17px; height: 1.5px; background: #78535a; }
  .hamburger i:nth-child(2) { width: 12px; }
  .active-category { padding-left: 10px; border-left: 1px solid #ead8d9; color: #9a7479; font-size: 11px; }
`

export const CategoryMenuPanel = styled.div`
  position: absolute;
  z-index: 8;
  top: calc(100% + 7px);
  left: 0;
  width: min(260px, calc(100vw - 40px));
  max-height: min(340px, 60vh);
  padding: 6px;
  overflow-y: auto;
  border: 1px solid #eddfdf;
  background: #fff;
  box-shadow: 0 12px 30px #52343b1a;
`

export const CategoryMenuOption = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 11px 12px;
  background: ${({ $active }) => ($active ? '#f8eeee' : '#fff')};
  color: ${({ $active }) => ($active ? '#76535a' : '#776566')};
  font-size: 12px;
  text-align: left;
  transition: background .2s, color .2s;
  &:hover { background: #fcf4f4; color: #76535a; }
`

export const StatusMessage = styled.p`
  min-height: 20px;
  margin: 0 0 12px;
  color: #66816b;
  font-size: 11px;
`

export const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 25px 22px;
  @media (min-width: 1400px) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  @media (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 14px; }
  @media (max-width: 370px) { gap: 12px 9px; }
`

export const Footer = styled.footer`
  padding: 48px 32px 0;
  background: #503b3f;
  color: #fffaf8;
  @media (max-width: 600px) { padding: 36px 20px 0; }
`

export const FooterContent = styled.div`
  display: grid;
  grid-template-columns: 1.2fr .8fr 1.1fr;
  gap: clamp(28px, 6vw, 84px);
  width: min(1120px, 100%);
  margin: 0 auto;
  padding-bottom: 38px;
  @media (max-width: 760px) { grid-template-columns: 1fr 1fr; gap: 30px 24px; }
  @media (max-width: 520px) { grid-template-columns: 1fr; gap: 28px; padding-bottom: 30px; }
`

export const FooterBrand = styled.div`
  display: flex;
  align-items: center;
  img { display: block; width: 64px; height: 64px; border: 3px solid #fffaf8; border-radius: 50%; object-fit: cover; }
`

export const FooterMessage = styled.p`
  margin-top: 13px;
  color: #e7d7d7;
  font: italic 15px Georgia, serif;
`

export const FooterSocialLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 16px;
  color: #fffaf8;
  font-size: 11px;
  text-decoration: none;
  transition: color .2s;
  &:hover { color: #e9bcc3; }
  &:focus-visible { outline: 2px solid #f2d8dc; outline-offset: 4px; }
`

export const FooterNavigation = styled.nav`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 12px;
  padding-top: 5px;
  strong { margin-bottom: 3px; color: #fffaf8; font: 17px Georgia, serif; }
  a { color: #ddcbcd; font-size: 11px; text-decoration: none; transition: color .2s; }
  a:hover { color: #fff; }
  a:focus-visible { outline: 2px solid #f2d8dc; outline-offset: 4px; }
`

export const FooterContact = styled.div`
  padding-top: 5px;
  > strong { color: #fffaf8; font: 17px Georgia, serif; }
  p { max-width: 290px; margin-top: 12px; color: #ddcbcd; font-size: 11px; line-height: 1.7; }
`

export const FooterContactButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 13px;
  border: 1px solid #c99ba1;
  border-radius: 2px;
  background: #f3e3e4;
  color: #684b50;
  font-size: 10px;
  text-decoration: none;
  transition: background .2s, transform .2s;
  svg { width: 16px; height: 16px; fill: currentColor; }
  &:hover { transform: translateY(-2px); background: #fff; }
  &:focus-visible { outline: 2px solid #f2d8dc; outline-offset: 3px; }
`

export const FooterBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 17px 0 20px;
  border-top: 1px solid #ffffff24;
  color: #cdbabc;
  font-size: 9px;
  @media (max-width: 520px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 7px;
    font-size: 8px;
  }
`
