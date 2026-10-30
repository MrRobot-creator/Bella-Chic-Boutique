import styled, { css, keyframes } from 'styled-components'
import { colors, fonts } from '../../styles/tokens'

const fade = keyframes`from { opacity: 0 } to { opacity: 1 }`
const slide = keyframes`from { transform: translateX(32px); opacity: 0 } to { transform: translateX(0); opacity: 1 }`

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  justify-content: flex-end;
  background: rgba(46, 30, 34, .45);
  animation: ${fade} .2s ease-out;
`

export const Drawer = styled.aside`
  width: min(480px, 100%);
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 24px 26px 32px;
  background: ${colors.white};
  box-shadow: -20px 0 50px rgba(46, 30, 34, .2);
  color: ${colors.plum};
  animation: ${slide} .28s cubic-bezier(.2, .7, .2, 1);
  .checkout-form { margin-top: 18px; padding-top: 22px; border-top: 1px solid ${colors.line}; }
  .checkout-form h3 { margin-bottom: 14px; font: 400 24px ${fonts.serif}; }
  .checkout-form > label { display: block; margin: 14px 0; color: #6B5659; font-size: 13px; font-weight: 500; }
  .checkout-form > label .unit-address { display: block; margin-top: 6px; color: ${colors.soft}; font-size: 12px; font-weight: 400; line-height: 1.5; }
  .checkout-form input:not([type="radio"]), .checkout-form select, .checkout-form textarea {
    width: 100%;
    min-height: 46px;
    margin-top: 6px;
    padding: 0 14px;
    border: 1px solid ${colors.lineStrong};
    border-radius: 12px;
    background: ${colors.white};
    color: ${colors.plum};
    font: 14px ${fonts.sans};
  }
  .checkout-form input:focus-visible, .checkout-form select:focus-visible { outline: 2px solid ${colors.rose}; outline-offset: 0; }
  fieldset { margin: 18px 0; padding: 14px 16px; border: 1px solid ${colors.line}; border-radius: 16px; }
  legend { padding: 0 6px; color: #6B5659; font-size: 13px; font-weight: 600; }
  .checkout-form .delivery-address { margin: 16px 0; padding: 16px; border: 1px solid ${colors.line}; border-radius: 16px; background: ${colors.blushSoft}; }
  .delivery-address label { display: block; margin: 12px 0; color: #6B5659; font-size: 13px; font-weight: 500; }
  .delivery-address label:first-child { margin-top: 0; }
  .delivery-address label:last-child { margin-bottom: 0; }
  .delivery-address .optional { color: ${colors.soft}; font-size: 12px; font-weight: 400; }
  .delivery-address .address-status, .delivery-address .address-hint { display: block; margin-top: 6px; color: ${colors.muted}; font-size: 12px; font-weight: 400; line-height: 1.5; }
  .delivery-address .address-hint { color: ${colors.soft}; }
  .address-suggestions { max-height: 200px; margin-top: 8px; padding: 4px; overflow-y: auto; border: 1px solid ${colors.lineStrong}; border-radius: 12px; background: ${colors.white}; list-style: none; }
  .address-suggestions button { width: 100%; display: flex; flex-direction: column; gap: 3px; padding: 10px; border-radius: 8px; background: transparent; color: ${colors.plum}; font: inherit; text-align: left; }
  .address-suggestions button:hover, .address-suggestions button:focus-visible { outline: none; background: ${colors.blush}; }
  .address-suggestions strong { font-size: 13px; font-weight: 600; }
  .address-suggestions span { color: ${colors.muted}; font-size: 12px; }
  .delivery-fee { margin: 14px 0 4px; padding: 12px; border-radius: 12px; background: ${colors.blush}; color: #6B5659; font-size: 13px; }
  .delivery-fee strong { color: ${colors.plum}; }
  .payment-option { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 12px 0; color: ${colors.plum}; font-size: 14px; cursor: pointer; }
  .payment-option input { width: 18px; height: 18px; accent-color: ${colors.rose}; }
  .payment-option span { width: 100%; margin-left: 26px; color: ${colors.muted}; font-size: 12px; }
  .payment-option.unavailable { color: ${colors.soft}; cursor: not-allowed; }
  .secure-note, .privacy-note { margin: 12px 0 4px; color: ${colors.soft}; font-size: 12px; line-height: 1.5; text-align: center; }
  .privacy-note a, .card-fee-disclosure a { color: ${colors.roseDark}; text-decoration: underline; }
  .card-fee-disclosure { margin: 10px 0; color: #8C5B63; font-size: 12px; line-height: 1.5; }
  button:disabled { cursor: not-allowed; opacity: .55; }
  @media (max-width: 420px) { padding: 20px 16px 28px; }
`

export const DrawerHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 18px;
  border-bottom: 1px solid ${colors.line};
  .eyebrow { color: ${colors.rose}; font-size: 11px; font-weight: 600; letter-spacing: 2.4px; }
  h2 { margin-top: 6px; font: 400 28px ${fonts.serif}; }
  h2 span { color: ${colors.soft}; font: 15px ${fonts.sans}; }
`

export const CloseButton = styled.button`
  width: 42px;
  height: 42px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: ${colors.blushSoft};
  color: ${colors.plum};
  font-size: 22px;
  transition: background .2s;
  &:hover { background: ${colors.blush}; }
`

export const Items = styled.div`
  max-height: 38vh;
  overflow-y: auto;
`

export const ItemRow = styled.div`
  display: flex;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid ${colors.line};
`

export const ItemImage = styled.img`
  width: 78px;
  height: 104px;
  flex: none;
  border-radius: 12px;
  object-fit: cover;
  background: ${colors.photoBg};
`

export const ItemDetails = styled.div`
  flex: 1;
  min-width: 0;
  h3 { font-size: 15px; font-weight: 600; }
  p { margin: 4px 0 6px; color: ${colors.muted}; font-size: 13px; }
  strong { color: ${colors.plum}; font-size: 15px; }
  small { display: block; margin-top: 6px; color: ${colors.soft}; font-size: 11px; }
  .quantity { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
  .quantity button:not(:last-child) { width: 30px; height: 30px; border: 1px solid ${colors.lineStrong}; border-radius: 50%; background: ${colors.white}; color: ${colors.plum}; font-size: 15px; }
  .quantity span { min-width: 14px; text-align: center; font-size: 14px; font-weight: 600; }
`

export const RemoveButton = styled.button`
  margin-left: auto;
  padding: 2px;
  background: transparent;
  color: ${colors.muted};
  font-size: 12px;
  text-decoration: underline;
  &:hover { color: ${colors.roseDark}; }
`

export const Summary = styled.div`
  padding: 16px 0 4px;
  .subtotal, > div { display: flex; justify-content: space-between; color: #6B5659; font-size: 14px; }
  p { margin-top: 8px; color: ${colors.muted}; font-size: 12px; }
`

export const Total = styled.div`
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid ${colors.line};
  color: ${colors.plum};
  font-size: 15px;
  strong { font-size: 20px; }
`

export const EmptyCart = styled.div`
  padding: 72px 12px;
  text-align: center;
  > span { color: ${colors.roseLight}; font-size: 46px; }
  h3 { margin: 12px 0 8px; font: 400 24px ${fonts.serif}; }
  p { color: ${colors.muted}; font-size: 14px; }
  button { margin-top: 22px; height: 46px; padding: 0 24px; border-radius: 999px; background: ${colors.rose}; color: ${colors.white}; font-size: 14px; font-weight: 600; }
  button:hover { background: ${colors.roseDark}; }
`

export const WhatsAppButton = styled.button`
  width: 100%;
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding: 0 22px;
  border-radius: 999px;
  background: ${colors.rose};
  color: ${colors.white};
  font-size: 15px;
  font-weight: 600;
  transition: background .2s;
  &:hover:not(:disabled) { background: ${colors.roseDark}; }
  span { font-size: 18px; }
`

export const FreeShipping = styled.div<{ $done: boolean }>`
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: ${({ $done }) => ($done ? '#EAF5EC' : colors.blushSoft)};
  color: ${colors.plum};
  font-size: 13px;
  strong { color: ${({ $done }) => ($done ? colors.success : colors.roseDark)}; }
  .bar { display: block; height: 7px; margin-top: 8px; overflow: hidden; border-radius: 999px; background: ${colors.line}; }
  .bar span { display: block; height: 100%; border-radius: 999px; background: ${({ $done }) => ($done ? colors.success : colors.rose)}; transition: width .4s ease; }
  button { margin-top: 8px; padding: 0; border: 0; background: none; color: ${colors.roseDark}; font: 600 13px ${fonts.sans}; text-decoration: underline; cursor: pointer; }
  ${({ $done }) => $done && css`.bar { display: none; }`}
`

export const Done = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 36px 4px 20px;
  text-align: center;
  .check { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 50%; background: #EAF5EC; color: ${colors.success}; font-size: 30px; font-weight: 700; }
  h3 { font: 400 28px ${fonts.serif}; }
  .ref { color: ${colors.muted}; font-size: 14px; }
  .ref strong { color: ${colors.plum}; letter-spacing: .5px; }
  .reserve { max-width: 360px; color: #6B5659; font-size: 14px; line-height: 1.6; }
  .whatsapp { width: 100%; min-height: 54px; display: flex; align-items: center; justify-content: center; gap: 10px; border-radius: 999px; background: #1F9D55; color: ${colors.white}; font-size: 15px; font-weight: 700; }
  .whatsapp:hover { background: #17834A; color: ${colors.white}; }
  .pix { width: 100%; margin-top: 8px; text-align: left; }
  .pix > p { margin-bottom: 8px; color: ${colors.muted}; font-size: 13px; }
  .keep { margin-top: 6px; padding: 10px; border: 0; background: none; color: ${colors.roseDark}; font: 600 14px ${fonts.sans}; cursor: pointer; }
`
