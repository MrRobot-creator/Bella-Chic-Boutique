import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  cancelStoreOrder,
  confirmStoreOrder,
  fetchAdminOrders,
  orderStatusLabel,
  orderTotal,
  StoreOrder,
  updateOrderStatus
} from '../../services/orders'
import { hasPix, StoreSettings } from '../../services/settings'
import { storeConfig } from '../../config/store'
import { orderUnitId, unitNameOf } from '../../utils/units'
import { createWhatsAppUrl } from '../../services/whatsapp'
import { customerWhatsApp, MessageStep, orderPixPayload, orderStatusMessage } from '../../utils/orderMessages'
import { AdminButton, AdminNotice, AdminPanel, OrderList, OrderRow, PanelHeading } from './styles'

type Filter = 'open' | 'progress' | 'done' | 'cancelled' | 'all'

const filterLabels: Record<Filter, string> = {
  open: 'Novos',
  progress: 'Em andamento',
  done: 'Concluídos',
  cancelled: 'Cancelados',
  all: 'Todos'
}

const matchesFilter = (order: StoreOrder, filter: Filter) => {
  if (filter === 'open') return order.status === 'pending'
  if (filter === 'progress') return order.status === 'confirmed' || order.status === 'paid' || order.status === 'shipped'
  if (filter === 'done') return order.status === 'delivered'
  if (filter === 'cancelled') return order.status === 'cancelled'
  return true
}

const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const formatTime = (value: string) => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] as string))

