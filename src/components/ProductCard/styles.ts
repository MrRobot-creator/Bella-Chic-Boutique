import styled from 'styled-components'

export const ProductWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  margin: auto;
  padding: 20px;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    align-items: center;
    .thumbnail {
      flex-direction: row;
      max-height: unset;
      overflow-x: auto;
      justify-content: center;
    }
    img {
      max-width: 90%;
      margin: auto;
    }
    padding: 16px;
  }
`

export const GalleryArea = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  border: 1px solid #eee;
  background: #fff;
  margin-bottom: 24px;
  img {
    width: 100%;
    height: auto;
    object-fit: contain;
    border-radius: 6px;
  }
  .main-image {
    flex: 1 1 calc(60% - 10px);
  }
  .thumbnail {
    flex: 1 1 calc(40% - 10px);
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: scroll;
    max-height: 400px;
  }
`

export const Card = styled.article`
  display: flex;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #f1e9e7;
  border-radius: 12px;
  background: linear-gradient(180deg, #fff 0%, #fffafa 100%);
  box-shadow: 0 6px 20px rgba(121, 87, 89, .06);
  transition: transform .25s, box-shadow .25s, border-color .25s;
  &:hover { transform: translateY(-5px); border-color: #e7cdd0; box-shadow: 0 18px 35px rgba(121, 87, 89, .13); }
`

export const ImageArea = styled.div`
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  aspect-ratio: 4 / 5;
  border-radius: 11px 11px 0 0;
  background: linear-gradient(145deg, #f7eeee, #fdf9f8);
  .discount { position: absolute; top: 14px; right: 14px; padding: 6px 9px; border-radius: 999px; background: #fff; color: #a45c69; font-size: 10px; font-weight: 700; letter-spacing: .4px; box-shadow: 0 4px 12px #79575916; }
  .sold-out { position: absolute; inset: 0; display: grid; place-items: center; background: #392c2c80; color: #fff; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
`

export const ImageTrigger = styled.button`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  background: transparent;
  cursor: zoom-in;
  &:focus-visible { outline: 2px solid #8c6066; outline-offset: -4px; }
`

