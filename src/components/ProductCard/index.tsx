import {
  ChangeEvent,
  MouseEvent as ReactMouseEvent,
  WheelEvent as ReactWheelEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState
} from 'react'
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
  DialogImageButton,
  DialogPrice,
  DialogQuickShopLabel,
  DialogZoomButton,
  DialogTitle,
  DialogVariantGroup,
  DialogVariants,
  DialogBackdrop,
  ImageArea,
  BuyButton,
  CardActions,
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

const ZOOM_SCALE = 1.65

const ProductCard = ({ product, onAdd }: ProductCardProps) => {
  const [size, setSize] = useState(product.sizes[0] || '')
  const [color, setColor] = useState(product.colors[0]?.name || '')
  const [modalMode, setModalMode] = useState<'quickshop' | 'details' | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
  const zoomPointerStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number; pointerId: number } | null>(null)
  const imageAreaRef = useRef<HTMLDivElement>(null)
  const suppressZoomClick = useRef(false)
  const isModalOpen = modalMode !== null
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const selectedColor = product.colors.find((option) => option.name === color)
  const image = selectedColor?.image || product.image

  const closeDetails = () => {
    setModalMode(null)
    setIsZoomed(false)
    setImageOffset({ x: 0, y: 0 })
  }

  const toggleZoom = () => {
    setIsZoomed((current) => !current)
    setImageOffset({ x: 0, y: 0 })
  }

  const handleZoomPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isZoomed || !event.isPrimary) return
    event.preventDefault()
    zoomPointerStart.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: imageOffset.x,
      offsetY: imageOffset.y,
      pointerId: event.pointerId
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleZoomPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = zoomPointerStart.current
    if (!start || start.pointerId !== event.pointerId) return
    const area = imageAreaRef.current
    if (!area) return
    const maxX = area.clientWidth * (ZOOM_SCALE - 1) / 2
    const maxY = area.clientHeight * (ZOOM_SCALE - 1) / 2
    setImageOffset({
      x: Math.max(-maxX, Math.min(maxX, start.offsetX + event.clientX - start.x)),
      y: Math.max(-maxY, Math.min(maxY, start.offsetY + event.clientY - start.y))
    })
  }

  const handleZoomPointerEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = zoomPointerStart.current
    if (!start || start.pointerId !== event.pointerId) return
    zoomPointerStart.current = null
    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y)
    if (distance > 8) suppressZoomClick.current = true
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleZoomClick = () => {
    if (suppressZoomClick.current) {
      suppressZoomClick.current = false
      return
    }
    toggleZoom()
  }

  useEffect(() => {
    if (!product.sizes.includes(size)) setSize(product.sizes[0] || '')
    if (!product.colors.some((option) => option.name === color)) {
      setColor(product.colors[0]?.name || '')
    }
  }, [color, product.colors, product.sizes, size])

  useEffect(() => {
    if (!isModalOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDetails()
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
  }, [isModalOpen])

  const openModal = (mode: 'quickshop' | 'details') => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setIsZoomed(false)
    setImageOffset({ x: 0, y: 0 })
    setModalMode(mode)
  }

  const addSelectedProduct = () => {
    onAdd(product, size, color)
    closeDetails()
  }

  const handleImageWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) < 2) return
    setIsZoomed(event.deltaY < 0)
    setImageOffset({ x: 0, y: 0 })
  }

  return (
    <>
      <Card>
        <ImageArea>
          <ImageTrigger
            type="button"
            aria-label={`Ver detalhes de ${product.name}`}
            onClick={() => openModal('details')}
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
          <CardActions>
            <ViewDetailsButton type="button" onClick={() => openModal('details')}>
              Ver detalhes <span aria-hidden="true">→</span>
            </ViewDetailsButton>
            <BuyButton
              type="button"
              disabled={product.available === false}
              onClick={() => openModal('quickshop')}
            >
              {product.available === false ? 'Esgotado' : 'Comprar'}
            </BuyButton>
          </CardActions>
        </ProductInfo>
      </Card>

      {isModalOpen && (
        <DialogBackdrop onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => {
          if (event.target === event.currentTarget) closeDetails()
        }}>
          <DialogContent
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`product-title-${product.id}`}
            onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => event.stopPropagation()}
          >
            <DialogImageArea ref={imageAreaRef} $zoomed={isZoomed} onWheel={handleImageWheel}>
              <DialogImageButton
                type="button"
                aria-label={isZoomed ? 'Reduzir imagem' : 'Ampliar imagem'}
                onClick={handleZoomClick}
                onPointerDown={handleZoomPointerDown}
                onPointerMove={handleZoomPointerMove}
                onPointerUp={handleZoomPointerEnd}
                onPointerCancel={handleZoomPointerEnd}
              >
                <DialogImage
                  $zoomed={isZoomed}
                  $offsetX={imageOffset.x}
                  $offsetY={imageOffset.y}
                  style={{ transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${isZoomed ? ZOOM_SCALE : 1})` }}
                  src={image}
                  alt={`${product.name}${selectedColor ? ` - ${selectedColor.name}` : ''}`}
                />
              </DialogImageButton>
              <DialogZoomButton
                type="button"
                aria-label={isZoomed ? 'Reduzir imagem' : 'Ampliar imagem'}
                aria-pressed={isZoomed}
                onClick={toggleZoom}
              >
                {isZoomed ? '−' : '+'}
              </DialogZoomButton>
              {product.tag && <Tag>{product.tag}</Tag>}
              {product.available === false && <span className="sold-out">Esgotado</span>}
            </DialogImageArea>
            <DialogVariants>
              <DialogCloseButton
                ref={closeButtonRef}
                type="button"
                aria-label={`Fechar detalhes de ${product.name}`}
                onClick={closeDetails}
              >
                ×
              </DialogCloseButton>
              {modalMode === 'quickshop' && <DialogQuickShopLabel>COMPRA RÁPIDA</DialogQuickShopLabel>}
              <span className="category">{product.category}</span>
              <DialogTitle id={`product-title-${product.id}`}>{product.name}</DialogTitle>
              <DialogPrice>
                <Price>{formatPrice(product.price)}</Price>
                {product.oldPrice && <OldPrice>{formatPrice(product.oldPrice)}</OldPrice>}
              </DialogPrice>
              {modalMode === 'details' && <DialogDescription>{product.description}</DialogDescription>}

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
