import { FocusEvent as ReactFocusEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SiteHeader from '../../components/SiteHeader'
import SideMenu from '../../components/SideMenu'
import AccountModal from '../../components/AccountModal'
import CartDrawer from '../../components/CartDrawer'
import ProductCard, { formatPrice, getDiscount, getProductImages } from '../../components/ProductCard'
import ProductDialog from '../../components/ProductDialog'
import Toast from '../../components/Toast'
import VipSignup from '../../components/VipSignup'
import { SkeletonCard } from '../../components/ProductCard/styles'
import { Wrap } from '../../components/ui'
import { useFavorites } from '../../hooks/useFavorites'
import { useCustomer } from '../../hooks/useCustomer'
import { trackEvent } from '../../services/analytics'
import { fetchCatalogProducts } from '../../services/catalog'
import { defaultSettings, fetchStoreSettings, StoreSettings } from '../../services/settings'
import type { StoreOrderItem } from '../../services/orders'
import { createWhatsAppUrl } from '../../services/whatsapp'
import { storeConfig } from '../../config/store'
import { cardFeeRates } from '../../config/paymentFees'
import { CartItem, Product } from '../../types/store'
import { getVariantStock } from '../../utils/inventory'
import { getProductIdFromPath, getProductPath } from '../../utils/productLink'
import * as S from './styles'
import boutiqueLogo from '../../assets/bella-chic-logo.jpg'
import banner1Image from '../../assets/banner 1.jpeg'
import lojaGaleriaImage from '../../assets/loja galeria.jpeg'
import lojaCnImage from '../../assets/loja cn.jpeg'

const PAGE_SIZE = 12
const COUPON_CODE = 'BELLA10'
const isCombo = (product: Pick<Product, 'category'>) => /combo/i.test(product.category)
const unitImages: Record<string, string> = { 'galeria-portuense': lojaGaleriaImage, 'cidade-nova-4': lojaCnImage }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isPersistedCartItems = (value: unknown): value is CartItem[] =>
  Array.isArray(value) && value.every((entry) => {
    if (!isRecord(entry) || !isRecord(entry.product)) return false
    const product = entry.product
    return (
      typeof product.id === 'number' &&
      typeof product.name === 'string' &&
      typeof product.category === 'string' &&
      typeof product.description === 'string' &&
      typeof product.price === 'number' &&
      typeof product.image === 'string' &&
      (product.sizeFit === undefined || typeof product.sizeFit === 'string') &&
      Array.isArray(product.sizes) &&
      product.sizes.every((size) => typeof size === 'string') &&
      Array.isArray(product.colors) &&
      product.colors.every((color) =>
        isRecord(color) && typeof color.name === 'string' && typeof color.hex === 'string'
      ) &&
      typeof entry.size === 'string' &&
      typeof entry.color === 'string' &&
      typeof entry.quantity === 'number' &&
      Number.isInteger(entry.quantity) &&
      entry.quantity > 0
    )
  })

/** "2026-11-30" → "30 de novembro". Datas inválidas ou vencidas não aparecem. */
const formatPromotionEnd = (value: string) => {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return ''
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59)
  if (Number.isNaN(date.getTime()) || date.getTime() < Date.now()) return ''
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
}

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)

