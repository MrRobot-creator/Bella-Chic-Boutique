import styled from 'styled-components'

export const Main = styled.main`
  .no-products { padding: 50px 0; color: #867778; text-align: center; font-size: 14px; }
`

export const Hero = styled.section`
  background: #f8eeee;
  scroll-margin-top: 82px;
`

export const HeroContent = styled.div`
  width: min(1200px, calc(100% - 48px));
  min-height: 515px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: .86fr 1fr;
  align-items: center;
  gap: 64px;
  padding: 50px 0;
  @media (max-width: 760px) { grid-template-columns: 1fr; gap: 28px; padding: 45px 0; }
  @media (max-width: 600px) { width: calc(100% - 32px); }
`

export const HeroText = styled.div`
  .eyebrow { color: #a47479; font-size: 10px; letter-spacing: 2px; }
  h1 { max-width: 500px; margin: 20px 0 16px; color: #503b3f; font: 58px/1.08 Georgia, serif; letter-spacing: -1.5px; }
  h1 em { color: #b77c85; font-weight: 400; }
  p { max-width: 400px; color: #806f70; font-size: 14px; line-height: 1.8; }
  .primary-link { display: inline-flex; align-items: center; gap: 35px; margin-top: 27px; padding: 14px 19px; background: #77545b; color: #fff; text-decoration: none; font-size: 12px; }
  .primary-link:hover { background: #60434a; }
  .primary-link span { font-size: 17px; }
  @media (max-width: 900px) { h1 { font-size: 48px; } }
  @media (max-width: 760px) { h1 { max-width: 500px; font-size: 48px; } }
  @media (max-width: 400px) { h1 { font-size: 41px; } }
`

export const HeroNote = styled.div`
  margin-top: 30px;
  color: #957a7c;
  font: italic 13px Georgia, serif;
`

export const HeroImage = styled.div`
  position: relative;
  width: min(100%, 375px);
  aspect-ratio: 3 / 4;
  justify-self: end;
  background: #f5eeee;
  img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center; }
  .image-caption { position: absolute; z-index: 1; right: 0; bottom: 0; display: grid; gap: 6px; min-width: 235px; padding: 18px 22px; background: #fff; color: #634b4f; }
  .image-caption span { color: #a7797e; font-size: 9px; letter-spacing: 1.5px; }
  .image-caption strong { font: 18px Georgia, serif; }
  .decorative-seal { position: absolute; z-index: 1; top: 18px; right: 18px; display: grid; place-content: center; width: 58px; height: 58px; border: 1px solid #ffffffbd; border-radius: 50%; color: white; font: 19px Georgia, serif; text-align: center; text-shadow: 0 1px 5px #0008; }
  .decorative-seal small { font-size: 11px; }
  @media (max-width: 760px) { width: min(100%, 330px); justify-self: center; }
`

export const Benefits = styled.section`
  width: min(1100px, calc(100% - 48px));
  margin: 0 auto;
  padding: 30px 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid #f0e6e5;
  @media (max-width: 640px) { width: calc(100% - 32px); grid-template-columns: 1fr; gap: 19px; }
`

export const Benefit = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 13px;
  color: #a7777e;
  > span { font-size: 22px; }
  strong, small { display: block; }
  strong { color: #5e4b4d; font: 14px Georgia, serif; }
  small { margin-top: 4px; color: #9b8989; font-size: 10px; }
`

export const Catalog = styled.section`
  width: min(1200px, calc(100% - 48px));
  margin: 0 auto;
  padding: 78px 0 88px;
  scroll-margin-top: 90px;
  @media (max-width: 600px) { width: calc(100% - 32px); padding: 55px 0; }
`

export const CatalogHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  .eyebrow { color: #a47479; font-size: 9px; letter-spacing: 1.8px; }
  h2 { margin-top: 11px; color: #533f42; font: 40px Georgia, serif; }
  h2 em { color: #b77c85; font-weight: 400; }
  p { margin-top: 9px; color: #8c7c7d; font-size: 12px; }
  @media (max-width: 760px) { align-items: flex-start; flex-direction: column; h2 { font-size: 35px; } }
`

export const CatalogTools = styled.div`
  @media (max-width: 760px) { width: 100%; }
`

export const SearchInput = styled.input`
  width: 230px;
  padding: 12px 14px;
  border: 1px solid #ebdfdf;
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
  margin: 29px 0 22px;
`

export const CategoryPill = styled.button<{ $active: boolean }>`
  padding: 9px 15px;
  border: 1px solid ${({ $active }) => ($active ? '#76535a' : '#eee4e3')};
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  @media (max-width: 1000px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 720px) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
  @media (max-width: 390px) { grid-template-columns: 1fr; }
`

export const About = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 390px;
  background: #f8eeee;
  scroll-margin-top: 82px;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`

export const AboutImage = styled.div`
  min-height: 360px;
  img { width: 100%; height: 100%; min-height: 360px; object-fit: cover; }
`

export const AboutText = styled.div`
  align-self: center;
  max-width: 510px;
  padding: 55px 11%;
  .eyebrow { color: #a47479; font-size: 9px; letter-spacing: 1.7px; }
  h2 { margin: 15px 0; color: #543f43; font: 39px/1.15 Georgia, serif; }
  h2 em { color: #b77c85; font-weight: 400; }
  p { color: #806f70; font-size: 13px; line-height: 1.8; }
  a { display: inline-flex; gap: 18px; margin-top: 20px; color: #75535a; font-size: 12px; text-decoration: none; }
  @media (max-width: 700px) { padding: 40px 24px 48px; }
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
  gap: 9px;
  color: #68484e;
  .monogram { display: grid; place-items: center; width: 35px; height: 35px; border: 1px solid #d39da5; border-radius: 50%; font: 18px Georgia, serif; }
  strong, small { display: block; }
  strong { font: 15px Georgia, serif; letter-spacing: 1px; }
  small { margin-top: 3px; font-size: 7px; text-align: center; }
  }
`
