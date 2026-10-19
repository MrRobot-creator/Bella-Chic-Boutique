import styled from 'styled-components'

export const AdminPage = styled.main`
  min-height: 100vh;
  padding: 42px 20px 70px;
  background: #fbf6f5;
  color: #594548;
`

export const AdminContainer = styled.div`
  width: min(1050px, 100%);
  margin: 0 auto;
`

export const AdminTopbar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 26px;
  a { color: #76555b; font-size: 13px; text-decoration: none; }
  h1 { margin-top: 6px; font: 34px Georgia, serif; color: #563f44; }
  .eyebrow { color: #a47479; font-size: 10px; letter-spacing: 1.7px; }
  @media (max-width: 520px) { align-items: flex-start; flex-direction: column; }
`

export const AdminPanel = styled.section`
  margin-bottom: 20px;
  padding: 24px;
  border: 1px solid #efe2e1;
  background: #fff;
  box-shadow: 0 12px 36px #563f4408;
  h2 { margin-bottom: 16px; color: #563f44; font: 22px Georgia, serif; }
  p { color: #806f70; font-size: 13px; line-height: 1.7; }
  @media (max-width: 520px) { padding: 18px; }
`

export const AdminForm = styled.form`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  label { display: grid; gap: 6px; color: #755f62; font-size: 12px; }
  input, textarea, select {
    width: 100%;
    padding: 11px 12px;
    border: 1px solid #e8dedd;
    border-radius: 2px;
    background: #fff;
    color: #503f41;
    font: inherit;
    font-size: 13px;
  }
  textarea { min-height: 84px; resize: none; overflow-y: auto; }
  .wide { grid-column: 1 / -1; }
  .check { display: flex; align-items: center; gap: 9px; }
  .check input { width: auto; accent-color: #9a6871; }
  input[type="file"] { padding: 8px; }
  .image-preview { width: 120px; height: 150px; object-fit: cover; border: 1px solid #e8dedd; background: #fbf6f5; }
  .color-list { display: grid; gap: 12px; }
  .color-item { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 14px; border: 1px solid #f0e7e6; }
  .color-item .color-image-preview { width: 92px; height: 110px; object-fit: cover; border: 1px solid #e8dedd; background: #fbf6f5; }
  .color-item .color-hex { display: flex; align-items: center; gap: 8px; }
  .color-item .color-hex input[type="color"] { width: 42px; height: 38px; padding: 3px; }
  .color-item .color-image-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .color-item .color-image-actions input[type="file"] { min-width: 0; flex: 1; }
  @media (max-width: 560px) { .color-item { grid-template-columns: 1fr; } }
  .actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  @media (max-width: 640px) { grid-template-columns: 1fr; .wide { grid-column: auto; } }
`

export const AdminButton = styled.button`
  min-height: 40px;
  padding: 10px 15px;
  border: 1px solid #76555b;
  background: #76555b;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  &:hover { background: #60434a; }
  &:disabled { opacity: .6; cursor: wait; }
  &.secondary { background: #fff; color: #76555b; }
  &.danger { border-color: #a64343; background: #a64343; }
`

export const AdminNotice = styled.p<{ $error?: boolean }>`
  margin: 0 0 15px;
  padding: 12px 14px;
  border: 1px solid ${({ $error }) => ($error ? '#edcccc' : '#d8e9d7')};
  background: ${({ $error }) => ($error ? '#fff5f5' : '#f4fbf3')};
  color: ${({ $error }) => ($error ? '#983f3f' : '#496a4b')};
  font-size: 13px;
  line-height: 1.6;
`

export const ProductList = styled.div`
  display: grid;
  gap: 10px;
`

export const ProductRow = styled.article`
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border: 1px solid #f0e7e6;
  img { width: 68px; height: 78px; object-fit: cover; background: #f5eeee; }
  h3 { color: #594548; font: 17px Georgia, serif; }
  p { margin-top: 5px; font-size: 11px; }
  .actions { display: flex; gap: 7px; flex-wrap: wrap; }
  .sold-out { color: #a64343; font-size: 11px; font-weight: 600; }
  @media (max-width: 620px) {
    grid-template-columns: 54px minmax(0, 1fr);
    img { width: 54px; height: 66px; }
    .actions { grid-column: 1 / -1; }
  }
`
