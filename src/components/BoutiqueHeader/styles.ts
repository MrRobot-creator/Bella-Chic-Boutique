import styled from 'styled-components'

export const Announcement = styled.div`
  padding: 9px 16px;
  background: #78535a;
  color: white;
  text-align: center;
  font-size: 10px;
  letter-spacing: 1.2px;
  font-weight: 500;
`

export const HeaderBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.97);
  border-bottom: 1px solid #f2e6e5;
  backdrop-filter: blur(12px);
`

export const HeaderContent = styled.div`
  width: min(1280px, calc(100% - 64px));
  min-height: 84px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;

  .brand-link { text-decoration: none; }
  @media (max-width: 700px) {
    width: calc(100% - 32px);
    min-height: 72px;
    padding: 0;
    flex-wrap: nowrap;
  }
`

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  color: #69454b;
  strong { display: block; font: 22px/1 Georgia, serif; letter-spacing: .1px; }
  small { display: block; margin-top: 5px; color: #a47d81; font-size: 8px; letter-spacing: 2.5px; }
  @media (max-width: 400px) { strong { font-size: 18px; } }
`

export const BrandMark = styled.img`
  width: 54px;
  height: 54px;
  display: block;
  border-radius: 50%;
  object-fit: cover;
  @media (max-width: 700px) { width: 46px; height: 46px; }
`

export const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 30px;
  color: #604f50;
  font-size: 12px;
  a { padding: 12px 0; text-decoration: none; transition: color .2s; }
  a:hover { color: #b67782; }
  @media (max-width: 700px) {
    width: 100%;
    justify-content: center;
    gap: clamp(24px, 10vw, 48px);
    order: 3;
    border-top: 1px solid #f4eaea;
    a { padding: 12px 0; }
  }
`

export const CartButton = styled.button`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 13px;
  border: 1px solid #ead8d9;
  border-radius: 999px;
  color: #684b50;
  background: white;
  font-size: 13px;
  .cart-count { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: #f5e3e5; font-size: 11px; }
  > span:first-child { font-size: 19px; line-height: 1; }
  &:hover { background: #fcf4f4; }
  @media (max-width: 400px) { gap: 6px; padding: 8px; .cart-label { display: none; } }
`
