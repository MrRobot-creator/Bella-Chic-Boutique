import { FormEvent, useMemo, useState } from 'react'
import { Product } from '../../types/store'
import { storeConfig } from '../../config/store'
import { registerStoreSale, StoreOrder } from '../../services/orders'
import { getVariantStock } from '../../utils/inventory'
import { AdminButton, AdminNotice, AdminPanel, DataTable, FormGrid } from './styles'

type Line = { key: number; productId: string; size: string; color: string; quantity: string }

const payments: StoreOrder['payment'][] = ['Pix', 'Cartão de débito', 'Cartão de crédito', 'Dinheiro', 'Link de pagamento']
const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

let lineKey = 0
const newLine = (): Line => ({ key: ++lineKey, productId: '', size: '', color: '', quantity: '1' })

type StoreSalePanelProps = {
  products: Product[]
  onSold: () => void
}

const StoreSalePanel = ({ products, onSold }: StoreSalePanelProps) => {
  const [unitId, setUnitId] = useState(storeConfig.units[0].id)
  const [payment, setPayment] = useState<StoreOrder['payment']>('Pix')
  const [lines, setLines] = useState<Line[]>([newLine()])
  const [discount, setDiscount] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const activeProducts = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')), [products])
  const productOf = (line: Line) => products.find((product) => String(product.id) === line.productId)

  const subtotal = lines.reduce((total, line) => {
    const product = productOf(line)
    return total + (product ? product.price * (Number(line.quantity) || 0) : 0)
  }, 0)
  const discountValue = Math.max(0, Number(discount.replace(',', '.')) || 0)

  const updateLine = (key: number, change: Partial<Line>) =>
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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    const items = lines.filter((line) => line.productId).map((line) => ({
      productId: Number(line.productId),
      size: line.size,
      color: line.color,
      quantity: Number(line.quantity)
    }))
    if (!items.length) {
      setError('Escolha pelo menos uma peça.')
      return
    }
    if (items.some((item) => !item.size || !item.color || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      setError('Escolha tamanho, cor e quantidade de cada peça.')
      return
    }
    for (const item of items) {
      const product = products.find((candidate) => candidate.id === item.productId)
      const stock = product ? getVariantStock(product.variantStock, item.size, item.color) : 0
      if (item.quantity > stock) {
        setError(`${product?.name || 'Peça'} (${item.size}, ${item.color}) tem só ${stock} no estoque.`)
        return
      }
    }
    if (discountValue > subtotal) {
      setError('O desconto não pode ser maior que o valor das peças.')
      return
    }
    const unit = storeConfig.units.find((option) => option.id === unitId) || storeConfig.units[0]
    setSaving(true)
    try {
      const sale = await registerStoreSale({
        unitName: unit.name,
        unitAddress: unit.address,
        payment,
        items,
        discount: discountValue || undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        note: note.trim() || undefined
      })
      setNotice(`Venda ${sale.reference} registrada: ${formatPrice(subtotal - discountValue)}. O estoque já foi atualizado.`)
      setLines([newLine()])
      setDiscount('')
      setCustomerName('')
      setCustomerPhone('')
      setNote('')
      onSold()
    } catch (saleError) {
      setError(saleError instanceof Error ? saleError.message : 'Não foi possível registrar a venda.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminPanel>
      <h2>Venda no balcão</h2>
      <p>Registre aqui as vendas feitas na loja física. O estoque do site baixa na hora e a venda entra no resumo, separada como balcão.</p>
      {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
      {notice && <AdminNotice role="status">{notice}</AdminNotice>}
      <form onSubmit={submit}>
        <FormGrid>
          <label>Loja
            <select value={unitId} onChange={(event) => setUnitId(event.target.value)}>
              {storeConfig.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select>
          </label>
          <label>Pagamento
            <select value={payment} onChange={(event) => setPayment(event.target.value as StoreOrder['payment'])}>
              {payments.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>Desconto em R$ (opcional)
            <input inputMode="decimal" value={discount} onChange={(event) => setDiscount(event.target.value)} placeholder="0,00" />
          </label>
        </FormGrid>

        <DataTable style={{ margin: '16px 0' }}>
          <table>
            <thead><tr><th>Peça</th><th>Tamanho</th><th>Cor</th><th>Qtd.</th><th>Estoque</th><th>Valor</th><th /></tr></thead>
            <tbody>
              {lines.map((line) => {
                const product = productOf(line)
                const stock = product && line.size && line.color ? getVariantStock(product.variantStock, line.size, line.color) : null
                return (
                  <tr key={line.key}>
                    <td style={{ minWidth: 180 }}>
                      <select aria-label="Peça" value={line.productId} onChange={(event) => updateLine(line.key, { productId: event.target.value })} style={{ width: '100%', padding: 8 }}>
                        <option value="">Escolha a peça</option>
                        {activeProducts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
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
                    <td>
                      <input aria-label="Quantidade" type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(line.key, { quantity: event.target.value })} style={{ width: 64, padding: 8 }} />
                    </td>
                    <td className={stock === 0 ? 'out' : ''}>{stock === null ? '—' : `${stock} un.`}</td>
                    <td>{product ? formatPrice(product.price * (Number(line.quantity) || 0)) : '—'}</td>
                    <td>
                      {lines.length > 1 && (
                        <AdminButton type="button" className="secondary" onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}>Tirar</AdminButton>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </DataTable>
        <AdminButton type="button" className="secondary" onClick={() => setLines((current) => [...current, newLine()])}>+ Outra peça</AdminButton>

        <FormGrid style={{ marginTop: 16 }}>
          <label>Nome da cliente (opcional)
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} maxLength={120} />
          </label>
          <label>WhatsApp (opcional)
            <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} maxLength={30} />
          </label>
          <label>Observação (opcional)
            <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} />
          </label>
        </FormGrid>

        <p style={{ marginTop: 16 }}>
          Subtotal: {formatPrice(subtotal)}{discountValue > 0 ? ` · Desconto: -${formatPrice(discountValue)}` : ''} · <strong>Total: {formatPrice(Math.max(0, subtotal - discountValue))}</strong>
        </p>
        <AdminButton type="submit" disabled={saving}>{saving ? 'Registrando...' : 'Registrar venda'}</AdminButton>
      </form>
    </AdminPanel>
  )
}

export default StoreSalePanel
