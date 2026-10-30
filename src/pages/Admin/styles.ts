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
  a { color: #c2405b; font-size: 13px; text-decoration: none; }
  h1 { margin-top: 6px; font: 34px 'Playfair Display', Georgia, serif; color: #563f44; }
  .eyebrow { color: #c2405b; font-size: 10px; letter-spacing: 1.7px; }
  @media (max-width: 520px) { align-items: flex-start; flex-direction: column; }
`

export const AdminPanel = styled.section`
  margin-bottom: 20px;
  padding: 24px;
  border: 1px solid #efe2e1;
  background: #fff;
  box-shadow: 0 12px 36px #563f4408;
  h2 { margin-bottom: 16px; color: #563f44; font: 22px 'Playfair Display', Georgia, serif; }
  p { color: #806f70; font-size: 13px; line-height: 1.7; }
  .order-list-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
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
  .gallery-image-previews { display: flex; flex-wrap: wrap; gap: 10px; }
  .gallery-image-item { display: grid; gap: 6px; justify-items: start; }
  .gallery-image-item img { width: 84px; height: 108px; object-fit: cover; border: 1px solid #e8dedd; background: #fbf6f5; }
  .color-list { display: grid; gap: 12px; }
  .stock-list { display: grid; gap: 10px; }
  .stock-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
  .stock-grid label { display: grid; gap: 6px; color: #755f62; font-size: 12px; }
  .stock-grid input { width: 100%; }
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
  border: 1px solid #c2405b;
  background: #c2405b;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  &:hover { background: #a72f48; }
  &:disabled { opacity: .6; cursor: wait; }
  &.secondary { background: #fff; color: #c2405b; }
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

export const OrderList = styled.div`
  display: grid;
  gap: 12px;
`

export const OrderRow = styled.article`
  display: grid;
  gap: 9px;
  padding: 16px;
  border: 1px solid #f0e7e6;
  color: #755f62;
  font-size: 12px;
  line-height: 1.6;
  h3 { color: #594548; font: 18px 'Playfair Display', Georgia, serif; }
  p { overflow-wrap: anywhere; }
  a { color: #c2405b; }
  ul { display: grid; gap: 4px; padding-left: 20px; }
  .order-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .order-status { padding: 3px 8px; border-radius: 12px; font-size: 10px; }
  .order-status.pending { background: #fff3d6; color: #80621f; }
  .order-status.confirmed { background: #fde9eb; color: #a72f48; }
  .order-status.paid { background: #e3eefc; color: #2f5d8a; }
  .order-status.shipped { background: #efe6fb; color: #5b3f8a; }
  .order-status.delivered { background: #e6f4e4; color: #496a4b; }
  .order-status.cancelled { background: #f7e7e7; color: #983f3f; }
  .actions { margin-top: 4px; }
  @media (max-width: 520px) { padding: 12px; .order-heading { align-items: flex-start; flex-direction: column; } }
`

export const ProductRow = styled.article`
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border: 1px solid #f0e7e6;
  img { width: 68px; height: 78px; object-fit: cover; background: #f5eeee; }
  h3 { color: #594548; font: 17px 'Playfair Display', Georgia, serif; }
  p { margin-top: 5px; font-size: 11px; }
  .actions { display: flex; gap: 7px; flex-wrap: wrap; }
  .sold-out { color: #a64343; font-size: 11px; font-weight: 600; }
  @media (max-width: 620px) {
    grid-template-columns: 54px minmax(0, 1fr);
    img { width: 54px; height: 66px; }
    .actions { grid-column: 1 / -1; }
  }
`

export const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
  .stat { padding: 14px 16px; border: 1px solid #f6dde2; border-radius: 12px; background: #fff8f9; }
  .stat span { display: block; color: #8b6b70; font-size: 11px; }
  .stat strong { display: block; margin-top: 4px; color: #a72f48; font: 600 24px 'Playfair Display', Georgia, serif; }
  .stat small { color: #9b8b8c; font-size: 11px; }
  @media (max-width: 760px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`

export const SummaryColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  h3 { margin-bottom: 10px; color: #594548; font: 17px 'Playfair Display', Georgia, serif; }
  ol, ul { display: grid; gap: 6px; padding-left: 20px; color: #755f62; font-size: 12px; line-height: 1.5; }
  .zero { color: #a64343; font-weight: 600; }
  .low { color: #a72f48; }
  .empty { color: #9b8b8c; font-size: 12px; }
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`

export const PanelHeading = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
  h2 { margin-bottom: 0 !important; }
  .controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  select { padding: 9px 10px; border: 1px solid #e8dedd; background: #fff; color: #503f41; font: inherit; font-size: 12px; }
`

export const RestockList = styled.div`
  display: grid;
  gap: 10px;
  article { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid #f0e7e6; color: #755f62; font-size: 12px; line-height: 1.6; }
  article.ready { border-color: #b9dcb6; background: #f6fbf5; }
  h3 { color: #594548; font: 16px 'Playfair Display', Georgia, serif; }
  .tag { display: inline-block; margin-left: 6px; padding: 1px 8px; border-radius: 10px; background: #e6f4e4; color: #496a4b; font-size: 10px; font-weight: 600; }
  .tag.waiting { background: #fff3d6; color: #80621f; }
  .tag.done { background: #eee9e8; color: #7a6d6e; }
  .actions { display: flex; flex-wrap: wrap; gap: 7px; justify-content: flex-end; }
  a.whatsapp { display: inline-flex; align-items: center; min-height: 40px; padding: 10px 15px; border: 1px solid #2f7a46; background: #2f7a46; color: #fff; font-size: 12px; text-decoration: none; }
  a.whatsapp:hover { background: #256238; }
  @media (max-width: 620px) { article { grid-template-columns: 1fr; } .actions { justify-content: flex-start; } }
`

export const AdminTabs = styled.nav`
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  gap: 6px;
  margin: 0 -4px 20px;
  padding: 8px 4px;
  overflow-x: auto;
  background: #fbf6f5;
  scrollbar-width: thin;
  button {
    flex: none;
    min-height: 40px;
    padding: 0 16px;
    border: 1px solid #efe2e1;
    border-radius: 999px;
    background: #fff;
    color: #594548;
    font-size: 13px;
    cursor: pointer;
  }
  button[aria-current='page'] { border-color: #c2405b; background: #c2405b; color: #fff; }
  .badge { margin-left: 6px; padding: 1px 7px; border-radius: 999px; background: #fff3d6; color: #80621f; font-size: 11px; font-weight: 700; }
`

export const DataTable = styled.div`
  overflow-x: auto;
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { padding: 9px 8px; border-bottom: 1px solid #f0e7e6; text-align: left; vertical-align: top; color: #755f62; }
  th { color: #594548; font-weight: 600; white-space: nowrap; }
  .in { color: #2f7a46; font-weight: 700; }
  .out { color: #a72f48; font-weight: 700; }
  .muted { color: #9b8b8c; }
  .actions { display: flex; flex-wrap: wrap; gap: 6px; }
`

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  label { display: grid; gap: 6px; color: #755f62; font-size: 12px; }
  input, select, textarea { width: 100%; padding: 10px 11px; border: 1px solid #e8dedd; background: #fff; color: #503f41; font: inherit; font-size: 13px; }
  .wide { grid-column: 1 / -1; }
  .check { display: flex; align-items: center; gap: 8px; }
  .check input { width: auto; accent-color: #c2405b; }
  .hint { color: #9b8b8c; font-size: 11px; line-height: 1.5; }
  @media (max-width: 760px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 520px) { grid-template-columns: 1fr; }
`
