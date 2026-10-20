import { ChangeEvent, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from 'react'
import { Product } from '../../types/store'
import {
  AddButton,
  Card,
  ColorChoice,
  ColorChoices,
  DialogCloseButton,
  DialogColorRow,
  DialogContent,
  DialogDescription,
  DialogImage,
  DialogImageArea,
  DialogPrice,
  DialogTitle,
  DialogVariantGroup,
  DialogVariants,
  DialogBackdrop,
  ImageArea,
  Image,
  ImageTrigger,
  OldPrice,
  Price,
  ProductInfo,
  Select,
  Tag,
  ViewDetailsButton
} from './styles'

type ProductCardProps = {
  product: Product
  onAdd: (product: Product, size: string, color: string) => void
}

const formatPrice = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const ProductCard = ({ product, onAdd }: ProductCardProps) => {
  const [size, setSize] = useState(product.sizes[0] || '')
  const [color, setColor] = useState(product.colors[0]?.name || '')
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const selectedColor = product.colors.find((option) => option.name === color)
  const image = selectedColor?.image || product.image

  useEffect(() => {
    if (!product.sizes.includes(size)) setSize(product.sizes[0] || '')
    if (!product.colors.some((option) => option.name === color)) {
      setColor(product.colors[0]?.name || '')
    }
  }, [color, product.colors, product.sizes, size])

  useEffect(() => {
    if (!isDetailsOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDetailsOpen(false)
        return
      }
      if (event.key !== 'Tab') return

      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), select:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusableElements?.length) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      } else if (!dialogRef.current?.contains(activeElement)) {
        event.preventDefault()
        firstElement.focus()
      }
    }
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
      triggerRef.current?.focus()
    }
  }, [isDetailsOpen])

  const openDetails = () => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setIsDetailsOpen(true)
  }

  const addSelectedProduct = () => {
    onAdd(product, size, color)
    setIsDetailsOpen(false)
  }

  return (
    <>
      <Card>
        <ImageArea>
          <ImageTrigger
            type="button"
            aria-label={`Ver detalhes de ${product.name}`}
            onClick={openDetails}
          >
            <Image
              src={image}
              alt={`${product.name}${selectedColor ? ` - ${selectedColor.name}` : ''}`}
              loading="lazy"
            />
          </ImageTrigger>
          {product.tag && <Tag>{product.tag}</Tag>}
          {product.available === false && <span className="sold-out">Esgotado</span>}
          {product.oldPrice && (
            <span className="discount">
              -{Math.round((1 - product.price / product.oldPrice) * 100)}%
            </span>
          )}
        </ImageArea>
        <ProductInfo>
          <span className="category">{product.category}</span>
          <h3>{product.name}</h3>
          <div className="prices">
            <Price>{formatPrice(product.price)}</Price>
            {product.oldPrice && <OldPrice>{formatPrice(product.oldPrice)}</OldPrice>}
          </div>
          {product.colors.length > 0 && (
            <div className="color-row">
              <span>Cor: <strong>{color}</strong></span>
              <ColorChoices aria-label={`Pré-visualizar cores de ${product.name}`}>
                {product.colors.map((option) => (
                  <ColorChoice
                    key={option.name}
                    type="button"
                    $color={option.hex}
                    $selected={option.name === color}
                    aria-label={`Pré-visualizar ${option.name}`}
                    aria-pressed={option.name === color}
                    title={option.name}
                    onClick={() => setColor(option.name)}
                  />
                ))}
              </ColorChoices>
            </div>
          )}
          <ViewDetailsButton type="button" onClick={openDetails}>
            Ver peça <span aria-hidden="true">→</span>
          </ViewDetailsButton>
        </ProductInfo>
      </Card>

      {isDetailsOpen && (
        <DialogBackdrop onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => {
          if (event.target === event.currentTarget) setIsDetailsOpen(false)
        }}>
          <DialogContent
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`product-title-${product.id}`}
            onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => event.stopPropagation()}
          >
            <DialogImageArea>
              <DialogImage
                src={image}
                alt={`${product.name}${selectedColor ? ` - ${selectedColor.name}` : ''}`}
              />
              {product.tag && <Tag>{product.tag}</Tag>}
              {product.available === false && <span className="sold-out">Esgotado</span>}
            </DialogImageArea>
            <DialogVariants>
              <DialogCloseButton
                ref={closeButtonRef}
                type="button"
                aria-label={`Fechar detalhes de ${product.name}`}
                onClick={() => setIsDetailsOpen(false)}
              >
                ×
              </DialogCloseButton>
              <span className="category">{product.category}</span>
              <DialogTitle id={`product-title-${product.id}`}>{product.name}</DialogTitle>
              <DialogPrice>
                <Price>{formatPrice(product.price)}</Price>
                {product.oldPrice && <OldPrice>{formatPrice(product.oldPrice)}</OldPrice>}
              </DialogPrice>
              <DialogDescription>{product.description}</DialogDescription>

              {product.colors.length > 0 && (
                <DialogVariantGroup>
                  <DialogColorRow>
                    <span>Cor</span>
                    <strong>{color}</strong>
                  </DialogColorRow>
                  <ColorChoices aria-label={`Escolher cor de ${product.name}`}>
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
                </DialogVariantGroup>
              )}

              {product.sizes.length > 0 && (
                <DialogVariantGroup>
                  <label htmlFor={`size-${product.id}`}>Tamanho</label>
                  <Select
                    id={`size-${product.id}`}
                    value={size}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => setSize(event.target.value)}
                  >
                    {product.sizes.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                </DialogVariantGroup>
              )}

              <AddButton
                type="button"
                disabled={product.available === false || !size || !color}
                onClick={addSelectedProduct}
              >
                {product.available === false ? 'Produto esgotado' : 'Adicionar à sacola'}
                {product.available !== false && <span aria-hidden="true">＋</span>}
              </AddButton>
            </DialogVariants>
          </DialogContent>
        </DialogBackdrop>
      )}
    </>
  )
}

export default ProductCard
