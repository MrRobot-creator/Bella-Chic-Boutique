import {
  ChangeEvent,
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
  FooterContact,
  FooterContactButton,
  FooterMessage,
  FooterNavigation,
  FooterSocialLink,
  Hero,
  HeroContent,
  HeroShowcase,
  HeroText,
  Main,
  PaymentCard,
  PaymentMethods,
  ProductGrid,
  ShowcaseImage,
  ShowcaseTrack,
  SearchInput,
  ShowcaseLink,
  ShowcaseViewport,
  StatusMessage
} from './styles'
import boutiqueLogo from '../../assets/bella-chic-logo.jpg'


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

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
    return catalogProducts.filter((product) => {
      const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory
      const matchesSearch =
        !normalizedSearch ||
        `${product.name} ${product.category} ${product.description}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, catalogProducts, search])

  const showcaseProducts = useMemo(
    () => catalogProducts.filter((product) => product.available !== false).slice(0, 5),
    [catalogProducts]
  )
  const showcaseSlides = useMemo(
    () => showcaseProducts.length > 1
      ? [showcaseProducts[showcaseProducts.length - 1], ...showcaseProducts, showcaseProducts[0]]
      : showcaseProducts,
    [showcaseProducts]
  )
  const activeUnit = storeConfig.units.find((unit) => unit.id === activeUnitId) || storeConfig.units[0]
  const unitContacts = storeConfig.whatsappContacts.filter((contact) => contact.unitId === activeUnit.id)

  useEffect(() => {
    if (showcaseProducts.length < 2) return undefined

    const rotation = window.setInterval(() => {
      if (
        document.visibilityState === 'visible' &&
        !showcasePointerStart.current &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        setActiveShowcaseIndex((index) => index >= showcaseProducts.length + 1 ? 1 : index + 1)
      }
    }, 5000)

    return () => window.clearInterval(rotation)
  }, [showcaseProducts.length])

  useEffect(() => {
    if (showcaseProducts.length < 2) {
      setActiveShowcaseIndex(0)
      return
    }
    if (activeShowcaseIndex < 1 || activeShowcaseIndex > showcaseProducts.length + 1) {
      setShowcaseTransitionEnabled(false)
      setActiveShowcaseIndex(1)
      window.requestAnimationFrame(() => setShowcaseTransitionEnabled(true))
    }
  }, [activeShowcaseIndex, showcaseProducts.length])

  const handleShowcaseTransitionEnd = (event: ReactTransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return
    if (showcaseProducts.length < 2) return
    const clonePosition = activeShowcaseIndex === 0
      ? showcaseProducts.length
      : activeShowcaseIndex === showcaseProducts.length + 1 ? 1 : null
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
    if (!start || start.pointerId !== event.pointerId || showcaseProducts.length < 2) return

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
    if (didDrag && showcaseProducts.length > 1) {
      suppressShowcaseClick.current = true
      window.setTimeout(() => {
        suppressShowcaseClick.current = false
      }, 0)
      setActiveShowcaseIndex((index) => {
        if (horizontalDistance < 0) return index >= showcaseProducts.length ? 0 : index + 1
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
    if (showcaseProducts.length < 2) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setActiveShowcaseIndex((index) => index <= 1 ? 0 : index - 1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setActiveShowcaseIndex((index) => index >= showcaseProducts.length ? 0 : index + 1)
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
      <BoutiqueHeader
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />
      <Main>
        <Hero id="inicio">
          <HeroContent>
            <HeroText>
              <span className="eyebrow">BELLA CHIC BOUTIQUE</span>
              <h1>Novidades <em>Bella Chic</em></h1>
              <a className="primary-link" href="#colecao">Ver coleção <span>→</span></a>
            </HeroText>
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
                    {showcaseSlides.map((product, index) => (
                      <ShowcaseLink
                        key={`${product.id}-${index}`}
                        href="#colecao"
                        aria-label={`Ver ${product.name} na coleção`}
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
                        <ShowcaseImage src={product.image} alt={product.name} draggable={false} />
                        <span className="showcase-label">DESTAQUE</span>
                        <span className="showcase-product">
                          <strong>{product.name}</strong>
                          <span>{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </span>
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
              <SearchInput
                id="product-search"
                type="search"
                placeholder="Buscar uma peça..."
                value={search}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
              />
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
            <ContactHeader>
              <span className="eyebrow">BELLA CHIC BOUTIQUE</span>
              <h2>Visite ou <em>fale com a gente</em></h2>
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
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="contact-icon">
                      <path d="M20.2 3.8A11.4 11.4 0 0 0 2.3 17.6L.8 23l5.5-1.4A11.4 11.4 0 0 0 20.2 3.8ZM12 20.6a9.4 9.4 0 0 1-4.8-1.3l-.4-.2-3.3.9.9-3.2-.2-.4A9.4 9.4 0 1 1 12 20.6Zm5.2-7c-.3-.2-1.7-.9-2-.9-.3-.1-.5-.2-.7.2l-.9 1.1c-.2.2-.3.3-.6.1a7.7 7.7 0 0 1-2.3-1.4 8.6 8.6 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.6l-.9-2.1c-.2-.5-.4-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.1 1.4 3.3c.2.2 2.3 3.5 5.5 4.8.8.3 1.4.5 1.9.6.8.2 1.5.2 2 .1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.1-1.4-.1-.1-.3-.2-.6-.3Z" />
                    </svg>
                    <span>WhatsApp · {contact.label} ↗</span>
                  </ContactLink>
                ))}
              </div>
            </ContactUnit>
            <div className="social-links">
              {storeConfig.instagramUrl && (
                <ContactLink href={storeConfig.instagramUrl} target="_blank" rel="noopener noreferrer">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="contact-icon instagram-icon">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle className="instagram-dot" cx="17.5" cy="6.8" r="1" />
                  </svg>
                  <span>Instagram Bella Chic ↗</span>
                </ContactLink>
              )}
            </div>
            <div id="pagamentos" className="payments">
              <h3>Formas de pagamento</h3>
              <PaymentMethods>
                {[
                  { name: 'Pix', icon: 'pix' },
                  { name: 'Cartão de crédito', icon: 'card' },
                  { name: 'Dinheiro', icon: 'cash' }
                ].map((method) => (
                  <PaymentCard
                    key={method.name}
                    href={createWhatsAppUrl(`Olá! Gostaria de saber sobre pagamento em ${method.name}.`, unitContacts[0].number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Consultar pagamento em ${method.name} pelo WhatsApp`}
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
                    </span>
                    <strong>{method.name}</strong>
                    <span className="payment-action">Consultar pelo WhatsApp ↗</span>
                  </PaymentCard>
                ))}
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
            <FooterMessage>Moda com afeto, do nosso jeito.</FooterMessage>
            <FooterSocialLink href={storeConfig.instagramUrl} target="_blank" rel="noopener noreferrer">
              Instagram <span aria-hidden="true">↗</span>
            </FooterSocialLink>
          </div>
          <FooterNavigation aria-label="Links do rodapé">
            <strong>Explore</strong>
            <a href="#inicio">Início</a>
            <a href="#colecao">Nossa coleção</a>
            <a href="#contato">Contato e pagamentos</a>
          </FooterNavigation>
          <FooterContact>
            <strong>Fale com a gente</strong>
            <p>Estamos em Belém e Ananindeua para ajudar você a escolher sua próxima peça.</p>
            <FooterContactButton
              href={createWhatsAppUrl(
                'Olá! Gostaria de falar com a Bella Chic Boutique.',
                storeConfig.whatsappContacts[0].number
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M20.2 3.8A11.4 11.4 0 0 0 2.3 17.6L.8 23l5.5-1.4A11.4 11.4 0 0 0 20.2 3.8ZM12 20.6a9.4 9.4 0 0 1-4.8-1.3l-.4-.2-3.3.9.9-3.2-.2-.4A9.4 9.4 0 1 1 12 20.6Z" />
              </svg>
              Chamar no WhatsApp <span aria-hidden="true">↗</span>
            </FooterContactButton>
          </FooterContact>
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
    </>
  )
}

export default Home
