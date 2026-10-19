import { ChangeEvent, useState } from 'react'
import { Product } from '../../types/store'
import {
  AddButton,
  Card,
  ColorChoice,
  ColorChoices,
  ImageArea,
  Image,
  OldPrice,
  Price,
  ProductInfo,
  Select,
  Tag
} from './styles'

type ProductCardProps = {
  product: Product
  onAdd: (product: Product, size: string, color: string) => void
}

const formatPrice = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const ProductCard = ({ product, onAdd }: ProductCardProps) => {
  const [size, setSize] = useState(product.sizes[0])
  const [color, setColor] = useState(product.colors[0].name)

  return (
    <Card>
      <ImageArea>
        <Image src={product.image} alt={product.name} loading="lazy" />
        {product.tag && <Tag>{product.tag}</Tag>}
        {product.available === false && <span className="sold-out">Esgotado</span>}
        {product.oldPrice && <span className="discount">-{Math.round((1 - product.price / product.oldPrice) * 100)}%</span>}
      </ImageArea>
      <ProductInfo>
        <span className="category">{product.category}</span>
        <h3>{product.name}</h3>
        <p className="description">{product.description}</p>
        <div className="prices">
          <Price>{formatPrice(product.price)}</Price>
          {product.oldPrice && <OldPrice>{formatPrice(product.oldPrice)}</OldPrice>}
        </div>
        <div className="options">
          <label htmlFor={`size-${product.id}`}>Tamanho</label>
          <Select id={`size-${product.id}`} value={size} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSize(event.target.value)}>
            {product.sizes.map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
        </div>
        <div className="color-row">
          <span>Cor: <strong>{color}</strong></span>
          <ColorChoices aria-label={`Cores disponíveis para ${product.name}`}>
            {product.colors.map((option) => (
              <ColorChoice
                key={option.name}
                type="button"
                $color={option.hex}
                $selected={option.name === color}
                aria-label={option.name}
                aria-pressed={option.name === color}
                title={option.name}
                onClick={() => setColor(option.name)}
              />
            ))}
          </ColorChoices>
        </div>
        <AddButton type="button" disabled={product.available === false} onClick={() => onAdd(product, size, color)}>
          {product.available === false ? 'Produto esgotado' : 'Adicionar à sacola'}
          {product.available !== false && <span>＋</span>}
        </AddButton>
      </ProductInfo>
    </Card>
  )
}

export default ProductCard
