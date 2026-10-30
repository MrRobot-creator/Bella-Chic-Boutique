import { MouseEvent, TouchEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Product } from '../../types/store'
import { getVariantStock, LOW_STOCK_LIMIT } from '../../utils/inventory'
import { getSizeFitLabel } from '../../utils/productSize'
import { getProductUrl } from '../../utils/productLink'
import { trackEvent } from '../../services/analytics'
import { Backdrop } from '../ui'
import { formatPrice, getDiscount, getProductImages } from '../ProductCard'
import RestockForm from '../ProductCard/RestockForm'
import {
  AddRow,
  Arrow,
  Chips,
  Close,
  Details,
  Dialog,
  FavoriteToggle,
  Gallery,
  Look,
  MainImage,
  PriceRow,
  Quantity,
  Share,
  SizeGuide,
  StockNote,
  Swatches,
  Thumbs,
  VariantGroup
} from './styles'

type ProductDialogProps = {
  product: Product
  relatedProducts: Product[]
  isFavorite: boolean
  onToggleFavorite: (product: Product) => void
  onAdd: (product: Product, size: string, color: string, quantity: number) => boolean
  onClose: () => void
  onOpenProduct: (product: Product) => void
}

const ZOOM = 1.7

const clamp = (value: number) => Math.max(0, Math.min(100, value))

