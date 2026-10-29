import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Session } from '@supabase/supabase-js'
import {
  AdminButton,
  AdminContainer,
  AdminForm,
  AdminNotice,
  AdminPage,
  AdminPanel,
  AdminTopbar,
  OrderList,
  OrderRow,
  ProductList,
  ProductRow
} from './styles'
import {
  deleteCatalogProduct,
  fetchAdminProducts,
  hasCatalogAdminAccess,
  saveCatalogProduct,
  supabase,
  uploadProductImage
} from '../../services/catalog'
import {
  cancelStoreOrder,
  confirmStoreOrder,
  fetchAdminOrders,
  StoreOrder
} from '../../services/orders'
import { CatalogProductInput } from '../../services/catalog'
import { Product, VariantStock } from '../../types/store'
import { buildVariantStock, getVariantStock } from '../../utils/inventory'

type ProductDraft = {
  name: string
  category: string
  description: string
  price: string
  oldPrice: string
  image: string
  images: string[]
  sizes: string
  sizeFit: string
  colors: ColorDraft[]
  variantStock: VariantStock[]
  tag: string
  available: boolean
}

type ColorDraft = {
  name: string
  hex: string
  image: string
}

const blankDraft: ProductDraft = {
  name: '',
  category: '',
  description: '',
  price: '',
  oldPrice: '',
  image: '',
  images: [],
  sizes: '',
  sizeFit: '',
  colors: [{ name: '', hex: '#e5a1ad', image: '' }],
  variantStock: [],
  tag: '',
  available: true
}

const formatPrice = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const draftFromProduct = (product: Product): ProductDraft => ({
  name: product.name,
  category: product.category,
  description: product.description,
  price: String(product.price),
  oldPrice: product.oldPrice === undefined ? '' : String(product.oldPrice),
  image: product.image,
  images: (product.images || []).filter((image) => image !== product.image),
  sizes: product.sizes.join(', '),
  sizeFit: product.sizeFit || '',
  colors: product.colors.map((color) => ({
    name: color.name,
    hex: color.hex,
    image: color.image || ''
  })),
  variantStock: product.variantStock || [],
  tag: product.tag || '',
  available: product.enabled !== false
})

const errorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error !== 'object' || error === null) return 'Ocorreu um erro inesperado.'

  const details = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown }
  const message = typeof details.message === 'string' ? details.message : ''
  const extraDetails = typeof details.details === 'string' ? details.details : ''
  const hint = typeof details.hint === 'string' ? details.hint : ''
  const code = typeof details.code === 'string' ? details.code : ''
  const diagnostic = `${message} ${extraDetails} ${hint}`.toLocaleLowerCase('pt-BR')

  const supabaseMessage = [message, extraDetails, hint].filter(Boolean).join(' ')
  if (diagnostic.includes('size_fit')) {
    return `${supabaseMessage} Execute supabase/product-size-fit.sql no SQL Editor do Supabase e tente novamente.`
  }
  if (diagnostic.includes('images')) {
    return `${supabaseMessage} Execute supabase/product-gallery.sql no SQL Editor do Supabase e tente novamente.`
  }
  if (diagnostic.includes('variant_stock')) {
    return `${supabaseMessage} Execute supabase/order-management.sql no SQL Editor do Supabase e tente novamente.`
  }
  if (code === 'PGRST204' || code === '42703') {
    return `${supabaseMessage} O banco parece estar sem uma coluna esperada pelo painel; confira se as migrações do catálogo foram executadas no SQL Editor do Supabase.`
  }

  return supabaseMessage || 'Ocorreu um erro inesperado.'
}

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [adminAllowed, setAdminAllowed] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [draft, setDraft] = useState<ProductDraft>(blankDraft)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingGalleryImages, setUploadingGalleryImages] = useState(false)
  const [uploadingColorIndex, setUploadingColorIndex] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    // O painel não deve aparecer no Google.
    const previousTitle = document.title
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    document.title = 'Painel | Bella Chic Boutique'
    return () => {
      robots.remove()
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }

    supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) throw sessionError
        setSession(data.session)
      })
      .catch((sessionError: Error) => setError(`Não foi possível verificar o acesso: ${sessionError.message}`))
      .finally(() => setAuthReady(true))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setError('')
      setNotice('')
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let active = true

    if (!session) {
      setAdminAllowed(false)
      setProducts([])
      setOrders([])
      return () => { active = false }
    }

    setLoadingProducts(true)
    setLoadingOrders(true)
    setError('')
    hasCatalogAdminAccess(session.user.id)
      .then(async (allowed) => {
        if (!active) return
        setAdminAllowed(allowed)
        if (!allowed) return
        const [catalog, loadedOrders] = await Promise.all([
          fetchAdminProducts(),
          fetchAdminOrders()
        ])
        if (active) {
          setProducts(catalog)
          setOrders(loadedOrders)
        }
      })
      .catch((loadError: Error) => {
        if (active) setError(`Não foi possível carregar o painel: ${loadError.message}`)
      })
      .finally(() => {
        if (active) setLoadingProducts(false)
        if (active) setLoadingOrders(false)
      })

    return () => { active = false }
  }, [session])

  const handleOrderStatusChange = async (order: StoreOrder, action: 'confirm' | 'cancel') => {
    const actionLabel = action === 'confirm' ? 'confirmar a venda e baixar o estoque' : 'cancelar o pedido'
    if (!window.confirm(`Deseja ${actionLabel} do pedido ${order.reference}?`)) return

    setError('')
    setNotice('')
    setProcessingOrderId(order.id)
    try {
      if (action === 'confirm') {
        await confirmStoreOrder(order.id)
      } else {
        await cancelStoreOrder(order.id)
      }
      const [loadedOrders, catalog] = await Promise.all([
        fetchAdminOrders(),
        fetchAdminProducts()
      ])
      setOrders(loadedOrders)
      setProducts(catalog)
      setNotice(action === 'confirm'
        ? `Pedido ${order.reference} confirmado e estoque atualizado.`
        : `Pedido ${order.reference} cancelado.`)
    } catch (actionError) {
      setError(`Não foi possível ${action === 'confirm' ? 'confirmar o pedido' : 'cancelar o pedido'}: ${errorMessage(actionError)}`)
    } finally {
      setProcessingOrderId(null)
    }
  }

  const handleRefreshOrders = async () => {
    setLoadingOrders(true)
    setError('')
    try {
      setOrders(await fetchAdminOrders())
    } catch (loadError) {
      setError(`Não foi possível atualizar os pedidos: ${errorMessage(loadError)}`)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return

    setError('')
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) setError(`Não foi possível entrar: ${loginError.message}`)
  }

  const handleLogout = async () => {
    if (!supabase) return
    const { error: logoutError } = await supabase.auth.signOut()
    if (logoutError) setError(`Não foi possível sair: ${logoutError.message}`)
  }

  const resetDraft = () => {
    setDraft(blankDraft)
    setEditingId(null)
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError('')
    setNotice('')
    setUploadingImage(true)
    try {
      const imageUrl = await uploadProductImage(file)
      setDraft((current) => ({ ...current, image: imageUrl }))
      setNotice('Imagem enviada ao Supabase Storage.')
    } catch (uploadError) {
      setError(`Não foi possível enviar a imagem: ${errorMessage(uploadError)}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleColorImageUpload = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError('')
    setNotice('')
    setUploadingColorIndex(index)
    try {
      const imageUrl = await uploadProductImage(file)
      setDraft((current) => ({
        ...current,
        colors: current.colors.map((color, colorIndex) =>
          colorIndex === index ? { ...color, image: imageUrl } : color
        )
      }))
      setNotice(`Imagem da cor ${draft.colors[index].name || ''} enviada ao Supabase Storage.`)
    } catch (uploadError) {
      setError(`Não foi possível enviar a foto da cor: ${errorMessage(uploadError)}`)
    } finally {
      setUploadingColorIndex(null)
    }
  }

  const handleGalleryImagesUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return

    setError('')
    setNotice('')
    setUploadingGalleryImages(true)
    try {
      for (const file of files) {
        const imageUrl = await uploadProductImage(file)
        setDraft((current) => ({ ...current, images: [...current.images, imageUrl] }))
      }
      setNotice(`${files.length} ${files.length === 1 ? 'foto de outro ângulo enviada' : 'fotos de outros ângulos enviadas'} ao Supabase Storage.`)
    } catch (uploadError) {
      setError(`Não foi possível enviar todas as fotos dos ângulos: ${errorMessage(uploadError)}`)
    } finally {
      setUploadingGalleryImages(false)
    }
  }

  const handleSaveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (uploadingImage || uploadingGalleryImages || uploadingColorIndex !== null) {
      setError('Aguarde o envio das imagens terminar antes de salvar a peça.')
      return
    }
    setError('')
    setNotice('')

    const sizes = draft.sizes.split(',').map((size) => size.trim()).filter(Boolean)
    const colors = draft.colors.filter((color) => color.name.trim() || color.image.trim())
      .map((color) => ({
        name: color.name.trim(),
        hex: color.hex.trim(),
        image: color.image.trim() || undefined
      }))
    const price = Number(draft.price.replace(',', '.'))
    const oldPrice = draft.oldPrice ? Number(draft.oldPrice.replace(',', '.')) : undefined

    if (!sizes.length) {
      setError('Informe pelo menos um tamanho, separado por vírgulas.')
      return
    }
    if (new Set(sizes).size !== sizes.length) {
      setError('Cada tamanho deve aparecer apenas uma vez.')
      return
    }
    if (!colors.length || colors.some((color) => !color.name || !color.hex)) {
      setError('Informe pelo menos uma cor, com nome e código hexadecimal.')
      return
    }
    if (new Set(colors.map((color) => color.name.toLocaleLowerCase('pt-BR'))).size !== colors.length) {
      setError('Cada cor deve ter um nome único.')
      return
    }
    if (!Number.isFinite(price) || price <= 0 || (oldPrice !== undefined && (!Number.isFinite(oldPrice) || oldPrice <= 0))) {
      setError('Informe preços válidos e maiores que zero.')
      return
    }
    if (colors.some((color) => !/^#[0-9a-fA-F]{6}$/.test(color.hex))) {
      setError('Cada cor deve usar um código hexadecimal válido, por exemplo #E5A1AD.')
      return
    }
    if (colors.some((color) => color.image && !/^https?:\/\//i.test(color.image))) {
      setError('As imagens individuais das cores devem ser URLs públicas iniciadas por https:// ou http://.')
      return
    }

    const variantStock = buildVariantStock(
      sizes,
      colors.map((color) => color.name),
      draft.variantStock
    )
    if (variantStock.some((variant) => !Number.isInteger(variant.quantity) || variant.quantity < 0)) {
      setError('As quantidades de estoque devem ser números inteiros iguais ou maiores que zero.')
      return
    }

    const mainImage = draft.image.trim() || colors.find((color) => color.image)?.image || draft.images[0] || ''
    const product: CatalogProductInput = {
      name: draft.name.trim(),
      category: draft.category.trim(),
      description: draft.description.trim(),
      price,
      oldPrice,
      image: mainImage,
      images: [
        mainImage,
        ...draft.images.filter((image) => image.trim() && image.trim() !== mainImage)
      ].filter(Boolean),
      sizes,
      sizeFit: draft.sizeFit.trim() || undefined,
      colors,
      variantStock,
      tag: draft.tag.trim() || undefined,
      available: draft.available,
      enabled: draft.available
    }

    setSaving(true)
    try {
      const savedProduct = await saveCatalogProduct(product, editingId ?? undefined)
      setProducts((current) => editingId
        ? current.map((item) => item.id === savedProduct.id ? savedProduct : item)
        : [...current, savedProduct].sort((first, second) => first.id - second.id))
      setNotice(editingId ? 'Peça atualizada no catálogo.' : 'Peça adicionada ao catálogo.')
      resetDraft()
    } catch (saveError) {
      setError(`Não foi possível salvar a peça: ${errorMessage(saveError)}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Deseja excluir "${product.name}" do catálogo?`)) return

    setError('')
    setNotice('')
    try {
      await deleteCatalogProduct(product.id)
      setProducts((current) => current.filter((item) => item.id !== product.id))
      setNotice(`${product.name} foi removido do catálogo.`)
      if (editingId === product.id) resetDraft()
    } catch (deleteError) {
      setError(`Não foi possível remover a peça: ${errorMessage(deleteError)}`)
    }
  }

  return (
    <AdminPage>
      <AdminContainer>
        <AdminTopbar>
          <div>
            <span className="eyebrow">BELLA CHIC BOUTIQUE</span>
            <h1>Administração do catálogo</h1>
          </div>
          <Link to="/">Voltar à loja</Link>
        </AdminTopbar>

        {!supabase ? (
          <AdminPanel>
            <h2>Configure a conexão segura</h2>
            <p>O painel precisa das variáveis REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY no arquivo .env.local. Siga a seção “Painel administrativo” do README para criar as tabelas, regras de acesso e conta administradora.</p>
          </AdminPanel>
        ) : !authReady ? (
          <AdminPanel><p>Verificando sessão...</p></AdminPanel>
        ) : !session ? (
          <AdminPanel>
            <h2>Entrar como administradora</h2>
            {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
            <AdminForm onSubmit={handleLogin}>
              <label className="wide">E-mail
                <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label className="wide">Senha
                <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>
              <div className="wide actions"><AdminButton type="submit">Entrar</AdminButton></div>
            </AdminForm>
          </AdminPanel>
        ) : !adminAllowed ? (
          <AdminPanel>
            {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
            {!error && <AdminNotice $error role="alert">Esta conta não tem permissão de administração do catálogo. Cadastre o usuário na tabela store_admins pelo painel do Supabase.</AdminNotice>}
            <AdminButton type="button" className="secondary" onClick={handleLogout}>Sair</AdminButton>
          </AdminPanel>
        ) : (
          <>
            {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
            {notice && <AdminNotice role="status">{notice}</AdminNotice>}
            <AdminPanel>
              <h2>{editingId ? 'Editar peça' : 'Adicionar nova peça'}</h2>
              <AdminForm onSubmit={handleSaveProduct}>
                <label>Nome da peça
                  <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
                </label>
                <label>Categoria
                  <input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="Vestidos, Blusas..." required />
                </label>
                <label>Preço (R$)
                  <input type="number" min="0.01" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} required />
                </label>
                <label>Preço anterior (opcional)
                  <input type="number" min="0.01" step="0.01" value={draft.oldPrice} onChange={(event) => setDraft({ ...draft, oldPrice: event.target.value })} />
                </label>
                <label className="wide">URL da imagem
                  <input type="url" value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} placeholder="Cole uma URL ou envie uma imagem abaixo" required={!draft.image.trim() && draft.colors.some((color) => !color.image.trim())} />
                </label>
                <label className="wide">Enviar foto do dispositivo (PNG, JPG ou WebP; até 5 MB)
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} disabled={uploadingImage || uploadingGalleryImages || uploadingColorIndex !== null} />
                  {uploadingImage && <span role="status">Enviando imagem para o Supabase...</span>}
                  {draft.image && <img className="image-preview" src={draft.image} alt="Pré-visualização da imagem do produto" />}
                </label>
                <label className="wide">Enviar fotos de outros ângulos (opcional; PNG, JPG ou WebP; até 5 MB por foto)
                  <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleGalleryImagesUpload} disabled={uploadingImage || uploadingGalleryImages || uploadingColorIndex !== null} />
                  {uploadingGalleryImages && <span role="status">Enviando fotos dos ângulos para o Supabase...</span>}
                  {!!draft.images.length && (
                    <span className="gallery-image-previews">
                      {draft.images.map((image, index) => (
                        <span className="gallery-image-item" key={`${image}-${index}`}>
                          <img src={image} alt={`Pré-visualização do ângulo ${index + 1}`} />
                          <AdminButton type="button" className="secondary" disabled={uploadingGalleryImages} onClick={() => setDraft((current) => ({
                            ...current,
                            images: current.images.filter((_item, imageIndex) => imageIndex !== index)
                          }))}>Remover ângulo {index + 1}</AdminButton>
                        </span>
                      ))}
                    </span>
                  )}
                </label>
                <label className="wide">Descrição
                  <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required />
                </label>
                <label className="wide">Tamanhos disponíveis (separados por vírgula)
                  <input value={draft.sizes} onChange={(event) => setDraft({ ...draft, sizes: event.target.value })} placeholder="P, M, G, GG" required />
                </label>
                <label className="wide">Numeração que o tamanho único veste (opcional)
                  <input
                    value={draft.sizeFit}
                    onChange={(event) => setDraft({ ...draft, sizeFit: event.target.value })}
                    placeholder="38-42"
                    aria-describedby="size-fit-help"
                    maxLength={40}
                  />
                  <span id="size-fit-help">Preencha quando o tamanho cadastrado for único; na loja aparecerá como “Veste do 38 ao 42”.</span>
                </label>
                <div className="wide color-list">
                  <strong>Cores e fotos por cor</strong>
                  <p>Envie uma foto para cada cor. Se deixar a foto vazia, será usada a imagem principal do produto.</p>
                  {draft.colors.map((color, index) => (
                    <div className="color-item" key={`color-${index}`}>
                      <label>Nome da cor
                        <input value={color.name} onChange={(event) => setDraft((current) => ({
                          ...current,
                          colors: current.colors.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item)
                        }))} placeholder="Rosa" required />
                      </label>
                      <label>Código da cor
                        <span className="color-hex">
                          <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(color.hex) ? color.hex : '#e5a1ad'} onChange={(event) => setDraft((current) => ({
                            ...current,
                            colors: current.colors.map((item, itemIndex) => itemIndex === index ? { ...item, hex: event.target.value } : item)
                          }))} aria-label={`Selecionar cor ${index + 1}`} />
                          <input value={color.hex} onChange={(event) => setDraft((current) => ({
                            ...current,
                            colors: current.colors.map((item, itemIndex) => itemIndex === index ? { ...item, hex: event.target.value } : item)
                          }))} placeholder="#E5A1AD" required />
                        </span>
                      </label>
                      <label className="wide">URL da foto desta cor (opcional)
                        <input type="url" value={color.image} onChange={(event) => setDraft((current) => ({
                          ...current,
                          colors: current.colors.map((item, itemIndex) => itemIndex === index ? { ...item, image: event.target.value } : item)
                        }))} placeholder="Será preenchida ao enviar a foto" />
                      </label>
                      <div className="wide color-image-actions">
                        <label>Enviar foto para esta cor (opcional)
                                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleColorImageUpload(index, event)} disabled={uploadingImage || uploadingGalleryImages || uploadingColorIndex !== null} />
                        </label>
                        {color.image && <img className="color-image-preview" src={color.image} alt={`Pré-visualização da cor ${color.name || index + 1}`} />}
                        {draft.colors.length > 1 && (
                          <AdminButton type="button" className="secondary" disabled={uploadingColorIndex !== null} onClick={() => setDraft((current) => ({
                            ...current,
                            colors: current.colors.filter((_item, itemIndex) => itemIndex !== index)
                          }))}>Remover cor</AdminButton>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="actions">
                    <AdminButton type="button" className="secondary" disabled={uploadingColorIndex !== null} onClick={() => setDraft((current) => ({
                      ...current,
                      colors: [...current.colors, { name: '', hex: '#e5a1ad', image: '' }]
                    }))}>Adicionar cor</AdminButton>
                    {uploadingColorIndex !== null && <span role="status">Enviando foto da cor...</span>}
                  </div>
                </div>
                <div className="wide stock-list">
                  <strong>Estoque por tamanho e cor</strong>
                  <p>Novas combinações começam com estoque zero. Informe as unidades disponíveis de cada variação.</p>
                  <div className="stock-grid">
                    {draft.sizes.split(',').map((size) => size.trim()).filter(Boolean).flatMap((size) =>
                      draft.colors.filter((color) => color.name.trim()).map((color) => (
                        <label key={`${size}-${color.name}`}>
                          {size} · {color.name}
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={getVariantStock(draft.variantStock, size, color.name.trim())}
                            onChange={(event) => {
                              const quantity = event.target.value === '' ? 0 : Number(event.target.value)
                              setDraft((current) => {
                                const variantStock = buildVariantStock(
                                  current.sizes.split(',').map((item) => item.trim()).filter(Boolean),
                                  current.colors.map((item) => item.name.trim()).filter(Boolean),
                                  current.variantStock
                                )
                                return {
                                  ...current,
                                  variantStock: variantStock.map((variant) =>
                                    variant.size === size && variant.color === color.name.trim()
                                      ? { ...variant, quantity }
                                      : variant
                                  )
                                }
                              })
                            }}
                            required
                          />
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <label>Etiqueta opcional
                  <input value={draft.tag} onChange={(event) => setDraft({ ...draft, tag: event.target.value })} placeholder="Novo, Mais vendido..." />
                </label>
                <label className="check">
                  <input type="checkbox" checked={draft.available} onChange={(event) => setDraft({ ...draft, available: event.target.checked })} />
                  Produto ativo no catálogo (o estoque zero sempre bloqueia a compra)
                </label>
                <div className="wide actions">
                  <AdminButton type="submit" disabled={saving || uploadingImage || uploadingGalleryImages || uploadingColorIndex !== null}>{uploadingImage || uploadingGalleryImages || uploadingColorIndex !== null ? 'Enviando imagem...' : saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar peça'}</AdminButton>
                  {editingId !== null && <AdminButton type="button" className="secondary" onClick={resetDraft}>Cancelar edição</AdminButton>}
                </div>
              </AdminForm>
            </AdminPanel>

            <AdminPanel>
              <h2>Peças cadastradas ({products.length})</h2>
              {loadingProducts ? <p>Carregando peças...</p> : products.length === 0 ? <p>Nenhuma peça cadastrada ainda.</p> : (
                <ProductList>
                  {products.map((product) => (
                    <ProductRow key={product.id}>
                      <img src={product.image} alt="" />
                      <div>
                        <h3>{product.name}</h3>
                        <p>{product.category} · {product.sizes.join(', ')}{product.sizeFit ? ` (veste ${product.sizeFit})` : ''} · {product.colors.map((color) => color.name).join(', ')}</p>
                        <p>Estoque: {(product.variantStock || []).reduce((total, variant) => total + variant.quantity, 0)} unidades</p>
                        {product.available === false && <span className="sold-out">Esgotado</span>}
                      </div>
                      <div className="actions">
                        <AdminButton type="button" className="secondary" onClick={() => {
                          setDraft(draftFromProduct(product))
                          setEditingId(product.id)
                          setNotice('')
                          setError('')
                        }}>Editar</AdminButton>
                        <AdminButton type="button" className="danger" onClick={() => handleDeleteProduct(product)}>Excluir</AdminButton>
                      </div>
                    </ProductRow>
                  ))}
                </ProductList>
              )}
            </AdminPanel>

            <AdminPanel>
              <div className="order-list-heading">
                <h2>Pedidos recentes ({orders.length})</h2>
                <AdminButton type="button" className="secondary" disabled={loadingOrders} onClick={handleRefreshOrders}>
                  {loadingOrders ? 'Atualizando...' : 'Atualizar pedidos'}
                </AdminButton>
              </div>
              <p>Pedidos enviados pela loja aguardam confirmação. Confirme a venda somente após combinar com a cliente pelo WhatsApp; essa ação baixa o estoque de todas as variações do pedido.</p>
              {loadingOrders ? <p>Carregando pedidos...</p> : orders.length === 0 ? <p>Nenhum pedido registrado ainda.</p> : (
                <OrderList>
                  {orders.map((order) => {
                    const deliveryFee = order.fulfillment.deliveryFee
                    const total = order.subtotal - order.discount + (deliveryFee || 0)
                    const customerPhone = order.customer.phone.replace(/\D/g, '')
                    const whatsappPhone = customerPhone.startsWith('55') ? customerPhone : `55${customerPhone}`
                    return (
                      <OrderRow key={order.id}>
                        <div className="order-heading">
                          <h3>Pedido {order.reference}</h3>
                          <span className={`order-status ${order.status}`}>{{
                            pending: 'Aguardando confirmação',
                            confirmed: 'Venda confirmada',
                            cancelled: 'Cancelado'
                          }[order.status]}</span>
                        </div>
                        <p>{new Date(order.created_at).toLocaleString('pt-BR')} · {order.unit.name} · {order.payment}</p>
                        <p><strong>{order.customer.name}</strong> · <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer">{order.customer.phone}</a>{order.customer.email ? ` · ${order.customer.email}` : ''}</p>
                        <ul>
                          {order.items.map((item, index) => (
                            <li key={`${item.productId}-${item.size}-${item.color}-${index}`}>
                              {item.quantity}× {item.name} · {item.size}{item.sizeFit ? ` (${item.sizeFit})` : ''} · {item.color} — {formatPrice(item.unitPrice * item.quantity)}
                            </li>
                          ))}
                        </ul>
                        <p>{order.fulfillment.type === 'Entrega'
                          ? `Entrega: ${order.fulfillment.street}, ${order.fulfillment.houseNumber}${order.fulfillment.complement ? `, ${order.fulfillment.complement}` : ''} · ${order.fulfillment.neighborhood}, ${order.fulfillment.deliveryCity}${deliveryFee === null ? ' · frete a combinar' : ` · frete ${formatPrice(deliveryFee)}`}`
                          : `Retirada em ${order.unit.address}`}</p>
                        {order.fulfillment.type === 'Entrega' && (order.fulfillment.referencePoint || order.fulfillment.deliveryNotes) && (
                          <p>{[order.fulfillment.referencePoint ? `Referência: ${order.fulfillment.referencePoint}` : '', order.fulfillment.deliveryNotes ? `Observação: ${order.fulfillment.deliveryNotes}` : ''].filter(Boolean).join(' · ')}</p>
                        )}
                        <p>Subtotal: {formatPrice(order.subtotal)}{order.discount > 0 ? ` · Desconto: -${formatPrice(order.discount)}` : ''} · <strong>Total: {deliveryFee === null ? 'a combinar' : formatPrice(total)}</strong></p>
                        {order.status === 'pending' && (
                          <div className="actions">
                            <AdminButton type="button" disabled={processingOrderId === order.id} onClick={() => handleOrderStatusChange(order, 'confirm')}>
                              {processingOrderId === order.id ? 'Processando...' : 'Confirmar venda e baixar estoque'}
                            </AdminButton>
                            <AdminButton type="button" className="danger" disabled={processingOrderId === order.id} onClick={() => handleOrderStatusChange(order, 'cancel')}>Cancelar pedido</AdminButton>
                          </div>
                        )}
                      </OrderRow>
                    )
                  })}
                </OrderList>
              )}
            </AdminPanel>

            <AdminButton type="button" className="secondary" onClick={handleLogout}>Sair da administração</AdminButton>
          </>
        )}
      </AdminContainer>
    </AdminPage>
  )
}

export default Admin
