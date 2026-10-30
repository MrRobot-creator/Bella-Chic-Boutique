import { useCallback, useEffect, useState } from 'react'
import { Product } from '../../types/store'
import { fetchStockMovements, StockMovement, stockReasonLabel } from '../../services/stock'
import { downloadTextFile } from '../../utils/reports'
import { AdminButton, AdminNotice, AdminPanel, DataTable, PanelHeading } from './styles'

type StockHistoryPanelProps = {
  products: Product[]
  refreshKey: number
}

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value)
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

const StockHistoryPanel = ({ products, refreshKey }: StockHistoryPanelProps) => {
  const [productId, setProductId] = useState('')
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setMovements(await fetchStockMovements({ productId: productId ? Number(productId) : undefined, limit: 300 }))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o histórico.')
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => { load() }, [load, refreshKey])

  const exportCsv = () => {
    const header = ['Data', 'Peça', 'Tamanho', 'Cor', 'Mudança', 'Saldo', 'Motivo', 'Pedido']
    const rows = movements.map((movement) => [
      new Date(movement.createdAt).toLocaleString('pt-BR'), movement.productName, movement.size, movement.color,
      movement.delta, movement.balanceAfter, stockReasonLabel[movement.reason], movement.orderReference || ''
    ])
    downloadTextFile(`estoque-bella-chic-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n'))
  }

  return (
    <AdminPanel>
      <PanelHeading>
        <h2>Histórico de estoque</h2>
        <div className="controls">
          <label className="sr-only" htmlFor="stock-product">Peça</label>
          <select id="stock-product" value={productId} onChange={(event) => setProductId(event.target.value)}>
            <option value="">Todas as peças</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
          <AdminButton type="button" className="secondary" onClick={exportCsv} disabled={!movements.length}>Exportar (planilha)</AdminButton>
        </div>
      </PanelHeading>
      <p>Cada entrada e saída fica registrada: reservas e confirmações de pedidos, vendas no balcão, cancelamentos e ajustes feitos na grade da peça.</p>
      {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
      {loading ? <p>Carregando...</p> : movements.length === 0 ? <p>Nenhuma movimentação registrada ainda.</p> : (
        <DataTable>
          <table>
            <thead><tr><th>Data</th><th>Peça</th><th>Variação</th><th>Mudança</th><th>Saldo</th><th>Motivo</th></tr></thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="muted">{new Date(movement.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{movement.productName}</td>
                  <td>{movement.size} · {movement.color}</td>
                  <td className={movement.delta > 0 ? 'in' : 'out'}>{movement.delta > 0 ? `+${movement.delta}` : movement.delta}</td>
                  <td>{movement.balanceAfter}</td>
                  <td>{stockReasonLabel[movement.reason]}{movement.orderReference ? <span className="muted"> · {movement.orderReference}</span> : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      )}
    </AdminPanel>
  )
}

export default StockHistoryPanel