const ProductDialog = ({ product, relatedProducts, isFavorite, onToggleFavorite, onAdd, onClose, onOpenProduct }: ProductDialogProps) => {
  const images = useMemo(() => getProductImages(product), [product])
  const [imageIndex, setImageIndex] = useState(0)
  const [size, setSize] = useState(product.sizes[0] || '')
  const [color, setColor] = useState(product.colors[0]?.name || '')
  const [quantity, setQuantity] = useState(1)
  const [zoom, setZoom] = useState(false)
  const [zoomPaused, setZoomPaused] = useState(false)
  const [origin, setOrigin] = useState({ x: 50, y: 50 })
  const [shareStatus, setShareStatus] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const lastTouch = useRef(0)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const stock = getVariantStock(product.variantStock, size, color)
  const discount = getDiscount(product)
  const sizeFit = getSizeFitLabel(product)
  const canRequestRestock = product.enabled !== false
  const current = images[Math.min(imageIndex, images.length - 1)]

  useEffect(() => {
    setQuantity((value) => Math.min(value, Math.max(1, stock)))
  }, [stock])

  // Título da aba, evento do Analytics, rolagem travada, Esc e foco preso na janela.
  useEffect(() => {
    const previousTitle = document.title
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.title = `${product.name} | Bella Chic Boutique`
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus({ preventScroll: true })
    trackEvent('view_item', {
      currency: 'BRL',
      value: product.price,
      items: [{ item_id: String(product.id), item_name: product.name, item_category: product.category, price: product.price }]
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select, summary, [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.title = previousTitle
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus({ preventScroll: true })
    }
  }, [product.category, product.id, product.name, product.price])

  const showImage = (index: number) => {
    setImageIndex((index + images.length) % images.length)
    setZoom(false)
  }

  const selectColor = (name: string) => {
    setColor(name)
    const colorImage = product.colors.find((option) => option.name === name)?.image
    const index = colorImage ? images.indexOf(colorImage) : -1
    if (index >= 0) showImage(index)
  }

  // Zoom: só com o mouse em cima da foto ou arrastando o dedo; um clique desliga.
  const pointFrom = (clientX: number, clientY: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    return { x: clamp(((clientX - rect.left) / rect.width) * 100), y: clamp(((clientY - rect.top) / rect.height) * 100) }
  }
  const handleMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
    if (Date.now() - lastTouch.current < 800) return
    setOrigin(pointFrom(event.clientX, event.clientY, event.currentTarget))
    if (!zoomPaused) setZoom(true)
  }
  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (Date.now() - lastTouch.current < 800) return
    setOrigin(pointFrom(event.clientX, event.clientY, event.currentTarget))
  }
  const handleMouseLeave = () => {
    setZoom(false)
    setZoomPaused(false)
  }
  const handleClick = () => {
    if (Date.now() - lastTouch.current < 800) return
    if (zoom) {
      setZoom(false)
      setZoomPaused(true)
    } else if (zoomPaused) {
      setZoom(true)
      setZoomPaused(false)
    }
  }
  const handleTouch = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    if (!touch) return
    lastTouch.current = Date.now()
    setOrigin(pointFrom(touch.clientX, touch.clientY, event.currentTarget))
    setZoom(true)
  }
  const endTouch = () => {
    lastTouch.current = Date.now()
    setZoom(false)
  }

  const share = async () => {
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

  const add = () => {
    if (onAdd(product, size, color, quantity)) onClose()
  }

  return (
    <Backdrop $center $z={110} onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose() }}>
      <Dialog ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={`product-title-${product.id}`}>
        <Close ref={closeRef} type="button" onClick={onClose} aria-label={`Fechar ${product.name}`}>×</Close>
        <Gallery>
          {images.length > 1 && (
            <Thumbs aria-label="Fotos da peça">
              {images.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => showImage(index)}
                  onMouseEnter={() => showImage(index)}
                  aria-label={`Ver foto ${index + 1} de ${product.name}`}
                  aria-current={index === imageIndex}
                  className={index === imageIndex ? 'active' : ''}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </Thumbs>
          )}
          <MainImage
            $zoom={zoom}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onTouchStart={handleTouch}
            onTouchMove={handleTouch}
            onTouchEnd={endTouch}
            onTouchCancel={endTouch}
          >
            <img
              src={current}
              alt={`${product.name}, foto ${imageIndex + 1} de ${images.length}`}
              style={{ transform: zoom ? `scale(${ZOOM})` : 'scale(1)', transformOrigin: `${origin.x}% ${origin.y}%` }}
              draggable={false}
            />
            {(discount > 0 || product.tag) && <span className="tag">{discount > 0 ? `-${discount}%` : product.tag}</span>}
            {images.length > 1 && (
              <>
                <Arrow type="button" $side="left" aria-label="Foto anterior" onClick={(event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); showImage(imageIndex - 1) }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                </Arrow>
                <Arrow type="button" $side="right" aria-label="Próxima foto" onClick={(event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); showImage(imageIndex + 1) }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                </Arrow>
              </>
            )}
          </MainImage>
        </Gallery>

        <Details>
          <span className="category">{product.category}</span>
          <h2 id={`product-title-${product.id}`}>{product.name}</h2>
          <PriceRow>
            <strong>{formatPrice(product.price)}</strong>
            {discount > 0 && product.oldPrice && <><s>{formatPrice(product.oldPrice)}</s><span className="off">-{discount}%</span></>}
          </PriceRow>
          <p className="pay-note">Preço no Pix. No cartão, consulte as taxas em Formas de pagamento.</p>
          {product.description && <p className="description">{product.description}</p>}
          <Share>
            <button type="button" onClick={share}><span aria-hidden="true">↗</span> Compartilhar</button>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Olha essa peça da Bella Chic: ${product.name} ${getProductUrl(product)}`)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent('share', { method: 'whatsapp', item_id: String(product.id) })}
            >
              Enviar no WhatsApp
            </a>
            {shareStatus && <span role="status">{shareStatus}</span>}
          </Share>

          {product.colors.length > 0 && (
            <VariantGroup>
              <span className="label">Cor: <strong>{color}</strong></span>
              <Swatches role="radiogroup" aria-label={`Cores de ${product.name}`}>
                {product.colors.map((option) => (
                  <button
                    key={option.name}
                    type="button"
                    role="radio"
                    aria-checked={option.name === color}
                    aria-label={option.name}
                    title={option.name}
                    style={{ background: option.hex }}
                    className={option.name === color ? 'active' : ''}
                    onClick={() => selectColor(option.name)}
                  />
                ))}
              </Swatches>
            </VariantGroup>
          )}

          {product.sizes.length > 0 && (
            <VariantGroup>
              <span className="label">Tamanho: <strong>{size}</strong>{sizeFit && <em> · {sizeFit}</em>}</span>
              <Chips role="radiogroup" aria-label={`Tamanhos de ${product.name}`}>
                {product.sizes.map((option) => {
                  const optionStock = getVariantStock(product.variantStock, option, color)
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={option === size}
                      className={`${option === size ? 'active' : ''} ${optionStock < 1 ? 'empty' : ''}`}
                      onClick={() => setSize(option)}
                    >
                      {option}
                    </button>
                  )
                })}
              </Chips>
              <SizeGuide>
                <summary>Guia de medidas</summary>
                <div>
                  <p>Referência aproximada de medidas corporais em centímetros:</p>
                  <div className="table-scroll">
                    <table>
                      <caption className="sr-only">Medidas aproximadas de busto, cintura e quadril</caption>
                      <thead><tr><th scope="col">Tamanho</th><th scope="col">Busto</th><th scope="col">Cintura</th><th scope="col">Quadril</th></tr></thead>
                      <tbody>
                        <tr><th scope="row">P</th><td>86–90</td><td>68–72</td><td>94–98</td></tr>
                        <tr><th scope="row">M</th><td>90–96</td><td>72–78</td><td>98–104</td></tr>
                        <tr><th scope="row">G</th><td>96–102</td><td>78–84</td><td>104–110</td></tr>
                        <tr><th scope="row">GG</th><td>102–110</td><td>84–92</td><td>110–118</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="note">Guia indicativo: a modelagem e o tecido podem alterar o caimento. Para tamanhos únicos ou numéricos, consulte a descrição da peça ou fale com a loja.</p>
                </div>
              </SizeGuide>
            </VariantGroup>
          )}

          {stock < 1 ? (
            <StockNote $tone="out" role="status">Esta combinação de tamanho e cor está esgotada.</StockNote>
          ) : stock <= LOW_STOCK_LIMIT ? (
            <StockNote $tone="low" role="status">Últimas unidades: {stock === 1 ? 'só resta 1 nesta variação!' : `só restam ${stock} nesta variação!`}</StockNote>
          ) : (
            <StockNote $tone="ok" role="status">{stock} unidades disponíveis nesta variação.</StockNote>
          )}

          {stock > 0 && product.available !== false && (
            <AddRow>
              <Quantity>
                <button type="button" aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
                <span aria-live="polite">{quantity}</span>
                <button type="button" aria-label="Aumentar quantidade" disabled={quantity >= stock} onClick={() => setQuantity((value) => Math.min(stock, value + 1))}>+</button>
              </Quantity>
              <button type="button" className="add" disabled={!size || !color} onClick={add}>Adicionar à sacola</button>
            </AddRow>
          )}
          {stock < 1 && canRequestRestock && (
            <RestockForm product={product} size={size} color={color} idPrefix={`dialog-${product.id}`} />
          )}

          <FavoriteToggle type="button" aria-pressed={isFavorite} onClick={() => onToggleFavorite(product)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
            {isFavorite ? 'Nos seus favoritos' : 'Salvar nos favoritos'}
          </FavoriteToggle>

          {relatedProducts.length > 0 && (
            <Look aria-labelledby={`look-${product.id}`}>
              <h3 id={`look-${product.id}`}>Complete o look</h3>
              <div>
                {relatedProducts.map((item) => (
                  <button key={item.id} type="button" onClick={() => onOpenProduct(item)}>
                    <img src={item.image} alt="" loading="lazy" />
                    <span><strong>{item.name}</strong><small>{formatPrice(item.price)}</small></span>
                  </button>
                ))}
              </div>
            </Look>
          )}
        </Details>
      </Dialog>
    </Backdrop>
  )
}

export default ProductDialog
