import styled from 'styled-components'

export const Announcement = styled.div`
  padding: 9px 16px;
  background: #7f555b;
  color: white;
  text-align: center;
  font-size: 10px;
  letter-spacing: 2px;
  font-weight: 600;
`

export const HeaderBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid #f2e6e5;
  backdrop-filter: blur(12px);
`

export const HeaderContent = styled.div`
  width: min(1200px, calc(100% - 48px));
  height: 82px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .brand-link { text-decoration: none; }
  @media (max-width: 600px) {
    width: calc(100% - 32px);
    height: 70px;
  }
`

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #69454b;
  strong { display: block; font-family: Georgia, serif; font-size: 17px; letter-spacing: 1px; }
  small { display: block; margin-top: 4px; font-size: 8px; text-align: center; }
  @media (max-width: 400px) { strong { font-size: 14px; } }
`

export const BrandMark = styled.span`
  width: 39px;
  height: 39px;
  display: grid;
  place-items: center;
  border: 1px solid #d39da5;
  border-radius: 50%;
  color: #a66b75;
  font-family: Georgia, serif;
  font-size: 19px;
`

export const Navigation = styled.nav`
  display: flex;
  gap: 34px;
  color: #604f50;
  font-size: 13px;
  a { text-decoration: none; transition: color .2s; }
  a:hover { color: #b67782; }
  @media (max-width: 600px) { display: none; }
`

export const CartButton = styled.button`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 14px;
  border: 1px solid #ead8d9;
  border-radius: 4px;
  color: #684b50;
  background: white;
  font-size: 13px;
  .cart-count { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: #f5e3e5; font-size: 11px; }
  > span:first-child { font-size: 19px; line-height: 1; }
  &:hover { background: #fcf4f4; }
  @media (max-width: 400px) { padding: 8px; .cart-label { display: none; } }
`