const Home = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { favorites, isFavorite, toggleFavorite } = useFavorites()
  const { customer, recoveringPassword, finishPasswordRecovery } = useCustomer()

  const [catalogProducts, setCatalogProducts] = useState<Product[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartStorageReady, setIsCartStorageReady] = useState(false)
  const [cartStorageError, setCartStorageError] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [search, setSearch] = useState('')
  const [activeSize, setActiveSize] = useState('')
  const [activeColor, setActiveColor] = useState('')
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState('featured')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selectedPaymentInfo, setSelectedPaymentInfo] = useState<string | null>(null)
  const [heroIndex, setHeroIndex] = useState(0)
  const [heroPaused, setHeroPaused] = useState(false)
  const [couponCopied, setCouponCopied] = useState(false)
  const [toast, setToast] = useState('')
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const toastTimer = useRef<number>()
  const cartTriggerRef = useRef<HTMLElement | null>(null)
  const pushedProductRef = useRef(false)
  const heroPointer = useRef<{ x: number; y: number } | null>(null)
  const heroSwiped = useRef(false)

  const notify = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(''), 3800)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  /* ---------- Catálogo ---------- */

  useEffect(() => {
    let active = true
    fetchCatalogProducts()
      .then((loadedProducts) => { if (active) setCatalogProducts(loadedProducts) })
      .catch((error: Error) => { if (active) setCatalogError(`Não foi possível carregar o catálogo: ${error.message}`) })
      .finally(() => { if (active) setCatalogLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    fetchStoreSettings().then((loaded) => { if (active) setSettings(loaded) })
    return () => { active = false }
  }, [])

  /* ---------- Sacola salva no navegador ---------- */

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('bella-chic-cart')
      if (savedCart) {
        const parsedCart: unknown = JSON.parse(savedCart)
        if (!isPersistedCartItems(parsedCart)) throw new Error('Os dados salvos não têm o formato esperado.')
        setCartItems(parsedCart)
      }
    } catch {
      setCartStorageError('Não foi possível restaurar a sacola salva. Ela foi iniciada vazia.')
    } finally {
      setIsCartStorageReady(true)
    }
  }, [])

  // Confere a sacola com o estoque atual sempre que o catálogo chega ou muda.
  useEffect(() => {
    if (!isCartStorageReady || catalogLoading || catalogError) return
    let adjusted = false
    const reconciledItems = cartItems.flatMap((item) => {
      const currentProduct = catalogProducts.find((product) => product.id === item.product.id)
      const availableStock = currentProduct && currentProduct.available !== false
        ? getVariantStock(currentProduct.variantStock, item.size, item.color)
        : 0
      if (!currentProduct || currentProduct.available === false || availableStock < 1) {
        adjusted = true
        return []
      }
      const quantity = Math.min(item.quantity, availableStock)
      if (quantity !== item.quantity || JSON.stringify(item.product) !== JSON.stringify(currentProduct)) adjusted = true
      return [{ ...item, product: currentProduct, quantity }]
    })
    if (adjusted) {
      setCartItems(reconciledItems)
      if (reconciledItems.length !== cartItems.length || reconciledItems.some((item, index) => item.quantity !== cartItems[index]?.quantity)) {
        notify('A sacola foi ajustada conforme o estoque atual. Confira as quantidades antes de enviar o pedido.')
      }
    }
  }, [cartItems, catalogError, catalogLoading, catalogProducts, isCartStorageReady, notify])

  useEffect(() => {
    if (!isCartStorageReady) return
    try {
      localStorage.setItem('bella-chic-cart', JSON.stringify(cartItems))
    } catch {
      setCartStorageError('Não foi possível salvar sua sacola neste navegador. Mantenha esta página aberta para não perder os itens.')
    }
  }, [cartItems, isCartStorageReady])

  /* ---------- Dados derivados ---------- */

  const offers = useMemo(() => catalogProducts.filter((product) => getDiscount(product) > 0), [catalogProducts])
  const combos = useMemo(() => catalogProducts.filter(isCombo), [catalogProducts])
  const favoriteProducts = useMemo(() => catalogProducts.filter((product) => favorites.includes(product.id)), [catalogProducts, favorites])

  const categories = useMemo(() => {
    const names = Array.from(new Set(catalogProducts.map((product) => product.category)))
    return names.map((name) => {
      const items = catalogProducts.filter((product) => product.category === name)
      const cover = items.find((product) => product.available !== false) || items[0]
      return { name, count: items.length, image: cover?.image || '' }
    })
  }, [catalogProducts])

  const launches = useMemo(() => [...catalogProducts]
    .filter((product) => !isCombo(product))
    .sort((first, second) => Number(second.available !== false) - Number(first.available !== false) || second.id - first.id)
    // 8 ou 4: fileiras completas no computador (4 por linha) e no celular (2 por linha).
    .filter((_product, index, list) => index < (list.length >= 8 ? 8 : 4)), [catalogProducts])

  // Peça do banner: a que tem mais cores à venda (empate: a mais nova).
  const featuredProduct = useMemo(() => catalogProducts
    .filter((product) => product.available !== false && !isCombo(product))
    .sort((first, second) => second.colors.length - first.colors.length || second.id - first.id)[0], [catalogProducts])

  const featuredOffer = useMemo(() => [...offers]
    .filter((product) => product.available !== false)
    .sort((first, second) => getDiscount(second) - getDiscount(first))[0], [offers])

  const availableSizes = useMemo(
    () => Array.from(new Set(catalogProducts.flatMap((product) => product.sizes))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [catalogProducts]
  )
  const availableColors = useMemo(
    () => Array.from(new Set(catalogProducts.flatMap((product) => product.colors.map((color) => color.name)))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [catalogProducts]
  )
  const priceLimit = useMemo(
    () => Math.max(50, Math.ceil(Math.max(...catalogProducts.map((product) => product.price), 0) / 50) * 50),
    [catalogProducts]
  )

  const matchesSearch = useCallback((product: Product, term: string) => {
    const normalized = term.trim().toLocaleLowerCase('pt-BR')
    return !normalized || `${product.name} ${product.category} ${product.description}`.toLocaleLowerCase('pt-BR').includes(normalized)
  }, [])

  const visibleProducts = useMemo(() => {
    const filtered = catalogProducts.filter((product) => {
      const matchesCategory = activeCategory === 'Todos'
        || (activeCategory === 'Ofertas' && getDiscount(product) > 0)
        || (activeCategory === 'Favoritos' && favorites.includes(product.id))
        || product.category === activeCategory
      return matchesCategory
        && matchesSearch(product, search)
        && (!activeSize || product.sizes.includes(activeSize))
        && (!activeColor || product.colors.some((color) => color.name === activeColor))
        && (maxPrice === null || product.price <= maxPrice)
    })
    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'pt-BR')
      // Destaques: peças à venda antes das esgotadas.
      return Number(b.available !== false) - Number(a.available !== false)
    })
  }, [activeCategory, activeColor, activeSize, catalogProducts, favorites, matchesSearch, maxPrice, search, sortBy])

  const searchResults = useMemo(
    () => (search.trim() ? catalogProducts.filter((product) => matchesSearch(product, search)).slice(0, 6) : []),
    [catalogProducts, matchesSearch, search]
  )
  const activeFilterCount = Number(Boolean(activeSize)) + Number(Boolean(activeColor)) + Number(maxPrice !== null)
  const hasAnyFilter = Boolean(activeSize || activeColor || maxPrice !== null || search || activeCategory !== 'Todos' || sortBy !== 'featured')

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [activeCategory, activeColor, activeSize, maxPrice, search, sortBy])

  const recommendationsByProduct = useMemo(() => {
    const recommendations = new Map<number, Product[]>()
    catalogProducts.forEach((product) => {
      const ranked = catalogProducts
        .filter((candidate) => candidate.id !== product.id && candidate.available !== false)
        .map((candidate) => {
          const sharesColor = candidate.colors.some((candidateColor) => product.colors.some((color) => color.name === candidateColor.name))
          const sameCategory = candidate.category === product.category
          const isAccessoryPairing = candidate.category === 'Acessórios' && product.category !== 'Acessórios'
          return { candidate, score: (sameCategory ? 3 : 0) + (isAccessoryPairing ? 2 : 0) + (sharesColor ? 1 : 0) }
        })
        .sort((first, second) => second.score - first.score)
        .slice(0, 3)
        .map(({ candidate }) => candidate)
      recommendations.set(product.id, ranked)
    })
    return recommendations
  }, [catalogProducts])

  /* ---------- Janela da peça, ligada ao endereço /produto/... ---------- */

  const routeProductId = getProductIdFromPath(location.pathname)
  const dialogProduct = routeProductId === null ? null : catalogProducts.find((product) => product.id === routeProductId) || null

  useEffect(() => {
    if (catalogLoading || catalogError || routeProductId === null) return
    if (!catalogProducts.some((product) => product.id === routeProductId)) {
      notify('Essa peça não está mais disponível no site. Veja as outras novidades da coleção!')
      navigate('/', { replace: true })
    }
  }, [catalogError, catalogLoading, catalogProducts, navigate, notify, routeProductId])

  const openProduct = useCallback((product: Product) => {
    const path = getProductPath(product)
    if (getProductIdFromPath(window.location.pathname) !== null) {
      navigate(path, { replace: true })
      return
    }
    pushedProductRef.current = true
    navigate(path)
  }, [navigate])

  const closeProduct = useCallback(() => {
    if (pushedProductRef.current) {
      pushedProductRef.current = false
      navigate(-1)
    } else {
      navigate('/', { replace: true })
    }
  }, [navigate])

  /* ---------- Sacola ---------- */

  const openCart = () => {
    cartTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setIsCartOpen(true)
  }
  const closeCart = useCallback(() => {
    setIsCartOpen(false)
    window.requestAnimationFrame(() => cartTriggerRef.current?.focus())
  }, [])

  const addToCart = (product: Product, size: string, color: string, quantity: number): boolean => {
    setCartStorageError('')
    const currentProduct = catalogProducts.find((item) => item.id === product.id) || product
    const existingQuantity = cartItems.find(
      (item) => item.product.id === product.id && item.size === size && item.color === color
    )?.quantity || 0
    const availableStock = currentProduct.available === false ? 0 : getVariantStock(currentProduct.variantStock, size, color)
    if (existingQuantity + quantity > availableStock) {
      notify(`Há somente ${Math.max(0, availableStock - existingQuantity)} unidade(s) disponível(is) de ${product.name} (${size}, ${color}).`)
      return false
    }
    setCartItems((currentItems) => {
      const match = currentItems.find((item) => item.product.id === product.id && item.size === size && item.color === color)
      if (match) return currentItems.map((item) => (item === match ? { ...item, quantity: item.quantity + quantity } : item))
      return [...currentItems, { product, size, color, quantity }]
    })
    notify(`${quantity === 1 ? 'Peça adicionada' : `${quantity} peças adicionadas`} à sacola: ${product.name} (${size}, ${color})`)
    trackEvent('add_to_cart', {
      currency: 'BRL',
      value: product.price * quantity,
      items: [{ item_id: String(product.id), item_name: product.name, item_category: product.category, item_variant: `${size} / ${color}`, price: product.price, quantity }]
    })
    return true
  }

  const removeFromCart = (productId: number, size: string, color: string) => {
    setCartStorageError('')
    setCartItems((currentItems) => currentItems.filter(
      (item) => !(item.product.id === productId && item.size === size && item.color === color)
    ))
  }

  const updateQuantity = (productId: number, size: string, color: string, quantity: number) => {
    setCartStorageError('')
    if (quantity < 1) {
      removeFromCart(productId, size, color)
      return
    }
    const currentProduct = catalogProducts.find((product) => product.id === productId)
    const availableStock = currentProduct && currentProduct.available !== false
      ? getVariantStock(currentProduct.variantStock, size, color)
      : 0
    if (quantity > availableStock) {
      notify(`Há somente ${availableStock} unidade(s) disponível(is) desta variação.`)
      return
    }
    setCartItems((currentItems) => currentItems.map((item) =>
      (item.product.id === productId && item.size === size && item.color === color ? { ...item, quantity } : item)
    ))
  }

  /** "Comprar de novo" em Meus pedidos: devolve à sacola o que ainda tem estoque. */
  const reorder = (orderItems: StoreOrderItem[]) => {
    let added = 0
    let next = [...cartItems]
    orderItems.forEach((item) => {
      const product = catalogProducts.find((candidate) => candidate.id === item.productId)
      if (!product || product.available === false) return
      const existing = next.find((entry) => entry.product.id === product.id && entry.size === item.size && entry.color === item.color)
      const room = getVariantStock(product.variantStock, item.size, item.color) - (existing?.quantity || 0)
      const quantity = Math.min(item.quantity, room)
      if (quantity < 1) return
      added += quantity
      next = existing
        ? next.map((entry) => (entry === existing ? { ...entry, quantity: entry.quantity + quantity } : entry))
        : [...next, { product, size: item.size, color: item.color, quantity }]
    })
    if (!added) {
      notify('As peças deste pedido não estão disponíveis agora.')
      return
    }
    setCartItems(next)
    setIsAccountOpen(false)
    notify(added === 1 ? '1 peça voltou para a sacola' : `${added} peças voltaram para a sacola`)
    window.setTimeout(() => setIsCartOpen(true), 200)
  }

  /* ---------- Favoritos, conta e navegação ---------- */

  const handleToggleFavorite = useCallback((product: Product) => {
    const added = toggleFavorite(product.id)
    notify(added ? `${product.name} salva nos favoritos ♡` : 'Peça removida dos favoritos')
  }, [notify, toggleFavorite])

  const closeAccount = useCallback(() => setIsAccountOpen(false), [])
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])

  useEffect(() => {
    if (recoveringPassword && storeConfig.customerAccounts) setIsAccountOpen(true)
  }, [recoveringPassword])

  const pickCategory = (category: string) => {
    setActiveCategory(category)
    window.requestAnimationFrame(() => scrollToSection('catalogo'))
  }

  const clearFilters = () => {
    setActiveCategory('Todos')
    setActiveSize('')
    setActiveColor('')
    setMaxPrice(null)
    setSearch('')
    setSortBy('featured')
  }

  const copyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE)
      setCouponCopied(true)
      notify(`Cupom ${COUPON_CODE} copiado. Use na sacola, em compras acima de R$ 300,00.`)
      window.setTimeout(() => setCouponCopied(false), 2500)
    } catch {
      notify(`Use o cupom ${COUPON_CODE} na sacola, em compras acima de R$ 300,00.`)
    }
  }

  /* ---------- Banner ---------- */

  const heroSlides = useMemo(
    () => ['banner', ...(featuredProduct ? ['product'] : []), 'stores'] as Array<'banner' | 'product' | 'stores'>,
    [featuredProduct]
  )
  const heroCount = heroSlides.length
  const currentHero = Math.min(heroIndex, heroCount - 1)
  const showHero = (index: number) => setHeroIndex((index + heroCount) % heroCount)

  useEffect(() => {
    if (heroPaused || heroCount < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const rotation = window.setInterval(() => {
      if (document.visibilityState === 'visible') setHeroIndex((index) => (index + 1) % heroCount)
    }, 6500)
    return () => window.clearInterval(rotation)
  }, [heroCount, heroPaused])

  const handleHeroPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!event.isPrimary) return
    heroPointer.current = { x: event.clientX, y: event.clientY }
    heroSwiped.current = false
  }
  const handleHeroPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const start = heroPointer.current
    heroPointer.current = null
    if (!start) return
    const dx = event.clientX - start.x
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(event.clientY - start.y)) {
      heroSwiped.current = true
      showHero(currentHero + (dx < 0 ? 1 : -1))
    }
  }
  const blockClickAfterSwipe = (event: { preventDefault: () => void }) => {
    if (heroSwiped.current) {
      event.preventDefault()
      heroSwiped.current = false
    }
  }

  const featuredWords = featuredProduct?.name.trim().split(/\s+/) || []
  const featuredSummary = featuredProduct ? [
    featuredProduct.colors.length > 1 ? `Em ${featuredProduct.colors.length} cores` : featuredProduct.colors[0] ? `Na cor ${featuredProduct.colors[0].name}` : '',
    featuredProduct.sizes.length > 1 ? `do ${featuredProduct.sizes[0]} ao ${featuredProduct.sizes[featuredProduct.sizes.length - 1]}` : featuredProduct.sizes[0] ? `tamanho ${featuredProduct.sizes[0]}` : '',
    `por ${formatPrice(featuredProduct.price)}`
  ].filter(Boolean).join(', ') : ''

  /* ---------- Textos ---------- */

  const catalogTitle = activeCategory === 'Todos' ? 'Nosso catálogo'
    : activeCategory === 'Favoritos' ? 'Seus favoritos'
      : activeCategory === 'Ofertas' ? 'Ofertas' : activeCategory
  const catalogTabs = [
    { label: 'Todos', count: catalogProducts.length },
    ...categories.map((category) => ({ label: category.name, count: category.count })),
    ...(offers.length ? [{ label: 'Ofertas', count: offers.length }] : []),
    { label: 'Favoritos', count: favoriteProducts.length }
  ]
  const promotionEnd = formatPromotionEnd(settings.promotionEndsAt || storeConfig.promotionEndsAt)
  const tickerItems = [
    'OFERTAS DA SEMANA',
    `CUPOM ${COUPON_CODE}`,
    featuredOffer ? `${featuredOffer.name.toUpperCase()} -${getDiscount(featuredOffer)}%` : 'PEÇAS SELECIONADAS',
    combos.length ? 'COMBOS COM DESCONTO' : 'ATENDIMENTO PELO WHATSAPP'
  ]
  const generalWhatsApp = createWhatsAppUrl('Olá! Gostaria de falar com a Bella Chic Boutique.', storeConfig.whatsappContacts[0].number)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const promoColumns = featuredOffer ? 3 : 2

  return (
    <S.Page>
      <S.AnnouncementBar>
        ✨ Cupom <strong>{COUPON_CODE}</strong>: 10% de desconto na primeira compra acima de R$ 300
      </S.AnnouncementBar>

      <SiteHeader
        cartCount={cartCount}
        favoritesCount={favoriteProducts.length}
        customer={customer}
        search={search}
        results={searchResults}
        onSearchChange={setSearch}
        onSearchSubmit={() => pickCategory('Todos')}
        onPickResult={openProduct}
        onMenuClick={() => setIsMenuOpen(true)}
        onAccountClick={() => setIsAccountOpen(true)}
        onFavoritesClick={() => pickCategory('Favoritos')}
        onCartClick={openCart}
      />

      <main>
        <h1 className="sr-only">Bella Chic Boutique: moda feminina em Belém e Ananindeua</h1>

        <S.Hero
          id="inicio"
          aria-roledescription="carrossel"
          aria-label="Destaques da Bella Chic"
          onMouseEnter={() => setHeroPaused(true)}
          onMouseLeave={() => setHeroPaused(false)}
          onFocus={() => setHeroPaused(true)}
          onBlur={(event: ReactFocusEvent<HTMLElement>) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeroPaused(false) }}
          onPointerDown={handleHeroPointerDown}
          onPointerUp={handleHeroPointerUp}
          onPointerCancel={() => { heroPointer.current = null }}
          onClickCapture={blockClickAfterSwipe}
        >
          {heroSlides.map((slide, index) => {
            const active = index === currentHero
            const tab = active ? 0 : -1
            return (
              <S.HeroSlide key={slide} $active={active} aria-hidden={!active} aria-roledescription="slide" aria-label={`${index + 1} de ${heroCount}`}>
                {slide === 'banner' && (
                  <a href="#lancamentos" tabIndex={tab} aria-label="Bella Chic Boutique: conheça a coleção" onDragStart={(event) => event.preventDefault()}>
                    <img src={banner1Image} alt="" draggable={false} />
                    <span className="cta">Conheça a coleção <ArrowIcon /></span>
                  </a>
                )}
                {slide === 'product' && featuredProduct && (
                  <S.HeroSplit>
                    <div className="copy">
                      <span className="eyebrow">Peça essencial</span>
                      <h2>{featuredWords.slice(0, -1).join(' ')} <em>{featuredWords[featuredWords.length - 1]}</em></h2>
                      <p>{featuredSummary}.</p>
                      <button type="button" className="action" tabIndex={tab} onClick={() => openProduct(featuredProduct)}>
                        {featuredProduct.colors.length > 1 ? 'Escolher minha cor' : 'Ver a peça'}
                      </button>
                    </div>
                    <img className="photo" src={featuredProduct.image} alt={featuredProduct.name} loading="lazy" draggable={false} />
                  </S.HeroSplit>
                )}
                {slide === 'stores' && (
                  <S.HeroStores>
                    <img className="photo" src={lojaGaleriaImage} alt="Interior da loja Bella Chic na Galeria Portuense" loading="lazy" draggable={false} />
                    <div className="copy">
                      <span className="eyebrow">Nossas lojas</span>
                      <h2>Vem provar com a gente</h2>
                      <p>{storeConfig.units.map((unit) => unit.name).join(' e ')}, em {Array.from(new Set(storeConfig.units.map((unit) => unit.city))).join(' e ')}.</p>
                      <a className="action" href="#lojas" tabIndex={tab}>Ver endereços</a>
                    </div>
                  </S.HeroStores>
                )}
              </S.HeroSlide>
            )
          })}
          {heroCount > 1 && (
            <>
              <S.HeroArrow type="button" $side="left" aria-label="Banner anterior" onClick={() => showHero(currentHero - 1)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
              </S.HeroArrow>
              <S.HeroArrow type="button" $side="right" aria-label="Próximo banner" onClick={() => showHero(currentHero + 1)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
              </S.HeroArrow>
              <S.HeroDots>
                {heroSlides.map((slide, index) => (
                  <button key={slide} type="button" aria-label={`Ir para o banner ${index + 1}`} aria-current={index === currentHero} onClick={() => showHero(index)} />
                ))}
              </S.HeroDots>
            </>
          )}
        </S.Hero>

        <S.Benefits aria-label="Vantagens">
          <Wrap>
            <ul>
              <li>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={'#C2405B'} strokeWidth="1.5" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>
                <strong>Entrega rápida</strong><span>Belém e região, a partir de R$ 12</span>
              </li>
              <li>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={'#C2405B'} strokeWidth="1.5" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></svg>
                <strong>Pix ou cartão</strong><span>Crédito em até 21x</span>
              </li>
              <li>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={'#C2405B'} strokeWidth="1.5" aria-hidden="true"><path d="M4 10l8-6 8 6v10H4z" /><path d="M10 20v-6h4v6" /></svg>
                <strong>Retire na loja</strong><span>Batista Campos ou Cidade Nova</span>
              </li>
              <li>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={'#C2405B'} strokeWidth="1.5" aria-hidden="true"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" /></svg>
                <strong>Atendimento humanizado ♡</strong><span>Fale com a gente no WhatsApp</span>
              </li>
            </ul>
          </Wrap>
        </S.Benefits>

        {categories.length > 0 && (
          <S.Block id="categorias" $tight aria-label="Categorias">
            <Wrap>
              <S.Categories>
                {categories.map((category) => (
                  <li key={category.name}>
                    <button type="button" onClick={() => pickCategory(category.name)}>
                      <span className="photo">{category.image && <img src={category.image} alt="" loading="lazy" />}</span>
                      {category.name}
                      <small>{category.count} {category.count === 1 ? 'peça' : 'peças'}</small>
                    </button>
                  </li>
                ))}
              </S.Categories>
            </Wrap>
          </S.Block>
        )}

        <S.Block id="lancamentos">
          <Wrap>
            <S.HeadRow>
              <div>
                <span className="eyebrow">Acabou de chegar</span>
                <h2>Lançamentos</h2>
              </div>
              <button type="button" className="see-all" onClick={() => pickCategory('Todos')}>Ver todas as peças →</button>
            </S.HeadRow>
            {catalogError && <S.Alert $tone="error" role="alert">{catalogError}</S.Alert>}
            {catalogLoading ? (
              <S.ProductGrid aria-hidden="true">
                {Array.from({ length: 4 }, (_, index) => (
                  <SkeletonCard key={index}>
                    <div className="block" />
                    <div className="body"><div className="line short" /><div className="line title" /><div className="line short" /><div className="line button" /></div>
                  </SkeletonCard>
                ))}
              </S.ProductGrid>
            ) : (
              <S.ProductGrid>
                {launches.map((product) => (
                  <ProductCard key={product.id} product={product} isFavorite={isFavorite(product.id)} onOpen={openProduct} onToggleFavorite={handleToggleFavorite} />
                ))}
              </S.ProductGrid>
            )}
          </Wrap>
        </S.Block>

        {combos.length > 0 && (
          <S.Block id="combos" $tone="dark">
            <Wrap>
              <S.HeadRow $light>
                <div>
                  <span className="eyebrow">Combine e economize</span>
                  <h2>Combos de roupas</h2>
                </div>
                <p>Looks completos montados pela nossa equipe. Leve as peças juntas e pague menos.</p>
              </S.HeadRow>
              <S.ComboGrid>
                {combos.map((combo) => {
                  const photos = getProductImages(combo).slice(0, 2)
                  const discount = getDiscount(combo)
                  return (
                    <S.ComboCard key={combo.id}>
                      <div className="photos">
                        {photos.map((src, index) => (
                          <button key={src} type="button" onClick={() => openProduct(combo)} aria-label={index === 0 ? `Ver ${combo.name}` : `Ver outra foto de ${combo.name}`}>
                            <img src={src} alt="" loading="lazy" />
                          </button>
                        ))}
                        {photos.length > 1 && <span className="plus" aria-hidden="true">+</span>}
                        <span className="badge">{combo.available === false ? 'Esgotado' : discount ? `Economize ${discount}%` : combo.tag || 'Combo'}</span>
                      </div>
                      <div>
                        <h3>{combo.name}</h3>
                        {combo.description && <p className="desc">{combo.description}</p>}
                      </div>
                      <div className="bottom">
                        <span className="prices">
                          {discount > 0 && combo.oldPrice && <s>Separadas: {formatPrice(combo.oldPrice)}</s>}
                          <strong>{formatPrice(combo.price)}</strong>
                        </span>
                        <button type="button" onClick={() => openProduct(combo)}>{combo.available === false ? 'Avise-me' : 'Quero o combo'}</button>
                      </div>
                    </S.ComboCard>
                  )
                })}
              </S.ComboGrid>
            </Wrap>
          </S.Block>
        )}

        <S.Block id="promocoes" style={{ paddingTop: 0, overflow: 'hidden' }}>
          <S.Ribbon aria-hidden="true">
            <div className="track">
              {[0, 1].map((copy) => (
                <div key={copy} className="group">
                  {[...tickerItems, ...tickerItems].map((item, index) => (
                    <span key={`${item}-${index}`}>{item} <span>✦</span></span>
                  ))}
                </div>
              ))}
            </div>
          </S.Ribbon>
          <Wrap>
            <S.HeadRow>
              <div>
                <span className="eyebrow">Aproveite</span>
                <h2>Promoções</h2>
              </div>
              {offers.length > 0 && <button type="button" className="see-all" onClick={() => pickCategory('Ofertas')}>Ver todas as ofertas →</button>}
            </S.HeadRow>
            <S.PromoGrid $columns={promoColumns}>
              <S.DealCard>
                <div>
                  <span className="badge">TEMPO LIMITADO</span>
                  <span className="title">Ofertas<br /><em>da semana</em></span>
                  <span className="lead">
                    {offers.length ? 'Peças selecionadas com desconto enquanto durar o estoque.' : 'Novas ofertas chegando! Enquanto isso, aproveite o cupom de primeira compra.'}
                  </span>
                </div>
                <div>
                  <span className="until">{promotionEnd ? <>Válida até <strong>{promotionEnd}</strong></> : 'Enquanto durar o estoque'}</span>
                  <button type="button" onClick={() => pickCategory(offers.length ? 'Ofertas' : 'Todos')}>
                    {offers.length ? 'Ver ofertas' : 'Ver catálogo'} <ArrowIcon />
                  </button>
                </div>
              </S.DealCard>

              {featuredOffer && featuredOffer.oldPrice && (
                <S.OfferCard>
                  <button type="button" className="photo" onClick={() => openProduct(featuredOffer)} aria-label={`Ver ${featuredOffer.name}`}>
                    <img src={featuredOffer.image} alt="" loading="lazy" />
                    <span className="off"><span><strong>-{getDiscount(featuredOffer)}%</strong><br /><small>OFF</small></span></span>
                  </button>
                  <div className="info">
                    <span className="category">{featuredOffer.category}</span>
                    <h3>{featuredOffer.name}</h3>
                    <span className="prices"><s>{formatPrice(featuredOffer.oldPrice)}</s><strong>{formatPrice(featuredOffer.price)}</strong></span>
                    <span className="save">Você economiza {formatPrice(featuredOffer.oldPrice - featuredOffer.price)}</span>
                    <button type="button" onClick={() => openProduct(featuredOffer)}>Aproveitar</button>
                  </div>
                </S.OfferCard>
              )}

              <S.PromoSide>
                <S.Coupon>
                  <span className="label">CUPOM DE PRIMEIRA COMPRA</span>
                  <span className="value">10% <small>OFF</small></span>
                  <span className="rule">Em compras acima de R$ 300,00. Aplique na sacola, antes de enviar o pedido.</span>
                  <div className="code">
                    <span>{COUPON_CODE}</span>
                    <button type="button" onClick={copyCoupon}>{couponCopied ? 'Copiado!' : 'Copiar'}</button>
                  </div>
                </S.Coupon>
                {combos.length > 0 && (
                  <S.ComboShortcut href="#combos">
                    <img src={combos[0].image} alt="" loading="lazy" />
                    <span>
                      <span className="tag">COMBO</span>
                      <strong>{combos[0].name}</strong>
                      <span className="more">Ver combos →</span>
                    </span>
                  </S.ComboShortcut>
                )}
              </S.PromoSide>
            </S.PromoGrid>
          </Wrap>
        </S.Block>

        <S.Block id="catalogo" $tone="blush">
          <Wrap>
            <S.HeadRow style={{ justifyContent: 'center', textAlign: 'center' }}>
              <div>
                <span className="eyebrow">Bella Chic</span>
                <h2>{catalogTitle}</h2>
              </div>
            </S.HeadRow>
            <S.Tabs role="tablist" aria-label="Filtrar catálogo por categoria">
              {catalogTabs.map((tab) => (
                <button key={tab.label} type="button" role="tab" aria-selected={activeCategory === tab.label} aria-controls="catalog-grid" onClick={() => setActiveCategory(tab.label)}>
                  {tab.label}<span>{tab.count}</span>
                </button>
              ))}
            </S.Tabs>
            <S.Toolbar>
              <span className="count" role="status" aria-live="polite">
                {visibleProducts.length} {visibleProducts.length === 1 ? 'peça encontrada' : 'peças encontradas'}
                {search.trim() && (
                  <button type="button" className="search-chip" onClick={() => setSearch('')} aria-label={`Limpar busca por ${search.trim()}`}>
                    “{search.trim()}” <span aria-hidden="true">✕</span>
                  </button>
                )}
              </span>
              <div className="tools">
                <select aria-label="Ordenar peças" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="featured">Destaques</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                  <option value="name">Nome (A-Z)</option>
                </select>
                <button type="button" className="filters" aria-expanded={isFiltersOpen} aria-controls="catalog-filters" onClick={() => setIsFiltersOpen((open) => !open)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                  Filtros
                  {activeFilterCount > 0 && <span className="badge" aria-label={`${activeFilterCount} filtros ativos`}>{activeFilterCount}</span>}
                </button>
              </div>
            </S.Toolbar>
            {isFiltersOpen && (
              <S.FilterPanel id="catalog-filters" role="group" aria-label="Filtros de peças">
                <label>
                  Tamanho
                  <select value={activeSize} onChange={(event) => setActiveSize(event.target.value)}>
                    <option value="">Todos os tamanhos</option>
                    {availableSizes.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </label>
                <label>
                  Cor
                  <select value={activeColor} onChange={(event) => setActiveColor(event.target.value)}>
                    <option value="">Todas as cores</option>
                    {availableColors.map((color) => <option key={color} value={color}>{color}</option>)}
                  </select>
                </label>
                <label>
                  <span>Preço até <strong>{formatPrice(maxPrice ?? priceLimit)}</strong></span>
                  <input
                    type="range"
                    min="0"
                    max={priceLimit}
                    step="10"
                    value={maxPrice ?? priceLimit}
                    aria-label={`Preço máximo ${formatPrice(maxPrice ?? priceLimit)}`}
                    onChange={(event) => {
                      const nextPrice = Number(event.target.value)
                      setMaxPrice(nextPrice >= priceLimit ? null : nextPrice)
                    }}
                  />
                </label>
                <button type="button" className="clear" onClick={clearFilters} disabled={!hasAnyFilter}>Limpar filtros</button>
              </S.FilterPanel>
            )}
            {cartStorageError && <S.Alert $tone="error" role="alert">{cartStorageError}</S.Alert>}
            {catalogLoading && <span className="sr-only" role="status">Carregando catálogo...</span>}
            <div id="catalog-grid" role="tabpanel">
              {catalogLoading ? (
                <S.ProductGrid aria-hidden="true">
                  {Array.from({ length: 8 }, (_, index) => (
                    <SkeletonCard key={index}>
                      <div className="block" />
                      <div className="body"><div className="line short" /><div className="line title" /><div className="line short" /><div className="line button" /></div>
                    </SkeletonCard>
                  ))}
                </S.ProductGrid>
              ) : visibleProducts.length ? (
                <>
                  <S.ProductGrid>
                    {visibleProducts.slice(0, visibleCount).map((product) => (
                      <ProductCard key={product.id} product={product} isFavorite={isFavorite(product.id)} onOpen={openProduct} onToggleFavorite={handleToggleFavorite} />
                    ))}
                  </S.ProductGrid>
                  {visibleProducts.length > visibleCount && (
                    <S.LoadMore>
                      <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                        Ver mais peças ({visibleProducts.length - visibleCount})
                      </button>
                    </S.LoadMore>
                  )}
                </>
              ) : !catalogError ? (
                <S.Empty>
                  {activeCategory === 'Favoritos' && !favoriteProducts.length
                    ? <p>Você ainda não favoritou nenhuma peça. Toque no ♡ das peças para salvar aqui.</p>
                    : <p>Nenhuma peça encontrada. Experimente outra busca ou categoria.</p>}
                  {hasAnyFilter && <button type="button" onClick={clearFilters}>Ver todas as peças</button>}
                </S.Empty>
              ) : null}
            </div>
          </Wrap>
        </S.Block>

        <S.Block id="lojas">
          <Wrap>
            <S.StoresLayout>
              <div className="about" id="sobre-nos">
                <span className="eyebrow">BELLA CHIC BOUTIQUE</span>
                <h2>Moda acessível, <em>porque te amamos te vestir de autoestima.</em></h2>
                <p>Somos uma boutique para mulheres que gostam de se sentir confiantes e especiais. Encontre peças escolhidas com carinho e venha nos visitar em uma de nossas duas unidades.</p>
              </div>
              <div className="units">
                {storeConfig.units.map((unit) => {
                  const contacts = storeConfig.whatsappContacts.filter((contact) => contact.unitId === unit.id)
                  return (
                    <S.UnitCard key={unit.id}>
                      {unitImages[unit.id] && <img src={unitImages[unit.id]} alt={`Interior da unidade ${unit.name}`} loading="lazy" />}
                      <div className="body">
                        <span className="city">{unit.city}</span>
                        <h3>{unit.name}</h3>
                        <p className="address">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
                          {unit.address}
                        </p>
                        {unit.hours && (
                          <p className="hours">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                            <span>{unit.hours}</span>
                          </p>
                        )}
                        <div className="actions">
                          <a className="map" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unit.address)}`} target="_blank" rel="noopener noreferrer">
                            Como chegar ↗
                          </a>
                          {contacts.map((contact, index) => (
                            <a
                              key={contact.id}
                              className="whats"
                              href={createWhatsAppUrl(`Olá! Gostaria de falar com a Bella Chic Boutique - ${unit.name}.`, contact.number)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Falar no WhatsApp com ${contact.label}`}
                            >
                              {contacts.length > 1 ? `WhatsApp ${index + 1}` : 'Falar no WhatsApp'} ↗
                            </a>
                          ))}
                        </div>
                      </div>
                    </S.UnitCard>
                  )
                })}
              </div>
            </S.StoresLayout>
          </Wrap>
        </S.Block>

        <S.Block $tone="blush" aria-label="Pagamentos e trocas">
          <Wrap>
            <S.InfoGrid>
              <S.Panel id="pagamentos">
                <h3>Formas de pagamento</h3>
                <p className="lead">Toque em uma opção para ver as condições.</p>
                <S.PaymentMethods>
                  {[
                    { name: 'Pix', icon: 'pix', subtitle: 'Instantâneo e prático' },
                    { name: 'Cartão de crédito', icon: 'card', subtitle: 'Crédito ou débito, com taxas' },
                    { name: 'Dinheiro', icon: 'cash', subtitle: 'Na retirada ou entrega' },
                    { name: 'Link de pagamento', icon: 'link', subtitle: 'Pague online com segurança' }
                  ].map((method) => {
                    const isSelected = selectedPaymentInfo === method.name
                    return (
                      <S.PaymentCard
                        key={method.name}
                        type="button"
                        $active={isSelected}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedPaymentInfo((previous) => (previous === method.name ? null : method.name))}
                      >
                        <span className={`icon ${method.icon}`} aria-hidden="true">
                          {method.icon === 'pix' && <svg viewBox="0 0 48 48"><path d="m24 3 8 8-8 8-8-8 8-8Zm0 26 8 8-8 8-8-8 8-8ZM3 24l8-8 8 8-8 8-8-8Zm26 0 8-8 8 8-8 8-8-8Z" /></svg>}
                          {method.icon === 'card' && <svg viewBox="0 0 64 44"><rect x="2" y="2" width="60" height="40" rx="6" /><path d="M2 13h60M10 31h11" /></svg>}
                          {method.icon === 'cash' && <svg viewBox="0 0 48 48"><rect x="4" y="12" width="35" height="25" rx="3" /><circle cx="22" cy="24.5" r="5" /><path d="m12 8 29 1v22" /></svg>}
                          {method.icon === 'link' && <svg viewBox="0 0 48 48"><path d="M21 27a8 8 0 0 1 0-11l5-5a8 8 0 0 1 11 11l-3 3" /><path d="M27 21a8 8 0 0 1 0 11l-5 5a8 8 0 0 1-11-11l3-3" /></svg>}
                        </span>
                        <strong>{method.name}</strong>
                        <small>{method.subtitle}</small>
                      </S.PaymentCard>
                    )
                  })}
                </S.PaymentMethods>
                {selectedPaymentInfo === 'Cartão de crédito' && (
                  <S.FeeInfo aria-label="Taxas de pagamento com cartão">
                    <p>Todas as compras no cartão de crédito ou débito estão sujeitas a taxa, independentemente do valor. Percentuais informados pela loja:</p>
                    <dl>
                      {cardFeeRates.map(({ label, rate }) => (
                        <div key={label}><dt>{label}</dt><dd>{rate}</dd></div>
                      ))}
                    </dl>
                    <p>Para parcelamentos de 5x a 20x, a atendente informará o percentual e o valor total antes de você autorizar o pagamento. Nenhum pagamento deve ser concluído sem a confirmação prévia do total.</p>
                  </S.FeeInfo>
                )}
                {selectedPaymentInfo && selectedPaymentInfo !== 'Cartão de crédito' && (
                  <S.FeeInfo>
                    <p>
                      {selectedPaymentInfo === 'Pix' && 'O preço das peças no site já é o valor no Pix. A chave é enviada pela atendente no WhatsApp, junto com o total do pedido.'}
                      {selectedPaymentInfo === 'Dinheiro' && 'Pague em dinheiro na retirada em uma das lojas ou na entrega. Se precisar de troco, avise a atendente.'}
                      {selectedPaymentInfo === 'Link de pagamento' && 'A atendente envia um link seguro pelo WhatsApp para você pagar online. Confira o total antes de concluir.'}
                    </p>
                  </S.FeeInfo>
                )}
                <p className="note">Consulte condições com a atendente pelo WhatsApp.</p>
              </S.Panel>

              <S.Policy id="trocas-devolucoes" tabIndex={-1} role="region" aria-labelledby="exchange-title">
                <span className="badge">Política oficial</span>
                <h3 id="exchange-title">Trocas e devoluções</h3>
                <ul>
                  <li>Não trocamos peças promocionais, nem adquiridas em live shop.</li>
                  <li>O prazo para solicitação de troca é de até 5 dias corridos após o recebimento.</li>
                  <li>A taxa de entrega/frete da troca é por conta da cliente.</li>
                  <li>Estas condições comerciais não afastam direitos garantidos pela legislação aplicável.</li>
                </ul>
                <p className="note">Dúvidas? <a href={generalWhatsApp} target="_blank" rel="noopener noreferrer">Fale com nossa equipe pelo WhatsApp</a>.</p>
              </S.Policy>
            </S.InfoGrid>
          </Wrap>
        </S.Block>

        <VipSignup />
      </main>

      <S.Footer>
        <Wrap>
          <S.FooterGrid>
            <div className="brand">
              <img src={boutiqueLogo} alt="Bella Chic Boutique" />
              <p>Moda feminina escolhida com carinho, em Belém e Ananindeua.</p>
              <div className="social">
                <a href={storeConfig.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram da Bella Chic Boutique">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" /></svg>
                </a>
                <a href={generalWhatsApp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp da Bella Chic Boutique">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" /></svg>
                </a>
              </div>
            </div>
            <nav aria-label="Institucional">
              <strong>INSTITUCIONAL</strong>
              <a href="#sobre-nos">Quem somos</a>
              <a href="#lojas">Nossas lojas</a>
              <a href="/termos-e-condicoes">Termos e condições</a>
              <a href="/privacidade">Privacidade e dados</a>
            </nav>
            <nav aria-label="Ajuda">
              <strong>AJUDA</strong>
              <a href="#trocas-devolucoes">Trocas e devoluções</a>
              <a href="#pagamentos">Formas de pagamento</a>
              {storeConfig.customerAccounts && <button type="button" onClick={() => setIsAccountOpen(true)}>Minha conta</button>}
              <a href={storeConfig.instagramUrl} target="_blank" rel="noopener noreferrer">@bellachicboutique__</a>
            </nav>
            <div className="col">
              <strong>DADOS DA LOJA</strong>
              <span>{storeConfig.name} · CNPJ {storeConfig.cnpj}</span>
              <span>{storeConfig.registeredAddress}</span>
              <a href={`mailto:${storeConfig.contactEmail}`}>{storeConfig.contactEmail}</a>
              <div className="chips" aria-label="Formas de pagamento aceitas">
                <span>Pix</span><span>Crédito até 21x</span><span>Débito</span><span>Dinheiro</span><span>Link de pagamento</span>
              </div>
              {typeof window !== 'undefined' && window.location.protocol === 'https:' && (
                <span className="secure">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                  Conexão HTTPS ativa
                </span>
              )}
            </div>
          </S.FooterGrid>
          <S.FooterBottom>
            <span>© {new Date().getFullYear()} Bella Chic Boutique · Todos os direitos reservados.</span>
            <S.DeveloperCredit>
              Desenvolvido por:
              <S.PortfolioButton href="https://matheus-nobre-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" /></svg>
                Matheus Nobre
              </S.PortfolioButton>
            </S.DeveloperCredit>
          </S.FooterBottom>
        </Wrap>
      </S.Footer>

      <SideMenu
        isOpen={isMenuOpen}
        categories={categories.filter((category) => !isCombo({ category: category.name })).map((category) => ({ label: category.name, count: category.count }))}
        hasCombos={combos.length > 0}
        hasOffers={offers.length > 0}
        favoritesCount={favoriteProducts.length}
        customer={customer}
        onClose={closeMenu}
        onPickCategory={pickCategory}
        onNavigate={(sectionId) => window.requestAnimationFrame(() => scrollToSection(sectionId))}
        onAccountClick={() => setIsAccountOpen(true)}
      />
      <AccountModal
        isOpen={isAccountOpen && storeConfig.customerAccounts}
        customer={customer}
        recoveringPassword={recoveringPassword}
        onClose={closeAccount}
        onNotify={notify}
        onPasswordUpdated={finishPasswordRecovery}
        settings={settings}
        onReorder={reorder}
      />
      <CartDrawer
        isOpen={isCartOpen}
        items={cartItems}
        customer={customer}
        settings={settings}
        onOrderPlaced={() => setCartItems([])}
        onKeepShopping={() => window.requestAnimationFrame(() => scrollToSection('catalogo'))}
        onClose={closeCart}
        onChangeQuantity={updateQuantity}
        onRemove={removeFromCart}
      />
      {dialogProduct && (
        <ProductDialog
          key={dialogProduct.id}
          product={dialogProduct}
          relatedProducts={recommendationsByProduct.get(dialogProduct.id) || []}
          isFavorite={isFavorite(dialogProduct.id)}
          onToggleFavorite={handleToggleFavorite}
          onAdd={addToCart}
          onClose={closeProduct}
          onOpenProduct={openProduct}
        />
      )}
      <Toast message={toast} />
    </S.Page>
  )
}

export default Home
