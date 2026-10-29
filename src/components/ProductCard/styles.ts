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
  .low-stock { position: absolute; left: 12px; bottom: 12px; z-index: 5; padding: 5px 10px; border-radius: 999px; background: #fff; color: #a72f48; font-size: 10px; font-weight: 700; letter-spacing: .3px; box-shadow: 0 4px 12px rgba(194, 64, 91, .18); pointer-events: none; }
  .discount { position: absolute; top: 54px; right: 14px; padding: 6px 9px; border-radius: 999px; background: #fff; color: #c2405b; font-size: 10px; font-weight: 700; letter-spacing: .4px; box-shadow: 0 4px 12px #79575916; }
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
  &:focus-visible { outline: 2px solid #c2405b; outline-offset: -4px; }
`

export const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  transition: transform .5s;
  ${Card}:hover & { transform: scale(1.04); }
  &.alt { position: absolute; inset: 0; opacity: 0; transition: opacity .45s ease, transform .5s; }
  &.primary { transition: opacity .45s ease, transform .5s; }
  @media (hover: hover) {
    ${Card}:hover &.alt { opacity: 1; }
    ${Card}:hover &.primary.has-alt { opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) { transition: none; ${Card}:hover & { transform: none; } }
`

export const WishlistButton = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  border: 1px solid #f1e9e7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .2s ease;
  color: #c2405b;
  font-size: 18px;
  line-height: 1;
  box-shadow: 0 2px 8px rgba(121, 87, 89, .1);
  &:hover { background: #fff; transform: scale(1.1); color: #c2405b; }
  &.active { color: #d64d5a; background: #fff; border-color: #d64d5a; }
`

export const Badge = styled.span<{ $variant: 'new' | 'bestseller' | 'limited' }>`
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  ${props => {
    switch (props.$variant) {
      case 'new': return 'background: #c2405b;';
      case 'bestseller': return 'background: #c2405b;';
      case 'limited': return 'background: #4a393b;';
      default: return 'background: #c2405b;';
    }
  }}
`

export const ProductInfo = styled.div`
  display: flex;
  flex: 1;
  min-height: 214px;
  flex-direction: column;
  padding: 18px;
  .category { color: #c2405b; font-size: 10px; text-transform: uppercase; letter-spacing: 1.4px; }
  h3 { margin-top: 6px; color: #4a393b; font: 20px/1.15 'Playfair Display', Georgia, serif; }
  .prices { display: flex; align-items: baseline; gap: 8px; margin: 12px 0 10px; }
  .size-fit-note { margin: -5px 0 8px; color: #8b6b70; font-size: 10px; line-height: 1.4; }
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
    .size-fit-note { margin: -4px 0 7px; font-size: 9px; }
    .color-row { flex-wrap: wrap; gap: 6px; margin: 8px 0 11px; font-size: 10px; }
  }
`

export const Price = styled.strong`
  color: #c2405b;
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
  border: 1px solid ${({ $selected }) => ($selected ? '#c2405b' : '#e6dddd')};
  border-radius: 50%;
  background: ${({ $color }) => $color};
  box-shadow: ${({ $selected }) => ($selected ? '0 0 0 2px #fff, 0 0 0 3px #bd9297' : 'none')};
  cursor: pointer;
  &:focus-visible { outline: 2px solid #c2405b; outline-offset: 3px; }
`

export const AddButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 999px;
  background: #c2405b;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding-inline: 18px;
  transition: background .2s, transform .2s;
  span { font-size: 18px; }
  &:hover:not(:disabled) { background: #a72f48; transform: translateY(-1px); }
  &:disabled { cursor: not-allowed; background: #eee9e8; color: #918787; }
  &:focus-visible { outline: 2px solid #c2405b; outline-offset: 3px; }
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
  color: #c2405b;
  font-size: 11px;
  text-align: left;
  transition: color .2s;
  span { font-size: 16px; transition: transform .2s; }
  &:hover { color: #a72f48; }
  &:hover span { transform: translateX(3px); }
  &:focus-visible { outline: 2px solid #c2405b; outline-offset: 3px; }
  @media (max-width: 480px) { font-size: 10px; white-space: nowrap; }
`

export const BuyButton = styled.button`
  min-height: 38px;
  padding: 9px 10px;
  border-radius: 999px;
  background: #c2405b;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .2px;
  transition: transform .2s, background .2s, box-shadow .2s;
  &:hover { background: #a72f48; transform: translateY(-1px); box-shadow: 0 8px 16px rgba(120, 83, 90, .18); }
  &:disabled { cursor: not-allowed; background: #e5dddd; color: #958789; box-shadow: none; transform: none; }
  &:focus-visible { outline: 2px solid #c2405b; outline-offset: 3px; }
  @media (max-width: 480px) { min-height: 40px; padding: 9px 12px; font-size: 11px; white-space: nowrap; }
`

type ProductDialogMode = 'quickshop' | 'details'

export const DialogBackdrop = styled.div<{ $mode: ProductDialogMode }>`
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: #251b1ccc;
  animation: fade-in .18s ease-out;
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  ${({ $mode }) => $mode === 'details' && `
    display: flex;
    align-items: stretch;
    overflow: hidden auto;
    padding: 0;
    background: #fff;
  `}
  @media (max-width: 560px) { padding: 0; }
`

export const DialogContent = styled.div<{ $mode: ProductDialogMode }>`
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(520px, 100%);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 24px 70px #1c121440;
  animation: rise-in .22s ease-out;
  @keyframes rise-in { from { transform: translateY(8px); } to { transform: translateY(0); } }
  ${({ $mode }) => $mode === 'details' && `
    width: 100%;
    max-height: none;
    min-height: 100vh;
    min-height: 100dvh;
    margin: 0;
    overflow: visible;
    border-radius: 0;
    box-shadow: none;
  `}
  @media (max-width: 560px) {
    width: 100%;
    max-height: ${({ $mode }) => ($mode === 'details' ? 'none' : '100dvh')};
    height: auto;
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
  height: min(72vh, 780px);
  min-height: 420px;
  overflow: hidden;
  background: #faf6f5;
  padding: 0;
  cursor: ${({ $zoomed }) => ($zoomed ? 'grab' : 'zoom-in')};
  &:active { cursor: ${({ $zoomed }) => ($zoomed ? 'grabbing' : 'zoom-in')}; }
  .sold-out { position: absolute; inset: 0; display: grid; place-items: center; background: #392c2c80; color: #fff; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
  @media (max-width: 560px) {
    height: 68dvh;
    min-height: 420px;
    padding: 0;
  }
  @media (max-height: 600px) {
    height: 68vh;
    min-height: 280px;
    padding: 0;
  }
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

export const DialogDetailsLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(420px, .92fr);
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  > div:last-child {
    min-width: 0;
    min-height: 100vh;
    min-height: 100dvh;
    justify-content: center;
    gap: clamp(14px, 2.2vh, 24px);
    padding: clamp(28px, 5vh, 64px) clamp(30px, 6vw, 96px);
  }
  @media (max-width: 900px) {
    display: flex;
    flex-direction: column;
    > div:last-child {
      min-height: 0;
      gap: 14px;
      padding: 26px 24px 36px;
    }
  }
  @media (max-width: 480px) {
    > div:last-child { padding: 22px 18px 30px; }
  }
  @media (max-height: 600px) {
    min-height: max(100dvh, 480px);
    > div:last-child {
      min-height: max(100dvh, 480px);
      gap: 10px;
      padding: 14px clamp(18px, 4vw, 48px);
    }
  }
`

export const DialogGallery = styled.div`
  position: sticky;
  top: 0;
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  align-self: start;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 560px;
  background: #faf6f5;
  ${DialogImageArea} {
    grid-column: 2;
    grid-row: 1;
    height: 100%;
    min-height: 0;
  }
  ${DialogThumbnails} {
    grid-column: 1;
    grid-row: 1;
    flex-direction: column;
    justify-content: flex-start;
    max-height: 100%;
    padding: 14px 8px;
    border: 0;
    border-right: 1px solid #f1e9e7;
    overflow-x: hidden;
    overflow-y: auto;
  }
  @media (max-width: 900px) {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    height: auto;
    min-height: 0;
    align-self: stretch;
    ${DialogImageArea} {
      grid-column: 1;
      grid-row: 1;
      height: 62dvh;
      min-height: 360px;
    }
    ${DialogThumbnails} {
      grid-column: 1;
      grid-row: 2;
      flex-direction: row;
      justify-content: center;
      max-height: none;
      padding: 10px 16px;
      border-top: 1px solid #f1e9e7;
      border-right: 0;
      overflow-x: auto;
      overflow-y: hidden;
    }
  }
  @media (max-width: 560px) {
    ${DialogImageArea} { height: 58dvh; min-height: 320px; }
  }
  @media (max-height: 600px) {
    height: 100dvh;
    min-height: 300px;
    ${DialogImageArea} {
      height: 100%;
      min-height: 0;
    }
  }
  @media (max-height: 600px) and (max-width: 900px) {
    height: auto;
    min-height: 0;
    ${DialogImageArea} { height: max(200px, calc(100dvh - 86px)); }
  }
`

export const DialogThumbnailButton = styled.button<{ $active: boolean }>`
  flex: 0 0 58px;
  width: 58px;
  height: 66px;
  padding: 0;
  border: 2px solid ${({ $active }) => ($active ? '#c2405b' : '#e6dddd')};
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
  &:focus-visible { outline: 2px solid #c2405b; outline-offset: -5px; }
`

export const DialogImage = styled.img<{ $zoomed?: boolean; $offsetX?: number; $offsetY?: number; $dragging?: boolean }>`
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  object-fit: contain;
  object-position: center;
  transform: translate(${({ $offsetX = 0 }) => `${$offsetX}px`}, ${({ $offsetY = 0 }) => `${$offsetY}px`}) scale(${({ $zoomed }) => ($zoomed ? 1.65 : 1)});
  transition: ${({ $dragging }) => ($dragging ? 'none' : 'transform .28s cubic-bezier(.2,.75,.25,1)')};
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
  &:hover { background: #c2405b; color: #fff; transform: scale(1.05); }
  &:focus-visible { outline: 2px solid #c2405b; outline-offset: 3px; }
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
  .category { color: #c2405b; font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; }
  .size-fit-note { width: 100%; margin-top: -9px; color: #8b6b70; font-size: 11px; line-height: 1.5; }
  @media (max-width: 560px) {
    gap: 12px;
    padding: 14px 18px 18px;
    flex: 0 0 auto;
  }
`

export const QuantitySelector = styled.div`
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid #ead8d9;
  border-radius: 999px;
  background: #fff;
  input {
    width: 42px;
    padding: 7px 0;
    border: 0;
    outline: 0;
    color: #594649;
    font: inherit;
    text-align: center;
    appearance: textfield;
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button { margin: 0; appearance: none; }
  }
`

export const QuantityButton = styled.button`
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  background: #fff;
  color: #684b50;
  font-size: 17px;
  &:hover:not(:disabled) { background: #fde9eb; }
  &:disabled { color: #b8a9aa; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid #c2405b; outline-offset: -2px; }
`

export const DialogQuickShopLabel = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 5px 9px;
  border-radius: 999px;
  background: #fde9eb;
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
  &:hover { background: #c2405b; color: #fff; }
  &:focus-visible { outline: 2px solid #c2405b; outline-offset: 2px; }
`

export const DialogTitle = styled.h2`
  max-width: calc(100% - 18px);
  color: #4a393b;
  font: 30px/1.15 'Playfair Display', Georgia, serif;
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

export const DialogQuickShopProduct = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 10px;
  border: 1px solid #f1e9e7;
  border-radius: 8px;
  background: #fdf9f8;
  > img {
    flex: 0 0 76px;
    width: 76px;
    height: 96px;
    border-radius: 5px;
    background: #f7eeee;
    object-fit: contain;
  }
  > div {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 6px;
  }
  .category { color: #c2405b; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }
  ${DialogTitle} { font-size: 20px; }
  ${DialogPrice} ${Price} { font-size: 16px; }
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
  .size-selection { display: flex; align-items: center; gap: 12px; }
`

export const SizeGuideDetails = styled.details`
  position: relative;
  flex: 0 0 auto;
  color: #c2405b;
  summary {
    padding: 6px 0;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  > div {
    position: absolute;
    z-index: 5;
    top: calc(100% + 5px);
    right: 0;
    width: min(440px, calc(100vw - 48px));
    padding: 14px;
    border: 1px solid #ead8d9;
    border-radius: 6px;
    background: #fff;
    box-shadow: 0 12px 30px #52343b20;
  }
  p { color: #766364; font-size: 10px; line-height: 1.5; }
  .table-scroll { margin: 9px 0; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; color: #594649; font-size: 10px; text-align: center; }
  th, td { padding: 7px 6px; border: 1px solid #f0e5e5; white-space: nowrap; }
  th { background: #fcf5f5; font-weight: 600; }
  .measurement-note { color: #8e7d7f; }
  summary:focus-visible { outline: 2px solid #c2405b; outline-offset: 3px; }
`

export const ComboSuggestions = styled.section`
  width: 100%;
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px solid #f0e5e5;
  h3 { margin-bottom: 10px; color: #594649; font: 18px 'Playfair Display', Georgia, serif; }
  .combo-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; width: 100%; }
  a {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 8px;
    padding: 7px;
    border: 1px solid #f0e5e5;
    border-radius: 5px;
    background: #fff;
    color: #594649;
  }
  a:hover { border-color: #f4a3b1; background: #fffafa; }
  img { flex: 0 0 42px; width: 42px; height: 54px; object-fit: cover; background: #fde9eb; }
  a > span { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
  strong { overflow: hidden; font-size: 9px; line-height: 1.3; text-overflow: ellipsis; }
  small { color: #8b6b70; font-size: 9px; }
  a:focus-visible { outline: 2px solid #c2405b; outline-offset: 2px; }
  @media (max-width: 560px) {
    .combo-list { grid-template-columns: 1fr; }
    a { padding: 6px; }
  }
`

export const DialogColorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  strong { color: #594649; font-weight: 500; }
`

export const StockNote = styled.p<{ $tone: 'ok' | 'low' | 'out' }>`
  color: ${({ $tone }) => ($tone === 'ok' ? '#7a6567' : '#a72f48')};
  font-size: 12px;
  font-weight: ${({ $tone }) => ($tone === 'ok' ? 400 : 600)};
`

export const ShareRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  button, a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border: 1px solid #f4c3cc;
    border-radius: 999px;
    background: #fff;
    color: #a72f48;
    font-size: 11px;
    font-weight: 600;
    text-decoration: none;
    transition: background .2s, border-color .2s;
  }
  button:hover, a:hover { background: #fde9eb; border-color: #fc8497; }
  button:focus-visible, a:focus-visible { outline: 2px solid #c2405b; outline-offset: 2px; }
  span[role='status'] { color: #7a6567; font-size: 11px; }
`

export const RestockBox = styled.form`
  width: 100%;
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px dashed #f4a3b1;
  border-radius: 12px;
  background: #fff7f8;
  h3 { color: #4a393b; font: 600 15px 'Playfair Display', Georgia, serif; }
  p { color: #7a6567; font-size: 12px; line-height: 1.5; }
  .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  label { display: grid; gap: 4px; color: #684b50; font-size: 11px; }
  input { width: 100%; padding: 9px 10px; border: 1px solid #ead8d9; border-radius: 8px; background: #fff; color: #4a393b; font: inherit; font-size: 13px; }
  input:focus-visible { outline: 2px solid #c2405b; outline-offset: 1px; }
  button { justify-self: start; padding: 9px 16px; border-radius: 999px; background: #c2405b; color: #fff; font-size: 12px; font-weight: 600; }
  button:hover:not(:disabled) { background: #a72f48; }
  button:disabled { cursor: wait; opacity: .7; }
  .feedback { font-size: 12px; font-weight: 600; }
  .feedback.ok { color: #2f7a46; }
  .feedback.error { color: #a72f48; }
  @media (max-width: 480px) { .fields { grid-template-columns: 1fr; } }
`

export const SkeletonCard = styled.div`
  overflow: hidden;
  border: 1px solid #f6e3e6;
  border-radius: 12px;
  background: #fff;
  .block, .line {
    background: linear-gradient(90deg, #fbeef0 0%, #fff6f7 50%, #fbeef0 100%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.3s ease-in-out infinite;
  }
  .block { aspect-ratio: 4 / 5; }
  .body { display: grid; gap: 10px; padding: 18px; }
  .line { height: 10px; border-radius: 999px; }
  .line.title { width: 75%; height: 16px; }
  .line.short { width: 35%; }
  .line.button { height: 34px; margin-top: 8px; }
  @keyframes skeleton-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  @media (prefers-reduced-motion: reduce) { .block, .line { animation: none; } }
`
