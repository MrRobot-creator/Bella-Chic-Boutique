import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Backdrop, RoundButton, SidePanel } from '../ui'
import { colors, fonts } from '../../styles/tokens'
import { Customer } from '../../hooks/useCustomer'
import { storeConfig } from '../../config/store'
import { createWhatsAppUrl } from '../../services/whatsapp'
import boutiqueLogo from '../../assets/bella-chic-logo.jpg'

export type MenuCategory = { label: string; count: number }

type SideMenuProps = {
  isOpen: boolean
  categories: MenuCategory[]
  hasCombos: boolean
  hasOffers: boolean
  favoritesCount: number
  customer: Customer | null
  onClose: () => void
  onPickCategory: (category: string) => void
  onNavigate: (sectionId: string) => void
  onAccountClick: () => void
}

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid ${colors.line};
  img { width: 56px; height: 56px; border-radius: 50%; }
`

const AccountRow = styled.button`
  margin: 18px 24px 6px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 0;
  border-radius: 14px;
  background: ${colors.blush};
  color: ${colors.plum};
  font: 14px ${fonts.sans};
  text-align: left;
  cursor: pointer;
`

const Group = styled.span`
  padding: 20px 24px 6px;
  color: ${colors.soft};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
`

const Item = styled.button<{ $highlight?: boolean }>`
  width: 100%;
  padding: 15px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 0;
  border-bottom: 1px solid #FAF0F1;
  background: none;
  color: ${({ $highlight }) => ($highlight ? colors.rose : colors.plum)};
  font: ${({ $highlight }) => ($highlight ? 700 : 500)} 16px ${fonts.sans};
  text-align: left;
  cursor: pointer;
  transition: background .15s, padding .15s;
  &:hover { background: ${colors.blushSoft}; padding-left: 28px; }
  .count { margin-left: 6px; color: ${colors.soft}; font-size: 13px; font-weight: 500; }
  .tag { padding: 3px 8px; border-radius: 999px; background: ${colors.rose}; color: ${colors.white}; font-size: 10px; font-weight: 700; letter-spacing: 1px; }
`

const Plain = styled.button`
  padding: 12px 24px;
  border: 0;
  background: none;
  color: ${colors.plum};
  font: 15px ${fonts.sans};
  text-align: left;
  cursor: pointer;
  &:hover { color: ${colors.rose}; }
`

const WhatsApp = styled.a`
  margin: 18px 24px 28px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 999px;
  background: ${colors.rose};
  color: ${colors.white};
  font: 600 14px ${fonts.sans};
  &:hover { background: ${colors.roseDark}; color: ${colors.white}; }
`

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
)

const SideMenu = ({
  isOpen,
  categories,
  hasCombos,
  hasOffers,
  favoritesCount,
  customer,
  onClose,
  onPickCategory,
  onNavigate,
  onAccountClick
}: SideMenuProps) => {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const go = (sectionId: string) => { onClose(); onNavigate(sectionId) }
  const pick = (category: string) => { onClose(); onPickCategory(category) }
  const generalContact = storeConfig.whatsappContacts[0]

  return (
    <>
      <Backdrop onClick={onClose} aria-hidden="true" />
      <SidePanel $side="left" aria-label="Menu" role="dialog" aria-modal="true">
        <Head>
          <img src={boutiqueLogo} alt="Bella Chic Boutique" />
          <RoundButton ref={closeRef} type="button" onClick={onClose} aria-label="Fechar menu">×</RoundButton>
        </Head>
        {storeConfig.customerAccounts && (
        <AccountRow type="button" onClick={() => { onClose(); onAccountClick() }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
          <span>{customer ? <><strong>Minha conta</strong><br />{customer.email}</> : <><strong>Entrar</strong> ou <strong>cadastrar-se</strong></>}</span>
        </AccountRow>
        )}

        <Group>LOJA</Group>
        <nav aria-label="Categorias">
          <Item type="button" onClick={() => go('lancamentos')}>Lançamentos <Chevron /></Item>
          {categories.map((category) => (
            <Item key={category.label} type="button" onClick={() => pick(category.label)}>
              <span>{category.label}<span className="count">{category.count}</span></span><Chevron />
            </Item>
          ))}
          {hasCombos && <Item type="button" onClick={() => go('combos')}>Combos <Chevron /></Item>}
          {hasOffers && (
            <Item type="button" $highlight onClick={() => pick('Ofertas')}>
              <span>Promoções <span className="tag">OFF</span></span><Chevron />
            </Item>
          )}
          <Item type="button" onClick={() => pick('Favoritos')}>
            <span>Favoritos<span className="count">{favoritesCount}</span></span><Chevron />
          </Item>
          <Item type="button" onClick={() => pick('Todos')}>Toda a loja <Chevron /></Item>
        </nav>

        <Group>ATENDIMENTO</Group>
        <Plain type="button" onClick={() => go('lojas')}>Nossas lojas</Plain>
        <Plain type="button" onClick={() => go('pagamentos')}>Formas de pagamento</Plain>
        <Plain type="button" onClick={() => go('trocas-devolucoes')}>Trocas e devoluções</Plain>
        <WhatsApp
          href={createWhatsAppUrl('Olá! Gostaria de falar com a Bella Chic Boutique.', generalContact.number)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" /></svg>
          Falar no WhatsApp
        </WhatsApp>
      </SidePanel>
    </>
  )
}

export default SideMenu
