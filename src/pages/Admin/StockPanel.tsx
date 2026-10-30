import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Product } from '../../types/store'
import { storeConfig } from '../../config/store'
import { setUnitStock, StockChange, transferStock } from '../../services/stock'
import { getUnitStock, getUnitTotal, getVariantStock } from '../../utils/inventory'
import { AdminButton, AdminNotice, AdminPanel, DataTable, FormGrid, PanelHeading } from './styles'

type StockPanelProps = {
  products: Product[]
  /** Loja da atendente; null para a dona (mexe nas duas). */
  unitId: string | null
  focusProductId: number | null
  onChanged: () => Promise<void> | void
}

type Grid = Record<string, string>
type TransferLine = { key: number; productId: string; size: string; color: string; quantity: string }

const cellKey = (unit: string, size: string, color: string) => `${unit}|${size}|${color}`
const variationsOf = (product: Product) => product.sizes.flatMap((size) => product.colors.map((color) => ({ size, color: color.name })))

let lineKey = 0
const newLine = (): TransferLine => ({ key: ++lineKey, productId: '', size: '', color: '', quantity: '1' })

const gridOf = (product: Product): Grid => {
  const grid: Grid = {}
  storeConfig.units.forEach((unit) => variationsOf(product).forEach(({ size, color }) => {
    grid[cellKey(unit.id, size, color)] = String(getUnitStock(product.unitStock, unit.id, size, color))
  }))
  return grid
}

