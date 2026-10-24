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
import { getSizeFitLabel } from '../../utils/productSize'
import {
  AddButton,
  Card,
  ColorChoice,
  ColorChoices,
  DialogCloseButton,
  DialogColorRow,
  DialogContent,
  DialogDescription,
  DialogDetailsLayout,
  DialogGallery,
  DialogImage,
  DialogImageArea,
  DialogImageButton,
  DialogPrice,
  DialogQuickShopLabel,
  DialogZoomButton,
  DialogTitle,
  DialogThumbnails,
  DialogThumbnailButton,
  DialogVariantGroup,
  DialogVariants,
  DialogBackdrop,
  DialogQuickShopProduct,
  QuantityButton,
  QuantitySelector,
  SizeGuideDetails,
  ComboSuggestions,
  ImageArea,
  BuyButton,
  CardActions,
  Image,
  ImageTrigger,
  OldPrice,
  Price,
  ProductInfo,
  Select,
  Badge,
  WishlistButton,
  ViewDetailsButton
} from './styles'

type ProductCardProps = {
  product: Product
  relatedProducts: Product[]
  onAdd: (product: Product, size: string, color: string, quantity: number) => void
}

const formatPrice = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const ZOOM_SCALE = 1.65

const SizeGuide = ({ id }: { id: string }) => (
  <SizeGuideDetails>
    <summary aria-controls={id}>Guia de medidas</summary>
    <div id={id}>
      <p>Referência aproximada de medidas corporais em centímetros:</p>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">Medidas aproximadas de busto, cintura e quadril</caption>
          <thead>
            <tr><th scope="col">Tamanho</th><th scope="col">Busto</th><th scope="col">Cintura</th><th scope="col">Quadril</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">P</th><td>86–90</td><td>68–72</td><td>94–98</td></tr>
            <tr><th scope="row">M</th><td>90–96</td><td>72–78</td><td>98–104</td></tr>
            <tr><th scope="row">G</th><td>96–102</td><td>78–84</td><td>104–110</td></tr>
            <tr><th scope="row">GG</th><td>102–110</td><td>84–92</td><td>110–118</td></tr>
          </tbody>
        </table>
      </div>
      <p className="measurement-note">
        Guia indicativo: a modelagem e o tecido podem alterar o caimento. Para tamanhos únicos ou numéricos, consulte a descrição da peça ou fale com a loja.
      </p>
    </div>
  </SizeGuideDetails>
)

