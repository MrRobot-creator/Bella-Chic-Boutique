import { FormEvent, useMemo, useState } from 'react'
import { Product } from '../../types/store'
import { storeConfig } from '../../config/store'
import { uploadProductImage } from '../../services/catalog'
import { registerStoreSale, StoreOrder, StoreSaleItem } from '../../services/orders'
import { availableInUnit } from '../../utils/inventory'
import { AdminButton, AdminNotice, AdminPanel, DataTable, FormGrid } from './styles'

/** Linha da venda: peça do cadastro (baixa estoque) ou peça fora do cadastro (nome, preço e foto, sem estoque). */
type Line = {
  key: number
  kind: 'catalog' | 'custom'
  productId: string
  size: string
  color: string
  quantity: string
  name: string
  price: string
  photo: string
}

const payments: StoreOrder['payment'][] = ['Pix', 'Cartão de débito', 'Cartão de crédito', 'Dinheiro', 'Link de pagamento']
const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
/** "1.250,90" ou "1250.90" viram 1250.9; vazio ou inválido vira 0. */
const parseMoney = (value: string) => {
  const clean = value.trim()
  const number = Number(clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean)
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : 0
}

let lineKey = 0
const newLine = (kind: Line['kind'] = 'catalog'): Line => ({
  key: ++lineKey, kind, productId: '', size: '', color: '', quantity: '1', name: '', price: '', photo: ''
})
const isFilled = (line: Line) => (line.kind === 'catalog' ? Boolean(line.productId) : Boolean(line.name.trim() || line.price.trim() || line.photo))

type StoreSalePanelProps = {
  products: Product[]
  /** Loja da atendente (fixa); null para a dona escolher. */
  adminUnitId: string | null
  onSold: () => void
}

