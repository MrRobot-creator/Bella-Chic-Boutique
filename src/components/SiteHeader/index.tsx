import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Product } from '../../types/store'
import { Customer } from '../../hooks/useCustomer'
import boutiqueLogo from '../../assets/bella-chic-logo.jpg'
import {
  AccountButton,
  Badge,
  Bar,
  Brand,
  IconButton,
  MenuButton,
  Results,
  ResultButton,
  Row,
  SearchBox,
  SearchField,
  Actions
} from './styles'

type SiteHeaderProps = {
  cartCount: number
  favoritesCount: number
  customer: Customer | null
  search: string
  results: Product[]
  onSearchChange: (value: string) => void
  onSearchSubmit: () => void
  onPickResult: (product: Product) => void
  onMenuClick: () => void
  onAccountClick: () => void
  onFavoritesClick: () => void
  onCartClick: () => void
}

const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
)

const SiteHeader = ({
  cartCount,
  favoritesCount,
  customer,
  search,
  results,
  onSearchChange,
  onSearchSubmit,
  onPickResult,
  onMenuClick,
  onAccountClick,
  onFavoritesClick,
  onCartClick
}: SiteHeaderProps) => {
  const [searchFocused, setSearchFocused] = useState(false)
  const [activeResult, setActiveResult] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const term = search.trim()
  const showResults = searchFocused && term.length > 0

  useEffect(() => setActiveResult(-1), [term])

  useEffect(() => {
    if (!searchFocused) return undefined
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !searchRef.current?.contains(event.target)) setSearchFocused(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [searchFocused])

  const pick = (product: Product) => {
    setSearchFocused(false)
    onPickResult(product)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (activeResult >= 0 && results[activeResult]) {
      pick(results[activeResult])
      return
    }
    setSearchFocused(false)
    onSearchSubmit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || !results.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveResult((index) => (index + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveResult((index) => (index <= 0 ? results.length - 1 : index - 1))
    } else if (event.key === 'Escape') {
      setSearchFocused(false)
    }
  }

  const firstName = customer?.name.split(' ')[0]

  return (
    <Bar>
      <Row>
        <MenuButton type="button" onClick={onMenuClick} aria-label="Abrir menu de categorias">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h11" /></svg>
          <span className="label">Menu</span>
        </MenuButton>
        <Brand href="#inicio" aria-label="Bella Chic Boutique, início">
          <img src={boutiqueLogo} alt="Bella Chic Boutique" />
        </Brand>

        <SearchBox ref={searchRef} onSubmit={handleSubmit} role="search">
          <SearchField>
            <SearchIcon />
            <label className="sr-only" htmlFor="site-search">Buscar peças</label>
            <input
              id="site-search"
              type="search"
              autoComplete="off"
              placeholder="Busque por vestido, conjunto, blusa…"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-expanded={showResults}
              aria-controls="site-search-results"
              aria-activedescendant={activeResult >= 0 ? `search-result-${activeResult}` : undefined}
            />
          </SearchField>
          {showResults && (
            <Results id="site-search-results" role="listbox" aria-label="Sugestões de peças">
              {results.map((product, index) => (
                <ResultButton
                  key={product.id}
                  id={`search-result-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeResult}
                  $active={index === activeResult}
                  onClick={() => pick(product)}
                >
                  <img src={product.image} alt="" />
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.category} · {formatPrice(product.price)}</small>
                  </span>
                </ResultButton>
              ))}
              {results.length === 0 && <p className="empty">Nenhuma peça encontrada para “{term}”.</p>}
              {results.length > 0 && (
                <button type="submit" className="see-all">Ver todos os resultados para “{term}” →</button>
              )}
            </Results>
          )}
        </SearchBox>

        <Actions>
          <AccountButton type="button" onClick={onAccountClick} aria-label={customer ? 'Minha conta' : 'Entrar ou cadastrar-se'}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
            <span className="label">
              {customer ? <>Olá{firstName ? `, ${firstName}` : ''}!<br /><strong>Minha conta</strong></> : <>Olá, visitante<br /><strong>Entrar</strong> | <strong>Cadastre-se</strong></>}
            </span>
          </AccountButton>
          <IconButton type="button" className="favorites" onClick={onFavoritesClick} aria-label={`Favoritos, ${favoritesCount} peças`}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
            {favoritesCount > 0 && <Badge $dark>{favoritesCount}</Badge>}
          </IconButton>
          <IconButton type="button" onClick={onCartClick} aria-label={`Abrir sacola, ${cartCount} itens`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
            <Badge>{cartCount}</Badge>
          </IconButton>
        </Actions>
      </Row>
    </Bar>
  )
}

export default SiteHeader