const ProductCard = ({ product, relatedProducts, onAdd }: ProductCardProps) => {
  const sizeFitLabel = getSizeFitLabel(product)
  const [size, setSize] = useState(product.sizes[0] || '')
  const [color, setColor] = useState(product.colors[0]?.name || '')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [modalMode, setModalMode] = useState<'quickshop' | 'details' | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isDraggingZoom, setIsDraggingZoom] = useState(false)
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
  const zoomPointerStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number; pointerId: number } | null>(null)
  const imageAreaRef = useRef<HTMLDivElement>(null)
  const zoomImageRef = useRef<HTMLImageElement>(null)
  const suppressZoomClick = useRef(false)
  const wishlistKey = `wishlist-${product.id}`
  const [isWishlist, setIsWishlist] = useState(
    () => localStorage.getItem(wishlistKey) === 'true'
  )

  const toggleWishlist = (e: ReactMouseEvent) => {
    e.stopPropagation()
    const nextWishlist = localStorage.getItem(wishlistKey) !== 'true'
    localStorage.setItem(wishlistKey, String(nextWishlist))
    setIsWishlist(nextWishlist)
  }
  const isModalOpen = modalMode !== null
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const selectedColor = product.colors.find((option) => option.name === color)
  const images = product.images?.length ? product.images : [product.image]
  const image = activeImageIndex === 0
    ? selectedColor?.image || images[0]
    : images[activeImageIndex] || product.image

  const closeDetails = () => {
    setModalMode(null)
    setIsZoomed(false)
    setIsDraggingZoom(false)
    setImageOffset({ x: 0, y: 0 })
  }

  const toggleZoom = () => {
    if (isZoomed) {
      setIsZoomed(false)
      setIsDraggingZoom(false)
      setImageOffset({ x: 0, y: 0 })
      return
    }
    setIsZoomed(true)
    setImageOffset({ x: 0, y: 0 })
  }

  const getMaxZoomOffset = () => {
    const area = imageAreaRef.current
    const zoomImage = zoomImageRef.current
    if (!area || !zoomImage?.naturalWidth || !zoomImage.naturalHeight) {
      return { x: 0, y: 0 }
    }
    const fitScale = Math.min(
      area.clientWidth / zoomImage.naturalWidth,
      area.clientHeight / zoomImage.naturalHeight
    )
    return {
      x: Math.max(0, (zoomImage.naturalWidth * fitScale * ZOOM_SCALE - area.clientWidth) / 2),
      y: Math.max(0, (zoomImage.naturalHeight * fitScale * ZOOM_SCALE - area.clientHeight) / 2)
    }
  }

  const zoomAtPoint = (clientX: number, clientY: number) => {
    const area = imageAreaRef.current
    if (!area) {
      toggleZoom()
      return
    }
    const bounds = area.getBoundingClientRect()
    const maxOffset = getMaxZoomOffset()
    const offsetX = (bounds.left + bounds.width / 2 - clientX) * (ZOOM_SCALE - 1)
    const offsetY = (bounds.top + bounds.height / 2 - clientY) * (ZOOM_SCALE - 1)
    setImageOffset({
      x: Math.max(-maxOffset.x, Math.min(maxOffset.x, offsetX)),
      y: Math.max(-maxOffset.y, Math.min(maxOffset.y, offsetY))
    })
    setIsZoomed(true)
  }

  const selectColor = (selectedColorName: string) => {
    setColor(selectedColorName)
    setActiveImageIndex(0)
    setIsZoomed(false)
    setIsDraggingZoom(false)
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
    setIsDraggingZoom(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleZoomPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = zoomPointerStart.current
    if (!start || start.pointerId !== event.pointerId) return
    const area = imageAreaRef.current
    if (!area) return
    const maxOffset = getMaxZoomOffset()
    setImageOffset({
      x: Math.max(-maxOffset.x, Math.min(maxOffset.x, start.offsetX + event.clientX - start.x)),
      y: Math.max(-maxOffset.y, Math.min(maxOffset.y, start.offsetY + event.clientY - start.y))
    })
  }

  const handleZoomPointerEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = zoomPointerStart.current
    if (!start || start.pointerId !== event.pointerId) return
    zoomPointerStart.current = null
    setIsDraggingZoom(false)
    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y)
    if (distance > 8) suppressZoomClick.current = true
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleZoomClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (suppressZoomClick.current) {
      suppressZoomClick.current = false
      return
    }
    if (isZoomed) {
      toggleZoom()
      return
    }
    if (event.detail === 0) {
      toggleZoom()
      return
    }
    zoomAtPoint(event.clientX, event.clientY)
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
    setIsDraggingZoom(false)
    setImageOffset({ x: 0, y: 0 })
    setQuantity(1)
    setModalMode(mode)
  }

  const addSelectedProduct = () => {
    onAdd(product, size, color, quantity)
    closeDetails()
  }

  const handleImageWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) < 2) return
    if (event.deltaY < 0 && !isZoomed) {
      zoomAtPoint(event.clientX, event.clientY)
    } else if (event.deltaY > 0 && isZoomed) {
      setIsZoomed(false)
      setIsDraggingZoom(false)
      setImageOffset({ x: 0, y: 0 })
    }
  }

  return (
    <>
      <Card id={`product-card-${product.id}`} tabIndex={-1}>
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
          {product.tag && (
            <Badge $variant={product.tag.toLowerCase().includes('novo') ? 'new' : product.tag.toLowerCase().includes('vendido') || product.tag.toLowerCase().includes('destaque') ? 'bestseller' : 'limited'}>
              {product.tag}
            </Badge>
          )}
          <WishlistButton
            type="button"
            className={isWishlist ? 'active' : ''}
            onClick={toggleWishlist}
            aria-label={isWishlist ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            {isWishlist ? '♥' : '♡'}
          </WishlistButton>
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
          {sizeFitLabel && <p className="size-fit-note">{sizeFitLabel}</p>}
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
                    onClick={() => selectColor(option.name)}
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
        <DialogBackdrop $mode={modalMode} onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => {
          if (event.target === event.currentTarget) closeDetails()
        }}>
          <DialogContent
            $mode={modalMode || 'details'}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`product-title-${product.id}`}
            onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => event.stopPropagation()}
          >
            <DialogCloseButton
              ref={closeButtonRef}
              type="button"
              aria-label={`Fechar ${modalMode === 'details' ? 'detalhes' : 'compra rápida'} de ${product.name}`}
              onClick={closeDetails}
            >
              ×
            </DialogCloseButton>
            {modalMode === 'details' && (
              <DialogDetailsLayout>
                <DialogGallery>
                <DialogImageArea ref={imageAreaRef} $zoomed={isZoomed} onWheel={handleImageWheel}>
                  <DialogImageButton
                    type="button"
                    aria-label={isZoomed ? 'Reduzir imagem' : 'Ampliar imagem'}
                    onClick={handleZoomClick}
                    onPointerDown={handleZoomPointerDown}
                    onPointerCancel={handleZoomPointerEnd}
                    onPointerMove={handleZoomPointerMove}
                    onPointerUp={handleZoomPointerEnd}
                  >
                    <DialogImage
                    ref={zoomImageRef}
                    $zoomed={isZoomed}
                    $dragging={isDraggingZoom}
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
                    onClick={() => toggleZoom()}
                  >
                    {isZoomed ? '−' : '+'}
                  </DialogZoomButton>
                  {product.tag && (
                    <Badge $variant={product.tag.toLowerCase().includes('novo') ? 'new' : product.tag.toLowerCase().includes('vendido') || product.tag.toLowerCase().includes('destaque') ? 'bestseller' : 'limited'}>
                      {product.tag}
                    </Badge>
                  )}
                  {product.available === false && <span className="sold-out">Esgotado</span>}
                </DialogImageArea>
                {images.length > 1 && (
                  <DialogThumbnails aria-label="Ângulos e miniaturas do produto">
                    {images.map((imgSrc, index) => (
                      <DialogThumbnailButton
                        key={index}
                        type="button"
                        $active={index === activeImageIndex}
                        onClick={() => {
                          setActiveImageIndex(index)
                          setIsZoomed(false)
                          setImageOffset({ x: 0, y: 0 })
                        }}
                        aria-label={`Ver ângulo ${index + 1} de ${product.name}`}
                        aria-pressed={index === activeImageIndex}
                      >
                        <img
                          src={index === 0 ? selectedColor?.image || imgSrc : imgSrc}
                          alt={`${product.name} ângulo ${index + 1}`}
                          loading="lazy"
                        />
                      </DialogThumbnailButton>
                    ))}
                  </DialogThumbnails>
                )}
                </DialogGallery>
                <DialogVariants>
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
                            onClick={() => selectColor(option.name)}
                          />
                        ))}
                      </ColorChoices>
                    </DialogVariantGroup>
                  )}

                  {product.sizes.length > 0 && (
                    <DialogVariantGroup>
                      <div className="size-selection">
                        <label htmlFor={`size-details-${product.id}`}>Tamanho</label>
                        <Select
                          id={`size-details-${product.id}`}
                          value={size}
                          onChange={(event: ChangeEvent<HTMLSelectElement>) => setSize(event.target.value)}
                        >
                          {product.sizes.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </Select>
                      </div>
                      <SizeGuide id={`size-guide-details-${product.id}`} />
                    </DialogVariantGroup>
                  )}
                  {sizeFitLabel && <p className="size-fit-note">{sizeFitLabel}</p>}

                  <DialogVariantGroup>
                    <label htmlFor={`quantity-details-${product.id}`}>Quantidade</label>
                    <QuantitySelector>
                      <QuantityButton
                        type="button"
                        aria-label={`Diminuir quantidade de ${product.name}`}
                        disabled={quantity <= 1}
                        onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      >
                        −
                      </QuantityButton>
                      <input
                        id={`quantity-details-${product.id}`}
                        type="number"
                        min="1"
                        value={quantity}
                        aria-label={`Quantidade de ${product.name}`}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                          const nextQuantity = Number(event.target.value)
                          if (Number.isInteger(nextQuantity) && nextQuantity >= 1) setQuantity(nextQuantity)
                        }}
                      />
                      <QuantityButton
                        type="button"
                        aria-label={`Aumentar quantidade de ${product.name}`}
                        onClick={() => setQuantity((current) => current + 1)}
                      >
                        +
                      </QuantityButton>
                    </QuantitySelector>
                  </DialogVariantGroup>
                  <AddButton
                    type="button"
                    disabled={product.available === false || !size || !color}
                    onClick={addSelectedProduct}
                  >
                    {product.available === false ? 'Produto esgotado' : 'Adicionar à sacola'}
                    {product.available !== false && <span aria-hidden="true">＋</span>}
                  </AddButton>
                  {relatedProducts.length > 0 && (
                    <ComboSuggestions aria-labelledby={`combo-title-${product.id}`}>
                      <h3 id={`combo-title-${product.id}`}>Complete o look</h3>
                      <div className="combo-list">
                        {relatedProducts.map((suggestion) => (
                          <a
                            key={suggestion.id}
                            href={`#product-card-${suggestion.id}`}
                            aria-label={`Ver ${suggestion.name} na coleção`}
                            onClick={closeDetails}
                          >
                            <img src={suggestion.image} alt="" loading="lazy" />
                            <span>
                              <strong>{suggestion.name}</strong>
                              <small>{formatPrice(suggestion.price)}</small>
                            </span>
                          </a>
                        ))}
                      </div>
                    </ComboSuggestions>
                  )}
                </DialogVariants>
              </DialogDetailsLayout>
            )}
            {modalMode === 'quickshop' && (
              <DialogVariants>
                <DialogQuickShopLabel>COMPRA RÁPIDA</DialogQuickShopLabel>
                <DialogQuickShopProduct>
                  <img src={image} alt={`${product.name}${selectedColor ? ` - ${selectedColor.name}` : ''}`} />
                  <div>
                    <span className="category">{product.category}</span>
                    <DialogTitle id={`product-title-${product.id}`}>{product.name}</DialogTitle>
                    <DialogPrice>
                      <Price>{formatPrice(product.price)}</Price>
                      {product.oldPrice && <OldPrice>{formatPrice(product.oldPrice)}</OldPrice>}
                    </DialogPrice>
                  </div>
                </DialogQuickShopProduct>
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
                        onClick={() => selectColor(option.name)}
                      />
                    ))}
                  </ColorChoices>
                </DialogVariantGroup>
              )}

              {product.sizes.length > 0 && (
                <DialogVariantGroup>
                  <div className="size-selection">
                    <label htmlFor={`size-quickshop-${product.id}`}>Tamanho</label>
                    <Select
                      id={`size-quickshop-${product.id}`}
                      value={size}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) => setSize(event.target.value)}
                    >
                      {product.sizes.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </Select>
                  </div>
                  <SizeGuide id={`size-guide-quickshop-${product.id}`} />
                </DialogVariantGroup>
              )}
              {sizeFitLabel && <p className="size-fit-note">{sizeFitLabel}</p>}

              <DialogVariantGroup>
                <label htmlFor={`quantity-quickshop-${product.id}`}>Quantidade</label>
                <QuantitySelector>
                  <QuantityButton
                    type="button"
                    aria-label={`Diminuir quantidade de ${product.name}`}
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  >
                    −
                  </QuantityButton>
                  <input
                    id={`quantity-quickshop-${product.id}`}
                    type="number"
                    min="1"
                    value={quantity}
                    aria-label={`Quantidade de ${product.name}`}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const nextQuantity = Number(event.target.value)
                      if (Number.isInteger(nextQuantity) && nextQuantity >= 1) setQuantity(nextQuantity)
                    }}
                  />
                  <QuantityButton
                    type="button"
                    aria-label={`Aumentar quantidade de ${product.name}`}
                    onClick={() => setQuantity((current) => current + 1)}
                  >
                    +
                  </QuantityButton>
                </QuantitySelector>
              </DialogVariantGroup>

              <AddButton
                type="button"
                disabled={product.available === false || !size || !color}
                onClick={addSelectedProduct}
              >
                {product.available === false ? 'Produto esgotado' : 'Adicionar à sacola'}
                {product.available !== false && <span aria-hidden="true">＋</span>}
              </AddButton>
              </DialogVariants>
            )}
          </DialogContent>
        </DialogBackdrop>
      )}
    </>
  )
}

export default ProductCard
