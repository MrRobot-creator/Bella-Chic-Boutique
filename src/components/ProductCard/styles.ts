import styled from 'styled-components'

export const Card = styled.article`
  overflow: hidden;
  border: 1px solid #f1e9e7;
  border-radius: 4px;
  background: #fff;
  transition: transform .25s, box-shadow .25s;
  &:hover { transform: translateY(-3px); box-shadow: 0 14px 30px #79575912; }
`

export const ImageArea = styled.div`
  position: relative;
  overflow: hidden;
  aspect-ratio: 4 / 5;
  border-radius: 3px 3px 0 0;
  background: #f5eeee;
  .discount { position: absolute; top: 14px; right: 14px; padding: 6px 8px; background: white; color: #a45c69; font-size: 10px; }
  .sold-out { position: absolute; inset: 0; display: grid; place-items: center; background: #392c2c80; color: #fff; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
`

export const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .5s;
  ${Card}:hover & { transform: scale(1.04); }
`

export const Tag = styled.span`
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 6px 9px;
  background: #fff;
  color: #86575e;
  font-size: 9px;
  letter-spacing: .5px;
  text-transform: uppercase;
`

export const ProductInfo = styled.div`
  padding: 16px;
  .category { color: #a88183; font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; }
  h3 { margin-top: 5px; color: #4a393b; font: 19px Georgia, serif; }
  .description { min-height: 40px; margin-top: 8px; color: #8c8080; font-size: 11px; line-height: 1.65; }
  .prices { display: flex; align-items: center; gap: 8px; margin: 13px 0; }
  .options { display: flex; align-items: center; gap: 10px; color: #766364; font-size: 11px; }
  .color-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 12px 0 16px; color: #766364; font-size: 11px; }
  @media (max-width: 480px) {
    padding: 12px 10px;
    h3 { font-size: 16px; }
    .category { font-size: 8px; letter-spacing: .8px; }
    .description { min-height: 0; margin-top: 6px; font-size: 10px; }
    .prices { margin: 10px 0; }
    .options { gap: 6px; font-size: 10px; }
    .color-row { gap: 4px; margin: 10px 0 13px; font-size: 10px; }
  }
`

export const Price = styled.strong`
  color: #765057;
  font-size: 15px;
`

export const OldPrice = styled.span`
  color: #b4a9a8;
  font-size: 12px;
  text-decoration: line-through;
`

export const Select = styled.select`
  padding: 6px 8px;
  border: 1px solid #eee2e2;
  color: #624c4f;
  background: #fff;
  font: inherit;
`

export const ColorChoices = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

export const ColorChoice = styled.button<{ $color: string; $selected: boolean }>`
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid ${({ $selected }) => ($selected ? '#8c6066' : '#e6dddd')};
  border-radius: 50%;
  background: ${({ $color }) => $color};
  box-shadow: ${({ $selected }) => ($selected ? '0 0 0 2px #fff, 0 0 0 3px #bd9297' : 'none')};
`

export const AddButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 2px;
  background: #f6e8e9;
  color: #68494e;
  font-size: 12px;
  transition: background .2s;
  span { font-size: 18px; }
  &:hover { background: #efd9dc; }
  &:disabled { cursor: not-allowed; background: #eee9e8; color: #918787; }
`
