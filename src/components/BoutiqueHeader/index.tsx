import { storeConfig } from '../../config/store'
import { HeaderBar, HeaderContent, Brand, BrandMark, Navigation, CartButton, Announcement } from './styles'

type BoutiqueHeaderProps = {
  cartCount: number
  onCartClick: () => void
}

const BoutiqueHeader = ({ cartCount, onCartClick }: BoutiqueHeaderProps) => (
  <>
    <Announcement>UM CARINHO EM CADA DETALHE · PRECINHO BELLA CHIC</Announcement>
    <HeaderBar>
      <HeaderContent>
        <a className="brand-link" href="#inicio" aria-label="Bella Chic Boutique, início">
          <Brand>
            <BrandMark>Ｂ</BrandMark>
            <span>
              <strong>BELLA CHIC</strong>
              <small>B O U T I Q U E</small>
            </span>
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
    <span className="sr-only">{storeConfig.name}</span>
  </>
)

export default BoutiqueHeader
