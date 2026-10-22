import {
  ChangeEvent,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  TransitionEvent as ReactTransitionEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import BoutiqueHeader from '../../components/BoutiqueHeader'
import CartDrawer from '../../components/CartDrawer'
import ProductCard from '../../components/ProductCard'
import { products as demoProducts } from '../../data/products'
import { storeConfig } from '../../config/store'
import { fetchCatalogProducts } from '../../services/catalog'
import { createWhatsAppUrl } from '../../services/whatsapp'
import { CartItem, Product } from '../../types/store'
import {
  AnnouncementBar,
  Catalog,
  CatalogHeader,
  CatalogTools,
  CategoryMenu,
  CategoryMenuButton,
  CategoryMenuOption,
  CategoryMenuPanel,
  Contact,
  ContactContent,
  ContactHeader,
  ContactLink,
  ContactUnit,
  ContactUnitButton,
  ContactUnits,
  Footer,
  FooterBrand,
  FooterBottom,
  FooterContent,
  FooterSocialLink,
  FooterNavigation,
  Hero,
  HeroContent,
  HeroShowcase,
  Main,
  PaymentCard,
  PaymentMethods,
  ProductGrid,
  ShowcaseImage,
  ShowcaseTrack,
  SearchInput,
  ShowcaseLink,
  ShowcaseViewport,
  FloatingWhatsApp,
  StoreCarousel,
  StoreViewport,
  StoreTrack,
  StoreSlideItem,
  StoreSlideImage,
  StatusMessage
} from './styles'
import boutiqueLogo from '../../assets/bella-chic-logo.jpg'
import banner1Image from '../../assets/banner 1.jpeg'
import banner2Image from '../../assets/banner 2.jpeg'
import lojaGaleriaImage from '../../assets/loja galeria.jpeg'
import lojaCnImage from '../../assets/loja cn.jpeg'


const Home = () => {
  const [catalogProducts, setCatalogProducts] = useState(demoProducts)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(1)
  const [showcaseDragOffset, setShowcaseDragOffset] = useState(0)
  const [showcaseTransitionEnabled, setShowcaseTransitionEnabled] = useState(true)
  const [activeUnitId, setActiveUnitId] = useState(storeConfig.units[0].id)
  const [selectedPaymentInfo, setSelectedPaymentInfo] = useState<string | null>(null)
  const [isExchangePolicyOpen, setIsExchangePolicyOpen] = useState(false)

  useEffect(() => {
    if (!isExchangePolicyOpen) return
    // Mantém o foco no contexto do usuário após o clique no rodapé
    const el = document.getElementById('trocas-devolucoes')
    if (el) el.focus?.()
  }, [isExchangePolicyOpen])

  useEffect(() => {
    if (!isExchangePolicyOpen) return

    const exchangePolicyEl = document.getElementById('trocas-devolucoes')
    if (!exchangePolicyEl) return

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!exchangePolicyEl.contains(target)) {
        setIsExchangePolicyOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExchangePolicyOpen(false)
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isExchangePolicyOpen])

  const [activeStoreIndex, setActiveStoreIndex] = useState(1)
  const [storeDragOffset, setStoreDragOffset] = useState(0)
  const [storeTransitionEnabled, setStoreTransitionEnabled] = useState(true)
  const storePointerStart = useRef<{ x: number; y: number; pointerId: number } | null>(null)
  const suppressStoreClick = useRef(false)
  const [isStoreCarouselPaused, setIsStoreCarouselPaused] = useState(false)

  const storeImages = useMemo(
    () => [
      { src: lojaGaleriaImage, title: 'Galeria Portuense', description: 'Nossa unidade em Belém' },
      { src: lojaCnImage, title: 'Cidade Nova 04', description: 'Nossa unidade em Ananindeua' }
    ],
    []
  )
  const storeSlides = useMemo(
    () => storeImages.length > 1
      ? [storeImages[storeImages.length - 1], ...storeImages, storeImages[0]]
      : storeImages,
    [storeImages]
  )

  const activeStoreSlideIndex = storeImages.length > 1
    ? (activeStoreIndex === 0 ? storeImages.length - 1 : activeStoreIndex === storeImages.length + 1 ? 0 : activeStoreIndex - 1)
    : 0
  const activeStore = storeImages[activeStoreSlideIndex] || storeImages[0]

  useEffect(() => {
    if (isStoreCarouselPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches || storeImages.length < 2) return undefined
    const rotation = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !storePointerStart.current) {
        setActiveStoreIndex((index) => index >= storeImages.length + 1 ? 1 : index + 1)
      }
    }, 5000)
    return () => window.clearInterval(rotation)
  }, [isStoreCarouselPaused, storeImages.length])

  useEffect(() => {
    if (storeImages.length < 2) {
      setActiveStoreIndex(0)
      return
    }
    if (activeStoreIndex < 1 || activeStoreIndex > storeImages.length + 1) {
      setStoreTransitionEnabled(false)
      setActiveStoreIndex(1)
      window.requestAnimationFrame(() => setStoreTransitionEnabled(true))
    }
  }, [activeStoreIndex, storeImages.length])

  const handleStoreTransitionEnd = (event: ReactTransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return
    if (storeImages.length < 2) return
    const clonePosition = activeStoreIndex === 0
      ? storeImages.length
      : activeStoreIndex === storeImages.length + 1 ? 1 : null
    if (clonePosition === null) return

    setStoreTransitionEnabled(false)
    setActiveStoreIndex(clonePosition)
    window.requestAnimationFrame(() => setStoreTransitionEnabled(true))
  }

  const handleStorePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
    storePointerStart.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
    setStoreTransitionEnabled(false)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleStorePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = storePointerStart.current
    if (!start || start.pointerId !== event.pointerId || storeImages.length < 2) return

    const horizontalDistance = event.clientX - start.x
    const verticalDistance = event.clientY - start.y
    if (Math.abs(verticalDistance) > Math.abs(horizontalDistance) && Math.abs(verticalDistance) > 12) {
      storePointerStart.current = null
      setStoreDragOffset(0)
      setStoreTransitionEnabled(true)
      return
    }
    setStoreDragOffset(horizontalDistance)
  }

  const handleStorePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = storePointerStart.current
    if (!start || start.pointerId !== event.pointerId) return
    storePointerStart.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const horizontalDistance = event.clientX - start.x
    const verticalDistance = event.clientY - start.y
    const didDrag = Math.abs(horizontalDistance) >= 45 && Math.abs(horizontalDistance) > Math.abs(verticalDistance)
    if (didDrag && storeImages.length > 1) {
      suppressStoreClick.current = true
      window.setTimeout(() => {
        suppressStoreClick.current = false
      }, 0)
      setActiveStoreIndex((index) => {
        if (horizontalDistance < 0) return index >= storeImages.length ? 0 : index + 1
        return index <= 1 ? 0 : index - 1
      })
    }
    setStoreDragOffset(0)
    setStoreTransitionEnabled(true)
  }

  const handleStorePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (storePointerStart.current?.pointerId !== event.pointerId) return
    storePointerStart.current = null
    setStoreDragOffset(0)
    setStoreTransitionEnabled(true)
  }
  const categoryMenuRef = useRef<HTMLDivElement>(null)
  const showcasePointerStart = useRef<{ x: number; y: number; pointerId: number } | null>(null)
  const suppressShowcaseClick = useRef(false)
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  useEffect(() => {
    let active = true

    fetchCatalogProducts()
      .then((loadedProducts) => {
        if (active) setCatalogProducts(loadedProducts)
      })
      .catch((error: Error) => {
        if (active) setCatalogError(`Não foi possível carregar o catálogo: ${error.message}`)
      })
      .finally(() => {
        if (active) setCatalogLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const availableCategories = useMemo(
    () => ['Todos', ...Array.from(new Set(catalogProducts.map((product) => product.category)))],
    [catalogProducts]
  )

  const [sortBy, setSortBy] = useState('featured')

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
    const filtered = catalogProducts.filter((product) => {
      const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory
      const matchesSearch =
        !normalizedSearch ||
        `${product.name} ${product.category} ${product.description}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'pt-BR')
      return 0
    })
  }, [activeCategory, catalogProducts, search, sortBy])

  const bannerSlides = useMemo(
    () => [
      { id: 1, image: banner1Image, title: 'Banner 1' },
      { id: 2, image: banner2Image, title: 'Banner 2' }
    ],
    []
  )
  const showcaseSlides = useMemo(
    () => bannerSlides.length > 1
      ? [bannerSlides[bannerSlides.length - 1], ...bannerSlides, bannerSlides[0]]
      : bannerSlides,
    [bannerSlides]
  )
  const activeUnit = storeConfig.units.find((unit) => unit.id === activeUnitId) || storeConfig.units[0]
  const unitContacts = storeConfig.whatsappContacts.filter((contact) => contact.unitId === activeUnit.id)

  useEffect(() => {
    if (bannerSlides.length < 2) return undefined

    const rotation = window.setInterval(() => {
      if (
        document.visibilityState === 'visible' &&
        !showcasePointerStart.current &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        setActiveShowcaseIndex((index) => index >= bannerSlides.length + 1 ? 1 : index + 1)
      }
    }, 5000)

    return () => window.clearInterval(rotation)
  }, [bannerSlides.length])

  useEffect(() => {
    if (bannerSlides.length < 2) {
      setActiveShowcaseIndex(0)
      return
    }
    if (activeShowcaseIndex < 1 || activeShowcaseIndex > bannerSlides.length + 1) {
      setShowcaseTransitionEnabled(false)
      setActiveShowcaseIndex(1)
      window.requestAnimationFrame(() => setShowcaseTransitionEnabled(true))
    }
  }, [activeShowcaseIndex, bannerSlides.length])

  const handleShowcaseTransitionEnd = (event: ReactTransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return
    if (bannerSlides.length < 2) return
    const clonePosition = activeShowcaseIndex === 0
      ? bannerSlides.length
      : activeShowcaseIndex === bannerSlides.length + 1 ? 1 : null
    if (clonePosition === null) return

    setShowcaseTransitionEnabled(false)
    setActiveShowcaseIndex(clonePosition)
    window.requestAnimationFrame(() => setShowcaseTransitionEnabled(true))
  }

  const handleShowcasePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
    showcasePointerStart.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
    setShowcaseTransitionEnabled(false)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleShowcasePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = showcasePointerStart.current
    if (!start || start.pointerId !== event.pointerId || bannerSlides.length < 2) return

    const horizontalDistance = event.clientX - start.x
    const verticalDistance = event.clientY - start.y
    if (Math.abs(verticalDistance) > Math.abs(horizontalDistance) && Math.abs(verticalDistance) > 12) {
      showcasePointerStart.current = null
      setShowcaseDragOffset(0)
      setShowcaseTransitionEnabled(true)
      return
    }
    setShowcaseDragOffset(horizontalDistance)
  }

  const handleShowcasePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = showcasePointerStart.current
    if (!start || start.pointerId !== event.pointerId) return
    showcasePointerStart.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const horizontalDistance = event.clientX - start.x
    const verticalDistance = event.clientY - start.y
    const didDrag = Math.abs(horizontalDistance) >= 45 && Math.abs(horizontalDistance) > Math.abs(verticalDistance)
    if (didDrag && bannerSlides.length > 1) {
      suppressShowcaseClick.current = true
      window.setTimeout(() => {
        suppressShowcaseClick.current = false
      }, 0)
      setActiveShowcaseIndex((index) => {
        if (horizontalDistance < 0) return index >= bannerSlides.length ? 0 : index + 1
        return index <= 1 ? 0 : index - 1
      })
    }
    setShowcaseDragOffset(0)
    setShowcaseTransitionEnabled(true)
  }

  const handleShowcasePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (showcasePointerStart.current?.pointerId !== event.pointerId) return
    showcasePointerStart.current = null
    setShowcaseDragOffset(0)
    setShowcaseTransitionEnabled(true)
  }

  const handleShowcaseKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (bannerSlides.length < 2) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setActiveShowcaseIndex((index) => index <= 1 ? 0 : index - 1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setActiveShowcaseIndex((index) => index >= bannerSlides.length ? 0 : index + 1)
    }
  }

  useEffect(() => {
    if (!isCategoryMenuOpen) return undefined

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !categoryMenuRef.current?.contains(event.target)) {
        setIsCategoryMenuOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCategoryMenuOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isCategoryMenuOpen])

  const addToCart = (product: Product, size: string, color: string) => {
    setCartItems((currentItems) => {
      const match = currentItems.find(
        (item) => item.product.id === product.id && item.size === size && item.color === color
      )
      if (match) {
        return currentItems.map((item) =>
          item === match ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...currentItems, { product, size, color, quantity: 1 }]
    })
    setStatus(`${product.name} (${size}, ${color}) adicionada à sacola.`)
  }

  const updateQuantity = (productId: number, size: string, color: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId, size, color)
      return
    }
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.product.id === productId && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      )
    )
  }

  const removeFromCart = (productId: number, size: string, color: string) => {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => !(item.product.id === productId && item.size === size && item.color === color)
      )
    )
  }

  return (
    <>
      <AnnouncementBar>
        <span>✨ Frete grátis para Belém e Ananindeua nas compras acima de R$ 300!</span>
      </AnnouncementBar>
      <BoutiqueHeader
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />
      <Main>
        <Hero id="inicio">
          <HeroContent>
            <HeroShowcase aria-label="Mostruário de produtos em destaque">
              {showcaseSlides.length > 0 && (
                <ShowcaseViewport
                  aria-roledescription="carrossel"
                  aria-label="Mostruário de produtos; arraste para os lados para navegar"
                  onPointerDown={handleShowcasePointerDown}
                  onPointerMove={handleShowcasePointerMove}
                  onPointerUp={handleShowcasePointerUp}
                  onPointerCancel={handleShowcasePointerCancel}
                  onKeyDown={handleShowcaseKeyDown}
                >
                  <ShowcaseTrack
                    $position={showcaseSlides.length > 1 ? activeShowcaseIndex : 0}
                    $dragOffset={showcaseDragOffset}
                    $transitionEnabled={showcaseTransitionEnabled}
                    onTransitionEnd={handleShowcaseTransitionEnd}
                  >
                    {showcaseSlides.map((slide, index) => (
                      <ShowcaseLink
                        key={`${slide.id}-${index}`}
                        href="#colecao"
                        aria-label={`Ver ${slide.title} na coleção`}
                        aria-roledescription="slide"
                        aria-hidden={index !== activeShowcaseIndex}
                        tabIndex={index === activeShowcaseIndex ? 0 : -1}
                        onDragStart={(event: ReactMouseEvent<HTMLAnchorElement>) => event.preventDefault()}
                        onClick={(event: ReactMouseEvent<HTMLAnchorElement>) => {
                          if (!suppressShowcaseClick.current) return
                          event.preventDefault()
                          event.stopPropagation()
                          suppressShowcaseClick.current = false
                        }}
                      >
                        <ShowcaseImage src={slide.image} alt={slide.title} draggable={false} />
                      </ShowcaseLink>
                    ))}
                  </ShowcaseTrack>
                </ShowcaseViewport>
              )}
            </HeroShowcase>
          </HeroContent>
        </Hero>

        <Catalog id="colecao">
          <CatalogHeader>
            <div>
              <span className="eyebrow">BELLA CHIC</span>
              <h2> Nossa <em>coleção</em></h2>
            </div>
            <CatalogTools>
              <label className="sr-only" htmlFor="product-search">Buscar produtos</label>
              <div className="catalog-tools-row">
                <SearchInput
                  id="product-search"
                  type="search"
                  placeholder="Buscar uma peça..."
                  value={search}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
                />
                <select
                  aria-label="Ordenar produtos"
                  className="sort-select"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="featured">✨ Destaques</option>
                  <option value="price-asc">💵 Menor Preço</option>
                  <option value="price-desc">💎 Maior Preço</option>
                  <option value="name">🔤 Nome (A-Z)</option>
                </select>
              </div>
            </CatalogTools>
          </CatalogHeader>
          <CategoryMenu ref={categoryMenuRef}>
            <CategoryMenuButton
              type="button"
              aria-haspopup="menu"
              aria-expanded={isCategoryMenuOpen}
              onClick={() => setIsCategoryMenuOpen((open) => !open)}
            >
              <span className="hamburger" aria-hidden="true"><i /><i /><i /></span>
              <span>Categorias</span>
              <span className="active-category">{activeCategory}</span>
            </CategoryMenuButton>
            {isCategoryMenuOpen && (
              <CategoryMenuPanel role="menu" aria-label="Filtrar por categoria">
                {availableCategories.map((category) => (
                  <CategoryMenuOption
                    key={category}
                    type="button"
                    role="menuitemradio"
                    aria-checked={activeCategory === category}
                    $active={activeCategory === category}
                    onClick={() => {
                      setActiveCategory(category)
                      setIsCategoryMenuOpen(false)
                    }}
                  >
                    {category}
                    {activeCategory === category && <span aria-hidden="true">✓</span>}
                  </CategoryMenuOption>
                ))}
              </CategoryMenuPanel>
            )}
          </CategoryMenu>
          {status && <StatusMessage role="status">{status}</StatusMessage>}
          {catalogLoading && <StatusMessage role="status">Carregando catálogo...</StatusMessage>}
          {catalogError && <StatusMessage role="alert">{catalogError}</StatusMessage>}
          {visibleProducts.length ? (
            <ProductGrid>
              {visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}
            </ProductGrid>
          ) : (
            <p className="no-products">Nenhuma peça encontrada. Experimente outra busca ou categoria.</p>
          )}
        </Catalog>

        <Contact id="contato">
          <ContactContent>
            <section className="about-store" id="sobre-nos" aria-labelledby="about-title">
              <div className="about-copy">
                <span className="eyebrow">BELLA CHIC BOUTIQUE</span>
                <h2 id="about-title">Moda acessível, <em>porque te amamos te vestir de auto estima.</em></h2>
                <p>Somos uma boutique para mulheres que gostam de se sentir confiantes e especiais. Encontre peças escolhidas com carinho e venha nos visitar em uma de nossas duas unidades.</p>
              </div>
              <StoreCarousel
                aria-label="Conheça nossas unidades"
                onMouseEnter={() => setIsStoreCarouselPaused(true)}
                onMouseLeave={() => setIsStoreCarouselPaused(false)}
                onFocus={() => setIsStoreCarouselPaused(true)}
                onBlur={(event: ReactFocusEvent<HTMLDivElement>) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsStoreCarouselPaused(false)
                }}
              >
                <StoreViewport
                  tabIndex={0}
                  onPointerDown={handleStorePointerDown}
                  onPointerMove={handleStorePointerMove}
                  onPointerUp={handleStorePointerUp}
                  onPointerCancel={handleStorePointerCancel}
                  aria-label="Carrossel de unidades"
                >
                  <StoreTrack
                    $position={activeStoreIndex}
                    $dragOffset={storeDragOffset}
                    $transitionEnabled={storeTransitionEnabled}
                    onTransitionEnd={handleStoreTransitionEnd}
                  >
                    {storeSlides.map((slide, index) => (
                      <StoreSlideItem key={`${slide.title}-${index}`}>
                        <StoreSlideImage src={slide.src} alt={`Interior da unidade ${slide.title}`} />
                      </StoreSlideItem>
                    ))}
                  </StoreTrack>
                </StoreViewport>
                <div className="store-caption"><strong>{activeStore.title}</strong><span>{activeStore.description}</span></div>
                <div className="store-controls">
                  <button type="button" aria-label="Unidade anterior" onClick={() => setActiveStoreIndex((index) => index <= 1 ? storeImages.length : index - 1)}>←</button>
                  <div className="store-dots" aria-label={`Imagem ${activeStoreSlideIndex + 1} de ${storeImages.length}`}>
                    {storeImages.map((image, index) => (
                      <button
                        key={image.title}
                        type="button"
                        aria-label={`Ver ${image.title}`}
                        aria-current={index === activeStoreSlideIndex}
                        onClick={() => setActiveStoreIndex(index + 1)}
                      />
                    ))}
                  </div>
                  <button type="button" aria-label="Próxima unidade" onClick={() => setActiveStoreIndex((index) => index >= storeImages.length + 1 ? 1 : index + 1)}>→</button>
                </div>
              </StoreCarousel>
            </section>
            <ContactHeader>
              <span className="eyebrow">BELLA CHIC BOUTIQUE</span>
              <h2><em>Fale com a gente</em></h2>
            </ContactHeader>
            <ContactUnits aria-label="Escolha uma unidade">
              {storeConfig.units.map((unit) => (
                <ContactUnitButton
                  key={unit.id}
                  type="button"
                  $active={activeUnit.id === unit.id}
                  aria-pressed={activeUnit.id === unit.id}
                  onClick={() => setActiveUnitId(unit.id)}
                >
                  {unit.name}
                </ContactUnitButton>
              ))}
            </ContactUnits>
            <ContactUnit>
              <div>
                <h3>{activeUnit.name}</h3>
                <p>{activeUnit.address}</p>
              </div>
              <div className="contact-actions">
                <ContactLink
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeUnit.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Como chegar ↗
                </ContactLink>
                {unitContacts.map((contact) => (
                  <ContactLink
                    key={contact.id}
                    $primary
                    href={createWhatsAppUrl(`Olá! Gostaria de falar com a Bella Chic Boutique - ${activeUnit.name}.`, contact.number)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Falar conosco ↗
                  </ContactLink>
                ))}
              </div>
            </ContactUnit>
            <div
              id="trocas-devolucoes"
              className={`payments exchange-policy ${selectedPaymentInfo === 'Link de pagamento' ? 'highlighted' : ''} ${isExchangePolicyOpen ? 'open' : 'closed'}`}
              aria-hidden={!isExchangePolicyOpen}
              tabIndex={-1}
              role="region"
              aria-label="Condições de troca e devolução"
            >
              <div className="exchange-policy-header">
                <span className="policy-badge">Política Oficial</span>
                <button
                  type="button"
                  className="policy-close-btn"
                  onClick={() => setIsExchangePolicyOpen(false)}
                  aria-label="Fechar política de trocas"
                >
                  ✕
                </button>
              </div>
              <h3>Condições de troca e devolução</h3>
              <ul>
                <li>Não trocamos peças promocionais, nem adquiridas em live shop.</li>
                <li>O prazo para solicitação de troca é de até 5 dias corridos após o recebimento.</li>
                <li>A taxa de entrega/frete da troca é por conta da cliente.</li>
              </ul>
              <span className="policy-note">Dúvidas? Fale com nossa equipe pelo WhatsApp.</span>
            </div>
            <div id="pagamentos" className="payments">
              <h3>Formas de pagamento</h3>
              <PaymentMethods>
                {[
                  {
                    name: 'Pix',
                    icon: 'pix',
                    subtitle: 'Instantâneo e prático'
                  },
                  {
                    name: 'Cartão de crédito',
                    icon: 'card',
                    subtitle: 'À vista ou parcelado'
                  },
                  {
                    name: 'Dinheiro',
                    icon: 'cash',
                    subtitle: 'Pagamento na retirada/entrega'
                  },
                  {
                    name: 'Link de pagamento',
                    icon: 'link',
                    subtitle: 'Pague online com segurança'
                  }
                ].map((method) => {
                  const isSelected = selectedPaymentInfo === method.name
                  return (
                    <PaymentCard
                      key={method.name}
                      type="button"
                      $active={isSelected}
                      onClick={() => {
                        setSelectedPaymentInfo((prev) => (prev === method.name ? null : method.name))
                        const policyElement = document.getElementById('trocas-devolucoes')
                        if (policyElement) {
                          policyElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                        }
                      }}
                      aria-pressed={isSelected}
                      title={`Clique para conferir as condições para ${method.name}`}
                    >
                      <span className={`payment-visual ${method.icon}`} aria-hidden="true">
                        {method.icon === 'pix' && (
                          <svg viewBox="0 0 48 48">
                            <path d="m24 3 8 8-8 8-8-8 8-8Zm0 26 8 8-8 8-8-8 8-8ZM3 24l8-8 8 8-8 8-8-8Zm26 0 8-8 8 8-8 8-8-8Z" />
                          </svg>
                        )}
                        {method.icon === 'card' && (
                          <svg viewBox="0 0 64 44">
                            <rect x="2" y="2" width="60" height="40" rx="6" />
                            <path className="card-stripe" d="M2 13h60v8H2z" />
                            <rect className="card-chip" x="10" y="27" width="11" height="8" rx="2" />
                            <path className="card-contactless" d="M29 29c3 2 3 5 0 7m4-9c5 3 5 8 0 11" />
                          </svg>
                        )}
                        {method.icon === 'cash' && (
                          <svg viewBox="0 0 48 48">
                            <rect x="4" y="12" width="35" height="25" rx="3" />
                            <path d="M9 18a5 5 0 0 0 0 13m25-13a5 5 0 0 1 0 13" />
                            <circle cx="22" cy="24.5" r="5" />
                            <path d="m12 8 29 1v22" />
                          </svg>
                        )}
                        {method.icon === 'link' && (
                          <svg viewBox="0 0 48 48">
                            <path d="M21 27a8 8 0 0 1 0-11l5-5a8 8 0 0 1 11 11l-3 3" />
                            <path d="M27 21a8 8 0 0 1 0 11l-5 5a8 8 0 0 1-11-11l3-3" />
                          </svg>
                        )}
                      </span>
                      <strong>{method.name}</strong>
                      <small>{method.subtitle}</small>
                    </PaymentCard>
                  )
                })}
              </PaymentMethods>
              <p>Consulte condições com a atendente pelo WhatsApp.</p>
            </div>
          </ContactContent>
        </Contact>
      </Main>
      <Footer>
        <FooterContent>
          <div className="footer-about">
            <FooterBrand>
              <img src={boutiqueLogo} alt="Bella Chic Boutique" />
            </FooterBrand>
            <FooterSocialLink
              href={storeConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram da Bella Chic Boutique"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <span>@bellachicboutique__</span>
            </FooterSocialLink>
          </div>
          <FooterNavigation aria-label="Links do rodapé">
            <strong>Explore</strong>
            <a href="#sobre-nos">Sobre nós</a>
            <a href="#inicio">Início</a>
            <a href="#colecao">Nossa coleção</a>
            <a href="#contato">Contato e pagamentos</a>
            <a
              href="#trocas-devolucoes"
              onClick={(e) => {
                e.preventDefault()
                setIsExchangePolicyOpen(true)
                setSelectedPaymentInfo((prev) => (prev ?? 'Link de pagamento'))

                const policyElement = document.getElementById('trocas-devolucoes')
                if (policyElement) {
                  policyElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
            >
              Trocas e devoluções
            </a>
            </FooterNavigation>
        </FooterContent>
        <FooterBottom>
          <span>© {new Date().getFullYear()} Bella Chic Boutique · Todos os direitos reservados.</span>
        </FooterBottom>
      </Footer>
      <CartDrawer
        isOpen={isCartOpen}
        items={cartItems}
        onClose={closeCart}
        onChangeQuantity={updateQuantity}
        onRemove={removeFromCart}
      />
      <FloatingWhatsApp
        href={createWhatsAppUrl("Olá! Gostaria de tirar dúvidas sobre as peças da Bella Chic Boutique.", storeConfig.whatsappContacts[0].number)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Fale conosco pelo WhatsApp"
      >
        💬 Fale no WhatsApp
      </FloatingWhatsApp>
    </>
  )
}

export default Home
