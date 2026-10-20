import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
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
  CategoryList,
  CategoryPill,
  Contact,
  ContactContent,
  ContactHeader,
  ContactLink,
  ContactUnit,
  ContactUnitButton,
  ContactUnits,
  Footer,
  FooterBrand,
  Hero,
  HeroContent,
  HeroShowcase,
  HeroText,
  Main,
  PaymentCard,
  PaymentMethods,
  ProductGrid,
  ShowcaseControls,
  ShowcaseImage,
  ShowcaseThumbnails,
  SearchInput,
  ShowcaseLink,
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
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0)
  const [activeUnitId, setActiveUnitId] = useState(storeConfig.units[0].id)
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
  const activeShowcaseProduct = showcaseProducts[activeShowcaseIndex % showcaseProducts.length]
  const activeUnit = storeConfig.units.find((unit) => unit.id === activeUnitId) || storeConfig.units[0]
  const unitContacts = storeConfig.whatsappContacts.filter((contact) => contact.unitId === activeUnit.id)

  useEffect(() => {
    if (activeShowcaseIndex >= showcaseProducts.length) setActiveShowcaseIndex(0)
  }, [activeShowcaseIndex, showcaseProducts.length])

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
              <a className="primary-link" href="#colecao">Comprar agora <span>→</span></a>
            </HeroText>
            <HeroShowcase aria-label="Mostruário de produtos em destaque">
              {activeShowcaseProduct && (
                <>
                  <ShowcaseLink href="#colecao" aria-label={`Ver ${activeShowcaseProduct.name} na coleção`}>
                    <ShowcaseImage src={activeShowcaseProduct.image} alt={activeShowcaseProduct.name} />
                    <span className="showcase-label">DESTAQUE</span>
                    <span className="showcase-product">
                      <strong>{activeShowcaseProduct.name}</strong>
                      <span>{activeShowcaseProduct.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </span>
                  </ShowcaseLink>
                  {showcaseProducts.length > 1 && (
                    <ShowcaseControls>
                      <button
                        type="button"
                        aria-label="Produto anterior"
                        onClick={() => setActiveShowcaseIndex((index) => (index - 1 + showcaseProducts.length) % showcaseProducts.length)}
                      >
                        ←
                      </button>
                      <ShowcaseThumbnails aria-label="Escolher produto em destaque">
                        {showcaseProducts.map((product, index) => (
                          <button
                            key={product.id}
                            type="button"
                            className={index === activeShowcaseIndex ? 'active' : ''}
                            aria-label={`Mostrar ${product.name}`}
                            aria-pressed={index === activeShowcaseIndex}
                            onClick={() => setActiveShowcaseIndex(index)}
                          >
                            <img src={product.image} alt="" />
                          </button>
                        ))}
                      </ShowcaseThumbnails>
                      <button
                        type="button"
                        aria-label="Próximo produto"
                        onClick={() => setActiveShowcaseIndex((index) => (index + 1) % showcaseProducts.length)}
                      >
                        →
                      </button>
                    </ShowcaseControls>
                  )}
                </>
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
          <CategoryList aria-label="Filtrar por categoria">
            {availableCategories.map((category) => (
              <CategoryPill
                key={category}
                type="button"
                $active={activeCategory === category}
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </CategoryPill>
            ))}
          </CategoryList>
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
                    WhatsApp · {contact.label} ↗
                  </ContactLink>
                ))}
              </div>
            </ContactUnit>
            <div className="social-links">
              {storeConfig.instagramUrl && (
                <ContactLink href={storeConfig.instagramUrl} target="_blank" rel="noopener noreferrer">
                  Instagram Bella Chic ↗
                </ContactLink>
              )}
            </div>
            <div id="pagamentos" className="payments">
              <h3>Formas de pagamento</h3>
              <PaymentMethods>
                {[
                  { name: 'Pix', icon: '◇' },
                  { name: 'Cartão de crédito', icon: '▤' },
                  { name: 'Dinheiro', icon: 'R$' }
                ].map((method) => (
                  <PaymentCard
                    key={method.name}
                    href={createWhatsAppUrl(`Olá! Gostaria de saber sobre pagamento em ${method.name}.`, unitContacts[0].number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Consultar pagamento em ${method.name} pelo WhatsApp`}
                  >
                    <span aria-hidden="true">{method.icon}</span>
                    <strong>{method.name}</strong>
                  </PaymentCard>
                ))}
              </PaymentMethods>
              <p>Consulte condições com a atendente pelo WhatsApp.</p>
            </div>
          </ContactContent>
        </Contact>
      </Main>
      <Footer>
        <FooterBrand>
          <img src={boutiqueLogo} alt="" />
        </FooterBrand>
        <small>© {new Date().getFullYear()} Bella Chic Boutique · Todos os direitos reservados.</small>
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