const StoreSalePanel = ({ products, adminUnitId, onSold }: StoreSalePanelProps) => {
  const [chosenUnitId, setUnitId] = useState(storeConfig.units[0].id)
  const unitId = adminUnitId || chosenUnitId
  const [payment, setPayment] = useState<StoreOrder['payment']>('Pix')
  const [lines, setLines] = useState<Line[]>([newLine()])
  const [discount, setDiscount] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingKeys, setUploadingKeys] = useState<number[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const activeProducts = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')), [products])
  const productOf = (line: Line) => products.find((product) => String(product.id) === line.productId)

  const lineValue = (line: Line) => {
    const quantity = Number(line.quantity) || 0
    if (line.kind === 'custom') return parseMoney(line.price) * quantity
    const product = productOf(line)
    return product ? product.price * quantity : 0
  }
  const subtotal = lines.reduce((total, line) => total + lineValue(line), 0)
  const discountValue = Math.max(0, parseMoney(discount))

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

  const pickPhoto = async (key: number, file: File | undefined) => {
    if (!file) return
    setError('')
    setUploadingKeys((current) => [...current, key])
    try {
      const url = await uploadProductImage(file)
      updateLine(key, { photo: url })
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Não foi possível enviar a foto.')
    } finally {
      setUploadingKeys((current) => current.filter((item) => item !== key))
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    const filled = lines.filter(isFilled)
    if (!filled.length) {
      setError('Escolha pelo menos uma peça.')
      return
    }
    if (uploadingKeys.length) {
      setError('Espere a foto terminar de enviar.')
      return
    }
    if (filled.some((line) => !Number.isInteger(Number(line.quantity)) || Number(line.quantity) < 1)) {
      setError('Confira a quantidade de cada peça.')
      return
    }
    const catalogLines = filled.filter((line) => line.kind === 'catalog')
    const customLines = filled.filter((line) => line.kind === 'custom')
    if (catalogLines.some((line) => !line.size || !line.color)) {
      setError('Escolha tamanho e cor de cada peça.')
      return
    }
    if (customLines.some((line) => line.name.trim().length < 2 || parseMoney(line.price) <= 0)) {
      setError('Escreva o nome e o preço de cada peça fora do cadastro.')
      return
    }
    const items: StoreSaleItem[] = filled.map((line) => (line.kind === 'catalog'
      ? { productId: Number(line.productId), size: line.size, color: line.color, quantity: Number(line.quantity) }
      : { name: line.name.trim(), unitPrice: parseMoney(line.price), quantity: Number(line.quantity), ...(line.photo ? { photo: line.photo } : {}) }))
    const catalogItems = items.filter((item): item is Extract<StoreSaleItem, { productId: number }> => 'productId' in item)
    for (const item of catalogItems) {
      const product = products.find((candidate) => candidate.id === item.productId)
      const stock = product ? availableInUnit(product, unitId, item.size, item.color) : 0
      if (item.quantity > stock) {
        setError(`${product?.name || 'Peça'} (${item.size}, ${item.color}) tem só ${stock} nesta loja.`)
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
      setNotice(`Venda ${sale.reference} registrada: ${formatPrice(subtotal - discountValue)}.${catalogItems.length ? ' O estoque já foi atualizado.' : ''}`)
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
      <p>Registre aqui as vendas feitas na loja física. O estoque da loja baixa na hora e a venda entra no resumo da loja, separada como balcão. Peça que não está no site: use “+ Peça fora do cadastro”, com nome, preço e foto se quiser. Ela entra no faturamento, mas não mexe no estoque.</p>
      {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
      {notice && <AdminNotice role="status">{notice}</AdminNotice>}
      <form onSubmit={submit}>
        <FormGrid>
          <label>Loja
            {adminUnitId ? (
              <input id="sale-unit" value={storeConfig.units.find((unit) => unit.id === adminUnitId)?.name || ''} readOnly />
            ) : (
              <select id="sale-unit" value={unitId} onChange={(event) => setUnitId(event.target.value)}>
                {storeConfig.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
              </select>
            )}
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
            <thead><tr><th>Peça</th><th>Tamanho</th><th>Cor</th><th>Qtd.</th><th>Nesta loja</th><th>Valor</th><th /></tr></thead>
            <tbody>
              {lines.map((line) => {
                const removeButton = lines.length > 1 && (
                  <AdminButton type="button" className="secondary" onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}>Tirar</AdminButton>
                )
                if (line.kind === 'custom') {
                  const uploading = uploadingKeys.includes(line.key)
                  return (
                    <tr key={line.key}>
                      <td style={{ minWidth: 180 }}>
                        <input aria-label="Nome da peça fora do cadastro" value={line.name} onChange={(event) => updateLine(line.key, { name: event.target.value })} placeholder="Ex.: Blusa de renda preta" maxLength={120} style={{ width: '100%', padding: 8 }} />
                      </td>
                      <td colSpan={2}>
                        {line.photo ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <img src={line.photo} alt="Foto da peça" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                            <AdminButton type="button" className="secondary" onClick={() => updateLine(line.key, { photo: '' })}>Tirar foto</AdminButton>
                          </span>
                        ) : (
                          <AdminButton as="label" className="secondary" style={{ cursor: uploading ? 'wait' : 'pointer' }}>
                            {uploading ? 'Enviando foto...' : 'Foto (opcional)'}
                            <input type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={uploading} onChange={(event) => { pickPhoto(line.key, event.target.files?.[0]); event.target.value = '' }} />
                          </AdminButton>
                        )}
                      </td>
                      <td>
                        <input aria-label="Quantidade" type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(line.key, { quantity: event.target.value })} style={{ width: 64, padding: 8 }} />
                      </td>
                      <td>Fora do cadastro</td>
                      <td>
                        <input aria-label="Preço de cada unidade" inputMode="decimal" value={line.price} onChange={(event) => updateLine(line.key, { price: event.target.value })} placeholder="Preço un." style={{ width: 96, padding: 8 }} />
                        {Number(line.quantity) > 1 && parseMoney(line.price) > 0 && <div><small>Total {formatPrice(lineValue(line))}</small></div>}
                      </td>
                      <td>{removeButton}</td>
                    </tr>
                  )
                }
                const product = productOf(line)
                const stock = product && line.size && line.color ? availableInUnit(product, unitId, line.size, line.color) : null
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
                    <td>{removeButton}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </DataTable>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <AdminButton type="button" className="secondary" onClick={() => setLines((current) => [...current, newLine()])}>+ Outra peça</AdminButton>
          <AdminButton type="button" className="secondary" onClick={() => setLines((current) => [...current, newLine('custom')])}>+ Peça fora do cadastro</AdminButton>
        </div>

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
        <AdminButton type="submit" disabled={saving || uploadingKeys.length > 0}>{saving ? 'Registrando...' : 'Registrar venda'}</AdminButton>
      </form>
    </AdminPanel>
  )
}

export default StoreSalePanel
