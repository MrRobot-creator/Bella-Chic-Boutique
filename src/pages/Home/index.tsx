import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import BoutiqueHeader from '../../components/BoutiqueHeader'
import CartDrawer from '../../components/CartDrawer'
import ProductCard from '../../components/ProductCard'
import { products as demoProducts } from '../../data/products'
import { storeConfig } from '../../config/store'
import { fetchCatalogProducts } from '../../services/catalog'
import { createWhatsAppUrl } from '../../services/whatsapp'
import { CartItem, Product } from '../../types/store'
import {
  About,
  AboutImage,
  AboutText,
  Benefits,
  Benefit,
  Catalog,
  CatalogHeader,
  CatalogTools,
  CategoryList,
  CategoryPill,
  Footer,
  FooterBrand,
  Hero,
  HeroContent,
  HeroImage,
  HeroNote,
  HeroText,
  Main,
  ProductGrid,
  SearchInput,
  StatusMessage
} from './styles'
import banner from '../../assets/thalita-banner.jpeg'


const Home = () => {
  const [catalogProducts, setCatalogProducts] = useState(demoProducts)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

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
              <span className="eyebrow">MODA FEMININA · FEITA PARA VOCÊ</span>
              <h1>Vista-se de <em>momentos</em> especiais.</h1>
              <p>Moda Acessivel, por que nós amamos te vestir de AUTO ESTIMA </p>
              <a className="primary-link" href="#colecao">Descobrir coleção <span>→</span></a>
              <HeroNote>♡ &nbsp; Seu estilo, seu encanto, sua Bella Chic.</HeroNote>
            </HeroText>
            <HeroImage>
              <img
                src={banner}
                alt="Amigas aproveitando um dia de compras e celebrando a moda"
              />
              <div className="image-caption"><span>COLEÇÃO</span><strong>Black Friday</strong></div>
              <span className="decorative-seal">BC<br /><small>♡</small></span>
            </HeroImage>
          </HeroContent>
        </Hero>

        <Benefits aria-label="Vantagens da loja">
          <Benefit><span>✧</span><div><strong>Escolha com carinho</strong><small>Curadoria para todos os dias</small></div></Benefit>
          <Benefit><span>♡</span><div><strong>Atendimento próximo</strong><small>Pedido confirmado com uma pessoa</small></div></Benefit>
          <Benefit><span>◈</span><div><strong>Pagamento facilitado</strong><small>Pix, cartão ou dinheiro</small></div></Benefit>
        </Benefits>

        <Catalog id="colecao">
          <CatalogHeader>
            <div>
              <span className="eyebrow">ENCONTRE O SEU PRÓXIMO FAVORITO</span>
              <h2>Feito para <em>encantar</em></h2>
              <p>Peças lindas, confortáveis e escolhidas pensando em você.</p>
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

        <About id="sobre">
          <AboutImage>
            <img src="https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1000&q=85" alt="Detalhe de um look feminino delicado" loading="lazy" />
          </AboutImage>
          <AboutText>
            <span className="eyebrow">UM POUQUINHO SOBRE NÓS</span>
            <h2>Moda com afeto,<br /><em>do nosso jeito.</em></h2>
            <p>A Bella Chic Boutique acredita que se sentir bem começa nas pequenas escolhas. Cada peça da nossa coleção é selecionada com cuidado para acompanhar você em todos os momentos.</p>
            <a href={createWhatsAppUrl('Olá! Quero conhecer a coleção da Bella Chic Boutique.', storeConfig.whatsappContacts[0].number)} target="_blank" rel="noreferrer">
              Converse com a gente <span>↗</span>
            </a>
          </AboutText>
        </About>
      </Main>
      <Footer>
        <FooterBrand>
          <span className="monogram">Ｂ</span>
          <span><strong>BELLA CHIC</strong><small>B O U T I Q U E</small></span>
        </FooterBrand>
        <p>Escolhida com carinho, feita para você.</p>
        <div className="social-links">
          {storeConfig.instagramUrl && <a href={storeConfig.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Visite nosso Instagram">Instagram ↗</a>}
          <a href={createWhatsAppUrl('Olá! Vim pelo site da Bella Chic Boutique.', storeConfig.whatsappContacts[0].number)} target="_blank" rel="noopener noreferrer" aria-label="Fale com a Bella Chic pelo WhatsApp">WhatsApp ↗</a>
        </div>
        <small>© {new Date().getFullYear()} Bella Chic Boutique · Feito com carinho.</small>
      </Footer>
      <CartDrawer
        isOpen={isCartOpen}
        items={cartItems}
        onClose={() => setIsCartOpen(false)}
        onChangeQuantity={updateQuantity}
        onRemove={removeFromCart}
      />
    </>
  )
}

export default Home
