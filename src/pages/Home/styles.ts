import styled from 'styled-components'

export const Main = styled.main`
  .no-products { padding: 50px 0; color: #867778; text-align: center; font-size: 14px; }
`

export const Hero = styled.section`
  position: relative;
  overflow: hidden;
  background: linear-gradient(110deg, #fbf5f1 0%, #f7e9e6 58%, #f4e2e2 100%);
  scroll-margin-top: 82px;
  &::before {
    position: absolute;
    top: -130px;
    right: -110px;
    width: 360px;
    height: 360px;
    border: 1px solid #d9babc55;
    border-radius: 50%;
    content: '';
  }
`

export const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  width: min(1240px, calc(100% - 64px));
  min-height: 460px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr .92fr;
  align-items: center;
  gap: clamp(38px, 7vw, 100px);
  padding: 38px 0;
  @media (max-width: 760px) { grid-template-columns: 1fr; gap: 26px; padding: 35px 0 40px; }
  @media (max-width: 600px) { width: calc(100% - 36px); }
`

export const HeroText = styled.div`
  .eyebrow { color: #a47479; font-size: 9px; font-weight: 600; letter-spacing: 2px; }
  h1 { max-width: 540px; margin: 21px 0 18px; color: #503b3f; font: clamp(48px, 5.2vw, 68px)/1.04 Georgia, serif; letter-spacing: -2px; }
  h1 em { color: #b77c85; font-weight: 400; }
  p { max-width: 420px; color: #806f70; font-size: 14px; line-height: 1.85; }
  .primary-link { display: inline-flex; align-items: center; gap: 38px; margin-top: 29px; padding: 15px 20px; border-radius: 2px; background: #77545b; color: #fff; text-decoration: none; font-size: 12px; transition: background .2s, transform .2s; }
  .primary-link:hover { transform: translateY(-2px); background: #60434a; }
  .primary-link span { font-size: 17px; }
  @media (max-width: 760px) { text-align: center; h1, p { margin-right: auto; margin-left: auto; } h1 { max-width: 520px; font-size: clamp(43px, 10vw, 58px); } .primary-link { margin-top: 23px; } }
  @media (max-width: 400px) { h1 { font-size: 42px; letter-spacing: -1.5px; } .eyebrow { font-size: 8px; letter-spacing: 1.4px; } }
`

export const HeroShowcase = styled.div`
  display: grid;
  gap: 13px;
  width: min(100%, 440px);
  justify-self: end;
  @media (max-width: 760px) { width: min(100%, 390px); justify-self: center; }
`

export const ShowcaseImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .45s;
`

export const ShowcaseControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  > button {
    display: grid;
    place-items: center;
    flex: 0 0 34px;
    width: 34px;
    height: 34px;
    border: 1px solid #ead8d9;
    border-radius: 50%;
    background: #fff;
    color: #684b50;
    font-size: 16px;
    transition: background .2s, color .2s;
  }
  > button:hover { background: #78535a; color: #fff; }
`

export const ShowcaseThumbnails = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  gap: 9px;
  overflow: hidden;
  button {
    flex: 0 0 52px;
    width: 52px;
    height: 62px;
    padding: 2px;
    overflow: hidden;
    border: 1px solid transparent;
    background: transparent;
    opacity: .72;
    transition: opacity .2s, border-color .2s;
  }
  button.active { border-color: #9e6c74; opacity: 1; }
  button:hover { opacity: 1; }
  img { display: block; width: 100%; height: 100%; object-fit: cover; }
  @media (max-width: 400px) { gap: 5px; button { flex-basis: 43px; width: 43px; height: 54px; } }
`

export const ShowcaseLink = styled.a`
  position: relative;
  display: block;
  aspect-ratio: 1.16 / 1;
  overflow: hidden;
  border: 1px solid #f0e4e2;
  background: #f5eeee;
  color: #634b4f;
  text-decoration: none;
  box-shadow: 12px 12px 0 #ffffffa8;
  &:hover ${ShowcaseImage} { transform: scale(1.035); }
  .showcase-label { position: absolute; top: 15px; left: 15px; padding: 7px 10px; background: #fffdfb; color: #8e6269; font-size: 8px; letter-spacing: 1.5px; }
  .showcase-product { position: absolute; right: 0; bottom: 0; left: 0; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; padding: 35px 17px 15px; background: linear-gradient(transparent, #332628bd); color: #fff; }
  .showcase-product strong { font: 18px Georgia, serif; }
  .showcase-product > span { flex: 0 0 auto; font-size: 12px; }
  @media (max-width: 400px) {
    aspect-ratio: 1 / 1;
    .showcase-product strong { font-size: 15px; }
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
`

export const PaymentMethods = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  @media (max-width: 500px) { gap: 8px; }
`

export const PaymentCard = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 14px 16px;
  border: 1px solid #eadbdc;
  background: #fffdfb;
  color: #604a4e;
  text-decoration: none;
  transition: transform .2s, border-color .2s, box-shadow .2s;
  &:hover { transform: translateY(-2px); border-color: #cba9ad; box-shadow: 0 6px 18px #79575912; }
  span { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: #f5e8e8; color: #9d6c74; font-size: 13px; }
  strong { font: 14px Georgia, serif; }
  @media (max-width: 500px) { flex-direction: column; justify-content: center; gap: 6px; padding: 10px 6px; strong { font-size: 12px; } }
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

export const CategoryList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 29px 0 25px;
  @media (max-width: 640px) {
    flex-wrap: nowrap;
    margin-right: -18px;
    padding: 3px 18px 8px 0;
    overflow-x: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
`

export const CategoryPill = styled.button<{ $active: boolean }>`
  flex: 0 0 auto;
  padding: 9px 16px;
  border: 1px solid ${({ $active }) => ($active ? '#76535a' : '#eee4e3')};
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#76535a' : '#fff')};
  color: ${({ $active }) => ($active ? '#fff' : '#776566')};
  font-size: 11px;
  transition: all .2s;
  &:hover { border-color: #ab7d84; }
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
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 42px 20px 24px;
  background: #fff;
  color: #8b7779;
  > p { margin-top: 14px; font: italic 13px Georgia, serif; }
  > small { margin-top: 32px; color: #a49394; font-size: 10px; }
  .social-links { display: flex; gap: 22px; margin-top: 19px; }
  .social-links a { color: #76555b; font-size: 11px; text-decoration: none; }
`

export const FooterBrand = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  img { display: block; width: 70px; height: 70px; border-radius: 50%; object-fit: cover; }
`