/** Etiqueta de separação para imprimir e colar na sacola. */
const printLabel = (order: StoreOrder) => {
  const win = window.open('', '_blank', 'width=420,height=640')
  if (!win) return
  const addressLines = order.fulfillment.type === 'Entrega'
    ? [
        `${order.fulfillment.street}, ${order.fulfillment.houseNumber}${order.fulfillment.complement ? `, ${order.fulfillment.complement}` : ''}`,
        `${order.fulfillment.neighborhood} · ${order.fulfillment.deliveryCity}`,
        order.fulfillment.referencePoint ? `Ref.: ${order.fulfillment.referencePoint}` : ''
      ].filter(Boolean)
    : [`Retirada na ${order.unit.name}`]
  const address = addressLines.map(escapeHtml).join('<br>')
  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Etiqueta ${escapeHtml(order.reference)}</title>
<style>body{font:14px/1.45 Arial,sans-serif;margin:18px;color:#222}h1{font-size:18px;margin:0 0 4px}h2{font-size:13px;margin:14px 0 4px;text-transform:uppercase;letter-spacing:1px}
.box{border:2px dashed #999;border-radius:10px;padding:14px}ul{margin:0;padding-left:18px}.ref{font-size:22px;font-weight:bold;letter-spacing:1px}</style></head>
<body><div class="box"><h1>Bella Chic Boutique</h1><div class="ref">${escapeHtml(order.reference)}</div>
<h2>Cliente</h2>${escapeHtml(order.customer.name)}<br>${escapeHtml(order.customer.phone)}
<h2>${order.fulfillment.type === 'Entrega' ? 'Entrega' : 'Retirada'}</h2>${address}
<h2>Peças</h2><ul>${order.items.map((item) => `<li>${item.quantity}x ${escapeHtml(item.name)} · ${escapeHtml(item.size)} · ${escapeHtml(item.color)}</li>`).join('')}</ul>
<h2>Pagamento</h2>${escapeHtml(order.payment)} · ${formatPrice(orderTotal(order))}${order.paid_at ? ' (pago)' : ''}</div>
<script>window.onload=function(){window.print()}</script></body></html>`)
  win.document.close()
}

type OrdersPanelProps = {
  settings: StoreSettings
  refreshKey: number
  /** Loja da atendente (o banco só devolve os pedidos dela); null para a dona. */
  adminUnitId: string | null
  onChanged: () => void
}

const OrdersPanel = ({ settings, refreshKey, adminUnitId, onChanged }: OrdersPanelProps) => {
  const [allOrders, setOrders] = useState<StoreOrder[]>([])
  const [unitFilter, setUnitFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('open')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setOrders(await fetchAdminOrders(300))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os pedidos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const orders = useMemo(
    () => (unitFilter ? allOrders.filter((order) => orderUnitId(order) === unitFilter) : allOrders),
    [allOrders, unitFilter]
  )

  const counts = useMemo(() => {
    const result = {} as Record<Filter, number>
    ;(Object.keys(filterLabels) as Filter[]).forEach((key) => { result[key] = orders.filter((order) => matchesFilter(order, key)).length })
    return result
  }, [orders])

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return orders.filter((order) => matchesFilter(order, filter) && (
      !term || `${order.reference} ${order.customer.name} ${order.customer.phone}`.toLocaleLowerCase('pt-BR').includes(term)
    ))
  }, [filter, orders, search])

  const run = async (order: StoreOrder, action: () => Promise<void>, success: string) => {
    setError('')
    setNotice('')
    setProcessingId(order.id)
    try {
      await action()
      await load()
      onChanged()
      setNotice(success)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Não foi possível atualizar o pedido.')
    } finally {
      setProcessingId(null)
    }
  }

  const confirm = (order: StoreOrder) => {
    const message = order.stock_taken
      ? `Confirmar o pedido ${order.reference}? As peças já estão separadas.`
      : `Confirmar o pedido ${order.reference}? A reserva venceu: as peças serão separadas agora, se ainda houver estoque.`
    if (!window.confirm(message)) return
    run(order, () => confirmStoreOrder(order.id), `Pedido ${order.reference} confirmado.`)
  }

  const advance = (order: StoreOrder, status: 'paid' | 'shipped' | 'delivered', label: string) => {
    run(order, () => updateOrderStatus(order.id, status), `Pedido ${order.reference}: ${label.toLowerCase()}.`)
  }

  const cancel = (order: StoreOrder) => {
    const returns = order.stock_taken ? ' As peças voltam para o estoque.' : ''
    const reason = window.prompt(`Cancelar o pedido ${order.reference}?${returns}\n\nMotivo (opcional, aparece na mensagem para a cliente):`, '')
    if (reason === null) return
    run(order, () => cancelStoreOrder(order.id, reason), `Pedido ${order.reference} cancelado${order.stock_taken ? ' e peças devolvidas ao estoque' : ''}.`)
  }

  const copyPix = async (order: StoreOrder) => {
    const payload = orderPixPayload(order, settings)
    try {
      await navigator.clipboard.writeText(payload)
      setCopiedId(order.id)
      window.setTimeout(() => setCopiedId(null), 2500)
    } catch {
      window.prompt('Copie o Pix copia e cola:', payload)
    }
  }

  const messageStep = (order: StoreOrder): MessageStep | null => {
    if (order.status === 'pending') return null
    return order.status
  }

  return (
    <AdminPanel>
      <PanelHeading>
        <h2>Pedidos</h2>
        <div className="controls">
          <label className="sr-only" htmlFor="orders-search">Buscar pedido</label>
          {!adminUnitId && (
            <>
              <label className="sr-only" htmlFor="orders-unit">Loja</label>
              <select id="orders-unit" value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)} style={{ padding: '9px 10px', border: '1px solid #e8dedd', fontSize: 12 }}>
                <option value="">As duas lojas</option>
                {storeConfig.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
              </select>
            </>
          )}
          <input id="orders-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Código, nome ou WhatsApp" style={{ padding: '9px 10px', border: '1px solid #e8dedd', fontSize: 12 }} />
          <AdminButton type="button" className="secondary" disabled={loading} onClick={load}>{loading ? 'Atualizando...' : 'Atualizar'}</AdminButton>
        </div>
      </PanelHeading>
      <div className="filter-tabs" role="tablist" aria-label="Filtrar pedidos" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {(Object.keys(filterLabels) as Filter[]).map((key) => (
          <AdminButton key={key} type="button" role="tab" aria-selected={filter === key} className={filter === key ? '' : 'secondary'} onClick={() => setFilter(key)}>
            {filterLabels[key]} ({counts[key] || 0})
          </AdminButton>
        ))}
      </div>
      {adminUnitId && <p><strong>Pedidos da {unitNameOf(adminUnitId)}.</strong></p>}
      <p>Pedidos do site separam as peças da loja escolhida na hora, por {settings.reservationMinutes >= 60 ? `${Math.round(settings.reservationMinutes / 60)} h` : `${settings.reservationMinutes} min`}. Pedidos sem confirmação em {settings.pendingExpireHours} h são cancelados sozinhos e as peças voltam ao estoque.</p>
      {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
      {notice && <AdminNotice role="status">{notice}</AdminNotice>}
      {loading && !orders.length ? <p>Carregando pedidos...</p> : visible.length === 0 ? <p>Nenhum pedido aqui.</p> : (
        <OrderList>
          {visible.map((order) => {
            const busy = processingId === order.id
            const deliveryFee = order.fulfillment.deliveryFee
            const phone = customerWhatsApp(order.customer.phone)
            const step = messageStep(order)
            const reservationActive = order.status === 'pending' && order.stock_taken && order.reserved_until && new Date(order.reserved_until) > new Date()
            const isPickup = order.fulfillment.type !== 'Entrega'
            const canPix = order.payment === 'Pix' && hasPix(settings, orderUnitId(order)) && !order.paid_at && order.status !== 'cancelled' && order.channel === 'site'
            return (
              <OrderRow key={order.id}>
                <div className="order-heading">
                  <h3>{order.channel === 'balcao' ? 'Balcão' : 'Pedido'} {order.reference}</h3>
                  <span className={`order-status ${order.status}`}>{orderStatusLabel(order)}</span>
                </div>
                <p>{new Date(order.created_at).toLocaleString('pt-BR')} · {order.unit.name} · {order.payment}{order.couponCode ? ` · cupom ${order.couponCode}` : ''}</p>
                {order.channel === 'site' && (
                  <p><strong>{order.customer.name}</strong> · {phone ? <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">{order.customer.phone}</a> : order.customer.phone}{order.customer.email ? ` · ${order.customer.email}` : ''}</p>
                )}
                {order.channel === 'balcao' && order.customer.name !== 'Cliente no balcão' && <p><strong>{order.customer.name}</strong>{order.customer.phone ? ` · ${order.customer.phone}` : ''}</p>}
                <ul>
                  {order.items.map((item, index) => (
                    <li key={`${item.productId}-${item.size}-${item.color}-${index}`}>
                      {item.quantity}× {item.name} · {item.size}{item.sizeFit ? ` (${item.sizeFit})` : ''} · {item.color} — {formatPrice(item.unitPrice * item.quantity)}
                    </li>
                  ))}
                </ul>
                {order.channel === 'site' && (
                  <p>{order.fulfillment.type === 'Entrega'
                    ? `Entrega: ${order.fulfillment.street}, ${order.fulfillment.houseNumber}${order.fulfillment.complement ? `, ${order.fulfillment.complement}` : ''} · ${order.fulfillment.neighborhood}, ${order.fulfillment.deliveryCity}${deliveryFee === null ? ' · frete a combinar' : deliveryFee === 0 ? ' · frete grátis' : ` · frete ${formatPrice(deliveryFee)}`}`
                    : `Retirada em ${order.unit.address}`}</p>
                )}
                {order.fulfillment.type === 'Entrega' && (order.fulfillment.referencePoint || order.fulfillment.deliveryNotes) && (
                  <p>{[order.fulfillment.referencePoint ? `Referência: ${order.fulfillment.referencePoint}` : '', order.fulfillment.deliveryNotes ? `Observação: ${order.fulfillment.deliveryNotes}` : ''].filter(Boolean).join(' · ')}</p>
                )}
                <p>Subtotal: {formatPrice(order.subtotal)}{order.discount > 0 ? ` · Desconto: -${formatPrice(order.discount)}` : ''} · <strong>Total: {deliveryFee === null && order.fulfillment.type === 'Entrega' ? 'a combinar' : formatPrice(orderTotal(order))}</strong></p>
                {reservationActive && order.reserved_until && <p><strong>Peças separadas até {formatTime(order.reserved_until)}.</strong></p>}
                {order.status === 'pending' && !order.stock_taken && <p><strong>Reserva vencida:</strong> ao confirmar, as peças são separadas de novo se ainda houver estoque.</p>}
                {order.note && <p>Observação: {order.note}</p>}
                {order.cancel_reason && <p>Motivo do cancelamento: {order.cancel_reason}</p>}
                <div className="actions">
                  {order.status === 'pending' && (
                    <AdminButton type="button" disabled={busy} onClick={() => confirm(order)}>{busy ? 'Processando...' : 'Confirmar pedido'}</AdminButton>
                  )}
                  {(order.status === 'confirmed') && (
                    <AdminButton type="button" disabled={busy} onClick={() => advance(order, 'paid', 'Marcado como pago')}>Marcar como pago</AdminButton>
                  )}
                  {(order.status === 'confirmed' || order.status === 'paid') && (
                    <AdminButton type="button" disabled={busy} onClick={() => advance(order, 'shipped', isPickup ? 'Pronto para retirar' : 'Saiu para entrega')}>
                      {isPickup ? 'Pronto para retirar' : 'Saiu para entrega'}
                    </AdminButton>
                  )}
                  {(order.status === 'confirmed' || order.status === 'paid' || order.status === 'shipped') && (
                    <AdminButton type="button" disabled={busy} onClick={() => advance(order, 'delivered', 'Marcado como entregue')}>Marcar como entregue</AdminButton>
                  )}
                  {step && phone && order.channel === 'site' && (
                    <a className="whatsapp" href={createWhatsAppUrl(orderStatusMessage(order, step, settings, window.location.origin), phone)} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '10px 15px', background: '#2f7a46', color: '#fff', fontSize: 12, textDecoration: 'none' }}>
                      Avisar no WhatsApp ({orderStatusLabel(order).toLowerCase()})
                    </a>
                  )}
                  {canPix && (
                    <AdminButton type="button" className="secondary" onClick={() => copyPix(order)}>{copiedId === order.id ? 'Pix copiado!' : 'Copiar Pix do pedido'}</AdminButton>
                  )}
                  {order.channel === 'site' && order.status !== 'cancelled' && (
                    <AdminButton type="button" className="secondary" onClick={() => printLabel(order)}>Etiqueta</AdminButton>
                  )}
                  {order.status !== 'cancelled' && (
                    <AdminButton type="button" className="danger" disabled={busy} onClick={() => cancel(order)}>
                      {order.stock_taken ? 'Cancelar e devolver ao estoque' : 'Cancelar pedido'}
                    </AdminButton>
                  )}
                </div>
              </OrderRow>
            )
          })}
        </OrderList>
      )}
    </AdminPanel>
  )
}

export default OrdersPanel
