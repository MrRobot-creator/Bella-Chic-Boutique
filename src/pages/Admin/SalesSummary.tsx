import { useCallback, useEffect, useMemo, useState } from 'react'
import { Product } from '../../types/store'
import { fetchOrdersSince, StoreOrder } from '../../services/orders'
import { getLowStockVariants } from '../../utils/inventory'
import { buildSalesSummary, downloadTextFile, ordersToCsv, startOfMonth } from '../../utils/reports'
import { AdminButton, AdminNotice, AdminPanel, PanelHeading, StatGrid, SummaryColumns } from './styles'

type Period = 'month' | 'last-month' | '30d' | '90d' | 'all'

const periodLabels: Record<Period, string> = {
  month: 'Este mês',
  'last-month': 'Mês passado',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  all: 'Todo o período'
}

const getPeriodRange = (period: Period, now = new Date()): { since: Date | null; until: Date | null } => {
  if (period === 'month') return { since: startOfMonth(now), until: null }
  if (period === 'last-month') {
    return { since: new Date(now.getFullYear(), now.getMonth() - 1, 1), until: startOfMonth(now) }
  }
  if (period === '30d') return { since: new Date(now.getTime() - 30 * 86400000), until: null }
  if (period === '90d') return { since: new Date(now.getTime() - 90 * 86400000), until: null }
  return { since: null, until: null }
}

const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type SalesSummaryProps = {
  products: Product[]
  refreshKey: number
}

const SalesSummary = ({ products, refreshKey }: SalesSummaryProps) => {
  const [period, setPeriod] = useState<Period>('month')
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (selected: Period) => {
    setLoading(true)
    setError('')
    try {
      const { since, until } = getPeriodRange(selected)
      const loaded = await fetchOrdersSince(since)
      setOrders(until ? loaded.filter((order) => new Date(order.created_at) < until) : loaded)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o resumo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(period)
  }, [load, period, refreshKey])

  const summary = useMemo(
    () => buildSalesSummary(orders, getPeriodRange(period).since || new Date(0)),
    [orders, period]
  )
  const lowStock = useMemo(() => getLowStockVariants(products), [products])

  const exportCsv = () => {
    const today = new Date().toISOString().slice(0, 10)
    const slug = period === 'all' ? 'todos' : period
    downloadTextFile(`pedidos-bella-chic-${slug}-${today}.csv`, ordersToCsv(orders))
  }

  return (
    <AdminPanel>
      <PanelHeading>
        <h2>Resumo de vendas</h2>
        <div className="controls">
          <label className="sr-only" htmlFor="summary-period">Período</label>
          <select id="summary-period" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
            {(Object.keys(periodLabels) as Period[]).map((option) => (
              <option key={option} value={option}>{periodLabels[option]}</option>
            ))}
          </select>
          <AdminButton type="button" className="secondary" onClick={exportCsv} disabled={loading || orders.length === 0}>
            Exportar pedidos (planilha)
          </AdminButton>
        </div>
      </PanelHeading>

      {error && <AdminNotice $error role="alert">{error}</AdminNotice>}

      <StatGrid aria-busy={loading}>
        <div className="stat">
          <span>Faturamento confirmado</span>
          <strong>{loading ? '…' : formatPrice(summary.revenue)}</strong>
          <small>peças após desconto, sem frete</small>
        </div>
        <div className="stat">
          <span>Vendas confirmadas</span>
          <strong>{loading ? '…' : summary.confirmedCount}</strong>
          <small>{loading ? '' : `${summary.itemsSold} ${summary.itemsSold === 1 ? 'peça vendida' : 'peças vendidas'}`}</small>
        </div>
        <div className="stat">
          <span>Ticket médio</span>
          <strong>{loading ? '…' : formatPrice(summary.averageTicket)}</strong>
          <small>por venda confirmada</small>
        </div>
        <div className="stat">
          <span>Aguardando confirmação</span>
          <strong>{loading ? '…' : summary.pendingCount}</strong>
          <small>{loading ? '' : `${summary.cancelledCount} cancelado(s)`}</small>
        </div>
      </StatGrid>

      <SummaryColumns>
        <section>
          <h3>Mais vendidas · {periodLabels[period].toLowerCase()}</h3>
          {loading ? <p className="empty">Carregando…</p> : summary.topProducts.length === 0 ? (
            <p className="empty">Nenhuma venda confirmada neste período.</p>
          ) : (
            <ol>
              {summary.topProducts.map((product) => (
                <li key={product.productId}>
                  <strong>{product.name}</strong> — {product.quantity} {product.quantity === 1 ? 'peça' : 'peças'} · {formatPrice(product.revenue)}
                </li>
              ))}
            </ol>
          )}
        </section>
        <section>
          <h3>Estoque baixo ({lowStock.length})</h3>
          {lowStock.length === 0 ? (
            <p className="empty">Nenhuma variação com 2 unidades ou menos. 🎉</p>
          ) : (
            <ul>
              {lowStock.slice(0, 12).map((variant) => (
                <li key={`${variant.productId}-${variant.size}-${variant.color}`} className={variant.quantity === 0 ? 'zero' : 'low'}>
                  {variant.productName} · {variant.size} · {variant.color} — {variant.quantity === 0 ? 'esgotada' : `${variant.quantity} un.`}
                </li>
              ))}
              {lowStock.length > 12 && <li className="empty">e mais {lowStock.length - 12} variações…</li>}
            </ul>
          )}
        </section>
      </SummaryColumns>
    </AdminPanel>
  )
}

export default SalesSummary
