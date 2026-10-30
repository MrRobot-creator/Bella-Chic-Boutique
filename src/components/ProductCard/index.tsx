import { MouseEvent } from 'react'
import { Product } from '../../types/store'
import { isLowStock } from '../../utils/inventory'
import { getSizeFitLabel } from '../../utils/productSize'
import { getProductPath } from '../../utils/productLink'
import { BuyButton, Card, Dots, FavoriteButton, Info, Media, Pill } from './styles'

type ProductCardProps = {
  product: Product
  isFavorite: boolean
  onOpen: (product: Product) => void
  onToggleFavorite: (product: Product) => void
}

export const formatPrice = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const getDiscount = (product: Pick<Product, 'price' | 'oldPrice'>) =>
  product.oldPrice && product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0

/** Fotos da peça sem repetição: principal primeiro, depois os outros ângulos e as fotos das cores. */
export const getProductImages = (product: Product) => {
  const list = [product.image, ...(product.images || []), ...product.colors.map((color) => color.image || '')]
  return list.filter((src, index) => Boolean(src) && list.indexOf(src) === index)
}

const ProductCard = ({ product, isFavorite, onOpen, onToggleFavorite }: ProductCardProps) => {
  const images = getProductImages(product)
  const backImage = images[1]
  const discount = getDiscount(product)
  const soldOut = product.available === false
  const canRequestRestock = product.enabled !== false
  const sizeFit = getSizeFitLabel(product)
  const tag = soldOut ? 'Esgotado' : discount ? `-${discount}%` : product.tag

  const open = (event?: MouseEvent) => {
    event?.preventDefault()
    onOpen(product)
  }

  return (
    <Card id={`product-card-${product.id}`}>
      <Media href={getProductPath(product)} onClick={open} aria-label={`Ver ${product.name}`}>
        <img className="main" src={product.image} alt={product.name} loading="lazy" />
        {backImage && <img className="back" src={backImage} alt="" aria-hidden="true" loading="lazy" />}
        {tag && <Pill $tone={soldOut ? 'dark' : discount ? 'rose' : 'light'}>{tag}</Pill>}
        {!soldOut && isLowStock(product) && <Pill $tone="light" $bottom>Últimas unidades</Pill>}
      </Media>
      <FavoriteButton
        type="button"
        onClick={() => onToggleFavorite(product)}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `Remover ${product.name} dos favoritos` : `Favoritar ${product.name}`}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
        </svg>
      </FavoriteButton>
      <Info>
        {product.colors.length > 0 && (
          <Dots aria-label={`Cores: ${product.colors.map((color) => color.name).join(', ')}`}>
            {product.colors.slice(0, 6).map((color) => (
              <span key={color.name} title={color.name} style={{ background: color.hex }} />
            ))}
          </Dots>
        )}
        <span className="category">{product.category}</span>
        <h3>{product.name}</h3>
        {sizeFit && <span className="fit">{sizeFit}</span>}
        <span className="price">
          <strong>{formatPrice(product.price)}</strong> <span>no Pix</span>
        </span>
        {product.oldPrice && product.oldPrice > product.price && <s>{formatPrice(product.oldPrice)}</s>}
        <div className="buy">
          <BuyButton
            type="button"
            $soft={soldOut}
            disabled={soldOut && !canRequestRestock}
            onClick={() => onOpen(product)}
          >
            {soldOut ? (canRequestRestock ? 'Avise-me' : 'Esgotado') : 'Comprar'}
          </BuyButton>
        </div>
      </Info>
    </Card>
  )
}

export default ProductCard
