import { useCallback, useEffect, useMemo, useState } from 'react'
import { Product } from '../../types/store'
import {
  deleteRestockRequest,
  fetchRestockRequests,
  markRestockNotified,
  RestockRequest
} from '../../services/restock'
import { getVariantStock } from '../../utils/inventory'
import { getProductPath } from '../../utils/productLink'
import { AdminButton, AdminNotice, AdminPanel, PanelHeading, RestockList } from './styles'

type RestockPanelProps = {
  products: Product[]
}

const buildMessage = (request: RestockRequest, product: Product | undefined) => {
  const greeting = request.customer_name ? `Oi, ${request.customer_name.split(' ')[0]}!` : 'Oi!'
  const link = product ? `${window.location.origin}${getProductPath(product)}` : window.location.origin
  return `${greeting} Aqui é da Bella Chic Boutique 💕 A peça ${request.product_name} (${request.size}, ${request.color}) que você pediu para avisar voltou ao estoque! Veja aqui: ${link}`
}

const RestockPanel = ({ products }: RestockPanelProps) => {
  const [requests, setRequests] = useState<RestockRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNotified, setShowNotified] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRequests(await fetchRestockRequests())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os avisos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const productsById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])

  const visible = useMemo(() => {
    const filtered = requests.filter((request) => showNotified || request.status === 'waiting')
    const inStock = (request: RestockRequest) => {
      const product = productsById.get(request.product_id)
      return product && product.enabled !== false ? getVariantStock(product.variantStock, request.size, request.color) : 0
    }
    // Quem já pode ser avisada (peça voltou) aparece primeiro.
    return [...filtered].sort((first, second) =>
      Number(second.status === 'waiting' && inStock(second) > 0) - Number(first.status === 'waiting' && inStock(first) > 0)
    ).map((request) => ({ request, stock: inStock(request) }))
  }, [productsById, requests, showNotified])

  const waitingCount = requests.filter((request) => request.status === 'waiting').length
  const readyCount = visible.filter(({ request, stock }) => request.status === 'waiting' && stock > 0).length

  const notify = async (request: RestockRequest) => {
    setBusyId(request.id)
    setError('')
    try {
      await markRestockNotified(request.id)
      setRequests((current) => current.map((item) => item.id === request.id
        ? { ...item, status: 'notified', notified_at: new Date().toISOString() }
        : item))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Não foi possível marcar como avisada.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (request: RestockRequest) => {
    if (!window.confirm(`Remover o pedido de aviso de ${request.customer_name || request.phone}?`)) return
    setBusyId(request.id)
    setError('')
    try {
      await deleteRestockRequest(request.id)
      setRequests((current) => current.filter((item) => item.id !== request.id))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Não foi possível remover o aviso.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminPanel>
      <PanelHeading>
        <h2>Avise-me quando chegar ({waitingCount})</h2>
        <div className="controls">
          <AdminButton type="button" className="secondary" aria-pressed={showNotified} onClick={() => setShowNotified((value) => !value)}>
            {showNotified ? 'Ocultar já avisadas' : 'Mostrar já avisadas'}
          </AdminButton>
          <AdminButton type="button" className="secondary" onClick={load} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </AdminButton>
        </div>
      </PanelHeading>
      <p>
        Clientes que pediram aviso de peças esgotadas. Quando a peça voltar ao estoque, ela aparece em verde no topo:
        clique em “Avisar no WhatsApp” para abrir a conversa com a mensagem pronta.
        {readyCount > 0 && <> <strong>{readyCount} {readyCount === 1 ? 'cliente já pode' : 'clientes já podem'} ser avisada(s).</strong></>}
      </p>
      {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
      {loading ? <p>Carregando avisos...</p> : visible.length === 0 ? (
        <p>Nenhum pedido de aviso {showNotified ? 'registrado' : 'aguardando'}.</p>
      ) : (
        <RestockList>
          {visible.map(({ request, stock }) => {
            const product = productsById.get(request.product_id)
            const digits = request.phone_digits.startsWith('55') ? request.phone_digits : `55${request.phone_digits}`
            const ready = request.status === 'waiting' && stock > 0
            return (
              <article key={request.id} className={ready ? 'ready' : ''}>
                <div>
                  <h3>
                    {request.product_name}
                    {request.status === 'notified'
                      ? <span className="tag done">Avisada</span>
                      : ready ? <span className="tag">Voltou: {stock} un.</span> : <span className="tag waiting">Ainda esgotada</span>}
                  </h3>
                  <p>{request.size} · {request.color}</p>
                  <p>
                    <strong>{request.customer_name || 'Cliente'}</strong> · {request.phone} · pediu em {new Date(request.created_at).toLocaleDateString('pt-BR')}
                    {request.notified_at ? ` · avisada em ${new Date(request.notified_at).toLocaleDateString('pt-BR')}` : ''}
                  </p>
                </div>
                <div className="actions">
                  {request.status === 'waiting' && (
                    <a
                      className="whatsapp"
                      href={`https://wa.me/${digits}?text=${encodeURIComponent(buildMessage(request, product))}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => notify(request)}
                      aria-disabled={busyId === request.id}
                    >
                      Avisar no WhatsApp
                    </a>
                  )}
                  <AdminButton type="button" className="secondary" disabled={busyId === request.id} onClick={() => remove(request)}>
                    Remover
                  </AdminButton>
                </div>
              </article>
            )
          })}
        </RestockList>
      )}
    </AdminPanel>
  )
}

export default RestockPanel
