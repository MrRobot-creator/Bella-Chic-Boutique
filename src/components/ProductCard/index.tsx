import {
  ChangeEvent,
  MouseEvent as ReactMouseEvent,
  WheelEvent as ReactWheelEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Product } from '../../types/store'
import { getVariantStock, isLowStock, LOW_STOCK_LIMIT } from '../../utils/inventory'
import { getSizeFitLabel } from '../../utils/productSize'
import { getProductIdFromPath, getProductPath, getProductUrl } from '../../utils/productLink'
import { trackEvent } from '../../services/analytics'
import RestockForm from './RestockForm'
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
  ViewDetailsButton,
  ShareRow,
  StockNote
} from './styles'

type ProductCardProps = {
  product: Product
  relatedProducts: Product[]
  onAdd: (product: Product, size: string, color: string, quantity: number) => boolean
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
  const navigate = useNavigate()
  const location = useLocation()
  const routeProductId = getProductIdFromPath(location.pathname)
  const isRouteProduct = routeProductId === product.id
  const pushedRouteRef = useRef(false)
  const [shareStatus, setShareStatus] = useState('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const selectedColor = product.colors.find((option) => option.name === color)
  const selectedVariantStock = getVariantStock(product.variantStock, size, color)
  const images = product.images?.length ? product.images : [product.image]
  const image = activeImageIndex === 0
    ? selectedColor?.image || images[0]
    : images[activeImageIndex] || product.image
  const hoverImage = images.find((candidate, index) => index > 0 && candidate && candidate !== image)
  const lowStock = isLowStock(product)
  const canRequestRestock = product.enabled !== false

  /** Fecha o modal sem mexer no endereço da página. */
  const closeLocal = useCallback(() => {
    setModalMode(null)
    setIsZoomed(false)
    setIsDraggingZoom(false)
    setImageOffset({ x: 0, y: 0 })
    setShareStatus('')
  }, [])

  /** Fecha o modal e volta o endereço para a vitrine quando ele estava em /produto/... */
  const closeDetails = () => {
    const wasRouteDetails = modalMode === 'details' && isRouteProduct
    closeLocal()
    if (!wasRouteDetails) return
    if (pushedRouteRef.current) {
      pushedRouteRef.current = false
      navigate(-1)
    } else {
      navigate('/', { replace: true })
    }
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
    setQuantity((current) => Math.min(current, Math.max(1, selectedVariantStock)))
  }, [selectedVariantStock])

  useEffect(() => {
    if (!isModalOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDetailsRef.current()
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

  const closeDetailsRef = useRef(closeDetails)
  closeDetailsRef.current = closeDetails

  const openDetails = () => {
    openModal('details')
    if (!isRouteProduct) {
      pushedRouteRef.current = true
      navigate(getProductPath(product))
    }
  }

  // Abre a peça quando o endereço é /produto/<id> (link compartilhado, voltar/avançar do navegador)
  // e fecha quando o endereço deixa de ser o desta peça.
  useEffect(() => {
    if (isRouteProduct && modalMode !== 'details') {
      triggerRef.current = null
      setIsZoomed(false)
      setImageOffset({ x: 0, y: 0 })
      setQuantity(1)
      setModalMode('details')
      document.getElementById(`product-card-${product.id}`)?.scrollIntoView({ block: 'center' })
    } else if (!isRouteProduct && modalMode === 'details' && pushedRouteRef.current) {
      pushedRouteRef.current = false
      closeLocal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRouteProduct])

  useEffect(() => {
    if (modalMode !== 'details') return undefined
    const previousTitle = document.title
    document.title = `${product.name} | Bella Chic Boutique`
    trackEvent('view_item', {
      currency: 'BRL',
      value: product.price,
      items: [{ item_id: String(product.id), item_name: product.name, item_category: product.category, price: product.price }]
    })
    return () => { document.title = previousTitle }
  }, [modalMode, product.category, product.id, product.name, product.price])

  const shareProduct = async () => {
    const url = getProductUrl(product)
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> }
    try {
      if (nav.share) {
        await nav.share({ title: product.name, text: `Olha essa peça da Bella Chic: ${product.name}`, url })
        trackEvent('share', { method: 'native', item_id: String(product.id) })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareStatus('Link copiado!')
      trackEvent('share', { method: 'copy', item_id: String(product.id) })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setShareStatus(url)
    }
  }

  const addSelectedProduct = () => {
    if (onAdd(product, size, color, quantity)) closeDetails()
  }

  const renderStockAndActions = (idPrefix: string) => (
    <>
      {selectedVariantStock < 1 ? (
        <StockNote $tone="out" role="status">Esta combinação de tamanho e cor está esgotada.</StockNote>
      ) : selectedVariantStock <= LOW_STOCK_LIMIT ? (
        <StockNote $tone="low" role="status">
          Últimas unidades: {selectedVariantStock === 1 ? 'só resta 1 nesta variação!' : `só restam ${selectedVariantStock} nesta variação!`}
        </StockNote>
      ) : (
        <StockNote $tone="ok" role="status">{selectedVariantStock} unidades disponíveis nesta variação.</StockNote>
      )}
      <AddButton
        type="button"
        disabled={product.available === false || selectedVariantStock < 1 || !size || !color}
        onClick={addSelectedProduct}
      >
        {selectedVariantStock < 1 ? 'Variação esgotada' : 'Adicionar à sacola'}
        {selectedVariantStock > 0 && <span aria-hidden="true">＋</span>}
      </AddButton>
      {selectedVariantStock < 1 && canRequestRestock && (
        <RestockForm product={product} size={size} color={color} idPrefix={`${idPrefix}-${product.id}`} />
      )}
    </>
  )

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
            onClick={openDetails}
          >
            <Image
              className={`primary${hoverImage ? ' has-alt' : ''}`}
              src={image}
              alt={`${product.name}${selectedColor ? ` - ${selectedColor.name}` : ''}`}
              loading="lazy"
            />
            {hoverImage && <Image className="alt" src={hoverImage} alt="" aria-hidden="true" loading="lazy" />}
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
          {lowStock && <span className="low-stock">Últimas unidades</span>}
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
            <ViewDetailsButton type="button" onClick={openDetails}>
              Ver detalhes <span aria-hidden="true">→</span>
            </ViewDetailsButton>
            <BuyButton
              type="button"
              disabled={product.available === false && !canRequestRestock}
              onClick={() => (product.available === false ? openDetails() : openModal('quickshop'))}
            >
              {product.available === false ? (canRequestRestock ? 'Avise-me' : 'Esgotado') : 'Comprar'}
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
                  <ShareRow>
                    <button type="button" onClick={shareProduct}>
                      <span aria-hidden="true">↗</span> Compartilhar
                    </button>
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Olha essa peça da Bella Chic: ${product.name} ${getProductUrl(product)}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackEvent('share', { method: 'whatsapp', item_id: String(product.id) })}
                    >
                      Enviar no WhatsApp
                    </a>
                    {shareStatus && <span role="status">{shareStatus}</span>}
                  </ShareRow>

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
                        max={selectedVariantStock}
                        value={quantity}
                        aria-label={`Quantidade de ${product.name}`}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                          const nextQuantity = Number(event.target.value)
                          if (Number.isInteger(nextQuantity) && nextQuantity >= 1 && nextQuantity <= selectedVariantStock) setQuantity(nextQuantity)
                        }}
                      />
                      <QuantityButton
                        type="button"
                        aria-label={`Aumentar quantidade de ${product.name}`}
                        disabled={quantity >= selectedVariantStock}
                        onClick={() => setQuantity((current) => current + 1)}
                      >
                        +
                      </QuantityButton>
                    </QuantitySelector>
                  </DialogVariantGroup>
                  {renderStockAndActions('details')}
                  {relatedProducts.length > 0 && (
                    <ComboSuggestions aria-labelledby={`combo-title-${product.id}`}>
                      <h3 id={`combo-title-${product.id}`}>Complete o look</h3>
                      <div className="combo-list">
                        {relatedProducts.map((suggestion) => (
                          <a
                            key={suggestion.id}
                            href={getProductPath(suggestion)}
                            aria-label={`Ver ${suggestion.name}`}
                            onClick={(event) => {
                              event.preventDefault()
                              pushedRouteRef.current = false
                              closeLocal()
                              navigate(getProductPath(suggestion), { replace: isRouteProduct })
                            }}
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
                    max={selectedVariantStock}
                    value={quantity}
                    aria-label={`Quantidade de ${product.name}`}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const nextQuantity = Number(event.target.value)
                      if (Number.isInteger(nextQuantity) && nextQuantity >= 1 && nextQuantity <= selectedVariantStock) setQuantity(nextQuantity)
                    }}
                  />
                  <QuantityButton
                    type="button"
                    aria-label={`Aumentar quantidade de ${product.name}`}
                    disabled={quantity >= selectedVariantStock}
                    onClick={() => setQuantity((current) => current + 1)}
                  >
                    +
                  </QuantityButton>
                </QuantitySelector>
              </DialogVariantGroup>
              {renderStockAndActions('quickshop')}
              </DialogVariants>
            )}
          </DialogContent>
        </DialogBackdrop>
      )}
    </>
  )
}

export default ProductCard
