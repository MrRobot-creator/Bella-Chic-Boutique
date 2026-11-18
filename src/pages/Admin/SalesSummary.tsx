import { useCallback, useEffect, useMemo, useState } from 'react'
import { Product } from '../../types/store'
import { fetchOrdersSince, StoreOrder } from '../../services/orders'
import { getLowStockVariants } from '../../utils/inventory'
import {
  buildSalesSummary, changePercent, CustomDates, DateRange, downloadTextFile, ordersInRange, ordersOfUnit, ordersToCsv,
  periodRange, previousRange, SalesPeriod, startOfMonth, toDateInput
} from '../../utils/reports'
import { storeConfig } from '../../config/store'
import { unitNameOf } from '../../utils/units'
import { AdminButton, AdminNotice, AdminPanel, CompareNote, DataTable, PanelHeading, StatGrid, SummaryColumns } from './styles'

const periodLabels: Record<SalesPeriod, string> = {
  week: 'Esta semana',
  month: 'Este mês',
  'last-month': 'Mês passado',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  year: 'Este ano',
  custom: 'Escolher datas',
  all: 'Todo o período'
}

const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const salesCount = (count: number) => `${count} ${count === 1 ? 'venda' : 'vendas'}`

/** "1 de nov. a 18 de nov." (com o ano quando não é o atual). */
const rangeText = ({ since, until }: DateRange) => {
  if (!since) return 'todo o período'
  const last = new Date((until || new Date()).getTime() - 1)
  const withYear = since.getFullYear() !== new Date().getFullYear() || last.getFullYear() !== since.getFullYear()
  const format = (date: Date) => date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) })
  return `${format(since)} a ${format(last)}`
}

/** Variação em relação ao período anterior; nada quando não há comparação. */
const Delta = ({ current, previous }: { current: number; previous?: number }) => {
  if (previous === undefined || (previous === 0 && current === 0)) return null
  const change = changePercent(current, previous)
  if (change === null) return <span className="delta up">sem vendas no período anterior</span>
  if (change === 0) return <span className="delta flat">igual ao período anterior</span>
  return <span className={`delta ${change > 0 ? 'up' : 'down'}`}>{change > 0 ? '↑' : '↓'} {Math.abs(change)}% vs. período anterior</span>
}

type SalesSummaryProps = {
  products: Product[]
  refreshKey: number
  /** Loja da atendente (o banco só devolve a dela); null para a dona. */
  adminUnitId: string | null
}

