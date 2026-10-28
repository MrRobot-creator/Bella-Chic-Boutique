import styled from 'styled-components'

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  justify-content: flex-end;
  background: #30252780;
`

export const Drawer = styled.aside`
  width: min(510px, 100%);
  height: 100%;
  overflow-y: auto;
  padding: 26px;
  background: #fffdfc;
  box-shadow: -12px 0 40px #362a2a20;
  .checkout-form { padding-top: 22px; }
  .checkout-form h3 { margin-bottom: 16px; color: #584246; font: 22px Georgia, serif; }
  .checkout-form > label { display: block; margin: 12px 0; color: #735f60; font-size: 11px; }
  .checkout-form > label .unit-address { display: block; margin-top: 5px; color: #9b8b8c; font-size: 10px; line-height: 1.5; }
  .checkout-form input:not([type="radio"]), .checkout-form select {
    width: 100%; margin-top: 6px; padding: 11px; border: 1px solid #ebdede; border-radius: 2px; background: #fff; color: #493b3d; font-size: 13px; font-family: inherit;
  }
  fieldset { margin: 17px 0; padding: 13px; border: 1px solid #ebdede; }
  legend { padding: 0 6px; color: #735f60; font-size: 11px; }
  .checkout-form .delivery-address { margin: 15px 0; padding: 13px; border: 1px solid #ebdede; }
  .delivery-address label { display: block; margin: 11px 0; color: #735f60; font-size: 11px; }
  .delivery-address label:last-child { margin-bottom: 0; }
  .delivery-address .optional { color: #a39394; font-size: 10px; font-weight: 400; }
  .delivery-address .address-status, .delivery-address .address-hint { display: block; margin-top: 6px; color: #9b8b8c; font-size: 10px; line-height: 1.5; }
  .delivery-address .address-hint { color: #a39394; }
  .address-suggestions { max-height: 190px; margin-top: 7px; padding: 4px; overflow-y: auto; border: 1px solid #ebdede; background: #fff; list-style: none; }
  .address-suggestions button { display: flex; flex-direction: column; gap: 4px; width: 100%; padding: 9px; background: transparent; color: #735f60; font: inherit; text-align: left; }
  .address-suggestions button:hover, .address-suggestions button:focus-visible { outline: none; background: #f8eeee; }
  .address-suggestions strong { font-size: 11px; font-weight: 600; }
  .address-suggestions span { color: #9b8b8c; font-size: 9px; }
  .delivery-fee { margin: 13px 0 4px; padding: 10px; background: #f8eeee; color: #735f60; font-size: 11px; }
  .delivery-fee strong { color: #684b50; }
  .delivery-address > label select { margin-top: 6px; }
  .payment-option { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 11px 0; color: #574849; font-size: 12px; cursor: pointer; }
  .payment-option input { accent-color: #a76f79; }
  .payment-option span { width: 100%; margin-left: 22px; color: #9d8e8f; font-size: 10px; }
  .payment-option.unavailable { color: #a39696; cursor: not-allowed; }
  .secure-note { margin: 12px 0 4px; color: #9b8c8d; font-size: 10px; line-height: 1.5; text-align: center; }
  .privacy-note { margin: 8px 0 4px; color: #9b8c8d; font-size: 10px; line-height: 1.5; text-align: center; }
  .privacy-note a { color: #79565d; text-decoration: underline; }
  .card-fee-disclosure { margin: 8px 0; color: #8c5b63; font-size: 10px; line-height: 1.5; }
  .card-fee-disclosure a { color: #79565d; text-decoration: underline; }
  button:disabled { cursor: not-allowed; opacity: .55; }
  @media (max-width: 420px) { padding: 20px 16px; }
`

export const DrawerHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 18px;
  border-bottom: 1px solid #f0e6e5;
  .eyebrow { color: #b2868a; font-size: 9px; letter-spacing: 1.5px; }
  h2 { margin-top: 6px; color: #513d40; font: 25px Georgia, serif; }
  h2 span { color: #a68e90; font: 13px Arial, sans-serif; }
`

export const CloseButton = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #f8eeee;
  color: #6f4c52;
  font-size: 23px;
`

export const Items = styled.div`
  max-height: 34vh;
  overflow-y: auto;
`

export const ItemRow = styled.div`
  display: flex;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid #f0e8e7;
`

export const ItemImage = styled.img`
  width: 76px;
  height: 94px;
  object-fit: cover;
  background: #f5eeee;
`

export const ItemDetails = styled.div`
  flex: 1;
  h3 { color: #574446; font: 16px Georgia, serif; }
  p { margin: 5px 0; color: #968687; font-size: 11px; }
  strong { color: #755159; font-size: 12px; }
  .quantity { display: flex; align-items: center; gap: 10px; margin-top: 9px; }
  .quantity button:not(:last-child) { width: 22px; height: 22px; border: 1px solid #eadbdc; background: #fff; color: #735158; }
  .quantity span { font-size: 11px; }
`

export const RemoveButton = styled.button`
  margin-left: auto;
  padding: 2px;
  background: transparent;
  color: #a18b8c;
  font-size: 10px;
  text-decoration: underline;
`

export const Summary = styled.div`
  padding: 16px 0 4px;
  .subtotal, > div { display: flex; justify-content: space-between; color: #716365; font-size: 12px; }
  p { margin-top: 7px; color: #9b8f8f; font-size: 10px; }
`

export const Total = styled.div`
  margin-top: 16px;
  padding-top: 13px;
  border-top: 1px solid #ebdfdf;
  color: #584346;
  strong { font-size: 17px; }
`

export const EmptyCart = styled.div`
  padding: 76px 12px;
  text-align: center;
  > span { color: #bc8c94; font-size: 42px; }
  h3 { margin: 12px 0 8px; color: #584246; font: 22px Georgia, serif; }
  p { color: #958788; font-size: 13px; }
  button { margin-top: 22px; padding: 12px 20px; background: #f5e5e6; color: #65494e; font-size: 12px; }
`

export const WhatsAppButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 15px;
  background: #75525a;
  color: white;
  font-size: 12px;
  transition: background .2s;
  &:hover { background: #62444b; }
  span { font-size: 17px; }
`