export const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
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
  display: flex;
  flex: 1;
  min-height: 214px;
  flex-direction: column;
  padding: 18px;
  .category { color: #a88183; font-size: 10px; text-transform: uppercase; letter-spacing: 1.4px; }
  h3 { margin-top: 6px; color: #4a393b; font: 20px/1.15 Georgia, serif; }
  .prices { display: flex; align-items: baseline; gap: 8px; margin: 12px 0 10px; }
  .color-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 8px 0 15px; color: #766364; font-size: 11px; }
  @media (max-width: 900px) {
    min-height: 202px;
    padding: 15px;
  }
  @media (max-width: 480px) {
    min-height: 188px;
    padding: 13px 11px 11px;
    h3 { font-size: 16px; }
    .category { font-size: 8px; letter-spacing: .8px; }
    .prices { margin: 9px 0 8px; }
    .color-row { flex-wrap: wrap; gap: 6px; margin: 8px 0 11px; font-size: 10px; }
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
  flex-wrap: wrap;
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
  cursor: pointer;
  &:focus-visible { outline: 2px solid #8c6066; outline-offset: 3px; }
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

export const CardActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`

export const ViewDetailsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  padding: 11px 0 2px;
  border-top: 1px solid #f1e9e7;
  background: transparent;
  color: #765057;
  font-size: 11px;
  text-align: left;
  transition: color .2s;
  span { font-size: 16px; transition: transform .2s; }
  &:hover { color: #a45c69; }
  &:hover span { transform: translateX(3px); }
  &:focus-visible { outline: 2px solid #8c6066; outline-offset: 3px; }
  @media (max-width: 480px) { font-size: 10px; white-space: nowrap; }
`

export const BuyButton = styled.button`
  min-height: 38px;
  padding: 9px 10px;
  border-radius: 999px;
  background: #78535a;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .2px;
  transition: transform .2s, background .2s, box-shadow .2s;
  &:hover { background: #60434a; transform: translateY(-1px); box-shadow: 0 8px 16px rgba(120, 83, 90, .18); }
  &:disabled { cursor: not-allowed; background: #e5dddd; color: #958789; box-shadow: none; transform: none; }
  &:focus-visible { outline: 2px solid #8c6066; outline-offset: 3px; }
  @media (max-width: 480px) { min-height: 40px; padding: 9px 12px; font-size: 11px; white-space: nowrap; }
`

export const DialogBackdrop = styled.div`
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: #251b1ccc;
  animation: fade-in .18s ease-out;
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @media (max-width: 560px) { padding: 0; }
`

export const DialogContent = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(500px, 100%);
  max-height: calc(100vh - 24px);
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 24px 70px #1c121440;
  animation: rise-in .22s ease-out;
  @keyframes rise-in { from { transform: translateY(8px); } to { transform: translateY(0); } }
  @media (max-width: 560px) {
    width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
`

export const DialogImageArea = styled.div<{ $zoomed: boolean }>`
  position: relative;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 420px;
  overflow: hidden;
  background: #faf6f5;
  padding: 8px;
  cursor: ${({ $zoomed }) => ($zoomed ? 'grab' : 'zoom-in')};
  &:active { cursor: ${({ $zoomed }) => ($zoomed ? 'grabbing' : 'zoom-in')}; }
  .sold-out { position: absolute; inset: 0; display: grid; place-items: center; background: #392c2c80; color: #fff; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
  @media (max-width: 560px) { height: 320px; }
`

export const DialogThumbnails = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 16px;
  background: #fdf9f8;
  border-top: 1px solid #f1e9e7;
  border-bottom: 1px solid #f1e9e7;
  overflow-x: auto;
  max-width: 100%;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e0d0cf;
    border-radius: 4px;
  }
`

export const DialogThumbnailButton = styled.button<{ $active: boolean }>`
  flex: 0 0 58px;
  width: 58px;
  height: 66px;
  padding: 0;
  border: 2px solid ${({ $active }) => ($active ? '#8c6066' : '#e6dddd')};
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
  scroll-snap-align: start;
  transition: border-color .2s, transform .2s, box-shadow .2s;
  box-shadow: ${({ $active }) => ($active ? '0 4px 12px rgba(140, 96, 102, .2)' : 'none')};
  &:hover { transform: scale(1.05); }
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #fdf9f8;
  }
`

export const DialogImageButton = styled.button`
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  padding: 0;
  overflow: hidden;
  border: 0;
  background: transparent;
  cursor: inherit;
  touch-action: none;
  user-select: none;
  &:focus-visible { outline: 2px solid #8c6066; outline-offset: -5px; }
`

export const DialogImage = styled.img<{ $zoomed?: boolean; $offsetX?: number; $offsetY?: number }>`
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  object-fit: contain;
  object-position: center;
  transform: translate(${({ $offsetX = 0 }) => `${$offsetX}px`}, ${({ $offsetY = 0 }) => `${$offsetY}px`}) scale(${({ $zoomed }) => ($zoomed ? 1.65 : 1)});
  transition: transform .35s ease;
  will-change: transform;
  pointer-events: none;
  @media (max-width: 560px) { min-height: 0; }
`

export const DialogZoomButton = styled.button`
  position: absolute;
  right: 15px;
  bottom: 15px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid #ead8d9;
  border-radius: 50%;
  background: #fffefeee;
  color: #684b50;
  font-size: 21px;
  line-height: 1;
  box-shadow: 0 6px 18px #52343b18;
  transition: background .2s, color .2s, transform .2s;
  &:hover { background: #78535a; color: #fff; transform: scale(1.05); }
  &:focus-visible { outline: 2px solid #8c6066; outline-offset: 3px; }
`

export const DialogVariants = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 16px;
  padding: 20px 24px 24px;
  overflow-y: visible;
  .category { color: #a88183; font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; }
  @media (max-width: 560px) { gap: 12px; padding: 16px 18px 20px; }
`

export const DialogQuickShopLabel = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 5px 9px;
  border-radius: 999px;
  background: #f8e8eb;
  color: #9b6972;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
`

export const DialogCloseButton = styled.button`
  position: absolute;
  top: 13px;
  right: 13px;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid #ead8d9;
  border-radius: 50%;
  background: #fff;
  color: #684b50;
  font-size: 23px;
  line-height: 1;
  transition: background .2s, color .2s;
  &:hover { background: #78535a; color: #fff; }
  &:focus-visible { outline: 2px solid #8c6066; outline-offset: 2px; }
`

export const DialogTitle = styled.h2`
  max-width: calc(100% - 18px);
  color: #4a393b;
  font: 30px/1.15 Georgia, serif;
  @media (max-width: 560px) { font-size: 26px; }
`

export const DialogPrice = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  ${Price} { font-size: 19px; }
`

export const DialogDescription = styled.p`
  color: #827475;
  font-size: 12px;
  line-height: 1.7;
`

export const DialogVariantGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  color: #766364;
  font-size: 11px;
  > label, > span { font-weight: 600; }
`

export const DialogColorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  strong { color: #594649; font-weight: 500; }
`