const SalesSummary = ({ products, refreshKey, adminUnitId }: SalesSummaryProps) => {
  const [period, setPeriod] = useState<SalesPeriod>('month')
  const [custom, setCustom] = useState<CustomDates>(() => ({ from: toDateInput(startOfMonth(new Date())), to: toDateInput(new Date()) }))
  const [unitFilter, setUnitFilter] = useState('')
  const [allOrders, setOrders] = useState<StoreOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  /** Período escolhido e o trecho equivalente anterior (para comparar). */
  const ranges = useMemo(() => {
    const now = new Date()
    const current = periodRange(period, now, custom)
    return { current, previous: current ? previousRange(period, current, now) : null }
  }, [period, custom])

  const load = useCallback(async (current: DateRange, previous: DateRange | null) => {
    setLoading(true)
    setError('')
    try {
      // Uma busca só: desde o começo do período anterior, que vem antes do atual.
      setOrders(await fetchOrdersSince(previous ? previous.since : current.since))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o resumo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!ranges.current) {
      setOrders([])
      setLoading(false)
      return
    }
    load(ranges.current, ranges.previous)
  }, [load, ranges, refreshKey])

  const unitId = adminUnitId || unitFilter || null
  const unitOrders = useMemo(() => ordersOfUnit(allOrders, unitId), [allOrders, unitId])
  const orders = useMemo(() => (ranges.current ? ordersInRange(unitOrders, ranges.current) : []), [unitOrders, ranges])
  const summary = useMemo(() => buildSalesSummary(orders, new Date(0)), [orders])
  const previous = useMemo(
    () => (ranges.previous ? buildSalesSummary(ordersInRange(unitOrders, ranges.previous), new Date(0)) : null),
    [unitOrders, ranges]
  )
  const byUnit = useMemo(
    () => buildSalesSummary(ranges.current ? ordersInRange(allOrders, ranges.current) : [], new Date(0)).byUnit,
    [allOrders, ranges]
  )
  const lowStock = useMemo(() => getLowStockVariants(products, unitId), [products, unitId])
  const periodTitle = period === 'custom' && ranges.current ? rangeText(ranges.current) : periodLabels[period].toLowerCase()
  const showDelta = !loading && previous

  const exportCsv = () => {
    const today = new Date().toISOString().slice(0, 10)
    const slug = period === 'all' ? 'todos' : period === 'custom' ? `${custom.from}-a-${custom.to}` : period
    const unitSlug = unitId ? `-${unitId}` : ''
    downloadTextFile(`pedidos-bella-chic${unitSlug}-${slug}-${today}.csv`, ordersToCsv(orders))
  }

  return (
    <AdminPanel>
      <PanelHeading>
        <h2>Resumo de vendas{unitId ? ` · ${unitNameOf(unitId)}` : ''}</h2>
        <div className="controls">
          {!adminUnitId && (
            <>
              <label className="sr-only" htmlFor="summary-unit">Loja</label>
              <select id="summary-unit" value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)}>
                <option value="">As duas lojas</option>
                {storeConfig.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
              </select>
            </>
          )}
          <label className="sr-only" htmlFor="summary-period">Período</label>
          <select id="summary-period" value={period} onChange={(event) => setPeriod(event.target.value as SalesPeriod)}>
            {(Object.keys(periodLabels) as SalesPeriod[]).map((option) => (
              <option key={option} value={option}>{periodLabels[option]}</option>
            ))}
          </select>
          {period === 'custom' && (
            <>
              <label htmlFor="summary-from">De</label>
              <input id="summary-from" type="date" value={custom.from} max={custom.to || undefined} onChange={(event) => setCustom((dates) => ({ ...dates, from: event.target.value }))} />
              <label htmlFor="summary-to">até</label>
              <input id="summary-to" type="date" value={custom.to} min={custom.from || undefined} onChange={(event) => setCustom((dates) => ({ ...dates, to: event.target.value }))} />
            </>
          )}
          <AdminButton type="button" className="secondary" onClick={exportCsv} disabled={loading || orders.length === 0}>
            Exportar pedidos (planilha)
          </AdminButton>
        </div>
      </PanelHeading>

      {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
      {!ranges.current && <AdminNotice role="status">Escolha as duas datas, com a primeira antes ou igual à segunda.</AdminNotice>}
      {ranges.previous && <CompareNote>Comparando com o mesmo trecho do período anterior: {rangeText(ranges.previous)}.</CompareNote>}

      <StatGrid aria-busy={loading}>
        <div className="stat">
          <span>Faturamento confirmado</span>
          <strong>{loading ? '…' : formatPrice(summary.revenue)}</strong>
          <small>site e balcão, peças após desconto, sem frete</small>
          {showDelta && <Delta current={summary.revenue} previous={previous.revenue} />}
        </div>
        <div className="stat">
          <span>Vendas pelo site</span>
          <strong>{loading ? '…' : formatPrice(summary.siteRevenue)}</strong>
          <small>{loading ? '' : salesCount(summary.siteCount)}</small>
          {showDelta && <Delta current={summary.siteRevenue} previous={previous.siteRevenue} />}
        </div>
        <div className="stat">
          <span>Vendas no balcão</span>
          <strong>{loading ? '…' : formatPrice(summary.storeRevenue)}</strong>
          <small>{loading ? '' : salesCount(summary.storeCount)}</small>
          {showDelta && <Delta current={summary.storeRevenue} previous={previous.storeRevenue} />}
        </div>
        <div className="stat">
          <span>Vendas</span>
          <strong>{loading ? '…' : summary.confirmedCount}</strong>
          <small>{loading ? '' : `${summary.itemsSold} ${summary.itemsSold === 1 ? 'peça vendida' : 'peças vendidas'}`}</small>
          {showDelta && <Delta current={summary.confirmedCount} previous={previous.confirmedCount} />}
        </div>
        <div className="stat">
          <span>Ticket médio</span>
          <strong>{loading ? '…' : formatPrice(summary.averageTicket)}</strong>
          <small>por venda confirmada</small>
          {showDelta && <Delta current={summary.averageTicket} previous={previous.averageTicket} />}
        </div>
        <div className="stat">
          <span>Aguardando confirmação</span>
          <strong>{loading ? '…' : summary.pendingCount}</strong>
          <small>{loading ? '' : `${summary.cancelledCount} cancelado(s)`}</small>
        </div>
      </StatGrid>

      {!adminUnitId && !unitFilter && (
        <DataTable style={{ marginBottom: 18 }}>
          <table>
            <thead>
              <tr><th>Loja</th><th style={{ textAlign: 'right' }}>Faturamento</th><th style={{ textAlign: 'right' }}>Vendas</th><th style={{ textAlign: 'right' }}>Site</th><th style={{ textAlign: 'right' }}>Balcão</th></tr>
            </thead>
            <tbody>
              {byUnit.map((unit) => (
                <tr key={unit.unitId}>
                  <td>{unit.name}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}><strong>{loading ? '…' : formatPrice(unit.revenue)}</strong></td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{loading ? '…' : unit.count}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{loading ? '…' : `${unit.siteCount} · ${formatPrice(unit.siteRevenue)}`}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{loading ? '…' : `${unit.storeCount} · ${formatPrice(unit.storeRevenue)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      )}

      <SummaryColumns>
        <section>
          <h3>Mais vendidas · {periodTitle}</h3>
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
          <h3>Estoque baixo{unitId ? ` na ${unitNameOf(unitId)}` : ''} ({lowStock.length})</h3>
          {lowStock.length === 0 ? (
            <p className="empty">Nenhuma variação com 2 unidades ou menos.</p>
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
