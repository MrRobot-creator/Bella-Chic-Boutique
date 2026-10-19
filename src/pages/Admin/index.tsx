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
import { CatalogProductInput } from '../../services/catalog'
import { Product } from '../../types/store'

type ProductDraft = {
  name: string
  category: string
  description: string
  price: string
  oldPrice: string
  image: string
  sizes: string
  colors: string
  tag: string
  available: boolean
}

const blankDraft: ProductDraft = {
  name: '',
  category: '',
  description: '',
  price: '',
  oldPrice: '',
  image: '',
  sizes: '',
  colors: '',
  tag: '',
  available: true
}

const draftFromProduct = (product: Product): ProductDraft => ({
  name: product.name,
  category: product.category,
  description: product.description,
  price: String(product.price),
  oldPrice: product.oldPrice === undefined ? '' : String(product.oldPrice),
  image: product.image,
  sizes: product.sizes.join(', '),
  colors: product.colors.map((color) => `${color.name} | ${color.hex}`).join('\n'),
  tag: product.tag || '',
  available: product.available !== false
})

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [adminAllowed, setAdminAllowed] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [draft, setDraft] = useState<ProductDraft>(blankDraft)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

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
      return () => { active = false }
    }

    setLoadingProducts(true)
    setError('')
    hasCatalogAdminAccess(session.user.id)
      .then(async (allowed) => {
        if (!active) return
        setAdminAllowed(allowed)
        if (!allowed) return
        const catalog = await fetchAdminProducts()
        if (active) setProducts(catalog)
      })
      .catch((loadError: Error) => {
        if (active) setError(`Não foi possível carregar o painel: ${loadError.message}`)
      })
      .finally(() => {
        if (active) setLoadingProducts(false)
      })

    return () => { active = false }
  }, [session])

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

  const handleSaveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (uploadingImage) {
      setError('Aguarde o envio da imagem terminar antes de salvar a peça.')
      return
    }
    setError('')
    setNotice('')

    const sizes = draft.sizes.split(',').map((size) => size.trim()).filter(Boolean)
    const colorLines = draft.colors.split('\n').map((line) => line.trim()).filter(Boolean)
    const colors = colorLines.map((line) => {
      const [name, hex] = line.split('|').map((part) => part.trim())
      return { name, hex }
    })
    const price = Number(draft.price.replace(',', '.'))
    const oldPrice = draft.oldPrice ? Number(draft.oldPrice.replace(',', '.')) : undefined

    if (!sizes.length) {
      setError('Informe pelo menos um tamanho, separado por vírgulas.')
      return
    }
    if (!colorLines.length || colors.some((color) => !color.name || !color.hex)) {
      setError('Informe cada cor em uma linha, no formato Nome | #hex.')
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

    const product: CatalogProductInput = {
      name: draft.name.trim(),
      category: draft.category.trim(),
      description: draft.description.trim(),
      price,
      oldPrice,
      image: draft.image.trim(),
      sizes,
      colors,
      tag: draft.tag.trim() || undefined,
      available: draft.available
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
                  <input type="url" value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} placeholder="Cole uma URL ou envie uma imagem abaixo" required />
                </label>
                <label className="wide">Enviar imagem para o Supabase Storage (PNG, JPG ou WebP; até 5 MB)
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} disabled={uploadingImage} />
                  {uploadingImage && <span role="status">Enviando imagem...</span>}
                  {draft.image && <img className="image-preview" src={draft.image} alt="Pré-visualização da imagem do produto" />}
                </label>
                <label className="wide">Descrição
                  <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required />
                </label>
                <label className="wide">Tamanhos disponíveis (separados por vírgula)
                  <input value={draft.sizes} onChange={(event) => setDraft({ ...draft, sizes: event.target.value })} placeholder="P, M, G, GG" required />
                </label>
                <label className="wide">Cores disponíveis (uma por linha: Nome | #hex)
                  <textarea value={draft.colors} onChange={(event) => setDraft({ ...draft, colors: event.target.value })} placeholder={'Rosa | #E5A1AD\nPreto | #292528'} required />
                </label>
                <label>Etiqueta opcional
                  <input value={draft.tag} onChange={(event) => setDraft({ ...draft, tag: event.target.value })} placeholder="Novo, Mais vendido..." />
                </label>
                <label className="check">
                  <input type="checkbox" checked={draft.available} onChange={(event) => setDraft({ ...draft, available: event.target.checked })} />
                  Produto disponível para compra
                </label>
                <div className="wide actions">
                  <AdminButton type="submit" disabled={saving || uploadingImage}>{uploadingImage ? 'Enviando imagem...' : saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar peça'}</AdminButton>
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
                        <p>{product.category} · {product.sizes.join(', ')} · {product.colors.map((color) => color.name).join(', ')}</p>
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

            <AdminButton type="button" className="secondary" onClick={handleLogout}>Sair da administração</AdminButton>
          </>
        )}
      </AdminContainer>
    </AdminPage>
  )
}

export default Admin
