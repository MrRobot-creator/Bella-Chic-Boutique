import { HeaderBar, HeaderContent, Brand, BrandMark, Navigation, CartButton, Announcement } from './styles'
import boutiqueLogo from '../../assets/bella-chic-logo.jpg'

type BoutiqueHeaderProps = {
  cartCount: number
  onCartClick: () => void
}

const BoutiqueHeader = ({ cartCount, onCartClick }: BoutiqueHeaderProps) => (
  <>
    <Announcement>Bem-vinda à Bella Chic Boutique · um carinho em cada detalhe</Announcement>
    <HeaderBar>
      <HeaderContent>
        <a className="brand-link" href="#inicio" aria-label="Bella Chic Boutique, início">
          <Brand>
            <BrandMark src={boutiqueLogo} alt="" />
            <span className="brand-copy"><strong>Bella Chic</strong><small>BOUTIQUE</small></span>
          </Brand>
        </a>
        <Navigation aria-label="Navegação principal">
          <a href="#colecao">Coleção</a>
          <a href="#sobre">Nossa essência</a>
        </Navigation>
        <CartButton type="button" onClick={onCartClick} aria-label={`Abrir sacola, ${cartCount} itens`}>
          <span aria-hidden="true">♡</span>
          <span className="cart-label">Sacola</span>
          <span className="cart-count">{cartCount}</span>
        </CartButton>
      </HeaderContent>
    </HeaderBar>
  </>
)

export default BoutiqueHeader
