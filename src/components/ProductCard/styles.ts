import styled, { css } from 'styled-components'
import { colors, fonts } from '../../styles/tokens'

export const Card = styled.article`
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border: 1px solid ${colors.line};
  border-radius: 16px;
  background: ${colors.white};
  transition: box-shadow .3s ease, border-color .3s ease;
  &:hover { border-color: #EFD3D8; box-shadow: 0 14px 34px rgba(62, 42, 46, .10); }
`

export const Media = styled.a`
  position: relative;
  display: block;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: ${colors.photoBg};
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; }
  .main, .back { transition: opacity .6s cubic-bezier(.45, 0, .25, 1), transform 1.2s cubic-bezier(.2, .7, .2, 1); }
  .back { opacity: 0; }
  @media (hover: hover) {
    ${Card}:hover & .back { opacity: 1; }
    /* Aproximação lenta da foto: dentro do overflow, não mexe no layout. */
    ${Card}:hover & img { transform: scale(1.04); }
  }
  @media (prefers-reduced-motion: reduce) {
    .main, .back { transition: none; }
    ${Card}:hover & img { transform: none; }
  }
`

export const Pill = styled.span<{ $tone: 'light' | 'rose' | 'dark'; $bottom?: boolean }>`
  position: absolute;
  left: 12px;
  ${({ $bottom }) => ($bottom ? 'bottom: 12px;' : 'top: 12px;')}
  z-index: 2;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .4px;
  text-transform: uppercase;
  pointer-events: none;
  ${({ $tone }) => ($tone === 'rose'
    ? css`background: ${colors.rose}; color: ${colors.white};`
    : $tone === 'dark'
      ? css`background: rgba(62, 42, 46, .86); color: ${colors.white};`
      : css`background: ${colors.white}; color: ${colors.roseDark}; box-shadow: 0 4px 12px rgba(194, 64, 91, .14);`)}
`

export const FavoriteButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, .94);
  color: ${colors.rose};
  box-shadow: 0 2px 8px rgba(62, 42, 46, .08);
  cursor: pointer;
  transition: transform .2s;
  &:hover { transform: scale(1.08); }
  &[aria-pressed='true'] svg { animation: beat .35s ease; }
  @keyframes beat { 50% { transform: scale(1.25); } }
`

export const Info = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 16px 18px;
  text-align: center;
  .category { color: ${colors.soft}; font-size: 11px; letter-spacing: 1.8px; text-transform: uppercase; }
  h3 {
    margin: 0;
    min-height: 2.6em;
    display: -webkit-box;
    overflow: hidden;
    color: ${colors.plum};
    font: 600 15px/1.3 ${fonts.sans};
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .fit { min-height: 1.4em; color: ${colors.muted}; font-size: 12px; line-height: 1.4; }
  .price { margin-top: 4px; color: ${colors.plum}; font-size: 17px; }
  .price strong { font-weight: 700; }
  .price span { color: ${colors.muted}; font-size: 13px; }
  .old { min-height: 1.4em; color: ${colors.soft}; font-size: 12px; line-height: 1.4; }
  .buy { width: 100%; margin-top: auto; padding-top: 10px; }
  @media (max-width: 480px) {
    padding: 12px 10px 14px;
    h3 { font-size: 13px; }
    .price { font-size: 15px; }
  }
`

export const Dots = styled.span`
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
  span { width: 14px; height: 14px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .14); }
`

export const BuyButton = styled.button<{ $soft?: boolean }>`
  width: 100%;
  min-height: 44px;
  /* "Avise-me" é fio fino em vez de bloco rosa: a vitrine com peças esgotadas fica leve, e "Comprar" se destaca. */
  border: 1px solid ${({ $soft }) => ($soft ? colors.lineStrong : colors.rose)};
  border-radius: 999px;
  background: ${({ $soft }) => ($soft ? 'transparent' : colors.rose)};
  color: ${({ $soft }) => ($soft ? colors.plum : colors.white)};
  font: 600 12px ${fonts.sans};
  letter-spacing: 1.6px;
  text-transform: uppercase;
  cursor: pointer;
  transition: background .2s, border-color .2s, color .2s;
  &:hover:not(:disabled) {
    border-color: ${({ $soft }) => ($soft ? colors.rose : colors.roseDark)};
    background: ${({ $soft }) => ($soft ? 'transparent' : colors.roseDark)};
    color: ${({ $soft }) => ($soft ? colors.roseDark : colors.white)};
  }
  &:disabled { cursor: not-allowed; background: #EEE9E8; color: #918787; }
`

export const RestockBox = styled.form`
  width: 100%;
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1.5px dashed ${colors.roseLight};
  border-radius: 16px;
  background: #FFF7F8;
  h3 { color: ${colors.plum}; font: 400 19px ${fonts.serif}; }
  p { color: ${colors.muted}; font-size: 13px; line-height: 1.5; }
  .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  label { display: grid; gap: 4px; color: #684B50; font-size: 12px; }
  input { width: 100%; height: 44px; padding: 0 12px; border: 1px solid ${colors.lineStrong}; border-radius: 10px; background: ${colors.white}; color: ${colors.plum}; font: 14px ${fonts.sans}; }
  button { justify-self: start; min-height: 44px; padding: 0 20px; border: 0; border-radius: 999px; background: ${colors.rose}; color: ${colors.white}; font: 600 13px ${fonts.sans}; cursor: pointer; }
  button:hover:not(:disabled) { background: ${colors.roseDark}; }
  button:disabled { cursor: wait; opacity: .7; }
  .feedback { font-size: 13px; font-weight: 600; }
  .feedback.ok { color: ${colors.success}; }
  .feedback.error { color: ${colors.roseDark}; }
  a { color: ${colors.roseDark}; text-decoration: underline; }
  @media (max-width: 480px) { .fields { grid-template-columns: 1fr; } }
`

export const SkeletonCard = styled.div`
  overflow: hidden;
  border: 1px solid #F6E3E6;
  border-radius: 16px;
  background: ${colors.white};
  .block, .line {
    background: linear-gradient(90deg, #FBEEF0 0%, #FFF6F7 50%, #FBEEF0 100%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.3s ease-in-out infinite;
  }
  .block { aspect-ratio: 3 / 4; }
  .body { display: grid; justify-items: center; gap: 10px; padding: 18px; }
  .line { width: 70%; height: 10px; border-radius: 999px; }
  .line.title { height: 14px; }
  .line.short { width: 35%; }
  .line.button { width: 100%; height: 40px; margin-top: 8px; }
  @keyframes skeleton-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  @media (prefers-reduced-motion: reduce) { .block, .line { animation: none; } }
`
