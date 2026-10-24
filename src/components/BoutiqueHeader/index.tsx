import { HeaderBar, HeaderContent, Brand, BrandMark, CartButton } from './styles'
import boutiqueLogo from '../../assets/bella-chic-logo.jpg'
import { storeConfig } from '../../config/store'

type BoutiqueHeaderProps = {
  cartCount: number
  onCartClick: () => void
  isHidden: boolean
}

const BoutiqueHeader = ({ cartCount, onCartClick, isHidden }: BoutiqueHeaderProps) => (
  <div
    aria-hidden={isHidden}
    style={{ visibility: isHidden ? 'hidden' : 'visible' }}
    className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-pink-100/80 shadow-sm transition-all duration-300"
  >
    <HeaderBar className="!bg-transparent !border-none !backdrop-blur-none">
      <HeaderContent className="py-3 flex flex-row items-center justify-between flex-nowrap">
        <a className="brand-link group min-w-0 flex-shrink" href="#inicio" aria-label="Bella Chic Boutique, início">
          <Brand className="transition-transform duration-300 group-hover:scale-105">
            <BrandMark src={boutiqueLogo} alt="" className="ring-2 ring-primary/30 shadow-md shrink-0" />
            <span className="brand-copy min-w-0">
              <strong className="text-brand-dark font-serif text-lg sm:text-xl md:text-2xl tracking-wide truncate">Bella Chic</strong>
              <small className="text-primary font-sans tracking-[2px] sm:tracking-[3px] font-semibold">BOUTIQUE</small>
            </span>
          </Brand>
        </a>
        <div className="flex flex-row items-center flex-nowrap gap-2 sm:gap-3 shrink-0">
          <a
            href={storeConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram da Bella Chic Boutique"
            className="inline-flex items-center justify-center w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] rounded-full border border-pink-200 bg-white/90 text-primary shadow-sm hover:bg-pink-50 hover:border-primary hover:scale-105 transition-all duration-300 shrink-0"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <CartButton 
            type="button" 
            onClick={onCartClick} 
            aria-label={`Abrir sacola, ${cartCount} itens`}
            className="!bg-white/90 !border-pink-200 hover:!bg-pink-50 hover:!border-primary !shadow-sm hover:!scale-105 !transition-all !duration-300 !px-2.5 sm:!px-4 !h-[36px] sm:!h-[42px] !flex !items-center !rounded-full shrink-0"
          >
            <span aria-hidden="true" className="text-primary text-base sm:text-xl">♡</span>
            <span className="cart-label font-medium text-brand-dark text-xs sm:text-sm">Sacola</span>
            <span className="cart-count bg-primary text-white font-bold shadow-sm">{cartCount}</span>
          </CartButton>
        </div>
      </HeaderContent>
    </HeaderBar>
  </div>
)

export default BoutiqueHeader
