import styled from 'styled-components'
import { colors, fonts } from '../../styles/tokens'

export const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, .96);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${colors.line};
`

export const Row = styled.div`
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 40px;
  height: 88px;
  display: flex;
  align-items: center;
  gap: 22px;
  @media (max-width: 900px) {
    height: auto;
    padding: 10px 16px 12px;
    flex-wrap: wrap;
    gap: 10px;
  }
`

export const MenuButton = styled.button`
  flex: none;
  height: 48px;
  padding: 0 18px 0 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid ${colors.lineStrong};
  border-radius: 999px;
  background: ${colors.white};
  color: ${colors.plum};
  font: 600 14px ${fonts.sans};
  transition: border-color .2s, background .2s;
  &:hover { border-color: ${colors.rose}; background: ${colors.blushSoft}; }
  @media (max-width: 900px) {
    order: 1;
    width: 44px;
    height: 44px;
    padding: 0;
    justify-content: center;
    border: 0;
    .label { display: none; }
  }
`

export const Brand = styled.a`
  flex: none;
  display: flex;
  img { width: 62px; height: 62px; border-radius: 50%; object-fit: cover; }
  @media (max-width: 900px) {
    order: 2;
    margin: 0 auto;
    img { width: 52px; height: 52px; }
  }
`

export const SearchBox = styled.form`
  position: relative;
  flex: 1;
  min-width: 0;
  @media (max-width: 900px) { order: 4; flex-basis: 100%; }
`

export const SearchField = styled.div`
  height: 46px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 999px;
  background: ${colors.blushSoft};
  color: #8D7779;
  transition: box-shadow .2s, background .2s;
  &:focus-within { background: ${colors.white}; box-shadow: 0 0 0 1.5px ${colors.rose}; }
  input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: ${colors.plum};
    font: 14px ${fonts.sans};
    outline: none;
  }
  input::-webkit-search-cancel-button { cursor: pointer; }
  @media (max-width: 900px) { height: 42px; }
`

export const Results = styled.div`
  position: absolute;
  top: 54px;
  left: 0;
  right: 0;
  z-index: 60;
  padding: 8px;
  display: flex;
  flex-direction: column;
  border: 1px solid ${colors.line};
  border-radius: 18px;
  background: ${colors.white};
  box-shadow: 0 20px 40px rgba(62, 42, 46, .12);
  .empty { padding: 14px; color: ${colors.muted}; font-size: 14px; }
  .see-all {
    margin-top: 4px;
    padding: 12px;
    border: 0;
    border-top: 1px solid ${colors.line};
    background: none;
    color: ${colors.roseDark};
    font: 600 13px ${fonts.sans};
    text-align: left;
    cursor: pointer;
  }
`

export const ResultButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border: 0;
  border-radius: 12px;
  background: ${({ $active }) => ($active ? colors.blushSoft : colors.white)};
  color: ${colors.plum};
  font: 14px ${fonts.sans};
  text-align: left;
  cursor: pointer;
  &:hover { background: ${colors.blushSoft}; }
  img { width: 44px; height: 58px; flex: none; border-radius: 8px; object-fit: cover; background: ${colors.photoBg}; }
  span { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  small { color: ${colors.muted}; font-size: 13px; }
`

export const Actions = styled.div`
  flex: none;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 18px;
  @media (max-width: 900px) { order: 3; margin-left: 0; gap: 4px; }
`

export const AccountButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: none;
  color: ${colors.plum};
  font: 13px/1.3 ${fonts.sans};
  text-align: left;
  cursor: pointer;
  &:hover strong { color: ${colors.rose}; }
  @media (max-width: 900px) {
    width: 44px;
    height: 44px;
    justify-content: center;
    .label { display: none; }
  }
`

export const IconButton = styled.button`
  position: relative;
  width: 48px;
  height: 48px;
  flex: none;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: ${colors.blushSoft};
  color: ${colors.plum};
  cursor: pointer;
  transition: background .2s;
  &.favorites { color: ${colors.roseDark}; }
  &:hover { background: ${colors.blush}; }
  @media (max-width: 900px) {
    width: 44px;
    height: 44px;
    background: transparent;
    &.favorites { display: none; }
  }
`

export const Badge = styled.span<{ $dark?: boolean }>`
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: ${({ $dark }) => ($dark ? colors.plum : colors.rose)};
  color: ${colors.white};
  font-size: 11px;
  font-weight: 700;
`
