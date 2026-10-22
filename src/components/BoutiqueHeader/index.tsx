import { HeaderBar, HeaderContent, Brand, BrandMark, CartButton, Announcement } from './styles'
import boutiqueLogo from '../../assets/bella-chic-logo.jpg'
import { storeConfig } from '../../config/store'

type BoutiqueHeaderProps = {
  cartCount: number
  onCartClick: () => void
}

const BoutiqueHeader = ({ cartCount, onCartClick }: BoutiqueHeaderProps) => (
  <>
    <Announcement>Moda feminina · Belém e Ananindeua</Announcement>
    <HeaderBar>
      <HeaderContent>
        <a className="brand-link" href="#inicio" aria-label="Bella Chic Boutique, início">
          <Brand>
            <BrandMark src={boutiqueLogo} alt="" />
            <span className="brand-copy"><strong>Bella Chic</strong><small>BOUTIQUE</small></span>
          </Brand>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href={storeConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram da Bella Chic Boutique"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: '1px solid #ead8d9',
              background: 'white',
              color: '#684b50',
              textDecoration: 'none',
              transition: 'background .2s'
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <CartButton type="button" onClick={onCartClick} aria-label={`Abrir sacola, ${cartCount} itens`}>
            <span aria-hidden="true">♡</span>
            <span className="cart-label">Sacola</span>
            <span className="cart-count">{cartCount}</span>
          </CartButton>
        </div>
      </HeaderContent>
    </HeaderBar>
  </>
)

export default BoutiqueHeader