const StockPanel = ({ products, unitId, focusProductId, onChanged }: StockPanelProps) => {
  const units = storeConfig.units
  const editableUnits = unitId ? units.filter((unit) => unit.id === unitId) : units
  const [editingId, setEditingId] = useState<number | null>(focusProductId)
  const [grid, setGrid] = useState<Grid>({})
  const [reason, setReason] = useState<'entrada' | 'ajuste'>('entrada')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [fromUnit, setFromUnit] = useState(unitId || units[0].id)
  const [lines, setLines] = useState<TransferLine[]>([newLine()])
  const [transferNote, setTransferNote] = useState('')
  const [transferring, setTransferring] = useState(false)

  const perStore = products.some((product) => product.unitStock)
  const sorted = useMemo(() => [...products].sort((a, b) => Number(b.enabled !== false) - Number(a.enabled !== false) || a.name.localeCompare(b.name, 'pt-BR')), [products])
  const editing = products.find((product) => product.id === editingId) || null
  const toUnit = units.find((unit) => unit.id !== fromUnit) || units[1]

  useEffect(() => { if (focusProductId) setEditingId(focusProductId) }, [focusProductId])
  useEffect(() => { if (unitId) setFromUnit(unitId) }, [unitId])

  // Recarrega a grade quando a peça muda ou o estoque é atualizado (pedido novo, outra pessoa lançou).
  useEffect(() => { if (editing) setGrid(gridOf(editing)) }, [editing])

  const open = (product: Product) => {
    setEditingId(product.id)
    setReason('entrada')
    setNote('')
    setError('')
    setNotice('')
  }

  const saveGrid = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editing) return
    setError('')
    setNotice('')
    const byUnit = editableUnits.map((unit) => {
      const changes: StockChange[] = variationsOf(editing).flatMap(({ size, color }) => {
        const from = getUnitStock(editing.unitStock, unit.id, size, color)
        const raw = grid[cellKey(unit.id, size, color)] ?? String(from)
        const to = raw.trim() === '' ? 0 : Number(raw)
        return to === from ? [] : [{ size, color, from, to }]
      })
      return { unit, changes }
    }).filter((entry) => entry.changes.length)
    if (byUnit.some(({ changes }) => changes.some((change) => !Number.isInteger(change.to) || change.to < 0))) {
      setError('Use números inteiros, sem negativos.')
      return
    }
    if (!byUnit.length) {
      setNotice('Nada mudou na grade.')
      return
    }
    setSaving(true)
    try {
      for (const { unit, changes } of byUnit) await setUnitStock(editing.id, unit.id, changes, reason, note)
      const total = byUnit.reduce((sum, { changes }) => sum + changes.reduce((acc, change) => acc + change.to - change.from, 0), 0)
      setNotice(`${editing.name}: estoque salvo (${total >= 0 ? '+' : ''}${total} ${Math.abs(total) === 1 ? 'peça' : 'peças'}).`)
      setNote('')
      await onChanged()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o estoque.')
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  const updateLine = (key: number, change: Partial<TransferLine>) =>
    setLines((current) => current.map((line) => {
      if (line.key !== key) return line
      const next = { ...line, ...change }
      if (change.productId !== undefined) {
        const product = products.find((item) => String(item.id) === change.productId)
        next.size = product?.sizes.length === 1 ? product.sizes[0] : ''
        next.color = product?.colors.length === 1 ? product.colors[0].name : ''
      }
      return next
    }))

  const submitTransfer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    const items = lines.filter((line) => line.productId).map((line) => ({
      productId: Number(line.productId), size: line.size, color: line.color, quantity: Number(line.quantity)
    }))
    if (!items.length) {
      setError('Escolha pelo menos uma peça para transferir.')
      return
    }
    if (items.some((item) => !item.size || !item.color || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      setError('Escolha tamanho, cor e quantidade de cada peça.')
      return
    }
    for (const item of items) {
      const product = products.find((candidate) => candidate.id === item.productId)
      const available = product ? getUnitStock(product.unitStock, fromUnit, item.size, item.color) : 0
      if (item.quantity > available) {
        setError(`${product?.name || 'Peça'} (${item.size}, ${item.color}): a ${units.find((unit) => unit.id === fromUnit)?.name} tem só ${available}.`)
        return
      }
    }
    setTransferring(true)
    try {
      const moved = await transferStock(fromUnit, toUnit.id, items, transferNote)
      setNotice(`${moved} ${moved === 1 ? 'peça transferida' : 'peças transferidas'} para a ${toUnit.name}.`)
      setLines([newLine()])
      setTransferNote('')
      await onChanged()
    } catch (transferError) {
      setError(transferError instanceof Error ? transferError.message : 'Não foi possível transferir.')
    } finally {
      setTransferring(false)
    }
  }

  if (!perStore) {
    return (
      <AdminPanel>
        <h2>Estoque por loja</h2>
        <AdminNotice role="status">Para separar o estoque da Galeria e da Cidade Nova, rode <b>supabase/v5-unidades.sql</b> no SQL Editor do Supabase. O estoque atual vai inteiro para a Galeria.</AdminNotice>
      </AdminPanel>
    )
  }

  return (
    <>
      <AdminPanel>
        <PanelHeading>
          <h2>Estoque por loja</h2>
        </PanelHeading>
        <p>
          {unitId
            ? `Você vê o estoque das duas lojas para ajudar nas vendas, e lança o da ${units.find((unit) => unit.id === unitId)?.name}.`
            : 'A mercadoria nova entra pela Galeria. Depois, use a transferência para mandar peças para a Cidade Nova.'}
        </p>
        {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
        {notice && <AdminNotice role="status">{notice}</AdminNotice>}
        <DataTable>
          <table>
            <thead>
              <tr>
                <th>Peça</th>
                {units.map((unit) => <th key={unit.id} style={{ textAlign: 'right' }}>{unit.name}</th>)}
                <th style={{ textAlign: 'right' }}>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map((product) => {
                const total = (product.variantStock || []).reduce((sum, variant) => sum + variant.quantity, 0)
                return (
                  <tr key={product.id} style={editingId === product.id ? { background: '#fbf1f2' } : undefined}>
                    <td>{product.name}{product.enabled === false && <span className="muted"> · inativa</span>}</td>
                    {units.map((unit) => {
                      const inUnit = getUnitTotal(product, unit.id)
                      return <td key={unit.id} className={inUnit === 0 ? 'muted' : ''} style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{inUnit}</td>
                    })}
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}><strong>{total}</strong></td>
                    <td><AdminButton type="button" className="secondary" onClick={() => open(product)}>{editingId === product.id ? 'Lançando' : 'Lançar'}</AdminButton></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </DataTable>
      </AdminPanel>

      {editing && (
        <AdminPanel>
          <PanelHeading>
            <h2>{editing.name}</h2>
            <div className="controls">
              <AdminButton type="button" className="secondary" onClick={() => setEditingId(null)}>Fechar</AdminButton>
            </div>
          </PanelHeading>
          <form onSubmit={saveGrid}>
            <FormGrid>
              <label>O que aconteceu
                <select id="stock-reason" value={reason} onChange={(event) => setReason(event.target.value as 'entrada' | 'ajuste')}>
                  <option value="entrada">Chegou mercadoria</option>
                  <option value="ajuste">Correção de contagem</option>
                </select>
              </label>
              <label className="wide" style={{ gridColumn: 'span 2' }}>Observação (opcional)
                <input id="stock-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} placeholder="Ex.: nota do fornecedor 1234, peça com defeito" />
              </label>
            </FormGrid>
            <DataTable style={{ margin: '16px 0' }}>
              <table>
                <thead>
                  <tr>
                    <th>Variação</th>
                    {units.map((unit) => <th key={unit.id}>{unit.name}</th>)}
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {variationsOf(editing).map(({ size, color }) => (
                    <tr key={`${size}-${color}`}>
                      <td>{size} · {color}</td>
                      {units.map((unit) => {
                        const key = cellKey(unit.id, size, color)
                        const canEdit = editableUnits.some((candidate) => candidate.id === unit.id)
                        return (
                          <td key={unit.id}>
                            {canEdit ? (
                              <input
                                id={`stock-${editing.id}-${key}`}
                                aria-label={`${unit.name}, ${size} ${color}`}
                                type="number" min="0" step="1"
                                value={grid[key] ?? ''}
                                onChange={(event) => setGrid((current) => ({ ...current, [key]: event.target.value }))}
                                style={{ width: 80, padding: 8 }}
                              />
                            ) : <span style={{ fontVariantNumeric: 'tabular-nums' }}>{getUnitStock(editing.unitStock, unit.id, size, color)}</span>}
                          </td>
                        )
                      })}
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{getVariantStock(editing.variantStock, size, color)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTable>
            <AdminButton type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar estoque'}</AdminButton>
          </form>
        </AdminPanel>
      )}

      <AdminPanel>
        <h2>Transferir entre lojas</h2>
        <p>As peças saem de uma loja e entram na outra na hora, e as duas ficam registradas no histórico.</p>
        <form onSubmit={submitTransfer}>
          <FormGrid>
            <label>De
              {unitId ? (
                <input id="transfer-from" value={units.find((unit) => unit.id === unitId)?.name || ''} readOnly />
              ) : (
                <select id="transfer-from" value={fromUnit} onChange={(event) => setFromUnit(event.target.value)}>
                  {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                </select>
              )}
            </label>
            <label>Para
              <input id="transfer-to" value={toUnit.name} readOnly />
            </label>
            <label>Observação (opcional)
              <input id="transfer-note" value={transferNote} onChange={(event) => setTransferNote(event.target.value)} maxLength={200} placeholder="Ex.: reposição da semana" />
            </label>
          </FormGrid>
          <DataTable style={{ margin: '16px 0' }}>
            <table>
              <thead><tr><th>Peça</th><th>Tamanho</th><th>Cor</th><th>Qtd.</th><th>Tem na origem</th><th /></tr></thead>
              <tbody>
                {lines.map((line) => {
                  const product = products.find((item) => String(item.id) === line.productId)
                  const available = product && line.size && line.color ? getUnitStock(product.unitStock, fromUnit, line.size, line.color) : null
                  return (
                    <tr key={line.key}>
                      <td style={{ minWidth: 180 }}>
                        <select aria-label="Peça" value={line.productId} onChange={(event) => updateLine(line.key, { productId: event.target.value })} style={{ width: '100%', padding: 8 }}>
                          <option value="">Escolha a peça</option>
                          {sorted.filter((item) => getUnitTotal(item, fromUnit) > 0).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <select aria-label="Tamanho" value={line.size} onChange={(event) => updateLine(line.key, { size: event.target.value })} disabled={!product} style={{ padding: 8 }}>
                          <option value="">—</option>
                          {product?.sizes.map((size) => <option key={size}>{size}</option>)}
                        </select>
                      </td>
                      <td>
                        <select aria-label="Cor" value={line.color} onChange={(event) => updateLine(line.key, { color: event.target.value })} disabled={!product} style={{ padding: 8 }}>
                          <option value="">—</option>
                          {product?.colors.map((color) => <option key={color.name}>{color.name}</option>)}
                        </select>
                      </td>
                      <td><input aria-label="Quantidade" type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(line.key, { quantity: event.target.value })} style={{ width: 64, padding: 8 }} /></td>
                      <td className={available === 0 ? 'out' : ''}>{available === null ? '—' : `${available} un.`}</td>
                      <td>{lines.length > 1 && <AdminButton type="button" className="secondary" onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}>Tirar</AdminButton>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </DataTable>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <AdminButton type="button" className="secondary" onClick={() => setLines((current) => [...current, newLine()])}>+ Outra peça</AdminButton>
            <AdminButton type="submit" disabled={transferring}>{transferring ? 'Transferindo...' : `Transferir para a ${toUnit.name}`}</AdminButton>
          </div>
        </form>
      </AdminPanel>
    </>
  )
}

export default StockPanel
