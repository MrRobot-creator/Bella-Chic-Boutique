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
  min-height: 540px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr .92fr;
  align-items: center;
  gap: clamp(38px, 7vw, 100px);
  padding: 58px 0;
  @media (max-width: 760px) { grid-template-columns: 1fr; gap: 32px; padding: 44px 0 50px; }
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

export const HeroNote = styled.div`
  margin-top: 30px;
  color: #957a7c;
  font: italic 13px Georgia, serif;
`

export const HeroImage = styled.div`
  position: relative;
  width: min(100%, 420px);
  aspect-ratio: 3 / 4;
  justify-self: end;
  background: #f5eeee;
  box-shadow: 18px 18px 0 #ffffffa8;
  img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center 35%; }
  .image-caption { position: absolute; z-index: 1; right: -18px; bottom: 20px; display: grid; gap: 6px; min-width: 230px; padding: 17px 20px; background: #fffdfb; color: #634b4f; box-shadow: 0 12px 35px #6545481c; }
  .image-caption span { color: #a7797e; font-size: 8px; letter-spacing: 1.6px; }
  .image-caption strong { font: 18px Georgia, serif; }
  .decorative-seal { position: absolute; z-index: 1; top: 17px; left: -25px; display: grid; place-content: center; width: 62px; height: 62px; border: 1px solid #fff; border-radius: 50%; background: #78535a; color: white; font: 18px Georgia, serif; text-align: center; box-shadow: 0 5px 15px #52343b33; }
  .decorative-seal small { font-size: 11px; }
  @media (max-width: 760px) { width: min(84%, 350px); justify-self: center; }
  @media (max-width: 400px) { .image-caption { right: -8px; min-width: 205px; } .decorative-seal { left: -14px; } }
`

export const Benefits = styled.section`
  width: min(1100px, calc(100% - 64px));
  margin: 0 auto;
  padding: 27px 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid #f0e6e5;
  @media (max-width: 640px) {
    width: 100%;
    display: flex;
    gap: 18px;
    padding: 19px 18px;
    overflow-x: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
`

export const Benefit = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  gap: 13px;
  color: #a7777e;
  > span { font-size: 22px; }
  strong, small { display: block; }
  strong { color: #5e4b4d; font: 14px Georgia, serif; }
  small { margin-top: 4px; color: #9b8989; font-size: 10px; }
  @media (max-width: 640px) { flex: 0 0 220px; justify-content: flex-start; }
`

export const Catalog = styled.section`
  width: min(1240px, calc(100% - 64px));
  margin: 0 auto;
  padding: 78px 0 90px;
  scroll-margin-top: 90px;
  @media (max-width: 700px) { width: calc(100% - 36px); padding: 55px 0 64px; }
`

export const CatalogHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  .eyebrow { color: #a47479; font-size: 9px; letter-spacing: 1.8px; }
  h2 { margin-top: 11px; color: #533f42; font: 42px Georgia, serif; }
  h2 em { color: #b77c85; font-weight: 400; }
  p { margin-top: 9px; color: #8c7c7d; font-size: 12px; }
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

export const About = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 450px;
  background: #f8eeee;
  scroll-margin-top: 82px;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`

export const AboutImage = styled.div`
  min-height: 450px;
  overflow: hidden;
  img { width: 100%; height: 100%; min-height: 450px; object-fit: cover; object-position: center 38%; }
  @media (max-width: 700px) { min-height: 0; height: min(105vw, 450px); img { min-height: 0; } }
`

export const AboutText = styled.div`
  align-self: center;
  max-width: 580px;
  padding: 65px 12%;
  .eyebrow { color: #a47479; font-size: 9px; letter-spacing: 1.7px; }
  h2 { margin: 15px 0; color: #543f43; font: 43px/1.15 Georgia, serif; }
  h2 em { color: #b77c85; font-weight: 400; }
  p { color: #806f70; font-size: 13px; line-height: 1.8; }
  a { display: inline-flex; gap: 18px; margin-top: 20px; color: #75535a; font-size: 12px; text-decoration: none; }
  @media (max-width: 700px) { max-width: none; padding: 40px 24px 48px; h2 { font-size: 37px; } }
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
